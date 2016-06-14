import tinycolor from 'tinycolor2';

import {
  WIDTH,
  HEIGHT,
} from '../../universal/constants';

import {
  State,
  LeaderboardPlayer,
} from '../records';

import toOrdinal from '../util/toOrdinal';

function renderLeaderboardPoints(
  ctx: CanvasRenderingContext2D, state: State, player: LeaderboardPlayer, pointsX: number,
  rowY: number
) {
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

export default function renderLeaderBoard(ctx: CanvasRenderingContext2D, state: State) {
  ctx.font = 'normal 16px "Press Start 2P"';
  ctx.textAlign = 'center';

  const x = WIDTH / 2;
  const y = 55;

  if (state.round.roundRankedPlayers === null) {
    // player connected late and missed the roundOver message, display placeholder
    ctx.fillText('Waiting for next round....', x, HEIGHT / 2);
    return;

  } else if (state.round.roundRankedPlayers.every((player) => !player.scored)) {
    // no one finished
    ctx.fillText('No one wins!', x, HEIGHT / 2);
    return;
  }

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
    const strokes = player.scored ? `${player.strokes}` : '---';
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
