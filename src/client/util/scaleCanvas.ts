function getScaleFactor(originalWidth: number, originalHeight: number, maxWidth: number,
                        maxHeight: number): number {
  // XXX: I picked .1x because it seems to always result in whole numbers for w=500 and h=250
  // but there has to be a way to find the "minimum scaling factor for whole numbers" for any
  // given width and height, right?
  const scaleStep = 0.1;

  let scale = 1;

  if (originalWidth > maxWidth || originalHeight > maxHeight) {
    // fall back to css scaling...
    return scale;
  }

  const heightScale = maxHeight / originalHeight;
  const widthScale = maxWidth / originalWidth;
  const initScale = Math.min(heightScale, widthScale);

  // Round scaling factor to nearest scaleStep
  scale = Math.floor(initScale / scaleStep) * scaleStep;

  return scale;
}

/*
 * Scales the canvas to the highest size that keeps the aspect ratio and fits within browser
 * height and canvas container width. Also applies retina scaling when appropriate.
 */
export default function scaleCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  const clientWidth = (<HTMLElement>canvas.parentNode).clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const heightBuffer = 125;  // leave room for control bar on touch devices

  const scale = getScaleFactor(width, height, clientWidth, viewportHeight - heightBuffer);

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