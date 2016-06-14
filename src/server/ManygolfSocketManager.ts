import {Store} from 'redux';
import randomColor from 'randomcolor';

import SocketManager from './util/SocketManager';
import nameGen from './nameGen';

import WebSocket from 'ws';
import p2 from 'p2';

import {
  messageInitial,
  messagePlayerConnected,
  messagePlayerDisconnected,
  messageDisplayMessage,
  MessageSwing,
  messagePlayerSwing,
  messageChat,
  TYPE_SWING,
  TYPE_ENTER_GAME,
  TYPE_SEND_CHAT,
} from '../universal/protocol';

import {
  State,
  Player,
} from './records';

/*
 * Connection manager
 */

export default class ManygolfSocketManager extends SocketManager {
  store: Store<State>;

  constructor(wss: WebSocket.Server, store: Store<State>) {
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

    const state = this.store.getState();

    this.sendTo(id, messageInitial({
      gameState: state.gameState,

      self: {
        id,
        color,
        name,
      },

      isObserver,

      leaderId: state.leaderId,

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

      time: state.time,
    }));

    if (!isObserver) {
      const player = state.players.get(id);
      this.playerJoined(player);
    }
  }

  onDisconnect(id: number) {
    const state = this.store.getState();

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
    const prevState = this.store.getState();

    if (msg.type === TYPE_SWING) {
      const data = <MessageSwing>msg.data;

      let state = this.store.getState();
      let player = state.players.get(id);

      // Player could be an observer
      if (!player) {
        return;
      }

      if (player.body.sleepState !== p2.Body.SLEEPING || player.scored) {
        return;
      }

      this.store.dispatch(Object.assign({
        type: 'swing',
        id,
      }, data));

      state = this.store.getState();
      player = state.players.get(id);

      this.sendAll(messagePlayerSwing({
        id,
        position: [player.body.position[0], player.body.position[1]],
        velocity: [data.vec.x, data.vec.y],
        time: Date.now(),
      }));

    } else if (msg.type === TYPE_ENTER_GAME) {
      if (!prevState.observers.get(id)) {
        return;
      }

      this.store.dispatch({
        type: 'enterGame',
        id,
      });

      const state = this.store.getState();
      const player = state.players.get(id);

      this.playerJoined(player);

    } else if (msg.type === TYPE_SEND_CHAT) {
      const state = this.store.getState();
      const player = state.players.get(id);

      // Player could be an observer
      if (!player) {
        return;
      }

      this.sendAll(messageChat({
        id,
        emoticon: msg.data.emoticon,
      }));

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
