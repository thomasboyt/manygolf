import {
  WIDTH,
  HEIGHT,
  MIN_POWER,
  MAX_POWER,
  HURRY_UP_MS,
  RoundState,
  ConnectionState,
  Emoticon,
} from '../universal/constants';

import {
  debugRender,
} from './flags';

import {
  State,
  LeaderboardPlayer,
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

function renderBalls(ctx: CanvasRenderingContext2D, state: State) {
  // ball border width
  ctx.lineWidth = 1;

  //
  // Draw other players
  //
  state.players.forEach((player) => {
    // Don't render ghost for the current player
    if (player.id === state.id && !debugRender) {
      return;
    }

    const pos = player.body.interpolatedPosition;
    ctx.beginPath();
    ctx.arc(pos[0], pos[1], 2.5, 0, 2 * Math.PI);
    ctx.strokeStyle = textColor;
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.stroke();
    ctx.closePath();

    if (state.leaderId === player.id) {
      drawCrown(ctx, pos[0], pos[1]);
    }
  });

  //
  // Draw chat bubbles
  //
  state.chats.forEach((chat, id) => {
    let x, y, onLeft = false;

    if (!state.players.get(id)) {
      // Chat received but no player/ball is present, so don't render!
      return;
    }

    if (id === state.id) {
      // render over current player
      x = state.round.ball.body.interpolatedPosition[0];
      y = state.round.ball.body.interpolatedPosition[1];

      if (state.round.aimDirection > -90) {
        onLeft = true;
      }

    } else {
      // render over other player
      const pos = state.players.get(id).body.interpolatedPosition;
      x = pos[0];
      y = pos[1];
    }

    renderChat(ctx, {ballX: x, ballY: y, emoticon: chat.emoticon, onLeft});
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

  if (state.leaderId === state.id) {
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

function renderLeaderBoard(ctx: CanvasRenderingContext2D, state: State) {
  const x = WIDTH / 2;
  const y = 55;

  ctx.fillStyle = 'white';

  if (!state.isObserver) {
    ctx.font = 'normal 16px "Press Start 2P"';

    if (state.round.scored) {
      const players = state.round.roundRankedPlayers;
      const position = players.findIndex((player) => player.id === state.id) + 1;
      ctx.fillText(`You placed ${toOrdinal(position)}`, WIDTH / 2, y);

    } else {
      ctx.fillText('You didn\'t make it in :(', WIDTH / 2, y);
    }
  }

  ctx.font = 'normal 8px "Press Start 2P"';

  const placeX = x - 200;
  const nameX = x - 180;
  const scoreX = x + 30;
  const timeX = x + 90;
  const pointsX = x + 160;

  // Draw header
  const headerY = y + 20;
  ctx.textAlign = 'left';
  ctx.fillText('Name', nameX, headerY);
  ctx.textAlign = 'right';
  ctx.fillText('Strokes', scoreX, headerY);
  ctx.fillText('Time', timeX, headerY);
  ctx.textAlign = 'right';
  ctx.fillText('Points', pointsX, headerY);

  state.round.roundRankedPlayers.forEach((player, idx) => {
    const rowY = y + 30 + idx * 12;

    const place = player.scored ? `${idx + 1}` : '';
    const strokes = player.scored ? `${player.strokes}` : '---'
    const elapsed = player.scored ? (player.scoreTime / 1000).toFixed(2) : '---';

    // Render place
    ctx.textAlign = 'left';
    ctx.fillText(place, placeX, rowY);

    // Render name
    if (tinycolor(player.color).isDark()) {
      ctx.strokeText(player.name, nameX, rowY);
    }

    ctx.fillStyle = player.color;
    ctx.fillText(player.name, nameX, rowY);

    // Render strokes & time elapsed
    ctx.textAlign = 'right';
    ctx.fillStyle = 'white';

    ctx.fillText(strokes, scoreX, rowY);
    ctx.fillText(elapsed, timeX, rowY);

    // Render points
    renderLeaderboardPoints(ctx, state, player, pointsX, rowY);
  });
}

function renderLeaderboardPoints(ctx: CanvasRenderingContext2D, state: State, player: LeaderboardPlayer, pointsX: number, rowY: number) {
  const timeLeftMs = state.round.expTime - Date.now();

  // render as "animation" over timeLeftMs

  const beginCountingMs = 3000;

  const addedPoints = player.addedPoints;

  if (addedPoints === 0) {
    // Don't bother with the animating adding points logic if we're not even rendering added points
    ctx.textAlign = 'right';
    ctx.fillText(`${player.prevPoints}`, pointsX, rowY);
    return;
  }

  if (timeLeftMs > beginCountingMs) {
    ctx.textAlign = 'right';
    ctx.fillText(`${player.prevPoints}`, pointsX, rowY);
    ctx.textAlign = 'left';
    ctx.fillText(`+${player.addedPoints}`, pointsX + 10, rowY);

  } else {
    // remove one point every 80ms
    let movedPoints = Math.floor(Math.abs(timeLeftMs - beginCountingMs) / 50);

    if (movedPoints > player.addedPoints) {
      movedPoints = player.addedPoints;
    }

    const remainingPoints = player.addedPoints - movedPoints;
    const newPoints = player.prevPoints + movedPoints;

    ctx.textAlign = 'right';
    ctx.fillText(`${newPoints}`, pointsX, rowY);

    if (remainingPoints > 0) {
      ctx.textAlign = 'left';
      ctx.fillText(`+${remainingPoints}`, pointsX + 10, rowY);
    }
  }

}

function renderInGame(ctx: CanvasRenderingContext2D, state: State, scaleFactor: number) {
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
      // display round leaderboard
      renderLeaderBoard(ctx, state);
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
