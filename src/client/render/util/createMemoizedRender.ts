import {WIDTH, HEIGHT} from '../../../universal/constants';

function getPixelRatio() {
  return window.devicePixelRatio ? window.devicePixelRatio : 1;
}

export class OffscreenCanvas {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  constructor(scaleFactor: number) {
    const pixelRatio = getPixelRatio();

    this.canvas = document.createElement('canvas') as HTMLCanvasElement;
    this.canvas.width = WIDTH * scaleFactor * pixelRatio;
    this.canvas.height = HEIGHT * scaleFactor * pixelRatio;

    this.ctx = this.canvas.getContext('2d');
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(scaleFactor * pixelRatio, scaleFactor * pixelRatio);
  }

  /*
   * Okay so this is super confusing but: we have to render this at the "internal" resolution so it
   * can be later scaled UP to the "native" resolution
   */
  render(ctx: CanvasRenderingContext2D) {
    ctx.drawImage(this.canvas, 0, 0, WIDTH, HEIGHT);
  }
}

/*
 * Creates a memoized reducer that renders to an offscreen canvas. Does a naive equality check on
 * passed args, so works well with ImmutableJS state. Also will always re-render if scaleFactor
 * changes.
 */
export default function createMemoizedRender(
  fn: (ctx: CanvasRenderingContext2D, ...args: any[]) => void) {
  let prevScaleFactor = null;
  let prevArgs = [];
  let prevCanvas = null;

  return (ctx: CanvasRenderingContext2D, scaleFactor: number, ...args) => {
    let shouldRecompute = false;

    if (scaleFactor !== prevScaleFactor) {
      prevScaleFactor = scaleFactor;
      shouldRecompute = true;

    } else {
      for (let idx in args) {
        if (args[idx] !== prevArgs[idx]) {
          shouldRecompute = true;
          break;
        }
      }
    }

    if (shouldRecompute) {
      prevCanvas = new OffscreenCanvas(scaleFactor);
      prevArgs = args;
      fn(prevCanvas.ctx, ...args);
    }

    prevCanvas.render(ctx);
  };
}
