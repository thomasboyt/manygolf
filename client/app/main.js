require('../styles/main.less');

import './polyfill';

// Set up store
import createStore from './store';
const store = createStore(undefined);

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
