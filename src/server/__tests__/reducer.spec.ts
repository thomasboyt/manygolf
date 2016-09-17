/// <reference path="../../../typings/globals/mocha/index.d.ts" />

import expect from 'expect';
import I from 'immutable';

import {Player, State} from '../records';
import reducer, {rankPlayers, updatePoints} from '../reducer';
import {PlayerState} from '../../universal/constants';
import levelGen from '../../universal/levelGen';

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

function generateRankedPlayers(n: number) {
  let players = I.Map<number, Player>();

  for (let i = 0; i < n; i++) {
    players = players.set(i, new Player({
      id: i,
      scored: true,
    }));
  }

  const ranked = players.map((player) => player.id).toList();

  return {players, ranked};
}

describe('updatePoints', () => {
  it('sets the top 3 scores', () => {
    let {players, ranked} = generateRankedPlayers(3);
    players = updatePoints(players, ranked);

    expect(players.get(0).points).toEqual(20);
    expect(players.get(1).points).toEqual(15);
    expect(players.get(2).points).toEqual(12);
  });

  it('sets top 25% and top 50% scores', () => {
    let {players, ranked} = generateRankedPlayers(20);
    players = updatePoints(players, ranked);

    const points = players.map((player) => player.points).toList();

    expect(points.toJS()).toEqual([
      20,
      15,
      12,
      10,
      10,
      5, 5, 5, 5, 5,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    ]);
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
    expect(players.get(2).points).toEqual(25);
  });
});

describe('startMatch', () => {
  it('resets the points of players', () => {
    const initialState = new State()
      .setIn(['players', 1], new Player({
        points: 10,
      }));

    const state = reducer(initialState, {
      type: 'startMatch',
      endTime: 123,
    });

    expect(state.players.get(1).points).toEqual(0);
  });
});

describe('playerLeft', () => {
  it('sets an active player to be in leftRound state', () => {
    const initialState = new State().setIn(['players', 1], new Player());

    const state = reducer(initialState, {
      type: 'playerLeft',
      id: 1,
    });

    expect(state.players.get(1).state).toEqual(PlayerState.leftRound);
  });
});

describe('playerJoined', () => {
  it('sets a leftRound player to be in active state', () => {
    const initialState = new State()
      .setIn(['players', 1], new Player({state: PlayerState.leftRound}));

    const state = reducer(initialState, {
      type: 'playerJoined',
      id: 1,
    });

    expect(state.players.get(1).state).toEqual(PlayerState.active);
  });

  it('creates a new ball for a leftMatch player', () => {
    const initialState = new State()
      .setIn(['players', 1], new Player({state: PlayerState.leftMatch}));

    const levelState = reducer(initialState, {
      type: 'level',
      levelData: levelGen(),
      expTime: Date.now() + 5000,
      startTime: Date.now(),
    });

    const state = reducer(levelState, {
      type: 'playerJoined',
      id: 1,
    });

    expect(state.players.get(1).state).toEqual(PlayerState.active);
    expect(state.players.get(1).body).toExist();
  });
});

describe('level', () => {
  it('sets leftRound players to be in leftMatch state', () => {
    const initialState = new State().setIn(['players', 1], new Player({state: PlayerState.leftRound}));

    const state = reducer(initialState, {
      type: 'level',
      levelData: levelGen(),
      expTime: Date.now() + 5000,
      startTime: Date.now(),
    });

    expect(state.players.get(1).state).toEqual(PlayerState.leftMatch);
    expect(state.players.get(1).body).toEqual(null);
  });

  it('does not create balls for leftMatch players', () => {
    const initialState = new State().setIn(['players', 1], new Player({state: PlayerState.leftMatch}));

    const state = reducer(initialState, {
      type: 'level',
      levelData: levelGen(),
      expTime: Date.now() + 5000,
      startTime: Date.now(),
    });

    expect(state.players.get(1).state).toEqual(PlayerState.leftMatch);
    expect(state.players.get(1).body).toEqual(null);
  });
});

describe('startMatch', () => {
  it('removes leftRound & leftMatch players from the current state', () => {
    const initialState = new State()
      .setIn(['players', 1], new Player({state: PlayerState.leftRound}))
      .setIn(['players', 2], new Player({state: PlayerState.leftMatch}))
      .setIn(['players', 3], new Player({state: PlayerState.active}));

    const state = reducer(initialState, {
      type: 'startMatch',
      endTime: Date.now() + 5000,
    });

    expect(state.players.size).toEqual(1);
    expect(state.players.has(3)).toEqual(true);
  });
});