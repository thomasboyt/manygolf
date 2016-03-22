import I from 'immutable';
import p2 from 'p2';

import createImmutableReducer from '../util/createImmutableReducer';

import keyCodes from '../keyCodes';
import {calcVectorDegrees} from '../util/math';

import {
  TYPES_LEVEL,
} from '../../universal/protocol';

import {
  WIDTH,
  HEIGHT,
  HOLE_HEIGHT,
  HOLE_WIDTH,
  BALL_RADIUS,
  MAX_POWER,
} from '../../universal/constants';

import clamp from 'lodash.clamp';

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
  aimDirection: -45,  // angle (in degrees) relative to pointing ->
  allowHit: false,
  inSwing: false,
  swingPower: 0,
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
  // TODO: Send vector to server!
  const vec = calcVectorDegrees(state.swingPower, state.aimDirection);
  state.ball.body.velocity[0] = vec.x;
  state.ball.body.velocity[1] = vec.y;

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

  [`ws:${TYPES_LEVEL}`]: (state, action) => {
    const level = action.data;

    let levelRec = new Level(I.fromJS(level));

    const world = new p2.World({
      gravity: [0, 20],
    });

    world.sleepMode = p2.World.BODY_SLEEPING;

    // Create ball

    const ballBody = new p2.Body({
      mass: 1,
      position: [
        levelRec.spawn.get(0), levelRec.spawn.get(1) - BALL_RADIUS
      ],
    });

    const ballShape = new p2.Circle({
      radius: BALL_RADIUS,
    });
    ballBody.addShape(ballShape);
    ballBody.angularDamping = 0.8;

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

    // Set up friction
    const ballMaterial = new p2.Material();
    ballShape.material = ballMaterial;

    const groundMaterial = new p2.Material();

    for (let shape of groundBody.shapes) {
      shape.material = groundMaterial;
    }

    const ballGroundContact = new p2.ContactMaterial(ballMaterial, groundMaterial, {
      friction: 1,
      restitution: 0.5,
    });

    ballBody.sleepTimeLimit = 1;
    ballBody.sleepSpeedLimit = 2;

    world.addContactMaterial(ballGroundContact);

    return state
      .set('world', world)
      .set('level', levelRec)
      .setIn(['ball', 'body'], ballBody);
  },
});
