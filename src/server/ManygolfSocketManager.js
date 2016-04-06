import SocketManager from './util/SocketManager';

import {
  TYPE_INITIAL,
  TYPE_PLAYER_CONNECTED,
  TYPE_PLAYER_DISCONNECTED,
  TYPE_SWING,
} from '../universal/protocol';

/*
 * Connection manager
 */

export default class ManygolfSocketManager extends SocketManager {
  constructor(wss, store) {
    super(wss);
    this.store = store;
  }

  onConnect(id) {
    this.store.dispatch({
      type: 'playerConnected',
      id,
    });

    const state = this.store.getState();

    const color = state.getIn(['players', id, 'color']);

    this.sendTo(id, {
      type: TYPE_INITIAL,
      data: {
        id,
        color,

        players: state.players.map((player, id) => {
          return {
            id,
            color: player.color,
          };
        }).toList().toJS(),

        level: state.levelData,
        expTime: state.expTime,
      },
    });

    this.sendAll({
      type: TYPE_PLAYER_CONNECTED,
      data: {
        id,
        color,
      }
    });
  }

  onDisconnect(id) {
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
  }

  onMessage(id, msg) {
    if (msg.type === TYPE_SWING) {
      this.store.dispatch({
        type: 'swing',
        id,
        ...msg.data,
      });

    } else {
      console.error(`unrecognized message type ${msg.type}`);
    }
  }
}
