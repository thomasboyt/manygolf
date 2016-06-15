import I from 'immutable';
import p2 from 'p2';

import {
  ConnectionState,
  GameState,
  Emoticon,
} from '../universal/constants';

import {
  MessageSync,
  MessagePlayerSwing,
} from '../universal/protocol';

export enum SwingMeterDirection {
  ascending,
  descending
}

const BallRec = I.Record({
  body: null,
  lastX: null,
});

export class Ball extends BallRec {
  body: p2.Body;
  lastX: number;
}

const PlayerRec = I.Record({
  body: null,
  color: null,
  name: null,
  id: null,
  pastPositions: I.Map(),
});

export class Player extends PlayerRec {
  body: p2.Body;
  color: string;
  name: string;
  id: number;
  pastPositions: I.Map<number, number[]>;
}

const LevelRec = I.Record({
  points: null,
  hole: null,
  spawn: null,
  color: null,
});

export class Level extends LevelRec {
  points: I.List<I.List<number>>;
  hole: I.List<number>;
  spawn: I.List<number>;
  color: string;
}

const LeaderboardPlayerRec = I.Record({
  color: null,
  name: null,
  id: null,
  strokes: null,
  scoreTime: null,
  prevPoints: null,
  addedPoints: null,
  scored: null,
});

export class LeaderboardPlayer extends LeaderboardPlayerRec {
  color: string;
  name: string;
  id: number;
  strokes: number;
  scoreTime: number;
  prevPoints: number;
  addedPoints: number;
  scored: boolean;
}

const MatchEndPlayerRec = I.Record({
  color: null,
  name: null,
  id: null,
  points: null,
});

export class MatchEndPlayer extends MatchEndPlayerRec {
  color: string;
  name: string;
  id: number;
  points: number;
}

const RoundRec = I.Record({
  level: null,
  world: null,
  ball: new Ball(),
  holeSensor: null,

  aimDirection: -45,  // angle (in degrees) relative to pointing ->
  swingPower: 0,
  swingMeterDirection: SwingMeterDirection.ascending,
  allowHit: false,
  inSwing: false,

  expTime: null,
  strokes: 0,

  scored: false,
  goalText: null,

  roundRankedPlayers: null,
});

export class Round extends RoundRec {
  level: Level;
  world: p2.World;
  ball: Ball;
  holeSensor: p2.Body;

  aimDirection: number;
  swingPower: number;
  swingMeterDirection: SwingMeterDirection;
  allowHit: boolean;
  inSwing: boolean;

  expTime: number;
  strokes: number;

  scored: boolean;
  goalText: string;

  roundRankedPlayers: I.List<LeaderboardPlayer>;
}

const ChatMessageRec = I.Record({
  emoticon: null,
  timeout: null,
});

export class ChatMessage extends ChatMessageRec {
  emoticon: Emoticon;
  timeout: number;
}

const StateRec = I.Record({
  gameState: null,

  connectionState: ConnectionState.connecting,

  players: I.Map(),

  name: null,
  id: null,
  color: null,
  isObserver: false,

  displayMessage: null,
  displayMessageTimeout: null,
  displayMessageColor: null,

  round: null,

  time: null,

  didSwing: false,
  syncQueue: I.List(),
  swingQueue: I.List(),

  chats: I.Map(),

  leaderId: null,
  matchEndsAt: null,
  matchRankedPlayers: null,
});

export class State extends StateRec {
  gameState: GameState;

  connectionState: ConnectionState;

  players: I.Map<number, Player>;

  name: string;
  id: number;
  color: string;
  isObserver: boolean;

  displayMessage: string;
  displayMessageTimeout: number;
  displayMessageColor: string;

  round: Round;

  time: number;

  didSwing: boolean;
  syncQueue: I.List<MessageSync>;
  swingQueue: I.List<MessagePlayerSwing>;

  chats: I.Map<number, ChatMessage>;

  // todo: move into "Match" record/key?
  leaderId: number;
  matchEndsAt: number;
  matchRankedPlayers: I.List<MatchEndPlayer>;
}
