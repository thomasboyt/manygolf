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
  MessageSwing,
  messagePlayerSwing,
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
      },

      isObserver,

      players: state.players.map((player, id) => {
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
        };
      }).toArray(),

      level: state.levelData,
      expiresIn: state.expTime - Date.now(),
    }));

    if (!isObserver) {
      const player = state.players.get(id);
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

    if (player) {
      this.sendAll(messagePlayerDisconnected({
        id,
      }));

      this.sendAll(messageDisplayMessage({
        messageText: `{{${player.name}}} left`,
        color: player.color,
      }));
    }
  }

  onMessage(id: number, msg: any) {
    const prevState = <State>this.store.getState();

    if (msg.type === TYPE_SWING) {
      const data = <MessageSwing>msg.data;

      this.store.dispatch(Object.assign({
        type: 'swing',
        id,
      }, data));

      this.sendAll(messagePlayerSwing({
        id,
        velocity: [data.vec.x, data.vec.y],
      }));

    } else if (msg.type === TYPE_ENTER_GAME) {
      if (!prevState.observers.get(id)) {
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
