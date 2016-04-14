import http from 'http';
import ws from 'ws';
import express from 'express';
import { createStore } from 'redux';

import RunLoop from '../universal/RunLoop';
import ManygolfSocketManager from './ManygolfSocketManager';
import reducer from './reducer';
import levelGen from '../universal/levelGen';

import {
  TIMER_MS,
  RoundState,
} from '../universal/constants';

import {
  messageLevel,
  messageDisplayMessage,
  messageLevelOver,
  messagePositions,
} from '../universal/protocol';

import {
  State,
  Player,
} from './records';

/*
 * Initialize server
 */

const server = http.createServer();
const wss = new ws.Server({server});
const app = express();
const port = 4080;

const store = createStore(reducer);

const socks = new ManygolfSocketManager(wss, store);

/*
 * Run loop
 */

function levelOver() {
  store.dispatch({
    type: 'levelOver',
  });

  const state = <State>store.getState();

  socks.sendAll(messageLevelOver({
    roundRankedPlayers: state.roundRankedPlayers.toArray().map((player) => {
      return {
        id: player.id,
        color: player.color,
        name: player.name,
        strokes: player.strokes,
        scoreTime: player.scoreTime,
      };
    }),
  }));
}

function cycleLevel() {
  console.log('Cycling level');

  const expTime = Date.now() + TIMER_MS;

  const nextLevel = levelGen();
  console.log(JSON.stringify(nextLevel));

  store.dispatch({
    type: 'level',
    levelData: nextLevel,
    expTime,
  });

  socks.sendAll(messageLevel({
    level: nextLevel,
    expTime,
  }));
}

cycleLevel();

const runLoop = new RunLoop(store);

runLoop.afterTick((state: State, prevState: State) => {

  if (state.roundState === RoundState.over) {
    if (state.expTime !== null && state.expTime < Date.now()) {
      cycleLevel();
      return;
    }

  } else {

    // Send scored messages if players scored
    state.players.forEach((player, id) => {
      if (player.scored && !prevState.players.get(id).scored) {
        const elapsed = (player.scoreTime / 1000).toFixed(2);

        const strokeLabel = player.strokes === 1 ? 'stroke' : 'strokes';

        socks.sendAll(messageDisplayMessage({
          messageText: `{{${player.name}}} scored! (${player.strokes} ${strokeLabel} in ${elapsed}s)`,
          color: player.color,
        }));
      }
    })

    // Move to 'levelOver' state when all players have finished the level, updating time
    if (state.players.size > 0 &&
        state.players.filter((player) => player.scored).size === state.players.size) {
      console.log('All players have finished');
      levelOver();
      return;
    }

    if (state.expTime !== null && state.expTime < Date.now()) {
      console.log('Timer expired');
      levelOver();
      return;
    }

    const positions = state.players.map((player, id) => {
      return {
        id,
        x: player.body.interpolatedPosition[0],
        y: player.body.interpolatedPosition[1],
      };
    }).toList().toJS();

    socks.sendAll(messagePositions({
      positions,
    }));
  }

});

runLoop.start();

server.on('request', app);
server.listen(port, () => { console.log('Listening on ' + server.address().port); });

process.on('unhandledRejection', (err) => {
  console.error(err.stack);
  process.exit(1);
});
