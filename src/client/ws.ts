import {Store} from 'redux';

class WSConnection {
  private _ws: WebSocket;
  private _store: Store;

  init(store: Store) {
    this._store = store;

    this._ws = new WebSocket(`ws://${document.location.host}/server`);

    this._ws.onmessage = this.handleMessage.bind(this);

    this._ws.onclose = this.handleClose.bind(this);
  }

  handleMessage(evt: MessageEvent) {
    const msg = JSON.parse(evt.data);

    this._store.dispatch({
      type: `ws:${msg.type}`,
      data: msg.data,
    });
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

    this._ws.send(strMsg);
  }
}

const ws = new WSConnection();

export default ws;
