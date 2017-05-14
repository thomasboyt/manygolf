import * as I from 'immutable';
import * as p2 from 'p2';

import createImmutableReducer, {IHandlers} from '../universal/createImmutableReducer';

import {
  Message,
  MessageInitial,
  MessagePlayerConnected,
  MessageDisplayMessage,
  MessageLevel,
  MessageLevelOver,
  MessageHurryUp,
  MessagePlayerSwing,
  MessageSync,
  MessageChat,
  MessageMatchOver,
  MessageIdentity,
  MessagePlayerDisconnected,
  MessagePlayerIdleKicked,
} from '../universal/protocol';

import {
  MIN_POWER,
  MAX_POWER,
  SWING_STEP,
  TIMER_MS,
  goalWords,
  GameState,
  ConnectionState,
  AimDirection,
  MATCH_LENGTH_MS,
  PlayerState,
} from '../universal/constants';

import {
  createWorld,
  createBall,
  createBallFromInitial,
  createGround,
  createHoleSensor,
  addHolePoints,
  ensureBallInBounds,
} from '../universal/physics';

import {clamp, sample} from 'lodash';

import {
  State,
  Level,
  PlayerPhysics,
  Player,
  SwingMeterDirection,
  LeaderboardPlayer,
  Round,
  ChatMessage,
  MatchEndPlayer,
  Match,
} from './records';

import debugLog from './util/debugLog';

const runBehind = 50;  // ms to enforce run-behind

const SYNC_THRESHOLD = 2;

const fixedStep = 1 / 60;

// this is set to be super high so that the physics engine can instantly catch up if you tab out
// and back in. with p2's default 10, it only does ten "catch-up" fixed steps per tick, which
// causes everything to move in "fast motion" until it's caught up, which is of course really weird
//
// this is set to be the maximum number of steps in a round (since the world is reset between
// rounds, you don't need to worry about anything higher)
const maxSubSteps = (TIMER_MS / 1000) * (1 / fixedStep);

const moveSpeed = 50;  // degrees per second

function syncWorld(state: State, data: MessageSync): State {
  debugLog(`syncing --- (${state.time - data.time}ms)`);

  // Update player states if they are over some threshold at time
  data.players.forEach((playerPosition) => {
    const player = state.players.get(playerPosition.id);

    // player disconnected OR player has no stored positions yet
    // the latter case happens when a sync message "from the future" is played before a tick
    // including this player is run
    if (!player || player.pastPositions.size === 0) {
      return;
    }

    const posAtClock = player.pastPositions.find((pos, posTime) => posTime >= data.time);

    const xDiff = posAtClock[0] - playerPosition.position[0];
    const yDiff = posAtClock[1] - playerPosition.position[1];

    if (Math.abs(xDiff) >= SYNC_THRESHOLD || Math.abs(yDiff) >= SYNC_THRESHOLD) {
      debugLog(`syncing ${playerPosition.id} (x: ${xDiff} y: ${yDiff})`);
      // move ball to synced location
      const body = state.round.playerPhysics.get(player.id).ball;
      body.position[0] = playerPosition.position[0];
      body.position[1] = playerPosition.position[1];
      body.velocity[0] = playerPosition.velocity[0];
      body.velocity[1] = playerPosition.velocity[1];

      // Step to catch up from snapshot time to the current render time
      const dt = (state.time - data.time) / 1000;
      state.round.playerPhysics.get(player.id).world.step(fixedStep, dt * 3, maxSubSteps);
    }
  });

  return state;
}

function enterScored(state: State) {
  const goalText = sample(goalWords);

  return state
    .setIn(['round', 'scored'], true)
    .setIn(['round', 'goalText'], goalText);
}

// TODO: typedef for player w/ position, velocity
function createPlayerPhysics(level: Level, player?: any) {
  const world = createWorld();

  const groundBodies = createGround(level);
  const holeSensor = createHoleSensor(level.hole);

  for (let body of groundBodies) {
    world.addBody(body);
  }

  world.addBody(holeSensor);

  let ball;
  if (player) {
    ball = createBallFromInitial(player.position, player.velocity);
  } else {
    ball = createBall(level.spawn);
  }

  world.addBody(ball);

  return new PlayerPhysics({
    ball,
    world,
    holeSensor,
  });
}

function newLevel(state: State, data: MessageInitial | MessageLevel) {
  const levelData = data.level;
  const expTime = data.expiresIn + Date.now();

  const level = new Level(I.fromJS(levelData))
    .update(addHolePoints);

  let playerPhysicsMap = I.Map<number, PlayerPhysics>();

  if (data.type === 'initial') {
    // Initial connection includes players with positions+velocities
    playerPhysicsMap = data.players.reduce((playerPhysicsMap, player) => {
      const playerPhysics = createPlayerPhysics(level, player);
      return playerPhysicsMap.set(player.id, playerPhysics);
    }, playerPhysicsMap);

  } else {
    // New level on existing connection

    // Remove disconnected players
    state = state.update('players', (players: I.List<Player>) => players.filter((player) => player.state === PlayerState.active));

    playerPhysicsMap = state.players.reduce((playerPhysicsMap, player) => {
      const playerPhysics = createPlayerPhysics(level);
      return playerPhysicsMap.set(player.id, playerPhysics);
    }, playerPhysicsMap);
  }

  // Clean up synced data
  state = state.set('players', state.players.map((player) => {
    return player.set('pastPositions', I.Map());
  }));

  state = state
    .set('syncQueue', I.List())
    .set('swingQueue', I.List());

  return state.set('round', new Round({
    gameState: GameState.roundInProgress,

    playerPhysics: playerPhysicsMap,
    level,
    expTime,
  }));
}

function applySwing(state: State, data: MessagePlayerSwing) {
  const dt = (state.time - data.time) / 1000;
  debugLog(`playing swing ${dt} ${data.id} ${data.time}`);

  const player = state.players.get(data.id);

  // player disconnected
  if (!player) {
    return state;
  }

  const body = state.round.playerPhysics.get(player.id).ball;

  body.position[0] = data.position[0];
  body.position[1] = data.position[1];
  body.velocity[0] = data.velocity[0];
  body.velocity[1] = data.velocity[1];

  state.round.playerPhysics.get(data.id).world.step(fixedStep, dt * 3, maxSubSteps);

  return state;
}

function enterGame(state: State) {
  const playerPhysics = createPlayerPhysics(state.round.level);

  return state
    .setIn(['round', 'playerPhysics', state.id], playerPhysics)
    .set('isObserver', false);
}

function levelOver(state: State, data: MessageLevelOver) {
  const rankedPlayers: I.List<LeaderboardPlayer> = I.fromJS(data.roundRankedPlayers)
    .map((player: any) => new LeaderboardPlayer(player));

  const leaderId = data.leaderId;

  return state
    .set('gameState', GameState.levelOver)
    .setIn(['match', 'leaderId'], leaderId)
    .setIn(['round', 'expTime'], data.expTime)
    .setIn(['round', 'roundRankedPlayers'], rankedPlayers);
}

function matchOver(state: State, data: MessageMatchOver) {
  const rankedPlayers: I.List<MatchEndPlayer> = I.fromJS(data.matchRankedPlayers)
    .map((player: any) => new MatchEndPlayer(player));

  const nextMatchTime = Date.now() + data.nextMatchIn;

  return state
    .set('gameState', GameState.matchOver)
    .setIn(['match', 'matchRankedPlayers'], rankedPlayers)
    .setIn(['match', 'nextMatchTime'],  nextMatchTime);
}

function getCurrentPlayerPhysics(state: State): PlayerPhysics {
  return state.round.playerPhysics.get(state.id);
}

export default createImmutableReducer<State>(new State(), {
  'tick': (state: State, {dt}: {dt: number}) => {
    // update stored clock
    state = state.update('time', (time) => time + dt * 1000);

    if (!state.round || state.gameState !== GameState.roundInProgress) {
      return state;
    }

    let overlapping;
    if (getCurrentPlayerPhysics(state)) {
      const {holeSensor, ball} = getCurrentPlayerPhysics(state);
      ensureBallInBounds(ball, state.round.level);

      // overlaps() can't be used on a sleeping object, so we check overlapping before tick
      overlapping = ball.overlaps(holeSensor);
    }

    // XXX: MMMMMonster hack
    // dt is set to dt * 3 because that's the speed I actually want
    state.round.playerPhysics.forEach((phys) => {
      phys.world.step(fixedStep, dt * 3, maxSubSteps);
    });

    // update saved positions
    state = state.set('players', state.players.map((player) => {
      const body = state.round.playerPhysics.get(player.id).ball;
      return player.setIn(['pastPositions', state.time], [
        body.position[0],
        body.position[1],
      ]);
    }));

    // run sync
    const syncMsg = state.syncQueue.filter((msg) => msg.time < state.time).maxBy((msg) => msg.time);
    if (syncMsg) {
      state = syncWorld(state, syncMsg);
    }
    state = state.set('syncQueue', state.syncQueue.filterNot((msg) => msg.time < state.time));

    const swingMsgs = state.swingQueue.filter((msg) => msg.time < state.time);
    swingMsgs.forEach((swing) => {
      state = applySwing(state, swing);
    });
    state = state.set('swingQueue', state.swingQueue.filterNot((msg) => msg.time < state.time));

    if (getCurrentPlayerPhysics(state)) {
      const {ball, lastBallX} = getCurrentPlayerPhysics(state);

      if (!state.round.scored) {
        const isSleeping = ball.sleepState === p2.Body.SLEEPING;
        const scored = overlapping && isSleeping;

        if (scored) {
          state = enterScored(state);

        } else {

          if (!state.round.allowHit && isSleeping) {
            // If the player has gone over the hole, mirror the ball's angle so they don't
            // have to slowly re-orient it
            const newX = ball.position[0];
            const holeX = state.round.level.hole.get(0);

            if ((lastBallX < holeX && newX > holeX) ||
                (lastBallX > holeX && newX < holeX)) {

              if ((newX > holeX && state.round.aimDirection < -90) ||
                  (newX < holeX && state.round.aimDirection > -90)) {
                // the aim is already in the correct direction, no need to flip
                // (fixes https://github.com/thomasboyt/manygolf/issues/10)
                return state;
              }

              const diff = -90 - state.round.aimDirection;
              state = state.setIn(['round', 'aimDirection'],
                                  state.round.aimDirection + diff * 2);
            }
          }

          state = state.setIn(['round', 'allowHit'], isSleeping);
        }
      }
    }

    if (state.displayMessageTimeout && Date.now() > state.displayMessageTimeout) {
      state = state
        .set('displayMessage', null)
        .set('displayMessageTimeout', null);
    }

    state = state.set('chats', state.chats.filter((chat) => {
      return chat.timeout > Date.now();
    }));

    return state;
  },

  'beginSwing': (state: State, action) => {
    return state
      .setIn(['round', 'inSwing'], true)
      .setIn(['round', 'swingMeterDirection'], SwingMeterDirection.ascending)
      .setIn(['round', 'swingPower'], MIN_POWER);
  },

  'continueSwing': (state: State, action) => {
    const dt = action.dt;

    let step = dt * SWING_STEP;

    if (state.round.swingMeterDirection === SwingMeterDirection.descending) {
      step = -step;
    }

    const nextPower = state.round.swingPower + step;

    if (nextPower > MAX_POWER) {
      return state
        .setIn(['round', 'swingMeterDirection'], SwingMeterDirection.descending)
        .setIn(['round', 'swingPower'], MAX_POWER);
    } else if (nextPower < MIN_POWER) {
      return state
        .setIn(['round', 'swingMeterDirection'], SwingMeterDirection.ascending)
        .setIn(['round', 'swingPower'], MIN_POWER);
    }

    return state.setIn(['round', 'swingPower'], nextPower);
  },

  'endSwing': (state: State, action) => {
    const lastX = getCurrentPlayerPhysics(state).ball.position[0];

    return state
      .setIn(['round', 'inSwing'], false)
      .setIn(['round', 'playerPhysics', state.id, 'lastBallX'], lastX)
      .updateIn(['round', 'strokes'], (strokes) => strokes + 1)
      .set('didSwing', true);
  },

  'updateAim': (state: State, action) => {
    const {direction, dt}: {direction: AimDirection, dt: number} = action;
    const dir = state.getIn(['round', 'aimDirection']);

    let step;
    if (direction === AimDirection.left) {
      step = -moveSpeed * dt;
    } else if (direction === AimDirection.right) {
      step = moveSpeed * dt;
    }

    const newDir = clamp(dir + step, -180, 0);

    return state.setIn(['round', 'aimDirection'], newDir);
  },

  'disconnect': (state: State) => {
    return state.set('connectionState', ConnectionState.disconnected);
  },

  'leaveObserver': (state: State) => {
    return enterGame(state);
  },

  'websocket': (state: State, {message}: {message: Message}): State => {
    return websocketHandlers[message.type](state, message);
  },
});

const websocketHandlers: IHandlers<State, Message> = {
  'level': (prevState: State, message: MessageLevel) => {
    let newState = newLevel(prevState, message)
      .set('gameState', GameState.roundInProgress);

    if (prevState.gameState === GameState.matchOver) {
      newState = newState.set('match', new Match({
        matchEndsAt: Date.now() + MATCH_LENGTH_MS,
      }));
    }

    return newState;
  },

  'identity': (prevState: State, message: MessageIdentity) => {
    // TODO: Yeah this shouldn't be in a reducer
    if (message.authToken) {
      const token = message.authToken;
      localStorage.setItem('accessToken', token);
    }

    return prevState
      .set('name', message.name)
      .set('twitterName', message.twitterName)
      .set('id', message.id)
      .set('color', message.color);
  },

  'initial': (prevState: State, message: MessageInitial) => {
    const data = message;

    let newState = prevState
      .set('connectionState', ConnectionState.connected)
      .set('isObserver', data.isObserver)
      .set('players', data.players.reduce((balls, player) => {
        return balls.set(player.id, new Player({
          color: player.color,
          name: player.name,
          id: player.id,
          state: player.state,
        }));
      }, I.Map()))
      .update((s) => newLevel(s, data))
      .set('gameState', data.gameState)
      .set('time', data.time - runBehind)
      .set('match', new Match({
        leaderId: data.leaderId,
        matchEndsAt: Date.now() + data.matchEndsIn,
      }));

    if (data.gameState === GameState.levelOver) {
      newState = levelOver(newState, data.levelOverState);
    } else if (data.gameState === GameState.matchOver) {
      newState = matchOver(newState, data.matchOverState);
    }

    // resume current-player-specific state
    // (this could theoretically be moved to newLevel logic, I think?)
    if (!data.isObserver) {
      const self = data.players.find((player) => player.id === newState.id);
      newState = newState.setIn(['round', 'strokes'], self.strokes);

      // restore scored state
      if (self.scored) {
        newState = enterScored(newState);
        // if goal text was previously set, use it
        if (prevState.round && prevState.round.goalText) {
          newState = newState.setIn(['round', 'goalText'], prevState.round.goalText);
        }
      }
    }

    return newState;
  },

  'connected': (state: State, message: MessagePlayerConnected) => {
    const data = message;

    if (state.players.get(data.id)) {
      // player was already connected
      return state.setIn(['players', data.id, 'state'], PlayerState.active);
    }

    const playerPhysics = createPlayerPhysics(state.round.level);

    return state
      .setIn(['round', 'playerPhysics', data.id], playerPhysics)
      .setIn(['players', data.id], new Player({
        color: data.color,
        name: data.name,
        id: data.id,
      }));
  },

  'disconnected': (state: State, message: MessagePlayerDisconnected) => {
    return state.setIn(['players', message.id, 'state'], PlayerState.leftRound);
  },

  'playerIdleKicked': (state: State, message: MessagePlayerIdleKicked) => {
    if (message.id === state.id) {
      return state.set('isObserver', true);
    }

    return state.setIn(['players', message.id, 'state'], PlayerState.leftRound);
  },

  'playerSwing': (state: State, message: MessagePlayerSwing) => {
    if (message.time < state.time) {
      return applySwing(state, message);
    } else {
      return state.update('swingQueue', (swingQueue) => swingQueue.push(message));
    }
  },

  'displayMessage': (state: State, message: MessageDisplayMessage) => {
    return state
      .set('displayMessage', message.messageText)
      .set('displayMessageColor', message.color)
      .set('displayMessageTimeout', Date.now() + 5 * 1000);
  },

  'levelOver': (state: State, message: MessageLevelOver) => {
    return levelOver(state, message);
  },

  'hurry-up': (state: State, message: MessageHurryUp) => {
    const expTime = Date.now() + message.expiresIn;

    return state
      .setIn(['round', 'expTime'], expTime)
      .set('displayMessage', 'Hurry up!')
      .set('displayMessageTimeout', Date.now() + 5 * 1000);
  },

  'sync': (state: State, message: MessageSync) => {
    const time = message.time;

    debugLog('server runahead', time - state.time);

    // if client is ahead of server, due to lag during the time it took to receive message...
    // this should be an exceptional case, ideally
    if (time < state.time) {
      debugLog('Client time is ahead of server, syncing to very old message');
      return syncWorld(state, message);

    } else {
      return state.update('syncQueue', (syncQueue) => syncQueue.push(message));
    }
  },

  'chat': (state: State, message: MessageChat) => {
    return state.setIn(['chats', message.id], new ChatMessage({
      emoticon: message.emoticon,
      timeout: Date.now() + 5 * 1000,
    }));
  },

  'matchOver': (state: State, message: MessageMatchOver) => {
    return matchOver(state, message);
  },
};