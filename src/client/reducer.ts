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
  goalWords,
} from '../universal/constants';

import {
  createWorld,
  createBall,
  createGround,
  createHoleSensor,
  addHolePoints,
  ensureBallInBounds,
} from '../universal/physics';

import clamp from 'lodash.clamp';
import sample from 'lodash.sample';

import {
  State,
  Level,
  Ball,
  DumbBall
} from './records';

const fixedStep = 1 / 60;
const maxSubSteps = 10;

const moveSpeed = 50;  // degrees per second

enum AimDirection {
  left,
  right,
}

function setAim(state: State, direction: AimDirection, dt: number) {
  const dir = state.get('aimDirection');

  let step;
  if (direction === AimDirection.left) {
    step = -moveSpeed * dt;
  } else if (direction === AimDirection.right) {
    step = moveSpeed * dt;
  }

  const newDir = clamp(dir + step, -180, 0);

  return state.set('aimDirection', newDir);
}

function beginSwing(state: State) {
  return state.set('inSwing', true);
}

function continueSwing(state: State, dt: number) {
  const step = dt * 50;

  // TODO: if swingPower > MAX_POWER, descend to 0
  // const swingPower = state.swingPower + step;

  return state.update('swingPower', (swingPower) => clamp(swingPower + step, MAX_POWER));
}

function endSwing(state: State) {
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

function enterScored(state: State) {
  const goalText = sample(goalWords);

  return state
    .set('scored', true)
    .set('goalText', goalText);
}

function newLevel(state: State, data) {
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

  return new State({
    state: STATE_IN_GAME,
    ghostBalls: state.ghostBalls,

    world,
    level,
    expTime,
    holeSensor,

    ball: new Ball({
      body: ballBody,
    }),
  });
}

function handleInput(state: State, {dt, keysDown}: {dt: number; keysDown: Set<number>}) {
  if (state.allowHit && !state.scored) {
    if (keysDown.has(keyCodes.A) || keysDown.has(keyCodes.LEFT_ARROW)) {
      state = setAim(state, AimDirection.left, dt);
    }
    if (keysDown.has(keyCodes.D) || keysDown.has(keyCodes.RIGHT_ARROW)) {
      state = setAim(state, AimDirection.right, dt);
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

  return state;
}

export default createImmutableReducer<State>(new State(), {
  'tick': (state: State, {dt, keysDown}: {dt: number; keysDown: Set<number>}) => {
    dt = dt / 1000;  // ms -> s

    if (!state.world) {
      return state;
    }

    state = handleInput(state, {dt, keysDown});

    ensureBallInBounds(state.ball.body, state.level);

    // overlaps() can't be used on a sleeping object, so we check overlapping before tick
    const overlapping = state.ball.body.overlaps(state.holeSensor);

    // XXX: MMMMMonster hack
    // dt is set to dt * 3 because that's the speed I actually want
    state.world.step(fixedStep, dt * 3, maxSubSteps);

    if (!state.scored) {
      const isSleeping = state.ball.body.sleepState === p2.Body.SLEEPING;
      const scored = overlapping && isSleeping;

      if (scored) {
        state = enterScored(state);

      } else {
        state = state
          .set('allowHit', isSleeping);
      }
    }

    return state;
  },

  [`ws:${TYPE_LEVEL}`]: (state: State, action) => {
    return newLevel(state, action.data);
  },

  [`ws:${TYPE_INITIAL}`]: (state: State, action) => {
    // TODO: use data.id, data.color for ?!?
    return state
      .set('ghostBalls', action.data.players.reduce((balls, player) => {
        return balls.set(player.id, new DumbBall({
          color: player.color,
        }));
      }, I.Map()))
      .update((s) => newLevel(s, action.data));
  },

  [`ws:${TYPE_PLAYER_CONNECTED}`]: (state: State, action) => {
    return state.setIn(['ghostBalls', action.data.id], new DumbBall({
      color: action.data.color,
    }));
  },

  [`ws:${TYPE_PLAYER_DISCONNECTED}`]: (state: State, action) => {
    return state.deleteIn(['ghostBalls', action.data.id]);
  },

  [`ws:${TYPE_POSITION}`]: (state: State, {data}) => {
    // this is defined so we're able to define positions.reduce below
    const positions: Array<any> = data.positions;

    // manually specify <State> due to https://github.com/Microsoft/TypeScript/issues/7014
    return positions.reduce<State>((state: State, {x, y, id}) => {
      return state.updateIn(['ghostBalls', id], (ball) => ball.merge({x, y}));
    }, state);
  },

  'disconnect': (state: State) => {
    return state.set('state', STATE_DISCONNECTED);
  }
});
