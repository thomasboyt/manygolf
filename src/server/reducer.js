import I from 'immutable';
import p2 from 'p2';

import createImmutableReducer from '../universal/createImmutableReducer';
import randomColor from 'randomcolor';

import {
  createWorld,
  createBall,
  createGround,
  createHoleSensor,
  addHolePoints,
} from '../universal/physics';

const Player = I.Record({
  body: null,
  color: null,
  strokes: 0,
  scored: false,
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
  holeSensor: null,
  levelOver: false,
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

    // overlaps() can't be used on a sleeping object, so we check overlapping before tick
    const isOverlapping = state.players.map((player) => {
      return player.body.overlaps(state.holeSensor);
    });

    // XXX: MMMMMonster hack
    // dt is set to dt * 3 because that's the speed I actually want
    state.world.step(fixedStep, dt * 3, maxSubSteps);

    state = state.update('players', (players) => players.map((player, id) => {
      if (player.scored) {
        return player;

      } else {
        const isSleeping = player.body.sleepState === p2.Body.SLEEPING;
        const scored = isOverlapping.get(id) && isSleeping;

        if (scored) {
          console.log(`*** Player ${id} scored`);
        }

        return player.set('scored', scored);
      }
    }));

    // Move to 'levelOver' state when all players have finished the level, updating time
    // XXX: will need to move this to runLoop listener if we want to send updated expTime to
    // clients
    if (!state.levelOver && state.players.size > 0 &&
        state.players.filter((player) => player.scored).size === state.players.size) {
      console.log('All players have finished');

      state = state
        .set('levelOver', true)
        .set('expTime', Date.now() + 5 * 1000);
    }

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

    const holeSensor = createHoleSensor(level.hole);
    world.addBody(holeSensor);

    return state
      .set('world', world)
      .set('level', level)
      .set('expTime', expTime)
      .set('levelData', levelData)
      .set('holeSensor', holeSensor)
      .set('levelOver', false)
      // TODO: better way to do this?
      .update('players', (players) => {
        return players.map((player) => {
          return player
            .set('body', addBall({level, world}))
            .set('strokes', 0)
            .set('scored', false);
        });
      });
  },
});
