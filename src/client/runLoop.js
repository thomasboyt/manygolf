import {keysDown} from './inputter';
import RunLoop from '../universal/RunLoop';

class ClientRunLoop extends RunLoop {
  getTickPayload() {
    return {
      keysDown: new Set(keysDown),  // create new copy of set
    };
  }
}

export default ClientRunLoop;
