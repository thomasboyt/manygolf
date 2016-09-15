import WebSocket from 'uws';

/**
 * TODO: This maybe doesn't need to exist and could be replaced with more complex code in
 * ManygolfSocketManager, I'm still feeling out the abstraction here.
 */
export default class ManygolfSocket {
  onMessage: (msg: any) => void;
  onDisconnect: () => void;

  private didReplace: boolean = false;
  private ws: WebSocket;

  constructor(ws: WebSocket) {
    this.ws = ws;

    this.ws.on('message', (strMsg) => this.handleMessage(strMsg));
    this.ws.on('close', () => this.handleCloseSocket(false));
    this.ws.on('error', () => this.handleCloseSocket(true));
  }

  close() {
    this.ws.close();
  }

  replace() {
    this.didReplace = true;
    this.ws.close();
  }

  send(msg: string, cb: (err: Error) => void) {
    this.ws.send(msg, cb);
  }

  private handleMessage(strMsg: string) {
    let msg;
    try {
      msg = JSON.parse(strMsg);
    } catch(err) {
      console.log(`ignoring malformed message ${strMsg}`);
      return;
    }

    this.onMessage(msg);
  }

  private handleCloseSocket(didError: boolean) {
    if (this.didReplace) {
      return;  // don't need to do any close-related activities since this was replaced!
    }

    this.onDisconnect();
  }
}