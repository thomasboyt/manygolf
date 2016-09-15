import I from 'immutable';
import p2 from 'p2';

import {
  GameState,
} from '../universal/constants';

export interface Coordinates {
  x: number;
  y: number;
}

const PlayerRec = I.Record({
  id: null,
  disconnected: false,

  body: null,
  color: null,
  name: null,

  scored: false,
  strokes: 0,
  scoreTime: null,

  points: 0,
  prevPoints: 0,

  lastSwingTime: null,
});

export type PlayersMap = I.Map<number, Player>;

export class Player extends PlayerRec {
  id: number;
  disconnected: boolean;

  body: p2.Body;
  color: string;
  name: string;

  scored: boolean;
  strokes: number;
  scoreTime: number;

  points: number;
  prevPoints: number;

  lastSwingTime: number;
}

const LevelRec = I.Record({
  points: null,
  hole: null,
  spawn: null,
  color: null,
});

export class Level extends LevelRec {
  points: I.List<I.List<number>>;
  hole: I.List<number>;
  spawn: I.List<number>;
  color: string;
}

/*
 * TODO Oh my god this record is a god damn mess
 * Should be split into game state + round state like client is
 * ALSO IF YOU ADD ANYTHING TO THIS THAT PERSISTS BETWEEN ROUNDS REMEMBER TO UPDATE THE NEW LEVEL
 * REDUCER OR YOU'RE GONNA HAVE A BAD TIME
 */

const StateRec = I.Record({
  levelData: null,
  world: null,
  level: null,
  players: I.Map(),
  observers: I.Map(),
  startTime: null,
  expTime: null,
  holeSensor: null,
  gameState: GameState.roundInProgress,
  roundRankedPlayers: null,
  matchRankedPlayers: null,
  didHurryUp: false,
  time: 0,
  leaderId: null,
  matchEndTime: null,
});

export class State extends StateRec {
  levelData: any;  // TODO
  world: p2.World;
  level: Level;
  players: PlayersMap;
  observers: PlayersMap;
  startTime: number;
  expTime: number;
  holeSensor: p2.Body;
  gameState: GameState;
  roundRankedPlayers: I.List<Player>;
  matchRankedPlayers: I.List<Player>;
  didHurryUp: boolean;
  time: number;
  leaderId: number;
  matchEndTime: number;
}
