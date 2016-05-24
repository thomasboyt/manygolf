import I from 'immutable';
import p2 from 'p2';

import createImmutableReducer from '../universal/createImmutableReducer';

import {
  TYPE_INITIAL,
  TYPE_PLAYER_CONNECTED,
  TYPE_PLAYER_DISCONNECTED,
  TYPE_LEVEL,
  TYPE_DISPLAY_MESSAGE,
  TYPE_LEVEL_OVER,
  MessageInitial,
  MessagePlayerConnected,
  MessageDisplayMessage,
  MessageLevelOver,
  TYPE_HURRY_UP,
  MessageHurryUp,
  TYPE_IDLE_KICKED,
  MessagePlayerSwing,
  TYPE_PLAYER_SWING,
  TYPE_SYNC,
  MessageSync,
  MessageChat,
  TYPE_CHAT,
  MessageMatchOver,
  TYPE_MATCH_OVER,
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

import clamp from 'lodash.clamp';
import sample from 'lodash.sample';

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
  console.log('sync ----');

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
      console.log(`syncing ${playerPosition.id} (x: ${xDiff} y: ${yDiff})`);
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

function newLevel(state: State, data: MessageInitial) {
  const levelData = data.level;
  const expTime = data.expiresIn + Date.now();

  const level = new Level(I.fromJS(levelData))
    .update(addHolePoints);

  let playerPhysicsMap = I.Map<number, PlayerPhysics>();

  if (data.players) {
    // Initial connection includes players with positions+velocities
    playerPhysicsMap = data.players.reduce((playerPhysicsMap, player) => {
      const playerPhysics = createPlayerPhysics(level, player);
      return playerPhysicsMap.set(player.id, playerPhysics);
    }, playerPhysicsMap);

  } else {
    // New level on existing connection
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
  console.log(`playing swing ${dt} ${data.id} ${data.time}`);

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

function leaveGame(state: State) {
  return state
    .deleteIn(['round', 'playerPhysics', state.id])
    .set('isObserver', true);
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

  [`ws:${TYPE_LEVEL}`]: (prevState: State, action) => {
    let newState = newLevel(prevState, action.data)
      .set('gameState', GameState.roundInProgress);

    if (prevState.gameState === GameState.matchOver) {
      newState = newState.set('match', new Match({
        matchEndsAt: Date.now() + MATCH_LENGTH_MS,
      }));
    }

    return newState;
  },

  [`ws:${TYPE_INITIAL}`]: (state: State, action) => {
    const data = <MessageInitial>action.data;

    return state
      .set('connectionState', ConnectionState.connected)
      .set('name', data.self.name)
      .set('id', data.self.id)
      .set('color', data.self.color)
      .set('isObserver', data.isObserver)
      .set('players', data.players.reduce((balls, player) => {
        return balls.set(player.id, new Player({
          color: player.color,
          name: player.name,
          id: player.id,
        }));
      }, I.Map()))
      .update((s) => newLevel(s, data))
      .set('gameState', data.gameState)
      .set('time', data.time)
      .set('match', new Match({
        leaderId: data.leaderId,
        matchEndsAt: Date.now() + data.matchEndsIn,
      }));
  },

  [`ws:${TYPE_PLAYER_CONNECTED}`]: (state: State, action) => {
    const data = <MessagePlayerConnected>action.data;

    const playerPhysics = createPlayerPhysics(state.round.level);

    return state
      .setIn(['round', 'playerPhysics', data.id], playerPhysics)
      .setIn(['players', action.data.id], new Player({
        color: data.color,
        name: data.name,
        id: data.id,
      }));
  },

  [`ws:${TYPE_PLAYER_DISCONNECTED}`]: (state: State, action) => {
    return state.deleteIn(['players', action.data.id]);
  },

  [`ws:${TYPE_PLAYER_SWING}`]: (state: State, {data}: {data: MessagePlayerSwing}) => {
    if (data.time < state.time) {
      return applySwing(state, data);
    } else {
      return state.update('swingQueue', (swingQueue) => swingQueue.push(data));
    }
  },

  [`ws:${TYPE_DISPLAY_MESSAGE}`]: (state: State, action) => {
    const data = <MessageDisplayMessage>action.data;

    return state
      .set('displayMessage', data.messageText)
      .set('displayMessageColor', data.color)
      .set('displayMessageTimeout', Date.now() + 5 * 1000);
  },

  [`ws:${TYPE_LEVEL_OVER}`]: (state: State, action) => {
    const data = <MessageLevelOver>action.data;

    const rankedPlayers: I.List<LeaderboardPlayer> = I.fromJS(data.roundRankedPlayers)
      .map((player) => new LeaderboardPlayer(player));

    const leaderId = data.leaderId;

    return state
      .set('gameState', GameState.levelOver)
      .setIn(['match', 'leaderId'], leaderId)
      .setIn(['round', 'expTime'], data.expTime)
      .setIn(['round', 'roundRankedPlayers'], rankedPlayers);
  },

  [`ws:${TYPE_HURRY_UP}`]: (state: State, action) => {
    const data = <MessageHurryUp>action.data;

    const expTime = Date.now() + data.expiresIn;

    return state
      .setIn(['round', 'expTime'], expTime)
      .set('displayMessage', 'Hurry up!')
      .set('displayMessageTimeout', Date.now() + 5 * 1000);
  },

  [`ws:${TYPE_IDLE_KICKED}`]: (state: State) => {
    return leaveGame(state);
  },

  [`ws:${TYPE_SYNC}`]: (state: State, {data}: {data: MessageSync}) => {
    const time = data.time;

    // if client is ahead of server, somehow...
    if (time < state.time) {
      return syncWorld(state, data);

    } else {
      return state.update('syncQueue', (syncQueue) => syncQueue.push(data));
    }
  },

  [`ws:${TYPE_CHAT}`]: (state: State, {data}: {data: MessageChat}) => {
    return state.setIn(['chats', data.id], new ChatMessage({
      emoticon: data.emoticon,
      timeout: Date.now() + 5 * 1000,
    }));
  },

  [`ws:${TYPE_MATCH_OVER}`]: (state: State, {data}: {data: MessageMatchOver}) => {
    const rankedPlayers: I.List<MatchEndPlayer> = I.fromJS(data.matchRankedPlayers)
      .map((player) => new MatchEndPlayer(player));

    const nextMatchTime = Date.now() + data.nextMatchIn;

    return state
      .set('gameState', GameState.matchOver)
      .setIn(['match', 'matchRankedPlayers'], rankedPlayers)
      .setIn(['match', 'nextMatchTime'],  nextMatchTime);
  },

  'disconnect': (state: State) => {
    return state.set('connectionState', ConnectionState.disconnected);
  },

  'leaveObserver': (state: State) => {
    return enterGame(state);
  },
});
