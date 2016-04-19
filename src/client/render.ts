import {
  WIDTH,
  HEIGHT,
  MIN_POWER,
  MAX_POWER,
  HURRY_UP_MS,
  RoundState,
  ConnectionState,
} from '../universal/constants';

import {
  State,
} from './records';

import tinycolor from 'tinycolor2';

import {calcVectorDegrees} from './util/math';
import toOrdinal from './util/toOrdinal';

const skyColor = 'rgb(0, 0, 40)';
const groundColor = 'black';

const ballColor = 'white';

const textColor = 'white';
const hurryUpTimerColor = 'red';

const meterBoxBorderColor = 'yellow';
const meterBoxColor = 'black';
const meterFillColor = 'yellow';

const debugRender = document.location.search.indexOf('debugRender') !== -1;

function renderConnecting(ctx: CanvasRenderingContext2D, state: State) {
  ctx.fillStyle = textColor;
  ctx.font = 'normal 16px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('Connecting...', WIDTH / 2, HEIGHT / 2);
}

function renderDisconnected(ctx: CanvasRenderingContext2D, state: State) {
  ctx.fillStyle = textColor;
  ctx.font = 'normal 16px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('Disconnected! Try reloading?', WIDTH / 2, HEIGHT / 2);
}

function renderGround(ctx: CanvasRenderingContext2D, state: State) {
  const level = state.round.level;

  const points = level.points;

  ctx.fillStyle = groundColor;

  ctx.beginPath();
  const firstPoint = points.get(0);
  ctx.moveTo(firstPoint.get(0), firstPoint.get(1));

  points.slice(1).forEach((point) => {
    ctx.lineTo(point.get(0), point.get(1));
  });

  // draw a complete shape so fill works
  // add padding so the outline stroke doesn't show up
  const groundLineWidth = 3;
  ctx.lineTo(WIDTH + groundLineWidth, points.last().get(1));
  ctx.lineTo(WIDTH + groundLineWidth, HEIGHT + groundLineWidth);
  ctx.lineTo(-groundLineWidth, HEIGHT + groundLineWidth);
  ctx.lineTo(-groundLineWidth, points.get(0).get(1));

  ctx.lineWidth = groundLineWidth;
  ctx.strokeStyle = state.round.level.color;
  ctx.stroke();
  ctx.fill();
  ctx.closePath();
}

function renderBalls(ctx: CanvasRenderingContext2D, state: State) {
  // ball border width
  ctx.lineWidth = 1;

  //
  // Draw ghost balls
  //
  state.players.forEach((ball) => {
    // Don't render ghost for the current player
    if (ball.id === state.id && !debugRender) {
      return ball;
    }

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 2.5, 0, 2 * Math.PI);
    ctx.strokeStyle = textColor;
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
  });

  if (state.isObserver) {
    return;
  }

  //
  // Draw player ball
  //
  const ballPos = state.round.ball.body.interpolatedPosition;

  ctx.beginPath();
  ctx.arc(ballPos[0], ballPos[1], 2.5, 0, 2 * Math.PI);
  ctx.fillStyle = ballColor;
  ctx.strokeStyle = ballColor; // add stroke so it's the same size as the ghosts
  ctx.fill();
  ctx.stroke();
  ctx.closePath();

  //
  // Draw aim arrow
  //
  if (state.round.allowHit && !state.round.scored) {
    const aimDirection = state.round.aimDirection;

    const offset = 10;
    const lineLength = 20;
    const startOffset = calcVectorDegrees(offset, aimDirection);
    const endOffset = calcVectorDegrees(offset + lineLength, aimDirection);

    ctx.beginPath();
    ctx.strokeStyle = textColor;
    ctx.moveTo(ballPos[0] + startOffset.x, ballPos[1] + startOffset.y);
    ctx.lineTo(ballPos[0] + endOffset.x, ballPos[1] + endOffset.y);
    ctx.stroke();
    ctx.closePath();
  }

  //
  // Draw swing meter
  //
  if (state.round.inSwing) {
    const meterWidth = 50;
    const meterHeight = 10;
    const meterX = ballPos[0] - meterWidth / 2;
    const meterY = ballPos[1] + 10;

    ctx.strokeStyle = meterBoxBorderColor;
    ctx.fillStyle = meterBoxColor;
    ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

    const fillWidth = ((state.round.swingPower - MIN_POWER) / (MAX_POWER - MIN_POWER)) * meterWidth;

    ctx.fillStyle = meterFillColor;
    ctx.fillRect(meterX, meterY, fillWidth, meterHeight);
  }
}

function renderInGame(ctx: CanvasRenderingContext2D, state: State) {
  renderGround(ctx, state);
  renderBalls(ctx, state);

  //
  // Draw UI
  //
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

  if (state.round.roundState === RoundState.over) {
    const x = WIDTH / 2;
    const y = HEIGHT / 2;

    ctx.textAlign = 'center';

    // Show leaderboard

    if (state.round.roundRankedPlayers === null) {
      // player connected late and missed the roundOver message, display placeholder
      ctx.fillText('Waiting for next round....', x, y);

    } else if (state.round.roundRankedPlayers.size === 0 ) {
      // no one finished
      ctx.fillText('No one wins!', x, y);

    } else {
      const winner = state.round.roundRankedPlayers.get(0);

      ctx.fillStyle = winner.color;

      if (tinycolor(winner.color).isDark()) {
        ctx.strokeText(winner.name, x, y - 10);
      }

      ctx.fillText(winner.name, x, y - 10);

      ctx.fillStyle = textColor;
      ctx.fillText(' wins!', x, y + 10);

      ctx.font = 'normal 8px "Press Start 2P"';
      const elapsed = (winner.scoreTime / 1000).toFixed(2);
      const strokeLabel = winner.strokes === 1 ? 'stroke' : 'strokes';
      ctx.fillText(`(${winner.strokes} ${strokeLabel} in ${elapsed}s)`, x, y + 22);

      if (winner.id !== state.id && state.round.scored) {
        const position = state.round.roundRankedPlayers.findIndex((player) => player.id === state.id) + 1;
        ctx.fillText(`You placed ${toOrdinal(position)}`, x, y + 36);
      }
    }

  } else {
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

  // Messages
  if (state.displayMessage) {
    ctx.fillStyle = textColor;
    ctx.font = 'normal 8px "Press Start 2P"';
    ctx.textAlign = 'left';

    const colorStart = state.displayMessage.indexOf('{{');
    const colorEnd = state.displayMessage.indexOf('}}');

    const x = 10;
    const y = HEIGHT - 10;

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

export default function render(ctx: CanvasRenderingContext2D, state: State) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  ctx.save();

  ctx.fillStyle = skyColor;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (state.connectionState === ConnectionState.connecting) {
    renderConnecting(ctx, state);
  } else if (state.connectionState === ConnectionState.connected) {
    renderInGame(ctx, state);
  } else if (state.connectionState === ConnectionState.disconnected) {
    renderDisconnected(ctx, state);
  }

  ctx.restore();
}
