/// <reference path="../../../typings/browser/ambient/mocha/index.d.ts" />

import expect from 'expect';
import I from 'immutable';

import {Player} from '../records';
import {rankPlayers} from '../reducer';

describe('rankPlayers', () => {
  it('ranks players by strokes', () => {
    const players = I.Map<number, Player>()
      .set(1, new Player({
        id: 1,
        scored: true,
        strokes: 3,
        scoreTime: 1000,
      }))
      .set(2, new Player({
        id: 2,
        scored: true,
        strokes: 2,
        scoreTime: 1000,
      }));

    const ranked = rankPlayers(players);

    expect(ranked.get(0).id).toEqual(2);
  });

  it('ranks players with better time when strokes are equal', () => {
    const players = I.Map<number, Player>()
      .set(1, new Player({
        id: 1,
        scored: true,
        strokes: 2,
        scoreTime: 1500,
      }))
      .set(2, new Player({
        id: 2,
        scored: true,
        strokes: 2,
        scoreTime: 1000,
      }))
      .set(3, new Player({
        id: 3,
        scored: true,
        strokes: 3,
        scoreTime: 500,
      }))

    const ranked = rankPlayers(players);

    expect(ranked.get(0).id).toEqual(2);
  });

  it('does not rank players who did not score', () => {
    const players = I.Map<number, Player>()
      .set(1, new Player({
        id: 1,
        scored: false,
        strokes: 2,
        scoreTime: 1000,
      }))
      .set(2, new Player({
        id: 2,
        scored: true,
        strokes: 2,
        scoreTime: 1500,
      }));

    const ranked = rankPlayers(players);

    expect(ranked.get(0).id).toEqual(2);
  })
});