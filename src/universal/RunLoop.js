import raf from 'raf';
raf.polyfill();

class RunLoop {
  constructor(store) {
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

    this.store.dispatch({
      type: 'tick',
      dt,
      ...tickPayload,
    });

    const nextState = this.store.getState();

    this._listeners.forEach((listener) => listener(nextState, prevState));

    requestAnimationFrame(this._nextTick);
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

export default RunLoop;
