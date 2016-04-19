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
  HURRY_UP_MS,
  RoundState,
} from '../universal/constants';

import {
  messageLevel,
  messageDisplayMessage,
  messageLevelOver,
  messagePositions,
  messageHurryUp,
} from '../universal/protocol';

import {
  State,
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
        isObserver: player.isObserver,
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
    expiresIn: TIMER_MS,
  }));
}

cycleLevel();

const runLoop = new RunLoop(store);

runLoop.afterTick((state: State, prevState: State, dispatch) => {

  if (state.roundState === RoundState.over) {
    if (state.expTime !== null && state.expTime < Date.now()) {
      cycleLevel();
      return;
    }

  } else {

    // Send scored messages if players scored
    let numScoredChanged = false;

    state.players.forEach((player, id) => {
      if (player.scored && !prevState.players.get(id).scored) {
        numScoredChanged = true;

        const elapsed = (player.scoreTime / 1000).toFixed(2);

        const strokeLabel = player.strokes === 1 ? 'stroke' : 'strokes';
        const msg = `{{${player.name}}} scored! (${player.strokes} ${strokeLabel} in ${elapsed}s)`;

        socks.sendAll(messageDisplayMessage({
          messageText: msg,
          color: player.color,
        }));
      }
    });

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

    if (numScoredChanged && !state.didHurryUp) {
      // Go into hurry-up mode if the number of players who have yet to score is === 1 or less than
      // 25% of the remaining players and time is over hurry-up threshold
      const numRemaining = state.players.filter((player) => !player.scored).size;

      if (numRemaining === 1 || (numRemaining / state.players.size) < 0.25) {
        const newTime = Date.now() + HURRY_UP_MS;

        if (state.expTime > newTime) {
          console.log('Hurry up mode entered');

          dispatch({
            type: 'hurryUp',
            expTime: newTime,
          });

          socks.sendAll(messageHurryUp({
            expiresIn: HURRY_UP_MS,
          }));
        }
      }
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
