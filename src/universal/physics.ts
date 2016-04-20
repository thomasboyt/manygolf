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

/*
 * Resets the ball position to level spawn if ball fell off world.
 */
export function ensureBallInBounds(body: p2.Body, level: any) {
  if (body.interpolatedPosition[1] > HEIGHT + 20) {
    body.position = [level.spawn.get(0), level.spawn.get(1) - BALL_RADIUS];
    body.velocity = [0, 0];
  }
}

function newBall(position: number[]) {
  const ballShape = new p2.Circle({
    radius: BALL_RADIUS,
    collisionGroup: BALL_GROUP,
    collisionMask: GROUND_GROUP,
  });
  ballShape.material = ballMaterial;

  const ballBody = new p2.Body({
    mass: 1,
    position,
  });
  ballBody.addShape(ballShape);

  ballBody.angularDamping = 0.8;
  ballBody.sleepTimeLimit = 1;
  ballBody.sleepSpeedLimit = 2;

  return ballBody;
}

export function createBall(spawn: I.List<number>) {
  return newBall([
    spawn.get(0),
    spawn.get(1) - BALL_RADIUS,
  ]);
}

export function createBallFromInitial(position: number[], velocity: number[]) {
  const ball = newBall(position);
  ball.velocity = velocity.slice(); // clone
  return ball;
}

export function addHolePoints(level: any) {
  // points has to start with x=0 and end with x=WIDTH
  if (level.points.get(0).get(0) !== 0) {
    throw new Error('invalid points: first x !== 0');
  }
  if (level.points.get(-1).get(0) !== WIDTH) {
    throw new Error(`invalid points: last x !== WIDTH (${WIDTH})`);
  }

  // insert hole
  // get the first point after the hole...
  const idxAfterHole = level.points.findIndex((point) => point.get(0) > level.hole.get(0));

  const x1 = level.hole.get(0) - HOLE_WIDTH / 2;
  const x2 = level.hole.get(0) + HOLE_WIDTH / 2;

  if (x1 <= level.points.get(idxAfterHole - 1).get(0)) {
    throw new Error('invalid points: hole x1 cannot be <= the previous x');
  }

  if (x2 >= level.points.get(idxAfterHole).get(0)) {
    throw new Error('invalid points: hole x2 cannot be >= the previous x');
  }

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

export function createGround(level: any): p2.Body[] {
  // This used to create a single ground shape.
  // Now it creates 3 because this mysteriously fixes a bug where the ground after the hole wasn't
  // working correctly? man I don't even know
  const beforeHole = level.points.filter((point) => point.get(0) < level.hole.get(0));
  const afterHole = level.points.filter((point) => point.get(0) > level.hole.get(0));

  const vertsBeforeHole = beforeHole.toJS().concat([
    [beforeHole.last().get(0), HEIGHT],
    [0, HEIGHT],
  ]);
  const vertsHole = [
    [level.hole.get(0) - HOLE_WIDTH / 2, level.hole.get(1) + HOLE_HEIGHT],
    [level.hole.get(0) + HOLE_WIDTH / 2, level.hole.get(1) + HOLE_HEIGHT],
    [level.hole.get(0) + HOLE_WIDTH / 2, HEIGHT],
    [level.hole.get(0) - HOLE_WIDTH / 2, HEIGHT],
  ];
  const vertsAfterHole = afterHole.toJS().concat([
    [WIDTH, HEIGHT],
    [afterHole.get(0).get(0), HEIGHT],
  ]);

  const grounds = [vertsBeforeHole, vertsHole, vertsAfterHole].map((verts) => {
    const body = new p2.Body({
      mass: 0,
    });

    body.fromPolygon(verts);

    for (let shape of body.shapes) {
      shape.material = groundMaterial;
      shape.collisionGroup = GROUND_GROUP;
      shape.collisionMask = BALL_GROUP;
    }

    return body;
  });

  return grounds;
}

export function createHoleSensor(pos: I.List<number>) {
  const sensorShape = new p2.Box({
    width: HOLE_WIDTH,
    height: HOLE_HEIGHT,
  });

  sensorShape.sensor = true;
  sensorShape.collisionGroup = GROUND_GROUP;
  sensorShape.collisionMask = BALL_GROUP;

  // Sensor is purposely built halfway into the ground so top edge collisions are avoided
  const sensorBody = new p2.Body({
    position: [
      pos.get(0),
      pos.get(1) + HOLE_HEIGHT,
    ],
  });
  sensorBody.damping = 0;
  sensorBody.addShape(sensorShape);

  return sensorBody;
}
