/*
 * Run after resizing the canvas to apply the appropriate scaling for retina devices
 */
export default function retinaFix(canvas: HTMLCanvasElement) {
  if (window.devicePixelRatio) {
    const prevWidth = canvas.width;
    const prevHeight = canvas.height;

    // canvas width and height should be the pixel-doubled size
    canvas.width = prevWidth * window.devicePixelRatio;
    canvas.height = prevHeight * window.devicePixelRatio;

    // the css styling should be the "logical" size
    canvas.style.width = `${prevWidth}px`;
    canvas.style.maxHeight = `${prevHeight}px`;

    canvas.getContext('2d').scale(window.devicePixelRatio, window.devicePixelRatio);
  }
}