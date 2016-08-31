import {Store} from 'redux';
import {State} from './records';

import {
  ConnectionState,
} from '../universal/constants';

enum Device {
  iOS,
  Android,
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

  /*
   * Globally-injected methods
   */

  enable(device: string) {
    if (device === 'ios') {
      this.device = Device.iOS;
    } else if (device === 'android') {
      this.device = Device.Android;
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
    }
  }

}

const mobileBridge = new MobileBridge();

export default mobileBridge;