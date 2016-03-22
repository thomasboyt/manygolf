import {WIDTH, HEIGHT, HOLE_HEIGHT, HOLE_WIDTH} from './constants';

const skyColor = 'beige';

export default function render(ctx, state) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  ctx.save();

  ctx.fillStyle = skyColor;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const level = state.game.level;
  if (!level) {
    return;
  }

  const points = level.points;

  ctx.fillStyle = 'black';

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

  ctx.restore();

  const hole = level.hole;

  const hx = hole.get(0) - HOLE_WIDTH / 2;
  const hy = hole.get(1);

  ctx.fillStyle = skyColor;
  ctx.fillRect(hx, hy, HOLE_WIDTH, HOLE_HEIGHT);
}
