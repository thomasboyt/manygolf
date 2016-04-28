"use strict";

const WebSocket = require('ws');

const NUM_BOTS = 10;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addBot() {
  // const ws = new WebSocket('ws://manygolf.disco.zone/server');
  const ws = new WebSocket('ws://localhost:4080');

  ws.on('open', () => {
    setInterval(() => {
      ws.send(JSON.stringify({
        type: 'swing',
        data: {
          vec: {
            x: randInt(-100, 100),
            y: randInt(-100, 100),
          }
        }
      }))
    }, randInt(1000, 2000));
  });
}

for (let i=0; i < NUM_BOTS; i++) {
  addBot();
}