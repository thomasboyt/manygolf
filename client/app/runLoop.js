import {keysDown} from './inputter';

import {
  TICK,
} from './ActionTypes';

class RunLoop {
  constructor() {
    this.store = null;
    this._listeners = [];
  }

  start() {
    this._lastTickMs = Date.now();

    this._nextTick = this._runLoop.bind(this);
    window.requestAnimationFrame(this._nextTick);
  }

  stop() {
    this._nextTick = () => {};
  }

  _runLoop() {
    const now = Date.now();
    const dt = now - this._lastTickMs;
    this._lastTickMs = now;

    this.store.dispatch({
      type: TICK,
      dt,
      keysDown: new Set(keysDown),  // create new copy of set
    });

    this._listeners.forEach((listener) => listener());

    window.requestAnimationFrame(this._nextTick);
  }

  setStore(store) {
    this.store = store;
  }

  subscribe(listener) {
    this._listeners.push(listener);
  }

  unsubscribe(listener) {
    const idx = this._listeners.indexOf(listener);

    if (idx === -1) {
      throw new Error('tried to unsubscribe listener that wasn\'t subscribed');
    }

    this._listeners.splice(idx, 1);
  }
}

const runLoop = new RunLoop();

if (process.env.NODE_ENV === 'development') {
  window.stop = runLoop.stop.bind(runLoop);
  window.start = runLoop.start.bind(runLoop);
}

export default runLoop;
