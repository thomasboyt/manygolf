import {Store} from 'redux';

import SocketManager from './util/SocketManager';

import WebSocket from 'uws';
import p2 from 'p2';
import url from 'url';

import {
  messagePlayerConnected,
  messagePlayerDisconnected,
  messageDisplayMessage,
  MessageSwing,
  messagePlayerSwing,
  messageChat,
  TYPE_SWING,
  TYPE_ENTER_GAME,
  TYPE_SEND_CHAT,
  TYPE_REQUEST_PAUSE_STREAM,
  TYPE_REQUEST_RESUME_STREAM,
} from '../universal/protocol';

import {
  State,
  Player,
} from './records';

import {createInitial} from './messages';
import {
  getUserByAuthToken,
  createUser,
} from './models';

/*
 * Connection manager
 */

export default class ManygolfSocketManager extends SocketManager {
  store: Store<State>;

  constructor(wss: WebSocket.Server, store: Store<State>) {
    super(wss);
    this.store = store;
  }

  async onConnect(id: number, ws: WebSocket) {
    const location = url.parse(ws.upgradeReq.url, true);

    let authToken = location.query.auth_token;

    let user;
    if (authToken) {
      user = await getUserByAuthToken(authToken);
    } else {
      user = await createUser();
    }

    // XXX: lol
    let isObserver = false;
    if (location.query.observe) {
      isObserver = true;
    }

    this.store.dispatch({
      type: 'playerConnected',
      id,
      color: user.color,
      name: user.name,
      isObserver,
    });

    const state = this.store.getState();
    this.sendTo(id, createInitial(state, id, user.authToken));

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

    } else if (msg.type === TYPE_REQUEST_PAUSE_STREAM) {
      this.pause(id);

    } else if (msg.type === TYPE_REQUEST_RESUME_STREAM) {
      this.resume(id);

      const state = this.store.getState();
      this.sendTo(id, createInitial(state, id));

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
