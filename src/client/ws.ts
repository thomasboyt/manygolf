import {Store} from 'redux';
import {State} from './records';
import {getWsApiUrl} from './api';

const simulateLag = document.location.search.indexOf('simlag') !== -1;
const simLagMs = 200;

if (simulateLag) {
  console.log(`*** WARNING: Simulating lag (${simLagMs}ms)`);
}

(<any>window).msgLog = [];

class WSConnection {
  private _ws: WebSocket;
  private _store: Store<State>;

  init(store: Store<State>) {
    this._store = store;

    let url = getWsApiUrl();

    if (document.location.search.indexOf('observe') !== -1) {
      url += '?observe';
    }

    const token = localStorage.getItem('accessToken');

    if (token) {
      // Y O L O
      // This should probably be sent as an initial message instead!!!
      url += `?auth_token=${token}`;
    }

    this._ws = new WebSocket(url);

    this._ws.onmessage = this.handleMessage.bind(this);

    this._ws.onclose = this.handleClose.bind(this);
  }

  handleMessage(evt: MessageEvent) {
    const msg = JSON.parse(evt.data);

    (<any>window).msgLog.push({
      time: Date.now(),
      msg,
    });

    if (simulateLag) {
      setTimeout(() => {
        this._store.dispatch({
          type: `ws:${msg.type}`,
          data: msg.data,
        });
      }, simLagMs);

    } else {
      this._store.dispatch({
        type: `ws:${msg.type}`,
        data: msg.data,
      });
    }
  }

  handleClose() {
    console.error('lost ws connection');

    this._store.dispatch({
      type: 'disconnect',
    });
  }

  send(msg: Object) {
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

  get connected(): boolean {
    return this._ws.readyState === this._ws.OPEN;
  }
}

const ws = new WSConnection();

export default ws;
