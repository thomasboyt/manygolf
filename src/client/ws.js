class WSConnection {
  init(store) {
    this._store = store;

    this._ws = new WebSocket(`ws://${document.location.host}/server`);

    this._ws.onmessage = this.handleMessage.bind(this);
  }

  handleMessage(evt) {
    const msg = JSON.parse(evt.data);

    this._store.dispatch({
      type: `ws:${msg.type}`,
      data: msg.data,
    });
  }
}

const ws = new WSConnection();

export default ws;
