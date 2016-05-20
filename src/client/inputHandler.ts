import { Dispatch } from 'redux';

import {keysDown} from './util/inputter';
import keyCodes from './util/keyCodes';
import {calcVectorDegrees} from './util/math';
import ws from './ws';

import { State } from './records';
import {
  messageSwing,
  messageEnterGame,
  messageSendChat,
} from '../universal/protocol';

import {
  AimDirection,
  RoundState,
  Emoticon,
} from '../universal/constants';

import {
  buttonsDown,
  ControlButton,
} from './controlBar';

export default function inputHandler(dt: number, state: State, dispatch: Dispatch) {
  if (state.isObserver) {
    if (keysDown.has(keyCodes.SPACE) || buttonsDown.has(ControlButton.Shoot)) {
      dispatch({
        type: 'leaveObserver',
      });

      ws.send(messageEnterGame());

      // HACK: To prevent shoot action from being taken next frame, we remove the key here
      keysDown.delete(keyCodes.SPACE);
      buttonsDown.delete(ControlButton.Shoot);
    }

    return;
  }

  if (buttonsDown.has(ControlButton.ChatHappy)) {
    ws.send(messageSendChat({
      emoticon: Emoticon.happy,
    }));

    buttonsDown.delete(ControlButton.ChatHappy);
  }

  if (buttonsDown.has(ControlButton.ChatSad)) {
    ws.send(messageSendChat({
      emoticon: Emoticon.sad,
    }));

    buttonsDown.delete(ControlButton.ChatSad);
  }

  if (!state.round || state.round.roundState === RoundState.over) {
    // ignore input
    return;
  }

  if (state.round.allowHit && !state.round.scored) {
    if (keysDown.has(keyCodes.A) || keysDown.has(keyCodes.LEFT_ARROW) ||
        buttonsDown.has(ControlButton.LeftArrow)) {
      dispatch({
        type: 'updateAim',
        dt,
        direction: AimDirection.left,
      });
    }
    if (keysDown.has(keyCodes.D) || keysDown.has(keyCodes.RIGHT_ARROW) ||
        buttonsDown.has(ControlButton.RightArrow)) {
      dispatch({
        type: 'updateAim',
        dt,
        direction: AimDirection.right,
      });
    }

    if (state.round.inSwing) {
      if (keysDown.has(keyCodes.SPACE) || buttonsDown.has(ControlButton.Shoot)) {
        dispatch({
          type: 'continueSwing',
          dt,
        });
      } else {
        const vec = calcVectorDegrees(state.round.swingPower, state.round.aimDirection);

        dispatch({
          type: 'endSwing',
          vec,
        });

        ws.send(messageSwing({
          vec,
        }));
      }
    } else if (keysDown.has(keyCodes.SPACE) || buttonsDown.has(ControlButton.Shoot)) {
      dispatch({
        type: 'beginSwing',
      });
    }
  }
}
