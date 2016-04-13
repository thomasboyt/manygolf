import {
  WIDTH,
  HEIGHT,
  MIN_POWER,
  MAX_POWER,
  RoundState,
  ConnectionState,
  // HOLE_WIDTH,
  // HOLE_HEIGHT,
} from '../universal/constants';

import {
  State,
} from './records';

import {calcVectorDegrees} from './util/math';

const skyColor = 'skyblue';
const groundColor = 'rgb(0, 170, 0)';
const ballColor = 'red';
const meterBoxBorderColor = 'black';
const meterBoxColor = 'white';
const meterFillColor = 'blue';

const debugRender = document.location.search.indexOf('debugRender') !== -1;

function renderConnecting(ctx: CanvasRenderingContext2D, state: State) {
  ctx.fillStyle = 'black';
  ctx.font = 'normal 16px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('Connecting...', WIDTH / 2, HEIGHT / 2);
}

function renderDisconnected(ctx: CanvasRenderingContext2D, state: State) {
  ctx.fillStyle = 'black';
  ctx.font = 'normal 16px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('Disconnected! Try reloading?', WIDTH / 2, HEIGHT / 2);
}

function renderInGame(ctx: CanvasRenderingContext2D, state: State) {
  //
  // Draw ground
  //
  const level = state.level;

  const points = level.points;

  ctx.fillStyle = groundColor;

  ctx.beginPath();
  const firstPoint = points.get(0);
  ctx.moveTo(firstPoint.get(0), firstPoint.get(1));

  points.slice(1).forEach((point) => {
    ctx.lineTo(point.get(0), point.get(1));
  });

  ctx.lineTo(WIDTH, HEIGHT);
  ctx.lineTo(0, HEIGHT);

  ctx.fill();
  ctx.closePath();

  //
  // Draw ghost balls
  //
  state.ghostBalls.forEach((ball) => {
    // Don't render ghost for the current player
    if (ball.id === state.id && !debugRender) {
      return ball;
    }

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 2.5, 0, 2 * Math.PI);
    ctx.strokeStyle = 'black';
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
  });

  //
  // Draw player ball
  //
  const ballPos = state.ball.body.interpolatedPosition;

  ctx.beginPath();
  ctx.arc(ballPos[0], ballPos[1], 2.5, 0, 2 * Math.PI);
  ctx.fillStyle = ballColor;
  ctx.fill();
  ctx.closePath();

  //
  // Draw aim arrow
  //
  if (state.allowHit && !state.scored) {
    const aimDirection = state.aimDirection;

    const offset = 10;
    const lineLength = 20;
    const startOffset = calcVectorDegrees(offset, aimDirection);
    const endOffset = calcVectorDegrees(offset + lineLength, aimDirection);

    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.moveTo(ballPos[0] + startOffset.x, ballPos[1] + startOffset.y);
    ctx.lineTo(ballPos[0] + endOffset.x, ballPos[1] + endOffset.y);
    ctx.stroke();
    ctx.closePath();
  }

  //
  // Draw swing meter
  //
  if (state.inSwing) {
    const meterWidth = 50;
    const meterHeight = 10;
    const meterX = ballPos[0] - meterWidth / 2;
    const meterY = ballPos[1] + 10;

    ctx.strokeStyle = meterBoxBorderColor;
    ctx.fillStyle = meterBoxColor;
    ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

    const fillWidth = ((state.swingPower - MIN_POWER) / (MAX_POWER - MIN_POWER)) * meterWidth;

    ctx.fillStyle = meterFillColor;
    ctx.fillRect(meterX, meterY, fillWidth, meterHeight);
  }

  // Hole (debug)
  // ctx.fillStyle = 'red';
  // ctx.fillRect(
  //   state.holeSensor.interpolatedPosition[0] - (HOLE_WIDTH / 2),
  //   state.holeSensor.interpolatedPosition[1] - (HOLE_HEIGHT / 2),
  //   10,
  //   10
  // );

  //
  // Draw UI
  //
  ctx.fillStyle = 'black';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;

  ctx.font = 'normal 16px "Press Start 2P"';

  // Stroke count
  ctx.textAlign = 'left';
  ctx.fillText(`Strokes ${state.strokes}`, 10, 20);

  ctx.font = 'normal 8px "Press Start 2P"';
  ctx.textAlign = 'right';

  ctx.fillText(`${state.ghostBalls.size} players connected`, WIDTH - 10, 11);

  ctx.fillStyle = state.color;
  ctx.strokeText(state.name, WIDTH - 10, 20);
  ctx.fillText(state.name, WIDTH - 10, 20);

  ctx.fillStyle = 'black';
  ctx.fillText('You are ', WIDTH - 10 - ctx.measureText(state.name).width, 20);

  ctx.font = 'normal 16px "Press Start 2P"';

  if (state.roundState === RoundState.over) {
    const x = WIDTH / 2;
    const y = HEIGHT / 2;

    ctx.textAlign = 'center';

    // Show winner text
    if (state.winnerId !== null) {
      const winner = state.ghostBalls.get(state.winnerId);

      ctx.fillStyle = winner.color;

      ctx.strokeText(winner.name, x, y - 10);
      ctx.fillText(winner.name, x, y - 10);

      ctx.fillStyle = 'black';
      ctx.fillText(' wins!', x, y + 10);

    } else {
      ctx.fillText('No one wins!', x, y);
    }

  } else {
    // Timer
    const expTime = state.expTime;
    const remainingMs = Math.ceil((expTime - Date.now()) / 1000);

    ctx.textAlign = 'center';
    ctx.fillText(remainingMs + '', WIDTH / 2, 20);

    // Show goalText when you score
    if (state.scored) {
      ctx.textAlign = 'center';
      ctx.fillText(`${state.goalText.toUpperCase()}!!`, WIDTH / 2, HEIGHT / 2);
    }
  }

  // Messages
  if (state.displayMessage) {
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

      ctx.fillStyle = 'black';
      ctx.fillText(before, x, y);

      ctx.fillStyle = state.displayMessageColor;
      ctx.strokeText(colorized, x + ctx.measureText(before).width, y);
      ctx.fillText(colorized, x + ctx.measureText(before).width, y);

      ctx.fillStyle = 'black';
      ctx.fillText(after, x + ctx.measureText(before + colorized).width, y);

    } else {
      ctx.fillText(state.displayMessage, x, y)
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
