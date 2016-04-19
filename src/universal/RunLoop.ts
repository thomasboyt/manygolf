const raf = require('raf');
raf.polyfill();

type TickListener = (dt: number) => void;

class RunLoop {
  private _lastTickMs: number;
  private _nextTick: () => any;
  private _onTick: TickListener;

  start() {
    this._lastTickMs = Date.now();

    this._nextTick = this._runLoop.bind(this);
    requestAnimationFrame(this._nextTick);
  }

  stop() {
    this._nextTick = () => {};
  }

  _runLoop() {
    const now = Date.now();
    const dt = now - this._lastTickMs;
    this._lastTickMs = now;

    this._onTick(dt);

    requestAnimationFrame(this._nextTick);
  }

  onTick(listener: TickListener) {
    this._onTick = listener;
  }
}

export default RunLoop;
