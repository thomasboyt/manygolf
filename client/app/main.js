require('../styles/main.less');

import './polyfill';

// Set up store
import createStore from './store';
const store = createStore();

// Set up runLoop
import runLoop from './runLoop';
runLoop.setStore(store);
runLoop.start();

import render from './render';
import {WIDTH, HEIGHT} from './constants';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = WIDTH;
canvas.height = HEIGHT;

function update() {
  render(ctx, store.getState());
}

store.subscribe(update);
update();

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

store.dispatch({
  type: 'ws:level',
  data: level,
});

// import ws from './ws';
// ws.init(store);

// set up input
import {registerListeners} from './inputter';
registerListeners();
