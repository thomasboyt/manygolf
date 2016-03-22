require('../../styles/main.less');

import './polyfill';

// Set up store
import createStore from './store';
const store = createStore();

// Set up runLoop
import runLoop from './runLoop';
runLoop.setStore(store);
runLoop.start();

import render from './render';
import {WIDTH, HEIGHT} from '../universal/constants';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = WIDTH;
canvas.height = HEIGHT;

function update() {
  render(ctx, store.getState());
}

runLoop.subscribe(update);
update();

import ws from './ws';
ws.init(store);

// set up input
import {registerListeners} from './inputter';
registerListeners();
