import I from 'immutable';
import p2 from 'p2';

import createImmutableReducer from '../universal/createImmutableReducer';

import {
  createWorld,
  createBall,
  createGround,
  addHolePoints,
} from '../universal/physics';

const Ball = I.Record({
  body: null,
  ws: null,
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
  sockets: I.Map(),  // id -> ws
});

const fixedStep = 1 / 60;
const maxSubSteps = 10;

function addBall(state, id) {
  const ballBody = createBall(state.level.spawn);

  state.world.addBody(ballBody);

  return state
    .setIn(['balls', id], new Ball({
      body: ballBody,
    }));
}

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

  'playerConnected': (state, {id, ws}) => {
    return addBall(state, id)
      .setIn(['sockets', id], ws);
  },

  'playerDisconnected': (state, {id}) => {
    return state
      .deleteIn(['balls', id])
      .deleteIn(['sockets', id]);
  },

  'swing': (state, {id, vec}) => {
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

    const nextState = state
      .set('world', world)
      .set('level', level);

    return nextState.balls.reduce((state, ball, id) => {
      return addBall(state, id);
    }, nextState);
  },
});
