import WebSocket, {Server} from 'ws';

abstract class SocketManager {
  idCounter: number;
  _sockets: Map<number, WebSocket>;

  abstract onConnect(id: number, ws?: WebSocket);
  abstract onMessage(id: number, msg: Object);
  abstract onDisconnect(id: number);

  constructor(wss: Server) {
    this.idCounter = 0;
    this._sockets = new Map();

    wss.on('connection', (ws) => this.handleConnection(ws));
  }

  handleConnection(ws: WebSocket) {
    const id = this.idCounter;
    this.idCounter += 1;

    this._sockets.set(id, ws);

    ws.on('message', (strMsg) => this.handleMessage(id, strMsg));
    ws.on('close', () => this.handleCloseSocket(id, false));
    ws.on('error', () => this.handleCloseSocket(id, true));

    this.onConnect(id, ws);
  }

  handleMessage(id: number, strMsg: string) {
    console.log(`received: ${strMsg}`);

    let msg;
    try {
      msg = JSON.parse(strMsg);
    } catch(err) {
      console.error('ignoring malformed message');
    }

    this.onMessage(id, msg);
  }

  handleCloseSocket(id: number, didError: boolean) {
    const reason = didError ? '(errored)' : '';
    console.log(`*** ID ${id} disconnected ${reason}`);

    this.onDisconnect(id);

    this._sockets.delete(id);
  }

  _getSocket(id: number) {
    return this._sockets.get(id);
  }

  /*
   * get map of id -> socket
   */
  _getSockets() {
    return this._sockets;
  }

  sendTo(id: number, msg: Object) {
    const msgStr = JSON.stringify(msg);

    console.log(`sent to ${id}: ${msgStr}`);

    return this._getSocket(id).send(msgStr, (err) => {
      if (err) {
        console.log(`error sending to ${id}`, err);
      }
    });
  }

  sendAll(msg: Object) {
    const msgStr = JSON.stringify(msg);

    console.log(`sent: ${msgStr}`);

    this._getSockets().forEach((socket, id) => {
      socket.send(msgStr, (err) => {
        if (err) {
          console.log(`error sending to ${id}`, err);
        }
      });
    });
  }
}

export default SocketManager;
