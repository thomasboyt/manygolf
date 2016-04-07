const raf = require('raf');
raf.polyfill();

import {Store} from 'redux';

type ListenerFn = (prevState: any, nextState: any) => void;

class RunLoop {
  store: Store;
  _listeners: Array<ListenerFn>;
  _lastTickMs: number;
  _nextTick: () => any;

  constructor(store: Store) {
    this.store = store;
    this._listeners = [];
  }

  start() {
    this._lastTickMs = Date.now();

    this._nextTick = this._runLoop.bind(this);
    requestAnimationFrame(this._nextTick);
  }

  stop() {
    this._nextTick = () => {};
  }

  getTickPayload() {
    return {};
  }

  _runLoop() {
    const now = Date.now();
    const dt = now - this._lastTickMs;
    this._lastTickMs = now;

    const prevState = this.store.getState();

    const tickPayload = this.getTickPayload();

    this.store.dispatch(Object.assign({
      type: 'tick',
      dt,
    }, tickPayload));

    const nextState = this.store.getState();

    this._listeners.forEach((listener) => listener(nextState, prevState));

    requestAnimationFrame(this._nextTick);
  }

  setStore(store: Store) {
    this.store = store;
  }

  subscribe(listener: ListenerFn) {
    this._listeners.push(listener);
  }

  unsubscribe(listener: ListenerFn) {
    const idx = this._listeners.indexOf(listener);

    if (idx === -1) {
      throw new Error('tried to unsubscribe listener that wasn\'t subscribed');
    }

    this._listeners.splice(idx, 1);
  }
}

export default RunLoop;
