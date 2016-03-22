const server = require('http').createServer();
const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ server: server });
const express = require('express');
const app = express();
const port = 4080;

const levelData = 'asdf';

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log('received: %s', message);
  });

  ws.send(JSON.stringify({
    type: 'level',
    data: levelData,
  }));
});

server.on('request', app);
server.listen(port, () => { console.log('Listening on ' + server.address().port); });
