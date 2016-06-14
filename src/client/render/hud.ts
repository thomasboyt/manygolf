import tinycolor from 'tinycolor2';

import {
  WIDTH,
  HEIGHT,
  HURRY_UP_MS,
  RoundState,
} from '../../universal/constants';

import {
  State,
} from '../records';

const textColor = 'white';
const hurryUpTimerColor = 'red';

export function renderMessages(ctx: CanvasRenderingContext2D, state: State, scaleFactor: number) {
  // Messages
  if (state.displayMessage) {
    ctx.fillStyle = textColor;
    ctx.font = 'normal 8px "Press Start 2P"';
    ctx.textAlign = 'left';

    const colorStart = state.displayMessage.indexOf('{{');
    const colorEnd = state.displayMessage.indexOf('}}');

    const x = 10;
    const y = Math.round(HEIGHT - (55 / scaleFactor));

    if (colorStart !== -1) {
      const before = state.displayMessage.slice(0, colorStart);
      const colorized = state.displayMessage.slice(colorStart + 2, colorEnd);
      const after = state.displayMessage.slice(colorEnd + 2);

      ctx.fillStyle = textColor;
      ctx.fillText(before, x, y);

      ctx.fillStyle = state.displayMessageColor;

      if (tinycolor(state.displayMessageColor).isDark()) {
        ctx.strokeText(colorized, x + ctx.measureText(before).width, y);
      }

      ctx.fillText(colorized, x + ctx.measureText(before).width, y);

      ctx.fillStyle = textColor;
      ctx.fillText(after, x + ctx.measureText(before + colorized).width, y);

    } else {
      ctx.fillText(state.displayMessage, x, y);
    }
  }
}

export function renderHud(ctx: CanvasRenderingContext2D, state: State) {
  ctx.fillStyle = textColor;
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 2;

  ctx.font = 'normal 16px "Press Start 2P"';

  // Stroke count

  if (!state.isObserver) {
    ctx.textAlign = 'left';
    ctx.fillText(`Strokes ${state.round.strokes}`, 10, 20);
  } else {
    ctx.fillText('Spectating', 10, 20);
    ctx.font = 'normal 8px "Press Start 2P"';
    ctx.fillText('Press [shoot] to join', 10, 33);
  }

  ctx.font = 'normal 8px "Press Start 2P"';
  ctx.textAlign = 'right';

  const playerCount = state.players.size;
  ctx.fillText(`${playerCount} players connected`, WIDTH - 10, 11);

  if (!state.isObserver) {
    ctx.fillStyle = state.color;

    if (tinycolor(state.color).isDark()) {
      ctx.strokeText(state.name, WIDTH - 10, 20);
    }

    ctx.fillText(state.name, WIDTH - 10, 20);

    ctx.fillStyle = textColor;
    ctx.fillText('You are ', WIDTH - 10 - ctx.measureText(state.name).width, 20);
  }

  ctx.font = 'normal 16px "Press Start 2P"';

  if (state.round.roundState !== RoundState.over) {
    // Timer
    const expTime = state.round.expTime;
    const remainingMs = expTime - Date.now();

    if (remainingMs < HURRY_UP_MS) {
      ctx.fillStyle = hurryUpTimerColor;
    }

    let remainingSec = Math.ceil(remainingMs / 1000);

    // prevent seconds from going into negatives (possible due to server lag on roundOver message)
    if (remainingSec < 0) {
      remainingSec = 0;
    }

    ctx.textAlign = 'center';
    ctx.fillText(remainingSec + '', WIDTH / 2, 20);

    ctx.fillStyle = textColor;

    // Show goalText when you score
    if (state.round.scored) {
      ctx.textAlign = 'center';
      ctx.fillText(`${state.round.goalText.toUpperCase()}!!`, WIDTH / 2, HEIGHT / 2);
    }
  }

}