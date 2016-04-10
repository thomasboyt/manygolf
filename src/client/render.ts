import {
  WIDTH,
  HEIGHT,
  MAX_POWER,
  STATE_CONNECTING,
  STATE_IN_GAME,
  STATE_DISCONNECTED,
  // HOLE_WIDTH,
  // HOLE_HEIGHT,
} from '../universal/constants';

import {
  State,
} from './records';

import {calcVectorDegrees} from './util/math';

const skyColor = 'beige';
const groundColor = 'orange';
const ballColor = 'red';
const meterBoxColor = 'skyblue';
const meterFillColor = 'blue';

function renderConnecting(ctx: CanvasRenderingContext2D, state: State) {
  ctx.fillStyle = 'black';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Connecting...', WIDTH / 2, HEIGHT / 2);
}

function renderDisconnected(ctx: CanvasRenderingContext2D, state: State) {
  ctx.fillStyle = 'black';
  ctx.font = '16px sans-serif';
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
  // Draw ball
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

    ctx.fillStyle = meterBoxColor;
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

    const fillWidth = (state.swingPower / MAX_POWER) * meterWidth;

    ctx.fillStyle = meterFillColor;
    ctx.fillRect(meterX, meterY, fillWidth, meterHeight);
  }

  //
  // Draw ghost balls
  //
  state.ghostBalls.forEach((ball) => {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 2.5, 0, 2 * Math.PI);
    ctx.strokeStyle = 'black';
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
  });

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
  ctx.font = 'normal 16px "Press Start 2P"';

  // Stroke count
  ctx.textAlign = 'left';
  ctx.fillText(`Stroke ${state.strokes}`, 10, 20);
  ctx.fillText(`Players ${state.ghostBalls.size}`, 10, 40);

  // Timer
  const expTime = state.expTime;
  const remainingMs = Math.ceil((expTime - Date.now()) / 1000);

  if (state.scored) {
    ctx.textAlign = 'center';
    ctx.fillText(`${state.goalText.toUpperCase()}!!`, WIDTH / 2, HEIGHT / 2);
  }

  ctx.textAlign = 'right';
  ctx.fillText(remainingMs + '', WIDTH - 10, 20);

  // Messages
  if (state.displayMessage) {
    ctx.font = 'normal 8px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText(state.displayMessage, 10, HEIGHT - 10)
  }
}

export default function render(ctx: CanvasRenderingContext2D, state: State) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  ctx.save();

  ctx.fillStyle = skyColor;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (state.state === STATE_CONNECTING) {
    renderConnecting(ctx, state);
  } else if (state.state === STATE_IN_GAME) {
    renderInGame(ctx, state);
  } else if (state.state === STATE_DISCONNECTED) {
    renderDisconnected(ctx, state);
  } else {
    throw new Error(`Unrecognized state ${state.state}`);
  }

  ctx.restore();
}
