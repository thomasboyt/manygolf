import http from 'http';
import ws from 'uws';
import express from 'express';
import { createStore } from 'redux';
import raven from 'raven';

import RunLoop from '../universal/RunLoop';
import ManygolfSocketManager from './ManygolfSocketManager';
import reducer from './reducer';

import {
  sweepInactivePlayers,
  ensurePlayersInBounds,
  checkScored,
  cycleLevel,
  sendSyncMessage,
  levelOver,
  checkHurryUp,
  startMatch,
  endMatch,
} from './actions';

import {
  GameState,
} from '../universal/constants';

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

const runLoop = new RunLoop();

function getState(): State {
  return store.getState();
}

function dispatch(action: any): State {
  store.dispatch(action);
  return store.getState();
}

startMatch(dispatch);
cycleLevel(dispatch, socks);

const fixedStep = 1 / 60;
const maxSubSteps = 10;

let lastSyncSent = 0;

runLoop.onTick((dt: number) => {
  dt = dt / 1000;  // ms -> s

  const prevState = <State>store.getState();

  // overlaps() can't be used on a sleeping object, so we check overlapping before tick
  const overlappingMap = prevState.players.map((player) => {
    return player.body.overlaps(prevState.holeSensor);
  });

  // XXX: MMMMMonster hack
  // dt is set to dt * 3 because that's the speed I actually want
  getState().world.step(fixedStep, dt * 3, maxSubSteps);

  dispatch({
    type: 'tick',
  });

  const {gameState, expTime, matchEndTime} = getState();

  if (gameState === GameState.levelOver) {
    if (expTime !== null && expTime < Date.now()) {
      if (Date.now() >= matchEndTime) {
        endMatch(dispatch, socks);
      } else {
        cycleLevel(dispatch, socks);
      }
      return;
    }

  } else if (gameState === GameState.matchOver) {
    if (expTime < Date.now()) {
      startMatch(dispatch);
      cycleLevel(dispatch, socks);
    }

  } else if (gameState === GameState.roundInProgress) {
    ensurePlayersInBounds(dispatch, {
      level: getState().level,
      players: getState().players,
    });

    checkScored(dispatch, socks, {
      overlappingMap,
      players: getState().players,
      elapsed: Date.now() - getState().startTime,
    });

    sweepInactivePlayers(dispatch, socks, {
      now: Date.now(),
      players: getState().players,
    });

    const players = getState().players;

    if (players.size > 0 &&
        players.filter((player) => player.scored).size === players.size) {
      console.log('All players have finished');
      levelOver(dispatch, socks, {players});
      return;
    }

    if (getState().expTime !== null && getState().expTime < Date.now()) {
      console.log('Timer expired');
      levelOver(dispatch, socks, {players});
      return;
    }

    if (!getState().didHurryUp) {
      checkHurryUp(dispatch, socks, {
        players,
        expTime: getState().expTime,
      });
    }

    // send sync message once per second
    if (Date.now() - lastSyncSent > 1000) {
      lastSyncSent = Date.now();

      sendSyncMessage(socks, {
        players,
        time: getState().time,
      });
    }
  }

});

runLoop.start();

app.get('/player-count', (req, res) => {
  res.type('text/plain');

  const count = getState().players.size;
  res.send(`${count}`);
});

server.on('request', app);
server.listen(port, () => { console.log('Listening on ' + server.address().port); });

if (process.env.NODE_ENV === 'production') {
  console.log('*** Installing Raven');

  const dsn = require('../../secret.json').ravenDSNPrivate;

  raven.patchGlobal(dsn, (sentryError, err) => {
    console.error(err.stack);
    process.exit(1);
  });

} else {
  process.on('unhandledRejection', (err) => {
    console.error(err.stack);
    process.exit(1);
  });
}
