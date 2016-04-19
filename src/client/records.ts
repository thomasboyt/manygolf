import I from 'immutable';
import p2 from 'p2';

import {
  ConnectionState,
  RoundState,
} from '../universal/constants';

export enum SwingMeterDirection {
  ascending,
  descending
}

const BallRec = I.Record({
  body: null,
});

export class Ball extends BallRec {
  body: p2.Body;
}

const PlayerRec = I.Record({
  x: null,
  y: null,
  color: null,
  name: null,
  id: null,
  isObserver: false,
});

export class Player extends PlayerRec {
  x: number;
  y: number;
  color: string;
  name: string;
  id: number;
  isObserver: boolean;
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

const LeaderboardPlayerRec = I.Record({
  color: null,
  name: null,
  id: null,
  strokes: null,
  scoreTime: null,
});

export class LeaderboardPlayer extends LeaderboardPlayerRec {
  color: string;
  name: string;
  id: number;
  strokes: number;
  scoreTime: number;
}

const RoundRec = I.Record({
  roundState: null,

  level: null,
  world: null,
  ball: new Ball(),
  holeSensor: null,

  aimDirection: -45,  // angle (in degrees) relative to pointing ->
  swingPower: 0,
  swingMeterDirection: SwingMeterDirection.ascending,
  allowHit: false,
  inSwing: false,

  expTime: null,
  strokes: 0,

  scored: false,
  goalText: null,

  roundRankedPlayers: null,
});

export class Round extends RoundRec {
  roundState: RoundState;

  level: Level;
  world: p2.World;
  ball: Ball;
  holeSensor: p2.Body;

  aimDirection: number;
  swingPower: number;
  swingMeterDirection: SwingMeterDirection;
  allowHit: boolean;
  inSwing: boolean;

  expTime: number;
  strokes: number;

  scored: boolean;
  goalText: string;

  roundRankedPlayers: I.List<LeaderboardPlayer>;
}

const StateRec = I.Record({
  connectionState: ConnectionState.connecting,

  players: I.Map(),

  name: null,
  id: null,
  color: null,
  isObserver: false,

  displayMessage: null,
  displayMessageTimeout: null,
  displayMessageColor: null,

  round: null,
});

export class State extends StateRec {
  connectionState: ConnectionState;

  players: I.Map<number, Player>;

  name: string;
  id: number;
  color: string;
  isObserver: boolean;

  displayMessage: string;
  displayMessageTimeout: number;
  displayMessageColor: string;

  round: Round;
}
