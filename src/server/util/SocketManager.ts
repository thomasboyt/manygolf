import WebSocket, {Server} from 'uws';

function log(msg: any, ...params: any[]) {
  if (process.env.LOG_WS) {
    console.log(msg, ...params);
  }
}

abstract class SocketManager {
  idCounter: number = 0;
  _sockets: Map<number, WebSocket> = new Map();
  private pausedSockets: Set<number> = new Set();

  abstract onConnect(id: number, ws?: WebSocket);
  abstract onMessage(id: number, msg: Object);
  abstract onDisconnect(id: number);

  constructor(wss: Server) {
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
    log(`received: ${strMsg}`);

    let msg;
    try {
      msg = JSON.parse(strMsg);
    } catch(err) {
      log('ignoring malformed message');
    }

    this.onMessage(id, msg);
  }

  handleCloseSocket(id: number, didError: boolean) {
    const reason = didError ? '(errored)' : '';
    log(`*** ID ${id} disconnected ${reason}`);

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
    if (this.pausedSockets.has(id)) {
      return;
    }

    const msgStr = JSON.stringify(msg);

    log(`sent to ${id}: ${msgStr}`);

    return this._getSocket(id).send(msgStr, (err) => {
      if (err) {
        log(`error sending to ${id}`, err);
      }
    });
  }

  sendAll(msg: Object) {
    const msgStr = JSON.stringify(msg);

    log(`sent: ${msgStr}`);

    this._getSockets().forEach((socket, id) => {
      if (this.pausedSockets.has(id)) {
        return;
      }

      socket.send(msgStr, (err) => {
        if (err) {
          log(`error sending to ${id}`, err);
        }
      });
    });
  }

  pause(id: number) {
    this.pausedSockets.add(id);
  }

  resume(id: number) {
    this.pausedSockets.delete(id);
  }
}

export default SocketManager;
