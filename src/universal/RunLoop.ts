const raf = require('raf');
raf.polyfill();

import {Store, Dispatch} from 'redux';

type BeforeTickListener = (dt: number, state: any, dispatch: Dispatch) => void;
type AfterTickListener = (nextState: any, prevState: any, dispatch: Dispatch) => void;

class RunLoop {
  store: Store;
  _lastTickMs: number;
  _nextTick: () => any;

  private onBeforeTick: BeforeTickListener;
  private onAfterTick: AfterTickListener;

  private prevState: any;

  constructor(store: Store) {
    this.store = store;

    this.onBeforeTick = () => {};
    this.onAfterTick = () => {};

    this.prevState = this.store.getState();
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

    const prevState = this.prevState;

    const tickPayload = this.getTickPayload();

    this.onBeforeTick(dt, prevState, (action) => this.store.dispatch(action));

    this.store.dispatch(Object.assign({
      type: 'tick',
      dt,
    }, tickPayload));

    const nextState = this.store.getState();

    this.onAfterTick(nextState, prevState, (action) => this.store.dispatch(action));

    this.prevState = nextState;

    requestAnimationFrame(this._nextTick);
  }

  setStore(store: Store) {
    this.store = store;
  }

  beforeTick(listener: BeforeTickListener) {
    this.onBeforeTick = listener;
  }

  afterTick(listener: AfterTickListener) {
    this.onAfterTick = listener;
  }
}

export default RunLoop;
