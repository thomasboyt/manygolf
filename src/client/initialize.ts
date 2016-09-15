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
      } else {
        ws.send(messageReqResumeStream());
        pausedWs = false;
      }
    }
  });

  window.addEventListener('message', (event: MessageEvent) => {
    const data = JSON.parse(event.data);

    if (data.type === 'twitterAuth') {
      const {token, secret} = data;

      window.fetch('/server/twitter-auth-token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authToken: localStorage.getItem('accessToken'),
          twitterToken: token,
          twitterSecret: secret,
        }),
      }).then((resp) => {
        if (resp.status === 200) {
          return resp.json();
        } else {
          console.log(resp);
          throw new Error('Twitter auth error');
        }
      }).then((data) => {
        localStorage.setItem('accessToken', data.authToken);
        document.location.reload();
      });
    }
  });

  return store;
}
