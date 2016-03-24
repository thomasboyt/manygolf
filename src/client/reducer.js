import I from 'immutable';
import p2 from 'p2';
import randomColor from 'randomcolor';

import createImmutableReducer from '../universal/createImmutableReducer';

import keyCodes from './keyCodes';
import {calcVectorDegrees} from './util/math';

import ws from './ws';

import {
  TYPE_LEVEL,
  TYPE_SWING,
  TYPE_POSITION,
} from '../universal/protocol';

import {
  MAX_POWER,
  STATE_CONNECTING,
  STATE_IN_GAME,
  STATE_DISCONNECTED,
} from '../universal/constants';

import {
  createWorld,
  createBall,
  createGround,
  addHolePoints,
} from '../universal/physics';

import clamp from 'lodash.clamp';

const Ball = I.Record({
  body: null,
  x: null,
  y: null,
});

const DumbBall = I.Record({
  x: null,
  y: null,
  color: null,
});

const Level = I.Record({
  points: null,
  hole: null,
  spawn: null,
});

const State = I.Record({
  state: STATE_CONNECTING,
  world: null,
  ball: Ball(),
  ghostBalls: I.Map(),
  level: null,
  aimDirection: -45,  // angle (in degrees) relative to pointing ->
  allowHit: false,
  inSwing: false,
  swingPower: 0,
  expTime: null,
});

const fixedStep = 1 / 60;
const maxSubSteps = 10;

const moveSpeed = 50;  // degrees per second

function setAim(state, direction, dt) {
  const dir = state.get('aimDirection');

  let step;
  if (direction === 'left') {
    step = -moveSpeed * dt;
  } else if (direction === 'right') {
    step = moveSpeed * dt;
  }

  const newDir = clamp(dir + step, -180, 0);

  return state.set('aimDirection', newDir);
}

function beginSwing(state) {
  return state.set('inSwing', true);
}

function continueSwing(state, dt) {
  const step = dt * 50;

  // TODO: if swingPower > MAX_POWER, descend to 0
  // const swingPower = state.swingPower + step;

  return state.update('swingPower', (swingPower) => clamp(swingPower + step, MAX_POWER));
}

function endSwing(state) {
  const vec = calcVectorDegrees(state.swingPower, state.aimDirection);
  state.ball.body.velocity[0] = vec.x;
  state.ball.body.velocity[1] = vec.y;

  // TODO: do this somewhere else...
  ws.send({
    type: TYPE_SWING,
    data: {vec},
  });

  return state
    .set('inSwing', false)
    .set('swingPower', 0);
}

export default createImmutableReducer(new State(), {
  'tick': (state, {dt, keysDown}) => {
    dt = dt / 1000;  // ms -> s

    if (!state.world) {
      return state;
    }

    if (state.allowHit) {
      if (keysDown.has(keyCodes.A) || keysDown.has(keyCodes.LEFT_ARROW)) {
        state = setAim(state, 'left', dt);
      }
      if (keysDown.has(keyCodes.D) || keysDown.has(keyCodes.RIGHT_ARROW)) {
        state = setAim(state, 'right', dt);
      }

      if (state.inSwing) {
        if (keysDown.has(keyCodes.SPACE)) {
          state = continueSwing(state, dt);
        } else {
          state = endSwing(state);
        }
      } else if (keysDown.has(keyCodes.SPACE)) {
        state = beginSwing(state);
      }
    }

    // XXX: MMMMMonster hack
    // dt is set to dt * 3 because that's the speed I actually want
    state.world.step(fixedStep, dt * 3, maxSubSteps);

    const [ballX, ballY] = state.ball.body.interpolatedPosition;

    const allowHit = state.ball.body.sleepState === p2.Body.SLEEPING;

    return state
      .setIn(['ball', 'x'], ballX)
      .setIn(['ball', 'y'], ballY)
      .set('allowHit', allowHit);
  },

  [`ws:${TYPE_LEVEL}`]: (state, action) => {
    const levelData = action.data.level;
    const expTime = action.data.expTime;

    const level = new Level(I.fromJS(levelData))
      .update(addHolePoints);

    const world = createWorld();

    const groundBody = createGround(level);
    world.addBody(groundBody);

    const ballBody = createBall(level.spawn);
    world.addBody(ballBody);

    return state
      .set('state', STATE_IN_GAME)
      .set('world', world)
      .set('level', level)
      .set('expTime', expTime)
      .setIn(['ball', 'body'], ballBody)
      .setIn(['ball', 'x'], level.spawn[0])
      .setIn(['ball', 'y'], level.spawn[1]);
  },

  [`ws:${TYPE_POSITION}`]: (state, {data}) => {
    const {positions} = data;

    return positions.reduce((state, {x, y, id}) => {
      if (!state.ghostBalls.get(id)) {
        return state.setIn(['ghostBalls', id], new DumbBall({
          x,
          y,
          color: randomColor(),
        }));
      }

      return state.updateIn(['ghostBalls', id], (ball) => ball.merge({x, y}));
    }, state);
  },

  'disconnect': (state) => {
    return state.set('state', STATE_DISCONNECTED);
  }
});
