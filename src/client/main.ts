require('../../styles/main.less');

import './polyfill';

import { State } from './records';

// Set up store
import { createStore, Dispatch } from 'redux';
import reducer from './reducer';
const store = createStore(reducer);

import {
  WIDTH,
  HEIGHT,
} from '../universal/constants';

// set up canvas
const canvas = <HTMLCanvasElement> document.getElementById('game');
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
import {registerListeners } from './util/inputter';
import inputHandler from './inputHandler';
registerListeners();

// Set up runLoop
import RunLoop from '../universal/RunLoop';
const runLoop = new RunLoop(store);

runLoop.beforeTick(inputHandler);

import render from './render';

runLoop.afterTick((state: State, prevState: State, dispatch: Dispatch) => {
  render(ctx, state);
});

runLoop.start();
