import {
  MessageIdentity,
  MessageInitial,
  MessageLevelOver,
  MessageMatchOver,
  MessageSync,
} from '../universal/protocol';
import {State} from './records';
import {GameState, PlayerState} from '../universal/constants';
import {User as UserModel} from './models';

export function createIdentity(user: UserModel, twitterName?: string): MessageIdentity {
  return {
    type: 'identity',
    id: user.id,
    color: user.color,
    name: user.name,
    authToken: user.authToken,
    twitterName,
  };
}

export function createInitial(state: State, playerId: number): MessageInitial {
  const players = state.players
    .filter((player) => player.state !== PlayerState.leftMatch)
    .map((player, id) => {
      return {
        id,
        color: player.color,
        name: player.name,
        state: player.state,
        position: [
          player.body.position[0],
          player.body.position[1],
        ],
        velocity: [
          player.body.velocity[0],
          player.body.velocity[1],
        ],
        scored: player.scored,
        strokes: player.strokes,
      };
    });

  let isObserver: boolean;
  if (players.has(playerId)) {
    isObserver = false;

  } else {
    isObserver = true;
  }

  const levelOverState = state.gameState === GameState.levelOver ? createLevelOver(state) : null;
  const matchOverState = state.gameState === GameState.matchOver ? createMatchOver(state) : null;

  return {
    type: 'initial',

    gameState: state.gameState,

    isObserver,

    levelOverState,
    matchOverState,

    leaderId: state.leaderId,

    players: players.toArray(),

    level: state.levelData,
    expiresIn: state.expTime - Date.now(),

    time: state.time,
    matchEndsIn: state.matchEndTime - Date.now(),
  };
}

export function createLevelOver(state: State): MessageLevelOver {
  const rankedPlayers = state.roundRankedPlayers;

  return {
    type: 'levelOver',

    roundRankedPlayers: rankedPlayers.toArray().map((player) => {
      return {
        id: player.id,
        color: player.color,
        name: player.name,
        strokes: player.strokes,
        scoreTime: player.scoreTime,
        scored: player.scored,

        prevPoints: player.prevPoints,
        addedPoints: player.points - player.prevPoints,
      };
    }),

    expTime: state.expTime,
    leaderId: state.leaderId,
  };
}

export function createMatchOver(state: State): MessageMatchOver {
  const rankedPlayers = state.matchRankedPlayers;

  return {
    type: 'matchOver',

    nextMatchIn: state.expTime - Date.now(),

    matchRankedPlayers: rankedPlayers.toArray().map((player) => {
      return {
        id: player.id,
        color: player.color,
        name: player.name,
        points: player.points,
      };
    }),
  };
}

export function createSync(state: State): MessageSync {
  const syncPlayers = state.players
    .filter((player) => player.state === PlayerState.active || player.state === PlayerState.leftRound)
    .map((player, id) => {
      return {
        id,
        position: [
          player.body.position[0],
          player.body.position[1],
        ],
        velocity: [
          player.body.velocity[0],
          player.body.velocity[1],
        ],
      };
  }).toArray();

  return{
    type: 'sync',

    players: syncPlayers,
    time: state.time,
  };
}