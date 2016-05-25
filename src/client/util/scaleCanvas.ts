function getScaleFactor(originalWidth: number, originalHeight: number, maxWidth: number,
                        maxHeight: number): number {
  if (originalWidth > maxWidth || originalHeight > maxHeight) {
    return 1;
  }

  const heightScale = maxHeight / originalHeight;
  const widthScale = maxWidth / originalWidth;
  return Math.min(heightScale, widthScale);
}

/*
 * Scales the canvas to the highest size that keeps the aspect ratio and fits within browser
 * height and canvas container width. Also applies retina scaling when appropriate.
 */
export default function scaleCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  const clientWidth = (<HTMLElement>canvas.parentNode).clientWidth;
  const viewportHeight = document.documentElement.clientHeight;

  const scale = getScaleFactor(width, height, clientWidth, viewportHeight);

  let pixelRatio = 1;

  if (window.devicePixelRatio) {
    pixelRatio = window.devicePixelRatio;
  }

  // canvas width and height should be the pixel-scaled size
  canvas.width = width * scale * pixelRatio;
  canvas.height = height * scale * pixelRatio;

  // the css styling should be the "logical" size
  canvas.style.width = `${width * scale}px`;
  canvas.style.maxHeight = `${height * scale}px`;

  canvas.getContext('2d').scale(scale * pixelRatio, scale * pixelRatio);
}