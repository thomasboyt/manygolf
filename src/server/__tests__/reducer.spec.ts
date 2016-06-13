/// <reference path="../../../typings/globals/mocha/index.d.ts" />

import expect from 'expect';
import I from 'immutable';

import {Player} from '../records';
import {rankPlayers, updatePoints} from '../reducer';

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

    expect(ranked.get(0)).toEqual(2);
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
      }));

    const ranked = rankPlayers(players);

    expect(ranked.get(0)).toEqual(2);
  });

  it('does ranks players who did not score at the end', () => {
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

    expect(ranked.get(0)).toEqual(2);
    expect(ranked.get(1)).toEqual(1);
  });
});

describe('updatePoints', () => {
  it('adds new points based on scores', () => {
    let players = I.Map<number, Player>();

    players = players
      .set(1, new Player({
        id: 1,
        scored: true,
        strokes: 3,
        scoreTime: 1,
      }))
      .set(2, new Player({
        id: 2,
        scored: true,
        strokes: 4,
        scoreTime: 1,
        points: 5,
      }));

    const ranked = rankPlayers(players);
    players = updatePoints(players, ranked);

    expect(players.get(1).points).toEqual(10);
    expect(players.get(2).points).toEqual(5 + 8);
  });

  it('does not award points to players who failed to score', () => {
    let players = I.Map<number, Player>();

    players = players
      .set(1, new Player({
        id: 1,
        scored: false,
        strokes: 3,
        scoreTime: 1,
      }))
      .set(2, new Player({
        id: 2,
        scored: true,
        strokes: 4,
        scoreTime: 1,
        points: 5,
      }));

    const ranked = rankPlayers(players);
    players = updatePoints(players, ranked);

    expect(players.get(1).points).toEqual(0);
    expect(players.get(2).points).toEqual(5 + 10);
  });
});