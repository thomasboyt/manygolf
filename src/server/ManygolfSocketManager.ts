import {Store} from 'redux';
import randomColor from 'randomcolor';

import SocketManager from './util/SocketManager';
import nameGen from './nameGen';

import {
  messageInitial,
  messagePlayerConnected,
  messageDisplayMessage,
  TYPE_PLAYER_DISCONNECTED,
  TYPE_SWING,
} from '../universal/protocol';

import {
  State,
} from './records';

/*
 * Connection manager
 */

export default class ManygolfSocketManager extends SocketManager {
  store: Store;

  constructor(wss, store: Store) {
    super(wss);
    this.store = store;
  }

  onConnect(id: number) {
    const color = randomColor();
    const name = nameGen();

    this.store.dispatch({
      type: 'playerConnected',
      id,
      color,
      name,
    });

    const state: State = this.store.getState();

    this.sendTo(id, messageInitial({
      self: {
        id,
        color,
        name,
      },

      players: state.players.map((player, id) => {
        return {
          id,
          color: player.color,
          name: player.name,
        };
      }).toList().toJS(),

      level: state.levelData,
      expTime: state.expTime,
    }));

    this.sendAll(messagePlayerConnected({
      id,
      color,
      name,
    }));

    this.sendAll(messageDisplayMessage({
      messageText: `${name} connected`,
    }));
  }

  onDisconnect(id) {
    const state: State = this.store.getState();

    const name = state.players.get(id).name;

    this.store.dispatch({
      type: 'playerDisconnected',
      id,
    });

    this.sendAll({
      type: TYPE_PLAYER_DISCONNECTED,
      data: {
        id,
      }
    });

    this.sendAll(messageDisplayMessage({
      messageText: `${name} left`,
    }));
  }

  onMessage(id, msg) {
    if (msg.type === TYPE_SWING) {
      this.store.dispatch(Object.assign({
        type: 'swing',
        id,
      }, msg.data));

    } else {
      console.error(`unrecognized message type ${msg.type}`);
    }
  }
}
