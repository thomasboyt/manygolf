import I from 'immutable';
import p2 from 'p2';

import createImmutableReducer from '../universal/createImmutableReducer';

import {
  TYPE_INITIAL,
  TYPE_PLAYER_CONNECTED,
  TYPE_PLAYER_DISCONNECTED,
  TYPE_LEVEL,
  TYPE_POSITION,
  TYPE_DISPLAY_MESSAGE,
  TYPE_LEVEL_OVER,
  MessageInitial,
  MessagePlayerConnected,
  MessageDisplayMessage,
  MessageLevelOver,
} from '../universal/protocol';

import {
  MIN_POWER,
  MAX_POWER,
  SWING_STEP,
  TIMER_MS,
  goalWords,
  RoundState,
  ConnectionState,
  AimDirection,
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
  DumbBall,
  SwingMeterDirection,
  LeaderboardPlayer,
} from './records';

const fixedStep = 1 / 60;

// this is set to be super high so that the physics engine can instantly catch up if you tab out
// and back in. with p2's default 10, it only does ten "catch-up" fixed steps per tick, which
// causes everything to move in "fast motion" until it's caught up, which is of course really weird
//
// this is set to be the maximum number of steps in a round (since the world is reset between
// rounds, you don't need to worry about anything higher)
const maxSubSteps = (TIMER_MS / 1000) * (1 / fixedStep);

const moveSpeed = 50;  // degrees per second

function enterScored(state: State) {
  const goalText = sample(goalWords);

  return state
    .set('scored', true)
    .set('goalText', goalText);
}

function newLevel(state: State, data: MessageInitial) {
  const levelData = data.level;
  const expTime = data.expTime;

  const level = new Level(I.fromJS(levelData))
    .update(addHolePoints);

  const world = createWorld();

  const groundBodies = createGround(level);
  for (let body of groundBodies) {
    world.addBody(body);
  }

  const ballBody = createBall(level.spawn);
  world.addBody(ballBody);

  const holeSensor = createHoleSensor(level.hole);
  world.addBody(holeSensor);

  return new State({
    connectionState: ConnectionState.connected,
    roundState: RoundState.inProgress,

    ghostBalls: state.ghostBalls,
    id: state.id,
    name: state.name,
    color: state.color,

    world,
    level,
    expTime,
    holeSensor,

    ball: new Ball({
      body: ballBody,
    }),
  });
}

export default createImmutableReducer<State>(new State(), {
  'tick': (state: State, {dt, keysDown}: {dt: number; keysDown: Set<number>}) => {
    dt = dt / 1000;  // ms -> s

    if (!state.world || state.roundState === RoundState.over) {
      return state;
    }

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

    if (state.displayMessageTimeout && Date.now() > state.displayMessageTimeout) {
      state = state
        .set('displayMessage', null)
        .set('displayMessageTimeout', null);
    }

    return state;
  },

  'beginSwing': (state: State, action) => {
    return state
      .set('inSwing', true)
      .set('swingMeterDirection', SwingMeterDirection.ascending)
      .set('swingPower', MIN_POWER);
  },

  'continueSwing': (state: State, action) => {
    const dt = action.dt;

    let step = dt * SWING_STEP;

    if (state.swingMeterDirection === SwingMeterDirection.descending) {
      step = -step;
    }

    const nextPower = state.swingPower + step;

    if (nextPower > MAX_POWER) {
      return state
        .set('swingMeterDirection', SwingMeterDirection.descending)
        .set('swingPower', MAX_POWER);
    } else if (nextPower < MIN_POWER) {
      return state
        .set('swingMeterDirection', SwingMeterDirection.ascending)
        .set('swingPower', MIN_POWER);
    }

    return state.set('swingPower', nextPower);
  },

  'endSwing': (state: State, action) => {
    const {vec}: {vec: {x: number, y: number}} = action;

    state.ball.body.velocity[0] = vec.x;
    state.ball.body.velocity[1] = vec.y;

    return state
      .set('inSwing', false)
      .update('strokes', (strokes) => strokes + 1);
  },

  'updateAim': (state: State, action) => {
    const {direction, dt}: {direction: AimDirection, dt: number} = action;
    const dir = state.get('aimDirection');

    let step;
    if (direction === AimDirection.left) {
      step = -moveSpeed * dt;
    } else if (direction === AimDirection.right) {
      step = moveSpeed * dt;
    }

    const newDir = clamp(dir + step, -180, 0);

    return state.set('aimDirection', newDir);
  },

  [`ws:${TYPE_LEVEL}`]: (state: State, action) => {
    return newLevel(state, action.data);
  },

  [`ws:${TYPE_INITIAL}`]: (state: State, action) => {
    const data = <MessageInitial>action.data;

    return state
      .update((s) => newLevel(s, data))
      .set('ghostBalls', data.players.reduce((balls, player) => {
        return balls.set(player.id, new DumbBall({
          color: player.color,
          name: player.name,
        }));
      }, I.Map()))
      .set('name', data.self.name)
      .set('id', data.self.id)
      .set('color', data.self.color)
      .set('roundState', data.roundState);
  },

  [`ws:${TYPE_PLAYER_CONNECTED}`]: (state: State, action) => {
    const data = <MessagePlayerConnected>action.data;

    return state
      .setIn(['ghostBalls', action.data.id], new DumbBall({
        color: data.color,
        name: data.name,
        id: data.id,
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

  [`ws:${TYPE_DISPLAY_MESSAGE}`]: (state: State, action) => {
    const data = <MessageDisplayMessage>action.data;

    return state
      .set('displayMessage', data.messageText)
      .set('displayMessageColor', data.color)
      .set('displayMessageTimeout', Date.now() + 5 * 1000);
  },

  [`ws:${TYPE_LEVEL_OVER}`]: (state: State, action) => {
    const data = <MessageLevelOver>action.data;

    return state
      .set('roundState', RoundState.over)
      .set('roundRankedPlayers', I.fromJS(data.roundRankedPlayers).map((player) => {
        return new LeaderboardPlayer(player);
      }));
  },

  'disconnect': (state: State) => {
    return state.set('connectionState', ConnectionState.disconnected);
  }
});
