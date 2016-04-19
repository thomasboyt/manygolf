require('../../styles/main.less');

import './util/registerPolyfill';
import './util/registerErrorHandler';

// Set up store
import { createStore } from 'redux';
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

import { renderControlBar } from './controlBar';
renderControlBar();

// create WS
import ws from './ws';

import levelGen from '../universal/levelGen';
const offlineMode = document.location.search.indexOf('offline') !== -1;

if (!offlineMode) {
  ws.init(store);

} else {
  const level = levelGen();

  store.dispatch({
    type: 'ws:level',
    data: {
      level,
      expiresIn: 1000 * 1000,
    },
  });
}

// set up input
import {registerListeners } from './util/inputter';
registerListeners();

// Set up runLoop
import RunLoop from '../universal/RunLoop';
const runLoop = new RunLoop();

import inputHandler from './inputHandler';
import render from './render';

runLoop.onTick((dt: number) => {
  dt = dt / 1000;  // ms -> s
  const dispatch = store.dispatch.bind(store);

  const prevState = store.getState();

  inputHandler(dt, prevState, dispatch);

  dispatch({
    type: 'tick',
    dt,
  });

  const newState = store.getState();

  render(ctx, newState);

  if (newState.name !== prevState.name) {
    updateTwitterLink(newState.name);
  }
});

runLoop.start();

function updateTwitterLink(name: string) {
  const link = <HTMLAnchorElement>document.getElementById('twitter-link');

  const text = `Come play #Manygolf with me! I'm playing as ${name}`;
  const encoded = encodeURIComponent(text);

  const linkUrl = `https://twitter.com/intent/tweet?text=${encoded}` +
                  '&url=http%3A%2F%2Fmanygolf.disco.zone';

  link.href = linkUrl;
}
