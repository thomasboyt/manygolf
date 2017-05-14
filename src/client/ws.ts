import {Store} from 'redux';
import {PersistentWebsocket, ReconnectEvent} from 'persistent-websocket';
import * as qs from 'qs';

import {State} from './records';
import {getWsApiUrl} from './api';
import {Message} from '../universal/protocol';
import {MAX_RECONNECT_BACKOFF_MS, MAX_RECONNECT_ATTEMPTS} from '../universal/constants';

const simulateLag = document.location.search.indexOf('simlag') !== -1;
const simLagMs = 200;

if (simulateLag) {
  console.log(`*** WARNING: Simulating lag (${simLagMs}ms)`);
}

(<any>window).msgLog = [];

class WSConnection {
  private _ws: PersistentWebsocket;
  private _store: Store<State>;

  init(store: Store<State>) {
    this._store = store;

    const currentQs = qs.parse(document.location.search);
    const observe = currentQs.observe ? true : undefined;
    const accessToken = localStorage.getItem('accessToken') || undefined;

    const newQs = qs.stringify({
      observe,
      auth_token: accessToken,
    });
    const url = `${getWsApiUrl()}?${newQs}`;

    this._ws = new PersistentWebsocket(url, {
      connectTimeoutMillis: 3000,
      maxBackoffDelayMillis: MAX_RECONNECT_BACKOFF_MS,
    });

    this._ws.onmessage = this.handleMessage.bind(this);
    this._ws.onbeforereconnect = this.handleReconnect.bind(this);

    this._ws.open();
  }

  handleMessage(evt: MessageEvent) {
    const msg: Message = JSON.parse(evt.data);

    (<any>window).msgLog.push({
      time: Date.now(),
      msg,
    });

    if (simulateLag) {
      setTimeout(() => {
        this._store.dispatch({
          type: 'websocket',
          message: msg,
        });
      }, simLagMs);

    } else {
      this._store.dispatch({
        type: 'websocket',
        message: msg,
      });
    }
  }

  send(msg: Message) {
    if (!this._ws) {
      return;
    }

    const strMsg = JSON.stringify(msg);

    if (simulateLag) {
      setTimeout(() => {
        this._ws.send(strMsg);
      }, simLagMs);

    } else {
      this._ws.send(strMsg);
    }
  }

  handleReconnect(evt: ReconnectEvent) {
    if (evt.attemptNumber > MAX_RECONNECT_ATTEMPTS) {
      this._ws.close();

      this._store.dispatch({
        type: 'disconnect',
      });

    } else {
      this._store.dispatch({
        type: 'reconnecting',
        attemptNumber: evt.attemptNumber,
      });
    }
  }

  get connected(): boolean {
    return this._ws.readyState === this._ws.OPEN;
  }
}

const ws = new WSConnection();

export default ws;
