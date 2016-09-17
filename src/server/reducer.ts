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
  GameState,
  PlayerState,
} from '../universal/constants';

interface AddPlayerOpts {
  id: number;
  name?: string;
  color?: string;
}

/**
 * Creates a physics entity and round state for a player.
 *
 * Called at the beginning of every round for every active player. Also called when a new player
 * connects, or a returning player who is not in the current round connects.
 */
function enterGame(player: Player, state: State): Player {
  const ballBody = createBall(state.level.spawn);

  state.world.addBody(ballBody);

  return player
    .set('body', ballBody)
    .set('strokes', 0)
    .set('scored', false)
    .set('scoreTime', null);
}

function pointsForRank(place: number, total: number): number {
  if (place === 1) {
    // first place
    return 20;
  } else if (place === 2) {
    // second place
    return 15;
  } else if (place === 3) {
    // third place
    return 12;
  } else if (place / total <= 0.25) {
    // top 25%
    return 10;
  } else if (place / total <= 0.5) {
    // top 50%
    return 5;
  } else {
    // participation award! (you don't get this if you didn't sink it)
    return 1;
  }
}

export function updatePoints(players: I.Map<number, Player>, rankedPlayerIds: I.List<number>) {
  return rankedPlayerIds
    .reduce((players, rankedPlayerId, index) => {
      const scored = players.get(rankedPlayerId).scored;
      // don't award points to players who did not score
      if (!scored) {
        return players;
      }

      const prevPoints = players.getIn([rankedPlayerId, 'points']);

      return players
        .setIn([rankedPlayerId, 'prevPoints'], prevPoints)
        .updateIn([rankedPlayerId, 'points'],
                  (points) => points + pointsForRank(index + 1, players.size));
    }, players);
}

function resetPoints(players: I.Map<number, Player>) {
  return players.map((player) => {
    return player
      .set('points', 0)
      .set('prevPoints', 0);
  });
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

export function getInWorldPlayers(state: State) {
  // get all players who have participated in the current round
  return state.players.filter((player) =>
    player.state === PlayerState.active || player.state === PlayerState.leftRound)
    .toMap();
}

export function getActivePlayers(state: State) {
  // get all currently-in game players
  return state.players.filter((player) => player.state === PlayerState.active).toMap();
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

    const leader = roundRankedPlayers.maxBy((player) => player.points);
    const leaderId = leader ? leader.id : null;

    return state
      .set('players', players)
      .set('leaderId', leaderId)
      .set('roundRankedPlayers', roundRankedPlayers)
      .set('gameState', GameState.levelOver)
      .set('expTime', Date.now() + OVER_TIMER_MS);
  },

  'matchOver': (state: State, {nextMatchAt}: {nextMatchAt: number}) => {
    const matchRankedPlayers = state.players.sortBy((player) => player.points).reverse().toList();

    return state
      .set('matchRankedPlayers', matchRankedPlayers)
      .set('gameState', GameState.matchOver)
      .set('expTime', nextMatchAt);
  },

  /**
   * Player (re-)connected or (re-)entered from observer mode.
   */
  'playerJoined': (state: State, {id, name, color}: AddPlayerOpts) => {
    let existingPlayer = state.players.get(id);

    if (existingPlayer) {
      if (existingPlayer.state === PlayerState.leftMatch) {
        existingPlayer = enterGame(existingPlayer, state);
      }

      existingPlayer = existingPlayer
        .set('state', PlayerState.active)
        .set('lastSwingTime', Date.now());
      return state.setIn(['players', id], existingPlayer);

    } else {
      const newPlayer = new Player({
        id,
        color,
        name,
        lastSwingTime: Date.now(),
      });

      return state.setIn(['players', id], enterGame(newPlayer, state));
    }
  },

  /**
   * Player disconnected or went into observer mode.
   */
  'playerLeft': (state: State, {id}: {id: number}) => {
    return state
      .setIn(['players', id, 'state'], PlayerState.leftRound);
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

  'startMatch': (state: State, {endTime}: {endTime: number}) => {
     return state
       .set('matchEndTime', endTime)
       .update('players', resetPoints)
       .update('players', (players) => {
         // remove all inactive players
         return players.filter((player: Player) => player.state === PlayerState.active);
       });
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
      matchEndTime: state.matchEndTime,
    });

    // XXX: This is done separately because it depends on the updated `state`
    nextState = nextState.set('players', state.players.map((player) => {
      if (player.state === PlayerState.leftRound) {
        return player
          .set('state', PlayerState.leftMatch)
          .set('body', null);

      } else if (player.state === PlayerState.active) {
        return enterGame(player, nextState);
      }

      return player;
    }));

    return nextState;
  },
});
