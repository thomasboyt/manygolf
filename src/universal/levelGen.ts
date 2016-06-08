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

function shuffle(a: any[]) {
  for (let i = a.length; i; i -= 1) {
    const j = Math.floor(Math.random() * i);
    const x = a[i - 1];
    a[i - 1] = a[j];
    a[j] = x;
  }
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

  // shuffle widths so it's not biased towards having smaller segments at the end
  shuffle(widths);

  return widths;
}

export default function levelGen() {
  const segmentWidths = getSegmentWidths(WIDTH, 12);
  const numSegments = segmentWidths.length;

  const spawnSegment = randInt(1, Math.floor(numSegments / 3));
  const holeSegment = numSegments - randInt(1, Math.floor(numSegments / 3));

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

      // special-case flat section
      if (randInt(1, 3) === 1) {
        y = prevY;

      } else {
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
