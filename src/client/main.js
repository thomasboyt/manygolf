require('../../styles/main.less');

import './polyfill';

// Set up store
import { createStore } from 'redux';
import reducer from './reducer';
const store = createStore(reducer);

// Set up runLoop
import runLoop from './runLoop';
runLoop.setStore(store);
runLoop.start();

// set up canvas
import {WIDTH, HEIGHT} from '../universal/constants';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = WIDTH;
canvas.height = HEIGHT;

// create WS
import ws from './ws';

const offlineMode = document.location.search.indexOf('offline') !== -1;

if (!offlineMode) {
  ws.init(store);

} else {
  const fixtureLevel = {
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

  store.dispatch({
    type: 'ws:level',
    data: {
      level: fixtureLevel,
      expTime: Date.now() + 100000000,
    }
  });
}

// set up input
import {registerListeners} from './inputter';
registerListeners();

// render on runLoop tick
import render from './render';

function update() {
  render(ctx, store.getState());
}

runLoop.subscribe(update);
update();
