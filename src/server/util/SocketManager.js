export default class SocketManager {
  constructor(wss) {
    this.idCounter = 0;
    this._sockets = new Map();

    wss.on('connection', (ws) => this.handleConnection(ws));
  }

  handleConnection(ws) {
    const id = this.idCounter;
    this.idCounter += 1;

    this._sockets.set(id, ws);

    ws.on('message', (strMsg) => this.handleMessage(id, strMsg));
    ws.on('close', () => this.handleCloseSocket(id, false));
    ws.on('error', () => this.handleCloseSocket(id, true));

    this.onConnect(id);
  }

  handleMessage(id, strMsg) {
    console.log('received: %s', strMsg);

    let msg;
    try {
      msg = JSON.parse(strMsg);
    } catch(err) {
      console.error('ignoring malformed message');
    }

    this.onMessage(id, msg);
  }

  handleCloseSocket(id, didError) {
    const reason = didError ? '(errored)' : '';
    console.log(`*** ID ${id} disconnected ${reason}`);

    this.onDisconnect(id);

    this._sockets.delete(id);
  }

  _getSocket(id) {
    return this._sockets.get(id);
  }

  /*
   * get map of id -> socket
   */
  _getSockets() {
    return this._sockets;
  }

  sendTo(id, msg) {
    return this._getSocket(id).send(JSON.stringify(msg), (err) => {
      if (err) {
        console.log(`error sending to ${id}`, err);
      }
    });
  }

  sendAll(msg) {
    const msgStr = JSON.stringify(msg);

    this._getSockets().forEach((socket, id) => {
      socket.send(msgStr, (err) => {
        if (err) {
          console.log(`error sending to ${id}`, err);
        }
      });
    });
  }
}
