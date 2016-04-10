import I from 'immutable';
import p2 from 'p2';

import createImmutableReducer from '../universal/createImmutableReducer';

import {
  createWorld,
  createBall,
  createGround,
  createHoleSensor,
  addHolePoints,
  ensureBallInBounds,
} from '../universal/physics';

import {
  State,
  Level,
  Player,
  Coordinates
} from './records';

const fixedStep = 1 / 60;
const maxSubSteps = 10;

function addPlayer(state: State, {id, name, color}: {id: number, name: string, color: string}) {
  const body = addBall(state);

  return state
    .setIn(['players', id], new Player({
      body,
      color,
      name,
    }));
}

function addBall({level, world}: {level: Level, world: p2.World}) {
  const ballBody = createBall(level.spawn);

  world.addBody(ballBody);

  return ballBody;
}

export default createImmutableReducer<State>(new State(), {
  'tick': (state: State, {dt}: {dt: number}) => {
    dt = dt / 1000;  // ms -> s

    if (!state.world) {
      return state;
    }

    state.players.forEach((player) => {
      ensureBallInBounds(player.body, state.level);
    });

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

    return state;
  },

  'levelOver': (state: State) => {
    return state
      .set('levelOver', true)
      .set('expTime', Date.now() + 5 * 1000);
  },

  'playerConnected': (state: State, action) => {
    return addPlayer(state, action);
  },

  'playerDisconnected': (state: State, {id}: {id: number}) => {
    return state
      .deleteIn(['players', id]);
  },

  'swing': (state: State, {id, vec}: {id: number; vec: Coordinates}) => {
    const body = state.players.get(id).body;

    if (body.sleepState !== p2.Body.SLEEPING) {
      // ignore
      return state;

    } else {
      body.velocity[0] = vec.x;
      body.velocity[1] = vec.y;

      return state.updateIn(['players', id, 'strokes'], (strokes) => strokes + 1);
    }
  },

  'level': (state: State, {levelData, expTime}: {levelData: any; expTime: number}) => {
    const level = new Level(I.fromJS(levelData))
      .update(addHolePoints);

    const world = createWorld();

    const groundBodies = createGround(level);
    for (let body of groundBodies) {
      world.addBody(body);
    }

    const holeSensor = createHoleSensor(level.hole);
    world.addBody(holeSensor);

    return new State({
      levelData,
      world,
      level,
      expTime,
      holeSensor,

      players: state.players.map((player) => {
        return player
          .set('body', addBall({level, world}))
          .set('strokes', 0)
          .set('scored', false);
      })
    });
  }
});
