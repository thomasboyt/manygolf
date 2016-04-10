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
} from '../universal/constants';

import {
  TYPE_LEVEL,
  TYPE_POSITION,
  messageDisplayMessage,
  // TYPE_LEVEL_OVER,
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
const runLoop = new RunLoop(store);
runLoop.start();

const socks = new ManygolfSocketManager(wss, store);


/*
 * Run loop
 */

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

  socks.sendAll({
    type: TYPE_LEVEL,
    data: {
      level: nextLevel,
      expTime,
    },
  });
}

cycleLevel();

runLoop.subscribe((state: State, prevState: State) => {

  // Send scored messages if players scored
  state.players.forEach((player, id) => {
    if (player.scored && !prevState.players.get(id).scored) {
      const elapsed = ((Date.now() - (state.expTime - TIMER_MS)) / 1000).toFixed(2);
      socks.sendAll(messageDisplayMessage({
        messageText: `${player.name} scored! (${player.strokes} strokes in ${elapsed}s)`
      }));
    }
  })

  // Move to 'levelOver' state when all players have finished the level, updating time
  if (!state.levelOver && state.players.size > 0 &&
      state.players.filter((player) => player.scored).size === state.players.size) {
    console.log('All players have finished');

    store.dispatch({
      type: 'levelOver',
    });

    // socks.sendAll({
    //   type: TYPE_LEVEL_OVER,
    //   data: {
    //     scores: getScores(state)
    //   },
    // });

    return;
  }

  if (state.expTime !== null && state.expTime < Date.now()) {
    cycleLevel();
    return;
  }

  const positions = state.players.map((player, id) => {
    return {
      id,
      x: player.body.interpolatedPosition[0],
      y: player.body.interpolatedPosition[1],
    };
  }).toList().toJS();

  socks.sendAll({
    type: TYPE_POSITION,
    data: {positions},
  });
});

server.on('request', app);
server.listen(port, () => { console.log('Listening on ' + server.address().port); });

process.on('unhandledRejection', (err) => {
  console.error(err.stack);
  process.exit(1);
});
