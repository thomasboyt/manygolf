import http from 'http';
import ws from 'ws';
import express from 'express';
import { createStore } from 'redux';

import reducer from './reducer';
import runLoop from './runLoop';

import {
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

const level = {
  points: [
    [0, 200],
    [100, 200],
    [200, 150],
    [300, 200],
    [500, 200]
  ],
  hole: [400, 200],
  spawn: [50, 200],
};

const store = createStore(reducer);
runLoop.setStore(store);
runLoop.start();

function nextLevel() {
  console.log('Cycling level');

  const expTime = Date.now() + 20 * 1000;

  store.dispatch({
    type: 'level',
    levelData: level,
    expTime,
  });

  sendAll(store.getState(), {
    type: TYPE_LEVEL,
    data: {
      level,
      expTime,
    },
  });
}

nextLevel();


let idCounter = 0;

wss.on('connection', (ws) => {
  idCounter += 1;
  const id = idCounter;
  const state = store.getState();

  ws.on('message', (strMsg) => {
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
  });

  ws.on('close', () => {
    store.dispatch({
      type: 'playerDisconnected',
      id,
    });
  });

  ws.send(JSON.stringify({
    type: TYPE_LEVEL,
    data: {
      level,
      expTime: state.expTime,
    },
  }));

  store.dispatch({
    type: 'playerConnected',
    id,
    ws,
  });
});

function sendAll(state, msg) {
  state.sockets.forEach((socket) => {
    socket.send(JSON.stringify(msg), (err) => {
      if (err) {
        // TODO: ignore if it's a closed thing
        console.error('error sending', err);
      }
    });
  });
}

runLoop.subscribe(() => {
  const state = store.getState();

  if (state.expTime !== null && state.expTime < Date.now()) {
    nextLevel();
    return;
  }

  const positions = state.balls.map((ball, id) => {
    return {
      id,
      x: ball.body.interpolatedPosition[0],
      y: ball.body.interpolatedPosition[1],
    };
  }).toList().toJS();

  sendAll(state, {
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
