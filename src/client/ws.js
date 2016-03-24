class WSConnection {
  init(store) {
    this._store = store;

    this._ws = new WebSocket(`ws://${document.location.host}/server`);

    this._ws.onmessage = this.handleMessage.bind(this);

    this._ws.onclose = this.handleClose.bind(this);
  }

  handleMessage(evt) {
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

  send(msg) {
    const strMsg = JSON.stringify(msg);

    this._ws.send(strMsg);
  }
}

const ws = new WSConnection();

export default ws;
