import http from 'http';
import ws from 'ws';
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
} from './actions';

import {
  TIMER_MS,
  RoundState,
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

cycleLevel(store.dispatch.bind(store), socks);

const runLoop = new RunLoop();

function getState(): State {
  return store.getState();
}

const fixedStep = 1 / 60;
const maxSubSteps = 10;

let lastSyncSent = 0;

runLoop.onTick((dt: number) => {
  dt = dt / 1000;  // ms -> s

  const dispatch = store.dispatch.bind(store);

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

  if (getState().roundState === RoundState.over) {
    if (getState().expTime !== null && getState().expTime < Date.now()) {
      cycleLevel(dispatch, socks);
      return;
    }

  } else {
    ensurePlayersInBounds(dispatch, {
      level: getState().level,
      players: getState().players,
    });

    checkScored(dispatch, socks, {
      overlappingMap,
      players: getState().players,
      elapsed: Date.now() - (getState().expTime - TIMER_MS),
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
