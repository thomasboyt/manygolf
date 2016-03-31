import I from 'immutable';
import p2 from 'p2';

import createImmutableReducer from '../universal/createImmutableReducer';
import randomColor from 'randomcolor';

import {
  createWorld,
  createBall,
  createGround,
  addHolePoints,
} from '../universal/physics';

const Player = I.Record({
  body: null,
  color: null,
  strokes: 0,
  socket: null,
});

const Level = I.Record({
  points: null,
  hole: null,
  spawn: null,
});

const State = I.Record({
  levelData: null,
  world: null,
  level: null,
  players: I.Map(),
  expTime: null,
});

const fixedStep = 1 / 60;
const maxSubSteps = 10;

function addPlayer(state, {id, ws}) {
  // XXX: in the future avoid generating color here...
  const color = randomColor();

  const body = addBall(state);

  return state
    .setIn(['players', id], new Player({
      body,
      color,
      socket: ws,
    }));
}

function addBall({level, world}) {
  const ballBody = createBall(level.spawn);

  world.addBody(ballBody);

  return ballBody;
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
    return addPlayer(state, {id, ws});
  },

  'playerDisconnected': (state, {id}) => {
    return state
      .deleteIn(['players', id]);
  },

  'swing': (state, {id, vec}) => {
    const body = state.players.get(id).get('body');

    if (body.sleepState !== p2.Body.SLEEPING) {
      // ignore
      return state;

    } else {
      body.velocity[0] = vec.x;
      body.velocity[1] = vec.y;

      return state.updateIn(['players', id, 'strokes'], (strokes) => strokes + 1);
    }
  },

  'level': (state, {levelData, expTime}) => {
    const level = new Level(I.fromJS(levelData))
      .update(addHolePoints);

    const world = createWorld();

    const groundBody = createGround(level);

    world.addBody(groundBody);

    return state
      .set('world', world)
      .set('level', level)
      .set('expTime', expTime)
      .set('levelData', levelData)
      // TODO: better way to do this?
      .update('players', (players) => {
        return players.map((player) => {
          return player
            .set('body', addBall({level, world}))
            .set('strokes', 0);
        });
      });
  },
});
