import I from 'immutable';
import p2 from 'p2';
import createImmutableReducer from '../util/createImmutableReducer';
import {TICK} from '../ActionTypes';

import {WIDTH, HEIGHT} from '../constants';

const Ball = I.Record({
  body: null,
  x: null,
  y: null,
  // vx: null,
  // vy: null,
});

const Level = I.Record({
  points: null,
  hole: null,
  spawn: null,
});

const State = I.Record({
  world: null,
  ball: Ball(),
  ghostBalls: I.List(),
  level: null,
});

const fixedStep = 1 / 60;
const maxSubSteps = 10;

export default createImmutableReducer(new State(), {
  [TICK]: (state, {dt}) => {
    if (!state.world) {
      return state;
    }

    dt = dt / 1000;  // ms -> s
    state.world.step(fixedStep, dt, maxSubSteps);

    const [ballX, ballY] = state.ball.body.interpolatedPosition;

    // TODO:
    // 1. Apply gravity to ball
    // 2. Apply velocity to ball
    // 3. Resolve collisions
    return state
      .setIn(['ball', 'x'], ballX)
      .setIn(['ball', 'y'], ballY);
  },

  'ws:level': (state, action) => {
    const level = action.data;

    const levelRec = new Level(I.fromJS(level));

    const world = new p2.World({
      gravity: [0, 20]
    });

    const ballBody = new p2.Body({
      mass: 10,
      position: [
        levelRec.spawn.get(0), levelRec.spawn.get(1) - 2.5
      ],
    });

    const ballShape = new p2.Circle({
      radius: 2.5,
    });
    ballBody.addShape(ballShape);

    world.addBody(ballBody);

    const groundBody = new p2.Body({
      mass: 0,
    });

    groundBody.fromPolygon(level.points.concat([[WIDTH, HEIGHT], [0, HEIGHT]]));

    world.addBody(groundBody);

    return state
      .set('world', world)
      .set('level', levelRec)
      .setIn(['ball', 'body'], ballBody);
      // .setIn(['ball', 'x'], levelRec.spawn.get(0))
      // .setIn(['ball', 'y'], levelRec.spawn.get(1) - 2.5);  // XXX: hardcoded height of ball
  },
});
