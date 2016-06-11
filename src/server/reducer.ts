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

// Map of rank index -> number of points awarded
const points = I.Map<number, number>()
  .set(0, 10)
  .set(1, 8)
  .set(2, 6)
  .set(3, 4)
  .set(4, 2);

function pointsForRank(index: number): number {
  if (index > 4) {
    return 0;
  } else {
    return points.get(index);
  }
}

export function updatePoints(players: I.Map<number, Player>, rankedPlayerIds: I.List<number>) {
  return rankedPlayerIds
    .reduce((players, rankedPlayerId, index) => {
      return players
        .updateIn([rankedPlayerId, 'points'], (points) => points + pointsForRank(index));
    }, players);
}

export function rankPlayers(players: I.Map<number, Player>): I.List<number> {
  const playersList = players.toList();

  return playersList
    // .filter((player) => player.scored)
    // TODO: There HAS to be a better way to do this, right?
    .sort((a, b) => {
      // players who haven't scored should be ranked lower
      if (a.scored && !b.scored) {
        return -1;
      } else if (!a.scored && b.scored) {
        return 1;
      }

      // players with more strokes should be ranked lower
      if (a.strokes > b.strokes) {
        return 1;
      } else if (a.strokes < b.strokes) {
        return -1;
      }

      // players with higher times should be ranked lower
      if (a.scoreTime > b.scoreTime) {
        return 1;
      } else if (a.scoreTime < b.scoreTime) {
        return -1;
      }

      return 0;
    })
    .map((player) => player.id)
    .toList();  // This isn't supposed to be necessary but makes TypeScript happy?
}

export default createImmutableReducer<State>(new State(), {
  'tick': (state: State, action) => {
    return state.set('time', Date.now());
  },

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
    // calculate points for each player
    const rankedPlayerIds = rankPlayers(state.players);
    const players = updatePoints(state.players, rankedPlayerIds);

    // this is copied from players so that if players disconnect, the server doesn't lose track of
    // their info and can still send it to newly-connected clients
    const roundRankedPlayers = rankedPlayerIds.map((id) => players.get(id));

    const leaderId = roundRankedPlayers.maxBy((player) => player.points).id;

    return state
      .set('players', players)
      .set('leaderId', leaderId)
      .set('roundRankedPlayers', roundRankedPlayers)
      .set('roundState', RoundState.over)
      .set('expTime', Date.now() + OVER_TIMER_MS);
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

  'level': (state: State,
            {levelData, expTime, startTime}:
            {levelData: any; startTime: number; expTime: number}) => {
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
      startTime,
      expTime,
      holeSensor,
      leaderId: state.leaderId,
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
