/// <reference types="mocha" />

import * as expect from 'expect';

import {getSegmentWidths} from '../levelGen';

describe('segment width gen', () => {
  // The goals of segment generation:
  // Generate n segments with widths that add up to total width
  // All segments should be long enough to fit a hole or starting point within

  it('Generates segment widths', () => {
    const totalWidth = 500;
    const minWidth = 10;
    const widths = getSegmentWidths(totalWidth, minWidth);

    const summed = widths.reduce((acc, n) => acc + n, 0);
    expect(summed).toEqual(totalWidth);

    widths.forEach((width) => {
      expect(width).toBeGreaterThanOrEqualTo(minWidth);
    });
  });
});