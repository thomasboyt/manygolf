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

const DumbBallRec = I.Record({
  x: null,
  y: null,
  color: null,
  name: null,
  id: null,
});

export class DumbBall extends DumbBallRec {
  x: number;
  y: number;
  color: string;
  name: string;
  id: number;
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
  connectionState: ConnectionState.connecting,
  roundState: null,

  ghostBalls: I.Map(),

  name: null,
  id: null,

  displayMessage: null,
  displayMessageTimeout: null,
  displayMessageColor: null,

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

  winnerId: null,
});

export class State extends StateRec {
  connectionState: ConnectionState;
  roundState: RoundState;

  ghostBalls: I.Map<number, DumbBall>;

  name: string;
  id: number;

  displayMessage: string;
  displayMessageTimeout: number;
  displayMessageColor: string;

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

  winnerId: number;
}
