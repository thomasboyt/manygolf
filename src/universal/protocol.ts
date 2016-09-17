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

// sent on initial connection before MessageInitial
export const TYPE_IDENTITY = 'identity';

export interface MessageIdentity {
  id: number;
  authToken: string;
  name: string;
  color: string;
}

export function messageIdentity(params: MessageIdentity) {
  return {
    type: TYPE_IDENTITY,
    data: params,
  };
}


export const TYPE_INITIAL = 'initial';

// This message should always allow a complete reset of client state
export interface MessageInitial {
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

export function messageInitial(params: MessageInitial) {
  return {
    type: TYPE_INITIAL,
    data: params,
  };
}


export const TYPE_PLAYER_CONNECTED = 'connected';

export interface MessagePlayerConnected {
  id: number;
  color: string;
  name: string;
}

export function messagePlayerConnected(params: MessagePlayerConnected) {
  return {
    type: TYPE_PLAYER_CONNECTED,
    data: params,
  };
}


export const TYPE_PLAYER_DISCONNECTED = 'disconnected';

export interface MessagePlayerDisconnected {
  id: number;
}

export function messagePlayerDisconnected(params: MessagePlayerDisconnected) {
  return {
    type: TYPE_PLAYER_DISCONNECTED,
    data: params,
  };
}


export const TYPE_PLAYER_IDLE_KICKED = 'playerIdleKicked';

export interface MessagePlayerIdleKicked {
  id: number;
}

export function messagePlayerIdleKicked(params: MessagePlayerIdleKicked) {
  return {
    type: TYPE_PLAYER_IDLE_KICKED,
    data: params,
  };
}


export const TYPE_DISPLAY_MESSAGE = 'displayMessage';

export interface MessageDisplayMessage {
  messageText: string;
  color?: string;
}

export function messageDisplayMessage(params: MessageDisplayMessage) {
  return {
    type: TYPE_DISPLAY_MESSAGE,
    data: params,
  };
}


export const TYPE_LEVEL_OVER = 'levelOver';

export interface MessageLevelOver {
  roundRankedPlayers: Array<LeaderboardPlayer>;
  expTime: number;
  leaderId: number;
}

export function messageLevelOver(params: MessageLevelOver) {
  return {
    type: TYPE_LEVEL_OVER,
    data: params,
  };
}


export const TYPE_LEVEL = 'level';

export interface MessageLevel {
  level: Level;
  expiresIn: number;
}

export function messageLevel(params: MessageLevel) {
  return {
    type: TYPE_LEVEL,
    data: params,
  };
}


export const TYPE_SYNC = 'sync';

export interface MessageSync {
  players: Array<SyncPlayer>;
  time: number;
}

export function messageSync(params: MessageSync) {
  return {
    type: TYPE_SYNC,
    data: params,
  };
}


export const TYPE_SWING = 'swing';

export interface MessageSwing {
  vec: {
    x: number;
    y: number;
  };
}

export function messageSwing(params: MessageSwing) {
  return {
    type: TYPE_SWING,
    data: params,
  };
}


export const TYPE_HURRY_UP = 'hurry-up';

export interface MessageHurryUp {
  expiresIn: number;
}

export function messageHurryUp(params: MessageHurryUp) {
  return {
    type: TYPE_HURRY_UP,
    data: params,
  };
}


export const TYPE_ENTER_GAME = 'enterGame';

export function messageEnterGame() {
  return {
    type: TYPE_ENTER_GAME,
  };
}


export const TYPE_PLAYER_SWING = 'playerSwing';

export interface MessagePlayerSwing {
  id: number;
  position: number[];
  velocity: number[];
  time: number;
}

export function messagePlayerSwing(params: MessagePlayerSwing) {
  return {
    type: TYPE_PLAYER_SWING,
    data: params,
  };
}


export const TYPE_SEND_CHAT = 'sendChat';

export interface MessageSendChat {
  emoticon: Emoticon;
}

export function messageSendChat(params: MessageSendChat) {
  return {
    type: TYPE_SEND_CHAT,
    data: params,
  };
}


export const TYPE_CHAT = 'chat';

export interface MessageChat {
  id: number;
  emoticon: Emoticon;
}

export function messageChat(params: MessageChat) {
  return {
    type: TYPE_CHAT,
    data: params,
  };
}


export const TYPE_MATCH_OVER = 'matchOver';

export interface MessageMatchOver {
  // ms until next match
  nextMatchIn: number;

  matchRankedPlayers: MatchEndPlayer[];
}

export function messageMatchOver(params: MessageMatchOver) {
  return {
    type: TYPE_MATCH_OVER,
    data: params,
  };
}


export const TYPE_REQUEST_PAUSE_STREAM = 'requestPauseStream';

export function messageReqPauseStream() {
  return {
    type: TYPE_REQUEST_PAUSE_STREAM,
  };
}


export const TYPE_REQUEST_RESUME_STREAM = 'requestResumeStream';

export function messageReqResumeStream() {
  return {
    type: TYPE_REQUEST_RESUME_STREAM,
  };
}
