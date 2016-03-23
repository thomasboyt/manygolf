import http from 'http';
import ws from 'ws';
import express from 'express';
import { createStore } from 'redux';

import reducer from './reducer';

import {
  TYPE_LEVEL,
  TYPE_SWING,
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

  store.dispatch({
    type: 'addBall',
    id,
  });

  ws.send(JSON.stringify({
    type: TYPE_LEVEL,
    data: level,
  }));
});

server.on('request', app);
server.listen(port, () => { console.log('Listening on ' + server.address().port); });

process.on('unhandledRejection', (err) => {
  console.error(err.stack);
  process.exit(1);
});
