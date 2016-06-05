import {WIDTH, HEIGHT} from '../universal/constants';

import sample from 'lodash.sample';

const colors = [
  'yellow',
  'pink',
  'limegreen',
  'skyblue',
  'orange',
  'red',
  'white',
];

/* get an int between min and max inclusive */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getSegmentWidths(totalWidth: number, minWidth: number): number[] {
  const widths = [];
  let remainingWidth = totalWidth;

  while (remainingWidth > 0) {
    let maxWidth = 50;

    if (remainingWidth < maxWidth) {
      maxWidth = remainingWidth;
    }

    let width = randInt(minWidth, maxWidth);

    // if this segment would leave us with < minWidth remaining width, just make this segment the
    // entire remaining width
    if (remainingWidth - width < minWidth) {
      width = remainingWidth;
    }

    widths.push(width);
    remainingWidth -= width;
  }

  return widths;
}

export default function levelGen() {
  const segmentWidths = getSegmentWidths(WIDTH, 10);
  const numSegments = segmentWidths.length;

  const spawnSegment = randInt(2, Math.floor(numSegments / 3));

  // hole can't be on the last segment because it may be smaller than the rest
  // this causes the hole alignment to be off which causes an invalid shape that the ball just
  // kinda falls through
  const holeSegment = randInt(Math.floor(numSegments / 3) * 2, numSegments - 1);

  const points = [];
  let spawnX, spawnY, holeX, holeY;

  const minY = 80;
  const maxY = 210;

  for (let idx = 0; idx <= numSegments; idx++) {
    const segmentWidth = segmentWidths[idx - 1];

    let x, y;

    if (idx === 0) {
      x = 0;
    } else {
      x = points[idx - 1][0] + segmentWidth;
    }

    if (x > WIDTH) {
      x = WIDTH;
    }

    if (idx === 0) {
      y = randInt(HEIGHT - 150, HEIGHT - 20);
    } else {
      const prevY = points[idx - 1][1];

      let boundLow = prevY - 40;
      let boundHigh = prevY + 40;

      // clamp high/low bounds so that if they go out of screen bounds, the bounds shift to contain
      // the same range but clamped
      if (boundLow < minY) {
        boundHigh = boundHigh - (boundLow - minY);
        boundLow = minY;
      }

      if (boundHigh > maxY) {
        boundLow = boundLow - (boundHigh - maxY);
        boundHigh = maxY;
      }

      y = randInt(boundLow, boundHigh);
    }

    if (idx === spawnSegment) {
      spawnX = x - Math.round(segmentWidth / 2);
      y = points[idx - 1][1];
      spawnY = y;
    }

    if (idx === holeSegment) {
      holeX = x - Math.round(segmentWidth / 2);
      y = points[idx - 1][1];
      holeY = y;
    }

    points.push([x, y]);
  }

  const color = sample(colors);
  console.log(points);

  const level = {
    points,
    hole: [holeX, holeY],
    spawn: [spawnX, spawnY],
    color,
  };

  return level;
}
