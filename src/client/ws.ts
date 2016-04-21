import {Store} from 'redux';

const simulateLag = document.location.search.indexOf('simlag') !== -1;
const simLagMsMin = 25;
const simLagMsMax = 200;

if (simulateLag) {
  console.log(`*** WARNING: Simulating lag (${simLagMsMin}-${simLagMsMax}ms)`);
}

function randomLag(): number {
  return Math.floor(Math.random() * (simLagMsMax - simLagMsMin + 1)) + simLagMsMin;
}

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

    if (simulateLag) {
      setTimeout(() => {
        this._store.dispatch({
          type: `ws:${msg.type}`,
          data: msg.data,
        });
      }, randomLag());

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
      }, randomLag());

    } else {
      this._ws.send(strMsg);
    }
  }
}

const ws = new WSConnection();

export default ws;
