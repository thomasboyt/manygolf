import { Dispatch } from 'redux';

import {keysDown} from './util/inputter';
import keyCodes from './util/keyCodes';
import {calcVectorDegrees} from './util/math';
import ws from './ws';

import { State } from './records';
import {messageSwing} from '../universal/protocol';
import {
  AimDirection,
  RoundState,
} from '../universal/constants';

export default function inputHandler(dt: number, state: State, dispatch: Dispatch) {
  dt = dt / 1000;

  if (!state.world || state.roundState === RoundState.over) {
    // ignore input
    return;
  }

  if (state.allowHit && !state.scored) {
    if (keysDown.has(keyCodes.A) || keysDown.has(keyCodes.LEFT_ARROW)) {
      dispatch({
        type: 'updateAim',
        dt,
        direction: AimDirection.left,
      });
    }
    if (keysDown.has(keyCodes.D) || keysDown.has(keyCodes.RIGHT_ARROW)) {
      dispatch({
        type: 'updateAim',
        dt,
        direction: AimDirection.right,
      });
    }

    if (state.inSwing) {
      if (keysDown.has(keyCodes.SPACE)) {
        dispatch({
          type: 'continueSwing',
          dt,
        });
      } else {
        const vec = calcVectorDegrees(state.swingPower, state.aimDirection);

        dispatch({
          type: 'endSwing',
          vec,
        });

        ws.send(messageSwing({
          vec,
        }));
      }
    } else if (keysDown.has(keyCodes.SPACE)) {
      dispatch({
        type: 'beginSwing',
      });
    }
  }
}
