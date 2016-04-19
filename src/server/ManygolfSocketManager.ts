import {Store} from 'redux';
import randomColor from 'randomcolor';

import SocketManager from './util/SocketManager';
import nameGen from './nameGen';

import WebSocket from 'ws';

import {
  messageInitial,
  messagePlayerConnected,
  messagePlayerDisconnected,
  messageDisplayMessage,
  TYPE_SWING,
  TYPE_ENTER_GAME,
} from '../universal/protocol';

import {
  State,
  Player,
} from './records';

/*
 * Connection manager
 */

export default class ManygolfSocketManager extends SocketManager {
  store: Store;

  constructor(wss: WebSocket.Server, store: Store) {
    super(wss);
    this.store = store;
  }

  onConnect(id: number, ws: WebSocket) {
    const url = ws.upgradeReq.url;

    // XXX: lol
    let isObserver = false;
    if (url.indexOf('observe') !== -1) {
      isObserver = true;
    }

    const color = randomColor();
    const name = nameGen();

    this.store.dispatch({
      type: 'playerConnected',
      id,
      color,
      name,
      isObserver,
    });

    const state: State = this.store.getState();

    this.sendTo(id, messageInitial({
      roundState: state.roundState,

      self: {
        id,
        color,
        name,
        isObserver,
      },

      players: state.players.filter((player) => !player.isObserver).map((player, id) => {
        return {
          id,
          color: player.color,
          name: player.name,
        };
      }).toList().toJS(),

      level: state.levelData,
      expiresIn: state.expTime - Date.now(),
    }));

    const player = state.players.get(id);

    if (!isObserver) {
      this.playerJoined(player);
    }
  }

  onDisconnect(id: number) {
    const state: State = this.store.getState();

    const player = state.players.get(id);

    this.store.dispatch({
      type: 'playerDisconnected',
      id,
    });

    this.sendAll(messagePlayerDisconnected({
      id,
    }));

    if (!player.isObserver) {
      this.sendAll(messageDisplayMessage({
        messageText: `{{${player.name}}} left`,
        color: player.color,
      }));
    }
  }

  onMessage(id: number, msg: any) {
    const prevState = <State>this.store.getState();

    if (msg.type === TYPE_SWING) {
      this.store.dispatch(Object.assign({
        type: 'swing',
        id,
      }, msg.data));

    } else if (msg.type === TYPE_ENTER_GAME) {
      if (!prevState.players.get(id).isObserver) {
        return;
      }

      this.store.dispatch({
        type: 'enterGame',
        id,
      });

      const state = <State>this.store.getState();
      const player = state.players.get(id);

      this.playerJoined(player);

    } else {
      console.error(`unrecognized message type ${msg.type}`);
    }
  }

  playerJoined(player: Player) {
    const {id, color, name} = player;

    this.sendAll(messagePlayerConnected({
      id,
      color,
      name,
    }));

    this.sendAll(messageDisplayMessage({
      messageText: `{{${name}}} joined`,
      color,
    }));
  }
}
