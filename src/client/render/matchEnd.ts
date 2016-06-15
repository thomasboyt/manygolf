import {
  WIDTH,
  HEIGHT,
  MATCH_OVER_MS
} from '../../universal/constants';

import {
  State,
  MatchEndPlayer,
} from '../records';

const podiumHeights = new Map<number, number>().set(1, 100).set(2, 75).set(3, 50);

function drawHalfCrown(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(10, 40);
  ctx.lineTo(0, 0);
  ctx.lineTo(20, 30);
  ctx.lineTo(30, 0);
  ctx.lineTo(40, 30);
  ctx.lineTo(40, 40);
  ctx.lineTo(10, 40);
  ctx.fill();
  ctx.closePath();
}

function drawCrown(ctx: CanvasRenderingContext2D, ballX: number, ballY: number) {
  ctx.save();

  ctx.strokeStyle = 'black';
  ctx.fillStyle = 'yellow';

  ctx.save();
  ctx.translate(ballX - 40, ballY - 80)
  drawHalfCrown(ctx);
  ctx.restore();

  ctx.save();
  ctx.translate(ballX + 40, ballY - 80)
  ctx.scale(-1, 1);
  drawHalfCrown(ctx);
  ctx.restore();

  ctx.restore();
}

function drawPodium(
  ctx: CanvasRenderingContext2D, player: MatchEndPlayer, position: number, x: number
) {
  // can't draw a podium soooo
  if (!player) {
    return;
  }

  const bottomY = HEIGHT - 50;

  const podiumHeight = podiumHeights.get(position);

  ctx.fillStyle = 'gray';
  ctx.fillRect(x - 50, bottomY - podiumHeight, 100, podiumHeight);

  ctx.beginPath();
  const ballY = bottomY - podiumHeight - 50;
  ctx.arc(x, ballY, 50, 0, 2 * Math.PI);
  ctx.strokeStyle = 'white';
  ctx.fillStyle = player.color;
  ctx.fill();
  ctx.stroke();
  ctx.closePath();

  if (position === 1) {
    drawCrown(ctx, x, ballY);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = 'black';

  ctx.font = 'normal 16px "Press Start 2P"';
  ctx.fillText(`${position}`, x, bottomY - podiumHeight + 25);

  ctx.font = 'normal 8px "Press Start 2P"';
  ctx.fillText(`${player.points} points`, x, bottomY - podiumHeight + 40);

  ctx.fillStyle = 'white';
  ctx.fillText(`${player.name}`, x, bottomY + 15);
}

function renderFirework(
  ctx: CanvasRenderingContext2D, x: number, y: number, startingTime: number, totalElapsed: number,
  color: string
) {
  if (startingTime > totalElapsed) {
    return;
  }

  const elapsed = totalElapsed - startingTime;
  const step = 1 / 10;

  ctx.save();
  ctx.translate(x, y);

  const beginDecay = 500;
  const decayTime = 500;

  const decay = elapsed <= beginDecay ? 0 : (elapsed - beginDecay) / decayTime;
  const brightness = 1 - decay;

  ctx.fillStyle = `rgba(${color}, ${brightness})`;

  // make a firework with like 12 particles
  for (let i = 0; i < 12; i += 1) {
    ctx.save();
    ctx.rotate(i * ((2 * Math.PI) / 12));

    ctx.beginPath();
    const x = 0;
    const y = elapsed * step;
    ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();

    ctx.restore();
  }

  ctx.restore();
}

function renderFireworks(ctx: CanvasRenderingContext2D, timeElapsed: number) {
  // TODO: randomize this
  // probably will need to generate fireworks in the reducer when you enter this state
  renderFirework(ctx, 200, 50, 1000, timeElapsed, '255, 0, 0');
  renderFirework(ctx, 410, 100, 2000, timeElapsed, '255, 255, 0');
  renderFirework(ctx, 120, 60, 2400, timeElapsed, '0, 255, 0');
  renderFirework(ctx, 440, 30, 3000, timeElapsed, '0, 255, 255');
  renderFirework(ctx, 500, 50, 3600, timeElapsed, '0, 0, 255');
  renderFirework(ctx, 260, 40, 4000, timeElapsed, '255, 255, 255');
}

export default function renderMatchEnd(ctx: CanvasRenderingContext2D, state: State) {
  const timeElapsed = Date.now() - (state.nextMatchTime - MATCH_OVER_MS);
  renderFireworks(ctx, timeElapsed);

  const players = state.matchRankedPlayers;

  drawPodium(ctx, players.get(0), 1, 300);
  drawPodium(ctx, players.get(0), 2, 100);
  drawPodium(ctx, players.get(0), 3, 500);
}