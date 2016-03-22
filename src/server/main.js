import http from 'http';
import ws from 'ws';
import express from 'express';

import {
  TYPES_LEVEL,
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

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log('received: %s', message);
  });

  ws.send(JSON.stringify({
    type: TYPES_LEVEL,
    data: level,
  }));
});

server.on('request', app);
server.listen(port, () => { console.log('Listening on ' + server.address().port); });

process.on('unhandledRejection', (err) => {
  console.error(err.stack);
  process.exit(1);
});
