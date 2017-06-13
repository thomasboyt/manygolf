declare module "persistent-websocket" {
  interface PersistentWebsocketOptions {
    pingSendFunction?: (pws: PersistentWebsocket) => void;
    pingTimeoutMillis?: number;
    pingIntervalSeconds?: number;
    connectTimeoutMillis?: number;
    maxBackoffDelayMillis?: number;
  }

  export interface ReconnectEvent {
    attemptNumber: number;
    waitMillis: number;
  }

  export class PersistentWebsocket extends WebSocket {
    constructor(url: string, options: PersistentWebsocketOptions);

    open(): void;

    onbeforereconnect: (evt: ReconnectEvent) => void;
  }
}