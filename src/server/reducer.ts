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
  Coordinates,
} from './records';

import {
  TIMER_MS,
  OVER_TIMER_MS,
  RoundState,
} from '../universal/constants';

const fixedStep = 1 / 60;
const maxSubSteps = 10;

interface AddPlayerOpts {
  id: number;
  name: string;
  color: string;
  isObserver: boolean;
}

function enterGame(player: Player, state: State) {
  const ballBody = createBall(state.level.spawn);

  state.world.addBody(ballBody);

  return player
    .set('body', ballBody)
    .set('strokes', 0)
    .set('scored', false)
    .set('scoreTime', null);
}

function leaveGame(player: Player, state: State) {
  const ball = player.body;
  state.world.removeBody(ball);
  return player.set('body', null);
}

export function rankPlayers(players: I.Map<number, Player>): I.List<Player> {
  const playersList = players.toList();

  return playersList
    .filter((player) => player.scored)
    // TODO: There HAS to be a better way to do this, right?
    .sort((a, b) => {
      if (a.strokes > b.strokes) {
        return 1;
      } else if (a.strokes < b.strokes) {
        return -1;
      } else {
        if (a.scoreTime > b.scoreTime) {
          return 1;
        } else if (a.scoreTime < b.scoreTime) {
          return -1;
        } else {
          return 0;
        }
      }
    })
    .toList();  // This isn't supposed to be necessary but makes TypeScript happy?
}

export default createImmutableReducer<State>(new State(), {
  'tick': (state: State, {dt}: {dt: number}) => {
    dt = dt / 1000;  // ms -> s

    if (!state.world || state.roundState === RoundState.over) {
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
          const elapsed = Date.now() - (state.expTime - TIMER_MS);

          return player
            .set('scored', true)
            .set('scoreTime', elapsed);
        }

        return player;
      }
    }));

    return state;
  },

  'hurryUp': (state: State, action) => {
    const expTime = action.expTime;

    return state
      .set('expTime', expTime)
      .set('didHurryUp', true);
  },

  'levelOver': (state: State) => {
    return state
      .set('roundState', RoundState.over)
      .set('expTime', Date.now() + OVER_TIMER_MS)
      .set('roundRankedPlayers', rankPlayers(state.players));
  },

  'playerConnected': (state: State, {id, name, color, isObserver}: AddPlayerOpts) => {
    const player = new Player({
      id,
      color,
      name,
      lastSwingTime: Date.now(),
    });

    if (isObserver) {
      return state.setIn(['observers', id], player);

    } else {
      return state.setIn(['players', id], enterGame(player, state));
    };
  },

  'playerDisconnected': (state: State, {id}: {id: number}) => {
    const player = state.players.get(id);

    if (player) {
      return state
        .setIn(['players', id], leaveGame(player, state))
        .deleteIn(['players', id]);
    }

    const observer = state.observers.get(id);
    return state.deleteIn(['observers', id]);
  },

  'swing': (state: State, {id, vec}: {id: number; vec: Coordinates}) => {
    const player = state.players.get(id);

    // Player could be an observer
    // XXX: Handle this in SocketManager?
    if (!player) {
      return state;
    }

    const body = state.players.get(id).body;

    if (body.sleepState !== p2.Body.SLEEPING) {
      // ignore
      return state;

    } else {
      body.velocity[0] = vec.x;
      body.velocity[1] = vec.y;

      return state
        .updateIn(['players', id, 'strokes'], (strokes) => strokes + 1)
        .setIn(['players', id, 'lastSwingTime'], Date.now());
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

    let nextState = new State({
      levelData,
      world,
      level,
      expTime,
      holeSensor,
      observers: state.observers,
    });

    // XXX: This is done separately because it depends on the updated `state`
    nextState = nextState.set('players', state.players.map((player) => {
      return enterGame(player, nextState);
    }));

    return nextState;
  },

  /*
   * Observer leave/enter
   */
  'enterGame': (state: State, {id}: {id: number}) => {
    const player = state.observers.get(id);

    return state
      .setIn(['players', id], enterGame(player, state))
      .setIn(['players', id, 'lastSwingTime'], Date.now())
      .deleteIn(['observers', id]);
  },

  'leaveGame': (state: State, {id}: {id: number}) => {
    const player = state.players.get(id);

    return state
      .setIn(['observers', id], leaveGame(player, state))
      .deleteIn(['players', id]);
  }
});
