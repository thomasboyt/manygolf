import I from 'immutable';
import p2 from 'p2';

import {
  RoundState,
} from '../universal/constants';

export interface Coordinates {
  x: number;
  y: number;
}

const PlayerRec = I.Record({
  id: null,

  body: null,
  color: null,
  name: null,

  scored: false,
  strokes: 0,
  scoreTime: null,
});

export class Player extends PlayerRec {
  id: number;
  body: p2.Body;
  color: string;
  name: string;
  strokes: number;
  scored: boolean;
  scoreTime: number;
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

const StateRec = I.Record({
  levelData: null,
  world: null,
  level: null,
  players: I.Map(),
  expTime: null,
  holeSensor: null,
  roundState: RoundState.inProgress,
});

export class State extends StateRec {
  levelData: any;  // TODO
  world: p2.World;
  level: Level;
  players: I.Map<number, Player>;
  expTime: number;
  holeSensor: p2.Body;
  roundState: RoundState;
}
