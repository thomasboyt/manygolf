import { createStore, Store } from 'redux';
import reducer from './reducer';
import { State } from './records';

import ws from './ws';

import RunLoop from '../universal/RunLoop';
import {
  runLoopCb,
} from './runLoop';

import { registerListeners } from './util/inputter';

import {messageReqPauseStream, messageReqResumeStream} from '../universal/protocol';

import testMsgs from '../testData';

/*
 * Initialize game store. Start run loop. Create WebSocket connection.
 */
export default function initialize(): Store<State> {
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

  let pausedWs = false;
  document.addEventListener('visibilitychange', () => {
    if (ws.connected) {
      if (document.hidden) {
        ws.send(messageReqPauseStream());
        pausedWs = true;
        runLoop.stop();
      } else {
        ws.send(messageReqResumeStream());
        pausedWs = false;
        runLoop.start();
      }
    }
  });

  return store;
}
