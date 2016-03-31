import I from 'immutable';
import p2 from 'p2';

import {
  WIDTH,
  HEIGHT,
  HOLE_HEIGHT,
  HOLE_WIDTH,
  BALL_RADIUS,
} from './constants';

const ballMaterial = new p2.Material();

const groundMaterial = new p2.Material();

const ballGroundContact = new p2.ContactMaterial(ballMaterial, groundMaterial, {
  friction: 1,
  restitution: 0.5,
});

const BALL_GROUP = Math.pow(2,1);
const GROUND_GROUP = Math.pow(2,2);

export function createWorld() {
  const world = new p2.World({
    gravity: [0, 20],
  });

  world.sleepMode = p2.World.BODY_SLEEPING;

  world.addContactMaterial(ballGroundContact);

  return world;
}

export function createBall(spawn) {
  const ballShape = new p2.Circle({
    radius: BALL_RADIUS,
    collisionGroup: BALL_GROUP,
    collisionMask: GROUND_GROUP,
  });
  ballShape.material = ballMaterial;

  const ballBody = new p2.Body({
    mass: 1,
    position: [
      spawn.get(0),
      spawn.get(1) - BALL_RADIUS
    ],
  });
  ballBody.addShape(ballShape);

  ballBody.angularDamping = 0.8;
  ballBody.sleepTimeLimit = 1;
  ballBody.sleepSpeedLimit = 2;

  return ballBody;
}

export function addHolePoints(level) {
  // points has to start with x=0 and end with x=WIDTH
  if (level.points.get(0).get(0) !== 0 || level.points.get(-1).get(0) !== WIDTH) {
    throw new Error('invalid points');
  }

  // insert hole
  // get the first point after the hole...
  const idxAfterHole = level.points.findIndex((point) => point.get(0) > level.hole.get(0));

  // ...then insert hole between points
  const holePoints = I.fromJS([
    [level.hole.get(0) - HOLE_WIDTH / 2, level.hole.get(1)],
    [level.hole.get(0) - HOLE_WIDTH / 2, level.hole.get(1) + HOLE_HEIGHT],
    [level.hole.get(0) + HOLE_WIDTH / 2, level.hole.get(1) + HOLE_HEIGHT],
    [level.hole.get(0) + HOLE_WIDTH / 2, level.hole.get(1)],
  ]);

  const pointsWithHole = level.points
    .slice(0, idxAfterHole)
    .concat(holePoints)
    .concat(level.points.slice(idxAfterHole));

  return level.set('points', pointsWithHole);
}

export function createGround(level) {
  // Create ground
  const groundBody = new p2.Body({
    mass: 0,
  });

  groundBody.fromPolygon(level.points.toJS().concat([[WIDTH, HEIGHT], [0, HEIGHT]]));

  for (let shape of groundBody.shapes) {
    shape.material = groundMaterial;
    shape.collisionGroup = GROUND_GROUP;
    shape.collisionMask = BALL_GROUP;
  }

  return groundBody;
}

export function createHoleSensor(pos) {
  const sensorShape = new p2.Box({
    width: HOLE_WIDTH,
    height: HOLE_HEIGHT,
  });

  sensorShape.sensor = true;
  sensorShape.collisionGroup = GROUND_GROUP;
  sensorShape.collisionMask = BALL_GROUP;

  // Sensor is purposely built halfway into the ground so top edge collisions are avoided
  const sensorBody = new p2.Body({
    position: [pos.get(0) - HOLE_WIDTH / 2, pos.get(1) + HOLE_WIDTH / 2],
  });
  sensorBody.damping = 0;
  sensorBody.addShape(sensorShape);
  sensorBody.active = false;

  return sensorBody;
}
