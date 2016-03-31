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
ws.init(store);

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
