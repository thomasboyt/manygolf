import I from 'immutable';
import p2 from 'p2';

import {
  STATE_CONNECTING,
} from '../universal/constants';

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
});

export class DumbBall extends DumbBallRec {
  x: number;
  y: number;
  color: string;
  name: string;
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
  state: STATE_CONNECTING,
  ghostBalls: I.Map(),

  name: null,
  displayMessage: null,
  displayMessageTimeout: null,

  level: null,
  world: null,
  ball: new Ball(),
  holeSensor: null,

  aimDirection: -45,  // angle (in degrees) relative to pointing ->
  swingPower: 0,
  allowHit: false,
  inSwing: false,

  expTime: null,
  strokes: 0,

  scored: false,
  goalText: null,
});

export class State extends StateRec {
  state: string;  // TODO: use enum here

  ghostBalls: I.Map<number, DumbBall>;

  name: string;
  displayMessage: string;
  displayMessageTimeout: number;

  level: Level;
  world: p2.World;
  ball: Ball;
  holeSensor: p2.Body;

  aimDirection: number;
  swingPower: number;
  allowHit: boolean;
  inSwing: boolean;

  expTime: number;
  strokes: number;

  scored: boolean;
  goalText: string;
}
