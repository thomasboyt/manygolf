import I from 'immutable';
import p2 from 'p2';

import createImmutableReducer from '../universal/createImmutableReducer';

// import {
//   WIDTH,
//   HEIGHT,
//   HOLE_HEIGHT,
//   HOLE_WIDTH,
//   BALL_RADIUS,
//   MAX_POWER,
// } from '../../universal/constants';

import {
  createWorld,
  createBall,
  createGround,
  addHolePoints,
} from '../universal/physics';

const Ball = I.Record({
  body: null,
  x: null,
  y: null,
});

const Level = I.Record({
  points: null,
  hole: null,
  spawn: null,
});

const State = I.Record({
  world: null,
  level: null,
  balls: I.Map(),
});

const fixedStep = 1 / 60;
const maxSubSteps = 10;

export default createImmutableReducer(new State(), {
  'tick': (state, {dt}) => {
    dt = dt / 1000;  // ms -> s

    if (!state.world) {
      return state;
    }

    // XXX: MMMMMonster hack
    // dt is set to dt * 3 because that's the speed I actually want
    state.world.step(fixedStep, dt * 3, maxSubSteps);

    return state;
  },

  'addBall': (state, {id}) => {
    const ballBody = createBall(state.level.spawn);

    state.world.addBody(ballBody);

    const [ballX, ballY] = ballBody.interpolatedPosition;

    return state.setIn(['balls', id], new Ball({
      x: ballX,
      y: ballY,
      body: ballBody,
    }));
  },

  'swing': (state, {id, vec}) => {
    // TODO: enforce MAX_POWER
    const ball = state.balls.get(id);

    if (ball.body.sleepState !== p2.Body.SLEEPING) {
      // ignore
      return state;

    } else {
      ball.body.velocity[0] = vec.x;
      ball.body.velocity[1] = vec.y;
      return state;
    }
  },

  'level': (state, action) => {
    const levelData = action.data;

    const level = new Level(I.fromJS(levelData))
      .update(addHolePoints);

    const world = createWorld();

    const groundBody = createGround(level);

    world.addBody(groundBody);

    return state
      .set('world', world)
      .set('level', level);
  },
});
