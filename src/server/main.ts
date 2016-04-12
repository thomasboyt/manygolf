import http from 'http';
import ws from 'ws';
import express from 'express';
import { createStore } from 'redux';

import RunLoop from '../universal/RunLoop';
import ManygolfSocketManager from './ManygolfSocketManager';
import reducer from './reducer';
import levelGen from './levelGen';

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

  const winner = state.players.reduce((cur: Player, player: Player) => {
    // If this player didn't score, it can't be the winner
    if (!player.scored) {
      return cur;
    }

    // If this is the first player to score, it's the current winner
    if (!cur) {
      return player;
    }

    if (player.strokes > cur.strokes) {
      return cur;
    } else if (player.strokes < cur.strokes) {
      return player;
    } else {
      // === strokes
      // this has ms precision so we can sorta assume you're not gonna tie...
      if (player.scoreTime < cur.scoreTime) {
        return player;
      } else {
        return cur;
      }
    }
  }, null);

  const winnerId = winner ? winner.id : null;

  socks.sendAll(messageLevelOver({
    winnerId,
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

        socks.sendAll(messageDisplayMessage({
          messageText: `{{${player.name}}} scored! (${player.strokes} strokes in ${elapsed}s)`,
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
