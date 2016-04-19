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
  TYPE_HURRY_UP,
  MessageHurryUp,
  TYPE_IDLE_KICKED,
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
  Player,
  SwingMeterDirection,
  LeaderboardPlayer,
  Round,
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
    .setIn(['round', 'scored'], true)
    .setIn(['round', 'goalText'], goalText);
}

function newLevel(state: State, data: MessageInitial) {
  const levelData = data.level;
  const expTime = data.expiresIn + Date.now();

  const level = new Level(I.fromJS(levelData))
    .update(addHolePoints);

  const world = createWorld();

  const groundBodies = createGround(level);
  for (let body of groundBodies) {
    world.addBody(body);
  }

  let ball = null;
  if (!state.isObserver) {
    const ballBody = createBall(level.spawn);
    world.addBody(ballBody);
    ball = new Ball({
      body: ballBody
    })
  }

  const holeSensor = createHoleSensor(level.hole);
  world.addBody(holeSensor);

  return state.set('round', new Round({
    roundState: RoundState.inProgress,

    world,
    level,
    expTime,
    holeSensor,

    ball,
  }));
}

function enterGame(state) {
  const ballBody = createBall(state.round.level.spawn);
  state.round.world.addBody(ballBody);
  const ball = new Ball({
    body: ballBody
  });

  return state
    .set('isObserver', false)
    .setIn(['round', 'ball'], ball);
}

function leaveGame(state) {
  return state
    .set('isObserver', true)
    .setIn(['round', 'ball'], null);
}

export default createImmutableReducer<State>(new State(), {
  'tick': (state: State, {dt}: {dt: number}) => {
    dt = dt / 1000;  // ms -> s

    if (!state.round || state.round.roundState === RoundState.over) {
      return state;
    }

    let overlapping;
    if (state.round.ball) {
      ensureBallInBounds(state.round.ball.body, state.round.level);

      // overlaps() can't be used on a sleeping object, so we check overlapping before tick
      overlapping = state.round.ball.body.overlaps(state.round.holeSensor);
    }

    // XXX: MMMMMonster hack
    // dt is set to dt * 3 because that's the speed I actually want
    state.round.world.step(fixedStep, dt * 3, maxSubSteps);

    if (state.round.ball) {
      if (!state.round.scored) {
        const isSleeping = state.round.ball.body.sleepState === p2.Body.SLEEPING;
        const scored = overlapping && isSleeping;

        if (scored) {
          state = enterScored(state);

        } else {
          state = state
            .setIn(['round', 'allowHit'], isSleeping);
        }
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
      .setIn(['round', 'inSwing'], true)
      .setIn(['round', 'swingMeterDirection'], SwingMeterDirection.ascending)
      .setIn(['round', 'swingPower'], MIN_POWER);
  },

  'continueSwing': (state: State, action) => {
    const dt = action.dt;

    let step = dt * SWING_STEP;

    if (state.round.swingMeterDirection === SwingMeterDirection.descending) {
      step = -step;
    }

    const nextPower = state.round.swingPower + step;

    if (nextPower > MAX_POWER) {
      return state
        .setIn(['round', 'swingMeterDirection'], SwingMeterDirection.descending)
        .setIn(['round', 'swingPower'], MAX_POWER);
    } else if (nextPower < MIN_POWER) {
      return state
        .setIn(['round', 'swingMeterDirection'], SwingMeterDirection.ascending)
        .setIn(['round', 'swingPower'], MIN_POWER);
    }

    return state.setIn(['round', 'swingPower'], nextPower);
  },

  'endSwing': (state: State, action) => {
    const {vec}: {vec: {x: number, y: number}} = action;

    state.round.ball.body.velocity[0] = vec.x;
    state.round.ball.body.velocity[1] = vec.y;

    return state
      .setIn(['round', 'inSwing'], false)
      .updateIn(['round', 'strokes'], (strokes) => strokes + 1);
  },

  'updateAim': (state: State, action) => {
    const {direction, dt}: {direction: AimDirection, dt: number} = action;
    const dir = state.getIn(['round', 'aimDirection']);

    let step;
    if (direction === AimDirection.left) {
      step = -moveSpeed * dt;
    } else if (direction === AimDirection.right) {
      step = moveSpeed * dt;
    }

    const newDir = clamp(dir + step, -180, 0);

    return state.setIn(['round', 'aimDirection'], newDir);
  },

  [`ws:${TYPE_LEVEL}`]: (state: State, action) => {
    return newLevel(state, action.data);
  },

  [`ws:${TYPE_INITIAL}`]: (state: State, action) => {
    const data = <MessageInitial>action.data;

    return state
      .set('connectionState', ConnectionState.connected)
      .set('name', data.self.name)
      .set('id', data.self.id)
      .set('color', data.self.color)
      .set('isObserver', data.isObserver)
      .set('players', data.players.reduce((balls, player) => {
        return balls.set(player.id, new Player({
          color: player.color,
          name: player.name,
          id: player.id,
        }));
      }, I.Map()))
      .update((s) => newLevel(s, data))
      .setIn(['round', 'roundState'], data.roundState);
  },

  [`ws:${TYPE_PLAYER_CONNECTED}`]: (state: State, action) => {
    const data = <MessagePlayerConnected>action.data;

    return state
      .setIn(['players', action.data.id], new Player({
        color: data.color,
        name: data.name,
        id: data.id,
      }));
  },

  [`ws:${TYPE_PLAYER_DISCONNECTED}`]: (state: State, action) => {
    return state.deleteIn(['players', action.data.id]);
  },

  [`ws:${TYPE_POSITION}`]: (state: State, {data}) => {
    // this is defined so we're able to define positions.reduce below
    const positions: Array<any> = data.positions;

    // manually specify <State> due to https://github.com/Microsoft/TypeScript/issues/7014
    return positions.reduce<State>((state: State, {x, y, id}) => {
      return state.updateIn(['players', id], (ball) => ball.merge({x, y}));
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
      .setIn(['round', 'roundState'], RoundState.over)
      .setIn(['round', 'roundRankedPlayers'], I.fromJS(data.roundRankedPlayers).map((player) => {
        return new LeaderboardPlayer(player);
      }));
  },

  [`ws:${TYPE_HURRY_UP}`]: (state: State, action) => {
    const data = <MessageHurryUp>action.data;

    const expTime = Date.now() + data.expiresIn;

    return state
      .setIn(['round', 'expTime'], expTime)
      .set('displayMessage', 'Hurry up!')
      .set('displayMessageTimeout', Date.now() + 5 * 1000);
  },

  [`ws:${TYPE_IDLE_KICKED}`]: (state: State) => {
    return leaveGame(state);
  },

  'disconnect': (state: State) => {
    return state.set('connectionState', ConnectionState.disconnected);
  },

  'leaveObserver': (state: State) => {
    return enterGame(state);
  }
});
