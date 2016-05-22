require('../../styles/main.less');

import './util/registerPolyfill';
import './util/registerErrorHandler';

import { createStore } from 'redux';
import reducer from './reducer';

import ws from './ws';

// import levelGen from '../universal/levelGen';
import RunLoop from '../universal/RunLoop';
import {
  runLoopCb,
  subscribe as runLoopSubscribe,
} from './runLoop';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Provider} from 'react-redux';

import { registerListeners } from './util/inputter';

import Main from './components/Main';

import testMsgs from '../testData';

function main() {
  // Bail out early if missing required browser features
  // XXX: typescript doesn't think window.WebSocket exists?
  if (!(window as any).WebSocket) {
    renderMissingFeatures();
    return;
  }

  // Set up store
  const store = createStore(reducer);

  // create websocket or use offline mode
  const offlineMode = document.location.search.indexOf('offline') !== -1;

  if (!offlineMode) {
    ws.init(store);

  } else {
    const initTime = testMsgs[0].time;

    for (let msg of testMsgs) {
      const timeDiff = msg.time - initTime;

      setTimeout(() => {
        console.log(msg.time);

        store.dispatch({
          type: `ws:${msg.msg.type}`,
          data: msg.msg.data,
        });
      }, timeDiff);
    }
  }

  // set up input event listeners
  registerListeners();

  // Start runLoop
  const runLoop = new RunLoop();
  runLoop.onTick((dt) => {
    runLoopCb(dt, store);
  });

  runLoop.start();

  const el = document.getElementById('react-container');

  ReactDOM.render((
    <Provider store={store}>
      <Main />
    </Provider>
  ), el);
}

function renderMissingFeatures() {
  const el = document.getElementsByClassName('game-container')[0];
  el.innerHTML = `
    <div class="browser-error">
      <p>
        Your browser does not support WebSockets, which are required for Manygolf to work.
      </p>
      <p>
        Please upgrade your browser to one of the following: Google Chrome, Firefox 11+, Internet
        Explorer 10+, or Safari 6+.
      </p>
    </div>
  `;
}

main();