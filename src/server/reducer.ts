import I from 'immutable';
import p2 from 'p2';

import createImmutableReducer from '../universal/createImmutableReducer';

import {
  createWorld,
  createBall,
  createGround,
  createHoleSensor,
  addHolePoints,
} from '../universal/physics';

import {
  State,
  Level,
  Player,
  Coordinates,
} from './records';

import {
  OVER_TIMER_MS,
  RoundState,
} from '../universal/constants';

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

export default createImmutableReducer<State>(new State(), {
  'scored': (state: State, action) => {
    const id = action.id;
    const elapsed = action.elapsed;

    return state
      .setIn(['players', id, 'scored'], true)
      .setIn(['players', id, 'scoreTime'], elapsed);
  },

  'hurryUp': (state: State, action) => {
    const expTime = action.expTime;

    return state
      .set('expTime', expTime)
      .set('didHurryUp', true);
  },

  'levelOver': (state: State, action) => {
    const rankedPlayers = action.rankedPlayers;

    return state
      .set('roundState', RoundState.over)
      .set('expTime', Date.now() + OVER_TIMER_MS)
      .set('roundRankedPlayers', rankedPlayers);
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
  },
});
