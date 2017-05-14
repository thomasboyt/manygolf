import {
  GameState,
  Emoticon,
  PlayerState,
} from '../universal/constants';

interface Player {
  id: number;
  color: string;
  name: string;
}

interface InitialPlayer extends Player {
  position: number[];
  velocity: number[];
  strokes: number;
  scored: boolean;
  state: PlayerState;
}

interface SyncPlayer {
  id: number;
  position: number[];
  velocity: number[];
}

interface LeaderboardPlayer extends Player {
  strokes: number;
  scoreTime: number;
  prevPoints: number;
  addedPoints: number;
  scored: boolean;
}

interface MatchEndPlayer extends Player {
  points: number;
}

interface Level {
  points: Array<Array<number>>;
  hole: Array<number>;
  spawn: Array<number>;
  color: string;
}

export interface MessageIdentity {
  type: 'identity';

  id: number;
  authToken: string;
  name: string;
  twitterName: string;
  color: string;
}

// This message should always allow a complete reset of client state
export interface MessageInitial {
  type: 'initial';

  gameState: GameState;
  players: InitialPlayer[];
  isObserver: boolean;

  levelOverState?: MessageLevelOver;
  matchOverState?: MessageMatchOver;

  matchEndsIn: number;

  // TODO: this should all go under a "current round" sub-message or something. this message should
  // support sending information about "end of round" and "end of match" states too...
  level: Level;
  expiresIn: number;
  time: number;
  leaderId: number;
}

export interface MessagePlayerConnected {
  type: 'connected';

  id: number;
  color: string;
  name: string;
}

export interface MessagePlayerDisconnected {
  type: 'disconnected';

  id: number;
}

export interface MessagePlayerIdleKicked {
  type: 'playerIdleKicked';

  id: number;
}

export interface MessageDisplayMessage {
  type: 'displayMessage';

  messageText: string;
  color?: string;
}

export interface MessageLevelOver {
  type: 'levelOver';

  roundRankedPlayers: Array<LeaderboardPlayer>;
  expTime: number;
  leaderId: number;
}

export interface MessageLevel {
  type: 'level';

  level: Level;
  expiresIn: number;
}

export interface MessageSync {
  type: 'sync';

  players: Array<SyncPlayer>;
  time: number;
}

export interface MessageSwing {
  type: 'swing';

  vec: {
    x: number;
    y: number;
  };
}

export interface MessageHurryUp {
  type: 'hurry-up';

  expiresIn: number;
}

export interface MessageEnterGame {
  type: 'enterGame';
}

export interface MessagePlayerSwing {
  type: 'playerSwing';

  id: number;
  position: number[];
  velocity: number[];
  time: number;
}

export interface MessageSendChat {
  type: 'sendChat';
  emoticon: Emoticon;
}

export interface MessageChat {
  type: 'chat';
  id: number;
  emoticon: Emoticon;
}

export interface MessageMatchOver {
  type: 'matchOver';

  // ms until next match
  nextMatchIn: number;

  matchRankedPlayers: MatchEndPlayer[];
}

export interface MessageReqPauseStream {
  type: 'requestPauseStream';
}

export interface MessageReqResumeStream {
  type: 'requestResumeStream';
}

export type Message =
  MessageIdentity |
  MessageInitial |
  MessagePlayerConnected |
  MessagePlayerDisconnected |
  MessagePlayerIdleKicked |
  MessageDisplayMessage |
  MessageLevelOver |
  MessageLevel |
  MessageSync |
  MessageSwing |
  MessageHurryUp |
  MessageEnterGame |
  MessagePlayerSwing |
  MessageSendChat |
  MessageChat |
  MessageMatchOver |
  MessageReqPauseStream |
  MessageReqResumeStream;