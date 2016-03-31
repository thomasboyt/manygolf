import I from 'immutable';
import p2 from 'p2';

import createImmutableReducer from '../universal/createImmutableReducer';

import keyCodes from './keyCodes';
import {calcVectorDegrees} from './util/math';

import ws from './ws';

import {
  TYPE_INITIAL,
  TYPE_PLAYER_CONNECTED,
  TYPE_PLAYER_DISCONNECTED,
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
  createHoleSensor,
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
  strokes: 0,
  holeSensor: null,
  scored: false,
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
    .set('swingPower', 0)
    .update('strokes', (strokes) => strokes + 1);
}

function newLevel(state, data) {
  const levelData = data.level;
  const expTime = data.expTime;

  const level = new Level(I.fromJS(levelData))
    .update(addHolePoints);

  const world = createWorld();

  const groundBody = createGround(level);
  world.addBody(groundBody);

  const ballBody = createBall(level.spawn);
  world.addBody(ballBody);

  const holeSensor = createHoleSensor(level.hole);
  world.addBody(holeSensor);

  return state
    .set('state', STATE_IN_GAME)
    .set('world', world)
    .set('level', level)
    .set('expTime', expTime)
    .set('strokes', 0)
    .set('holeSensor', holeSensor)
    .set('scored', false)
    .setIn(['ball', 'body'], ballBody)
    .setIn(['ball', 'x'], level.spawn[0])
    .setIn(['ball', 'y'], level.spawn[1]);
}

export default createImmutableReducer(new State(), {
  'tick': (state, {dt, keysDown}) => {
    dt = dt / 1000;  // ms -> s

    if (!state.world) {
      return state;
    }

    if (state.allowHit && !state.scored) {
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

    // overlaps() can't be used on a sleeping object, so we check overlapping before tick
    const overlapping = state.ball.body.overlaps(state.holeSensor);

    // XXX: MMMMMonster hack
    // dt is set to dt * 3 because that's the speed I actually want
    state.world.step(fixedStep, dt * 3, maxSubSteps);

    if (state.scored) {
      return state;

    } else {
      const isSleeping = state.ball.body.sleepState === p2.Body.SLEEPING;

      const scored = overlapping && isSleeping;

      const [ballX, ballY] = state.ball.body.interpolatedPosition;

      return state
        .setIn(['ball', 'x'], ballX)
        .setIn(['ball', 'y'], ballY)
        .set('allowHit', isSleeping)
        .set('scored', scored);
    }
  },

  [`ws:${TYPE_LEVEL}`]: (state, action) => {
    return newLevel(state, action.data);
  },

  [`ws:${TYPE_INITIAL}`]: (state, action) => {
    // TODO: use data.id, data.color for ?!?
    return state
      .set('ghostBalls', action.data.players.reduce((balls, player) => {
        return balls.set(player.id, new DumbBall({
          color: player.color,
        }));
      }, I.Map()))
      .update((s) => newLevel(s, action.data));
  },

  [`ws:${TYPE_PLAYER_CONNECTED}`]: (state, action) => {
    return state.setIn(['ghostBalls', action.data.id], new DumbBall({
      color: action.data.color,
    }));
  },

  [`ws:${TYPE_PLAYER_DISCONNECTED}`]: (state, action) => {
    return state.deleteIn(['ghostBalls', action.data.id]);
  },

  [`ws:${TYPE_POSITION}`]: (state, {data}) => {
    const {positions} = data;

    return positions.reduce((state, {x, y, id}) => {
      return state.updateIn(['ghostBalls', id], (ball) => ball.merge({x, y}));
    }, state);
  },

  'disconnect': (state) => {
    return state.set('state', STATE_DISCONNECTED);
  }
});
