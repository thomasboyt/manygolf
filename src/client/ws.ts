import {Store} from 'redux';

const simulateLag = document.location.search.indexOf('simlag') !== -1;
const simLagMs = 200;

if (simulateLag) {
  console.log(`*** WARNING: Simulating lag (${simLagMs}ms)`);
}

(<any>window).msgLog = [];

class WSConnection {
  private _ws: WebSocket;
  private _store: Store;

  init(store: Store) {
    this._store = store;

    let url = `ws://${document.location.host}/server`;
    if (document.location.search.indexOf('observe') !== -1) {
      url += '?observe';
    }

    this._ws = new WebSocket(url);

    this._ws.onmessage = this.handleMessage.bind(this);

    this._ws.onclose = this.handleClose.bind(this);
  }

  handleMessage(evt: MessageEvent) {
    const msg = JSON.parse(evt.data);

    (<any>window).msgLog.push(msg);

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
}

const ws = new WSConnection();

export default ws;
