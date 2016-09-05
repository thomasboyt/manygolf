import {messageLevelOver, messageInitial, messageMatchOver} from '../universal/protocol';
import {State} from './records';
import {GameState} from '../universal/constants';

export function createInitial(state: State, playerId: number, authToken?: string) {
  const players = state.players.map((player, id) => {
    return {
      id,
      color: player.color,
      name: player.name,
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

  let self;
  let isObserver: boolean;
  if (players.has(playerId)) {
    self = players.get(playerId);
    isObserver = false;

  } else {
    const observer = state.observers.get(playerId);
    self = {
      id: observer.id,
      name: observer.name,
      color: observer.color,
    };
    isObserver = true;
  }

  if (authToken) {
    self.authToken = authToken;
  }

  const levelOverState = state.gameState === GameState.levelOver ? createLevelOver(state).data : null;
  const matchOverState = state.gameState === GameState.matchOver ? createMatchOver(state).data : null;

  return messageInitial({
    gameState: state.gameState,

    self,

    isObserver,

    levelOverState,
    matchOverState,

    leaderId: state.leaderId,

    players: players.toArray(),

    level: state.levelData,
    expiresIn: state.expTime - Date.now(),

    time: state.time,
    matchEndsIn: state.matchEndTime - Date.now(),
  });
}

export function createLevelOver(state: State) {
  const rankedPlayers = state.roundRankedPlayers;

  return messageLevelOver({
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
  });
}

export function createMatchOver(state: State) {
  const rankedPlayers = state.matchRankedPlayers;

  return messageMatchOver({
    nextMatchIn: state.expTime - Date.now(),

    matchRankedPlayers: rankedPlayers.toArray().map((player) => {
      return {
        id: player.id,
        color: player.color,
        name: player.name,
        points: player.points,
      };
    }),
  });
}