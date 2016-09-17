import {Store} from 'redux';

import ManygolfSocket from './util/ManygolfSocket';

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
  PlayerState,
} from '../universal/constants';

import {
  State,
  Player,
} from './records';

import {
  createInitial,
  createIdentity,
} from './messages';

import {
  getUserByAuthToken,
  getUserByUserId,
  createUser,
  User,
} from './models';


/**
 * TODO: This thing's huge! It may be worth breaking the logic of the connect and message
 * handlers down into something smaller and easier to manage.
 */
export default class ManygolfSocketManager {
  store: Store<State>;

  // maps player ID -> socket
  private sockets: Map<number, ManygolfSocket> = new Map();

  private pausedSockets: Set<number> = new Set();

  constructor(wss: WebSocket.Server, store: Store<State>) {
    wss.on('connection', (ws) => this.onConnect(ws));
    this.store = store;
  }

  pause(id: number) {
    this.pausedSockets.add(id);
  }

  resume(id: number) {
    this.pausedSockets.delete(id);
  }

  closeSocket(socketId: number, didReplace?: boolean) {
    const socket = this.sockets.get(socketId);
    if (didReplace) {
      socket.replace();
    } else {
      socket.close();
    }
  }

  sendTo(id: number, msg: Object) {
    if (this.pausedSockets.has(id)) {
      return;
    }

    const msgStr = JSON.stringify(msg);

    return this.sockets.get(id).send(msgStr, (err) => {
      if (err) {
        console.log(`error sending to ${id}`, err);
      }
    });
  }

  sendAll(msg: Object) {
    const msgStr = JSON.stringify(msg);

    this.sockets.forEach((socket, id) => {
      if (this.pausedSockets.has(id)) {
        return;
      }

      socket.send(msgStr, (err) => {
        if (err) {
          console.log(`error sending to ${id}`, err);
        }
      });
    });
  }

  private async getUser(ws: WebSocket): Promise<User> {
    const location = url.parse(ws.upgradeReq.url, true);

    let authToken = location.query.auth_token;

    let user;
    if (authToken) {
      user = await getUserByAuthToken(authToken);
    } else {
      user = await createUser();
    }

    return user;
  }

  private async onConnect(ws: WebSocket) {
    const location = url.parse(ws.upgradeReq.url, true);

    const user = await this.getUser(ws);

    // user already had a connection
    // set new socket IDs, send initial message, otherwise stays the same
    const wasConnected = this.sockets.has(user.id);

    if (wasConnected) {
      // close previous socket before creating new one
      this.closeSocket(user.id, true);
    }

    // ensure socket is unpaused if it was left in a paused state
    if (this.pausedSockets.has(user.id)) {
      this.pausedSockets.delete(user.id);
    }

    const socket = new ManygolfSocket(ws);

    socket.onMessage = (msg) => this.onMessage(user.id, msg);
    socket.onDisconnect = () => this.onDisconnect(user.id);

    this.sockets.set(user.id, socket);

    // XXX: lol
    let isObserver = false;
    if (location.query.observe) {
      isObserver = true;
    }

    this.sendTo(user.id, createIdentity(user));

    // if the user is already in the players map, they're rejoining
    const rejoining = this.store.getState().players.has(user.id);

    if (!wasConnected && !isObserver) {
      this.store.dispatch({
        type: 'playerJoined',
        id: user.id,
        color: user.color,
        name: user.name,
      });
    }

    const state = this.store.getState();
    this.sendTo(user.id, createInitial(state, user.id));

    if (!isObserver && !wasConnected) {
      const player = state.players.get(user.id);
      this.playerJoined(player, rejoining);
    }
  }

  private async onMessage(id: number, msg: any) {
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
      const rejoining = this.store.getState().players.has(id);

      if (rejoining && prevState.players.get(id).state === PlayerState.active) {
        return;
      }

      if (rejoining) {
        this.store.dispatch({
          type: 'playerJoined',
          id,
        });

      } else {
        // If this user is not loaded into memory already, we need to re-query for their data

        const user = await getUserByUserId(id);

        this.store.dispatch({
          type: 'playerJoined',
          id,
          color: user.color,
          name: user.name,
        });
      }

      const state = this.store.getState();
      const player = state.players.get(id);

      this.playerJoined(player, rejoining);

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

  private onDisconnect(id: number) {
    this.sockets.delete(id);

    const state = this.store.getState();

    const player = state.players.get(id);

    if (player) {
      if (player.state === PlayerState.active) {
        this.store.dispatch({
          type: 'playerLeft',
          id,
        });
      }

      this.sendAll(messagePlayerDisconnected({
        id,
      }));

      this.sendAll(messageDisplayMessage({
        messageText: `{{${player.name}}} disconnected`,
        color: player.color,
      }));
    }
  }

  private playerJoined(player: Player, didRejoin: boolean) {
    const {id, color, name} = player;

    this.sendAll(messagePlayerConnected({
      id,
      color,
      name,
    }));

    this.sendAll(messageDisplayMessage({
      messageText: `{{${name}}} ${didRejoin ? 'rejoined' : 'joined'}`,
      color,
    }));
  }

}
