// message types
export const TYPE_SWING = 'swing';
export const TYPE_LEVEL = 'level';
export const TYPE_POSITION = 'position';
export const TYPE_INITIAL = 'initial';
export const TYPE_PLAYER_CONNECTED = 'connected';
export const TYPE_PLAYER_DISCONNECTED = 'disconnected';
export const TYPE_LEVEL_OVER = 'levelOver';
export const TYPE_DISPLAY_MESSAGE = 'displayMessage';

interface Player {
  id: number;
  color: string;
  name: string;
}

interface Level {
  points: Array<Array<number>>;
  hole: Array<number>;
  spawn: Array<number>
}

export interface MessageInitial {
  self: Player;
  players: Array<Player>;
  level: Level;
  expTime: number;
}

export function messageInitial(params: MessageInitial) {
  return {
    type: TYPE_INITIAL,
    data: params,
  }
}

export interface MessagePlayerConnected {
  id: number;
  color: string;
  name: string;
}

export function messagePlayerConnected(params: MessagePlayerConnected) {
  return {
    type: TYPE_PLAYER_CONNECTED,
    data: params,
  }
}

export interface MessageDisplayMessage {
  messageText: string;
}

export function messageDisplayMessage(params: MessageDisplayMessage) {
  return {
    type: TYPE_DISPLAY_MESSAGE,
    data: params,
  }
}
