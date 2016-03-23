import http from 'http';
import ws from 'ws';
import express from 'express';
import { createStore } from 'redux';

import reducer from './reducer';
import runLoop from './runLoop';

import {
  // TYPE_LEVEL,
  TYPE_SNAPSHOT,
  TYPE_SWING,
  TYPE_POSITION,
} from '../universal/protocol';

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

store.dispatch({
  type: 'level',
  data: level,
});

runLoop.setStore(store);
runLoop.start();

let idCounter = 0;

wss.on('connection', (ws) => {
  idCounter += 1;
  const id = idCounter;

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
      type: 'removeBall',
      id,
    });
  });

  ws.send(JSON.stringify({
    type: TYPE_SNAPSHOT,
    data: {
      level,
    },
  }));

  store.dispatch({
    type: 'addBall',
    id,
    ws,
  });
});

runLoop.subscribe(() => {
  const state = store.getState();

  const positions = state.balls.map((ball, id) => {
    return {
      id,
      x: ball.body.interpolatedPosition[0],
      y: ball.body.interpolatedPosition[1],
    };
  }).toList().toJS();

  state.balls.forEach((ball) => {
    ball.ws.send(JSON.stringify({
      type: TYPE_POSITION,
      data: {positions},
    }), (err) => {
      if (err) {
        console.error('error sending position', err);
      }
    });
  });
});

server.on('request', app);
server.listen(port, () => { console.log('Listening on ' + server.address().port); });

process.on('unhandledRejection', (err) => {
  console.error(err.stack);
  process.exit(1);
});
