import * as http from 'http';
import * as ws from 'uws';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import { createStore } from 'redux';
import * as raven from 'raven';

import RunLoop from '../universal/RunLoop';
import ManygolfSocketManager from './ManygolfSocketManager';
import reducer, {getInWorldPlayers, getActivePlayers} from './reducer';
import registerTwitterEndpoints from './twitter';

import {configureDatabase} from './models';
import * as cors from 'cors';

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
  PHYSICS_SPEED_FACTOR,
} from '../universal/constants';

import {
  State,
} from './records';

if (process.env.NODE_ENV !== 'production') {
 require('dotenv').config();
}

configureDatabase();

/*
 * Initialize server
 */

const server = http.createServer();
const wss = new ws.Server({server});
const app = express();
app.use(bodyParser.json());
app.use(cors({
  origin: process.env.STATIC_URL,
}));

const port = process.env.PORT || 4080;

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
  const overlappingMap = getInWorldPlayers(prevState).map((player) => {
    return player.body.overlaps(prevState.holeSensor);
  });

  getState().world.step(fixedStep, dt * PHYSICS_SPEED_FACTOR, maxSubSteps);

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
    const inWorldPlayers = getInWorldPlayers(getState());

    ensurePlayersInBounds(dispatch, {
      level: getState().level,
      players: inWorldPlayers,
    });

    checkScored(dispatch, socks, {
      overlappingMap,
      players: inWorldPlayers,
      elapsed: Date.now() - getState().startTime,
    });

    sweepInactivePlayers(dispatch, socks, {
      now: Date.now(),
      players: inWorldPlayers,
    });

    const players = getActivePlayers(getState());

    if (players.size > 0 &&
        players.filter((player) => player.scored).size === players.size) {
      console.log('All players have finished');
      levelOver(dispatch, socks);
      return;
    }

    if (getState().expTime !== null && getState().expTime < Date.now()) {
      console.log('Timer expired');
      levelOver(dispatch, socks);
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

      sendSyncMessage(socks, getState());
    }
  }

});

runLoop.start();

registerTwitterEndpoints(app);

app.get('/player-count', (req, res) => {
  res.type('text/plain');

  const count = getState().players.size;
  res.send(`${count}`);
});

server.on('request', app);
server.listen(port, () => { console.log('Listening on ' + server.address().port); });

if (process.env.NODE_ENV === 'production') {
  console.log('*** Installing Raven');

  const dsn = process.env.RAVEN_DSN_PRIVATE;

  if (!dsn) {
    console.log('*** WARNING: No Raven DSN found in RAVEN_DSN_PRIVATE env var');

    raven.patchGlobal(dsn, (sentryError: any, err: any) => {
      console.error(err.stack);
      process.exit(1);
    });
  }

} else {
  process.on('unhandledRejection', (err: any) => {
    console.error(err.stack);
    process.exit(1);
  });
}
