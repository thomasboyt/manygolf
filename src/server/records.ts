import I from 'immutable';
import p2 from 'p2';

export interface Coordinates {
  x: number;
  y: number;
}

const PlayerRec = I.Record({
  body: null,
  color: null,
  strokes: 0,
  scored: false,
});

export class Player extends PlayerRec {
  body: p2.Body;
  color: string;
  strokes: number;
  scored: boolean;
}

const LevelRec = I.Record({
  points: null,
  hole: null,
  spawn: null,
});

export class Level extends LevelRec {
  points: I.List<I.List<number>>;
  hole: I.List<number>;
  spawn: I.List<number>;
}

const StateRec = I.Record({
  levelData: null,
  world: null,
  level: null,
  players: I.Map(),
  expTime: null,
  holeSensor: null,
  levelOver: false,
});

export class State extends StateRec {
  levelData: any;  // TODO
  world: p2.World;
  level: Level;
  players: I.Map<number, Player>;
  expTime: number;
  holeSensor: p2.Body;
  levelOver: boolean;
}
