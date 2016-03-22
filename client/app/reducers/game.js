import I from 'immutable';
import p2 from 'p2';
import createImmutableReducer from '../util/createImmutableReducer';
import {TICK} from '../ActionTypes';

import {WIDTH, HEIGHT, HOLE_HEIGHT, HOLE_WIDTH, BALL_RADIUS} from '../constants';

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

    return state
      .setIn(['ball', 'x'], ballX)
      .setIn(['ball', 'y'], ballY);
  },

  'ws:level': (state, action) => {
    const level = action.data;

    let levelRec = new Level(I.fromJS(level));

    const world = new p2.World({
      gravity: [0, 20]
    });

    // Create ball

    const ballBody = new p2.Body({
      mass: 10,
      position: [
        levelRec.spawn.get(0), levelRec.spawn.get(1) - BALL_RADIUS
      ],
      velocity: [50, -50]
    });

    const ballShape = new p2.Circle({
      radius: BALL_RADIUS,
    });
    ballBody.addShape(ballShape);

    world.addBody(ballBody);

    // Create ground

    const groundBody = new p2.Body({
      mass: 0,
    });

    // points has to start with x=0 and end with x=WIDTH
    if (levelRec.points.get(0).get(0) !== 0 || levelRec.points.get(-1).get(0) !== WIDTH) {
      throw new Error('invalid points');
    }

    // insert hole
    // get the first point after the hole...
    const idxAfterHole = levelRec.points.findIndex((point) => point.get(0) > levelRec.hole.get(0));

    // ...then insert hole between points
    const holePoints = I.fromJS([
      [levelRec.hole.get(0) - HOLE_WIDTH / 2, levelRec.hole.get(1)],
      [levelRec.hole.get(0) - HOLE_WIDTH / 2, levelRec.hole.get(1) + HOLE_HEIGHT],
      [levelRec.hole.get(0) + HOLE_WIDTH / 2, levelRec.hole.get(1) + HOLE_HEIGHT],
      [levelRec.hole.get(0) + HOLE_WIDTH / 2, levelRec.hole.get(1)],
    ]);

    const pointsWithHole = levelRec.points
      .slice(0, idxAfterHole)
      .concat(holePoints)
      .concat(levelRec.points.slice(idxAfterHole));

    levelRec = levelRec.set('points', pointsWithHole);

    groundBody.fromPolygon(pointsWithHole.toJS().concat([[WIDTH, HEIGHT], [0, HEIGHT]]));

    world.addBody(groundBody);

    return state
      .set('world', world)
      .set('level', levelRec)
      .setIn(['ball', 'body'], ballBody);
      // .setIn(['ball', 'x'], levelRec.spawn.get(0))
      // .setIn(['ball', 'y'], levelRec.spawn.get(1) - 2.5);  // XXX: hardcoded height of ball
  },
});
