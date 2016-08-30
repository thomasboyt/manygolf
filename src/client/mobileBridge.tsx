import {Store} from 'redux';
import {State} from './records';

import {
  ConnectionState,
} from '../universal/constants';

enum Device {
  iOS,
  Android,
  Steam,
}

class MobileBridge {
  device: Device = null;
  store: Store<State>;

  initialize(store: Store<State>) {
    this.store = store;

    // Methods exposed as globals
    (window as any).mobileBridge = {
      enable: this.enable.bind(this),
      reconnectIfDisconnected: this.reconnectIfDisconnected.bind(this),
    };
  }

  isNative() {
    return this.device !== null;
  }

  displayNativeShare() {
    this.sendMessage({
      type: 'displayShareInterface',
    });
  }

  sendSteamPlayerConnected(playerId: number, steamId: string) {
    this.sendMessage({
      type: 'steamPlayerConnected',
      playerId,
      steamId,
    });
  }

  /*
   * Globally-injected methods
   */

  enable(device: string) {
    if (device === 'ios') {
      this.device = Device.iOS;
    } else if (device === 'android') {
      this.device = Device.Android;
    } else if (device === 'steam') {
      this.device = Device.Steam;
      this.initializeElectronIPC();
    } else {
      throw new Error('Unrecognized device');
    }
  }

  reconnectIfDisconnected() {
    const state = this.store.getState();

    if (state.connectionState === ConnectionState.disconnected) {
      document.location.reload();
    }
  }

  private sendMessage(message: Object) {
    const messageStr = JSON.stringify(message);

    if (this.device === Device.iOS) {
      try {
        (window as any).webkit.messageHandlers.callbackHandler.postMessage(messageStr);
      } catch(err) {
        console.error(`Error sending message to iOS: ${err}`);
      }
    } else if (this.device === Device.Android) {
      try {
        (window as any).Android.postMessage(messageStr);
      } catch(err) {
        console.error(`Error sending message to Android: ${err}`);
      }
    } else if (this.device === Device.Steam) {
      (window as any).ipcRenderer.sendToHost('', message);
    }
  }

  private initializeElectronIPC() {
    (window as any).ipcRenderer.on('message', (evt: any, message: any) => {
      this.handleMessage(message);
    });
  }

  private handleMessage(message: any) {
    if (message.type === 'showSteamFriend') {
      this.showSteamFriend(message.playerId, message.name);
    } else if (message.type === 'registerSteam') {
      this.registerSteamSelf(message.ticket);
    }
  }

  private registerSteamSelf(ticket: string) {
    console.log('registering steam auth ticket', ticket);
  }

  private showSteamFriend(playerId: number, name: string) {
    console.log('displaying steam friend', name);
  }
}

const mobileBridge = new MobileBridge();

export default mobileBridge;