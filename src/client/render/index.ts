import {
  WIDTH,
  HEIGHT,
  MIN_POWER,
  MAX_POWER,
  BALL_RADIUS,
  GameState,
  ConnectionState,
  Emoticon,
  PlayerState,
} from '../../universal/constants';

import tinycolor from 'tinycolor2';

import {
  debugRender,
} from '../flags';

import {
  State,
  Level,
} from '../records';

import {calcVectorDegrees} from '../util/math';
import createMemoizedRender from './util/createMemoizedRender';

import renderLeaderBoard from './leaderboard';
import renderMatchEnd from './matchEnd';
import {
  renderMessages,
  renderHud,
} from './hud';

const skyColor = 'rgb(0, 0, 40)';
const groundColor = 'black';

const ballColor = 'white';

const textColor = 'white';

const meterBoxBorderColor = 'yellow';
const meterBoxColor = 'black';
const meterFillColor = 'yellow';

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
  ctx.fillText('You have been disconnected', WIDTH / 2, HEIGHT / 2 - 30);
  ctx.fillText('from the server', WIDTH / 2, HEIGHT / 2 - 10);
  ctx.fillText('Click or tap here to reload', WIDTH / 2, HEIGHT / 2 + 20);
}

function renderEmoticon(ctx: CanvasRenderingContext2D, x: number, y: number, emoticon: Emoticon) {
  ctx.save();

  ctx.strokeStyle = 'white';
  ctx.fillStyle = 'white';

  ctx.beginPath();
  ctx.arc(x + 4, y + 4, 1, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();

  ctx.beginPath();
  ctx.arc(x + 11, y + 4, 1, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();

  if (emoticon === Emoticon.happy) {
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 10);
    ctx.quadraticCurveTo(x + 7.5, y + 15, x + 11, y + 10);
    ctx.fill();
    ctx.closePath();

  } else if (emoticon === Emoticon.sad) {
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 12);
    ctx.quadraticCurveTo(x + 7.5, y + 7, x + 11, y + 12);
    ctx.fill();
    ctx.closePath();

  }

  ctx.restore();
}

function renderChat(ctx: CanvasRenderingContext2D,
  {ballX, ballY, emoticon, onLeft=false}:
  {ballX: number; ballY: number; emoticon: Emoticon; onLeft: boolean}) {

  const flipX = onLeft ? -1 : 1;

  ctx.save();

  ctx.strokeStyle = 'rgba(255, 255, 255, .4)';
  ctx.fillStyle = 'rgba(255, 255, 255, .4)';

  const bubbleW = 15;
  const bubbleH = 15;
  const cornerRadius = 8;

  const x = ballX + (6 * flipX);
  const y = ballY - bubbleH - 10;

  // "Rounded rectangle"
  ctx.save();

  ctx.lineJoin = 'round';
  ctx.lineWidth = cornerRadius;
  ctx.strokeRect(x + ((cornerRadius/2) * flipX), y + cornerRadius/2,
                 (bubbleW - cornerRadius) * flipX, bubbleH - cornerRadius);

  ctx.restore();

  const emoticonX = x + (onLeft ? -bubbleW : 0);
  const emoticonY = y;
  renderEmoticon(ctx, emoticonX, emoticonY, emoticon);

  ctx.moveTo(ballX + (5 * flipX), ballY - 5);
  ctx.quadraticCurveTo(ballX + (8 * flipX), ballY - 10, ballX + (10 * flipX), ballY - 10);
  ctx.lineTo(ballX + (17 * flipX), ballY - 10);
  ctx.quadraticCurveTo(ballX + (10 * flipX), ballY - 5, ballX + (5 * flipX), ballY - 5);
  ctx.fill();

  ctx.restore();
}

const renderGround = createMemoizedRender(
  (ctx: CanvasRenderingContext2D, level: Level, scaleFactor: number) => {
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
  ctx.strokeStyle = level.color;
  ctx.stroke();
  ctx.fill();
  ctx.closePath();
});

function drawCrown(ctx: CanvasRenderingContext2D, ballX: number, ballY: number) {
  ctx.save();

  const bottomY = ballY - 2;
  const topY = bottomY - 6;

  ctx.strokeStyle = 'black';
  ctx.fillStyle = 'yellow';
  ctx.beginPath();
  ctx.moveTo(ballX - 5, bottomY);
  ctx.moveTo(ballX - 5, bottomY);
  ctx.moveTo(ballX - 3, bottomY);
  ctx.lineTo(ballX - 3, topY);
  ctx.lineTo(ballX - 1, bottomY);
  ctx.lineTo(ballX, topY);
  ctx.lineTo(ballX + 1, bottomY);
  ctx.lineTo(ballX + 3, topY);
  ctx.lineTo(ballX + 3, bottomY);
  ctx.lineTo(ballX + 5, bottomY);
  ctx.lineTo(ballX - 5, bottomY);
  ctx.fill();
  ctx.closePath();

  ctx.restore();
}

function renderBall(
  ctx: CanvasRenderingContext2D, x: number, y: number, fill: string, stroke: string, playerState?: PlayerState
) {
  // ball border width
  ctx.lineWidth = 1;

  if (playerState && playerState === PlayerState.leftRound) {
    // make fill translucent
    ctx.fillStyle = tinycolor(fill).setAlpha(0.5).toRgbString();
    ctx.strokeStyle = tinycolor(stroke).setAlpha(0.5).toRgbString();
  } else {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
  }

  ctx.beginPath();
  ctx.arc(x, y, BALL_RADIUS, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();

  ctx.beginPath();
  ctx.arc(x, y, BALL_RADIUS - ctx.lineWidth / 2, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.closePath();
}

function renderBalls(ctx: CanvasRenderingContext2D, state: State) {
  //
  // Draw other players
  //
  state.players.forEach((player) => {
    // Don't render ghost for the current player
    if (player.id === state.id && !debugRender) {
      return;
    }

    const pos = state.round.playerPhysics.get(player.id).ball.interpolatedPosition;
    renderBall(ctx, pos[0], pos[1], player.color, textColor, player.state);

    if (state.match.leaderId === player.id) {
      drawCrown(ctx, pos[0], pos[1]);
    }
  });

  //
  // Draw chat bubbles
  //
  state.chats.forEach((chat, id) => {

    if (!state.players.get(id)) {
      // Chat received but no player/ball is present, so don't render!
      return;
    }

    const pos = state.round.playerPhysics.get(id).ball.interpolatedPosition;
    const x = pos[0];
    const y = pos[1];

    // if it's over the current player, don't overlap the aim arrow
    let onLeft = false;
    if (id === state.id && state.round.aimDirection > -90) {
      onLeft = true;
    }

    renderChat(ctx, {ballX: x, ballY: y, emoticon: chat.emoticon, onLeft});
  });

  if (state.isObserver) {
    return;
  }

  //
  // Draw player ball
  //
  const ballPos = state.round.playerPhysics.get(state.id).ball.interpolatedPosition;

  // draw a translucent "shadow" around the player ball to make it easy to keep tack
  ctx.beginPath();
  ctx.arc(ballPos[0], ballPos[1], 8, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(128, 128, 0, .6)';
  ctx.fill();
  ctx.closePath();

  renderBall(ctx, ballPos[0], ballPos[1], state.color, textColor);

  if (state.match.leaderId === state.id) {
    drawCrown(ctx, ballPos[0], ballPos[1]);
  }

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

function renderInGame(ctx: CanvasRenderingContext2D, state: State, scaleFactor: number) {
  if (state.gameState === GameState.matchOver) {
    renderMatchEnd(ctx, state);
    return;
  }

  renderGround(ctx, scaleFactor, state.round.level);
  renderBalls(ctx, state);
  renderMessages(ctx, state, scaleFactor);
  renderHud(ctx, state);

  if (state.gameState === GameState.levelOver) {
    renderLeaderBoard(ctx, state);
  }
}

export default function render(ctx: CanvasRenderingContext2D, state: State, scaleFactor: number) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  ctx.save();

  ctx.fillStyle = skyColor;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (state.connectionState === ConnectionState.connecting) {
    renderConnecting(ctx, state);
  } else if (state.connectionState === ConnectionState.connected) {
    renderInGame(ctx, state, scaleFactor);
  } else if (state.connectionState === ConnectionState.disconnected) {
    renderDisconnected(ctx, state);
  }

  ctx.restore();
}