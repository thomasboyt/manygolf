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
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function levelGen() {
  let numSegments = randInt(10, 30);

  // ceil to prevent sum(segment widths) with being < WIDTH...
  const segmentWidth = Math.ceil(WIDTH / numSegments);

  // ...but with ceil() you can end up in an annoying edge case where points[n - 1].x >= 500
  // example: n=26, width=500, segmentWidth=20, 20*25 = 500
  // this causes two points with x=width to exist which can break ground polygon creation
  //
  // as a hack, we just decrease numSegments by 1 if this scenario is encountered, but keep
  // the previous segment width
  if (segmentWidth * (numSegments - 1) >= WIDTH) {
    numSegments -= 1;
  }

  const spawnSegment = randInt(2, Math.floor(numSegments / 3));

  // hole can't be on the last segment because it may be smaller than the rest
  // this causes the hole alignment to be off which causes an invalid shape that the ball just
  // kinda falls through
  const holeSegment = randInt(Math.floor(numSegments / 3) * 2, numSegments - 1);

  const points = [];
  let spawnX, spawnY, holeX, holeY;

  const maxY = HEIGHT - 20;
  const minY = HEIGHT - 150;

  for (let idx = 0; idx <= numSegments; idx++) {
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

  const level = {
    points,
    hole: [holeX, holeY],
    spawn: [spawnX, spawnY],
    color,
  };

  return level;
}
