import http from 'http';
import ws from 'ws';
import express from 'express';
import { createStore } from 'redux';

import reducer from './reducer';
import runLoop from './runLoop';
import levelGen from './levelGen';

import {
  TYPE_INITIAL,
  TYPE_PLAYER_CONNECTED,
  TYPE_PLAYER_DISCONNECTED,
  TYPE_LEVEL,
  TYPE_SWING,
  TYPE_POSITION,
} from '../universal/protocol';


/*
 * TODO:
 * this file is a complete mess
 */

const server = http.createServer();
const wss = new ws.Server({server});
const app = express();
const port = 4080;

const store = createStore(reducer);
runLoop.setStore(store);
runLoop.start();

function cycleLevel() {
  console.log('Cycling level');

  const expTime = Date.now() + 60 * 1000;

  const nextLevel = levelGen();
  console.log(JSON.stringify(nextLevel));

  store.dispatch({
    type: 'level',
    levelData: nextLevel,
    expTime,
  });

  sendAll({
    type: TYPE_LEVEL,
    data: {
      level: nextLevel,
      expTime,
    },
  });
}

cycleLevel();


let idCounter = 0;

function handleCloseSocket(id, didError) {
  const reason = didError ? '(errored)' : '';
  console.log(`*** ID ${id} disconnected ${reason}`);

  store.dispatch({
    type: 'playerDisconnected',
    id,
  });

  sendAll({
    type: TYPE_PLAYER_DISCONNECTED,
    data: {
      id,
    }
  });
}

function handleMessage(id, strMsg) {
  console.log('received: %s', strMsg);

  let msg;
  try {
    msg = JSON.parse(strMsg);
  } catch(err) {
    console.error('ignoring malformed message');
  }

  if (msg.type === TYPE_SWING) {
    store.dispatch({
      type: 'swing',
      id,
      ...msg.data,
    });

  } else {
    console.error(`unrecognized message type ${msg.type}`);
  }
}

wss.on('connection', (ws) => {
  idCounter += 1;
  const id = idCounter;

  console.log(`*** ID ${id} connected`);

  ws.on('message', (strMsg) => handleMessage(id, strMsg));
  ws.on('close', () => handleCloseSocket(id, false));
  ws.on('error', () => handleCloseSocket(id, true));

  store.dispatch({
    type: 'playerConnected',
    id,
    ws,
  });

  const state = store.getState();

  const color = state.getIn(['players', id, 'color']);

  ws.send(JSON.stringify({
    type: TYPE_INITIAL,
    data: {
      id,
      color,

      players: state.players.map((player, id) => {
        return {
          id,
          color: player.color,
        };
      }).toList().toJS(),

      level: state.levelData,
      expTime: state.expTime,
    },
  }));

  sendAll({
    type: TYPE_PLAYER_CONNECTED,
    data: {
      id,
      color,
    }
  });
});

function sendAll(msg) {
  const state = store.getState();
  state.players.forEach((player, id) => {
    player.socket.send(JSON.stringify(msg), (err) => {
      if (err) {
        console.log(`error sending to ${id}`, err);
      }
    });
  });
}

runLoop.subscribe(() => {
  const state = store.getState();

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

  sendAll({
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
