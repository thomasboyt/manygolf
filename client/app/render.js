import {WIDTH, HEIGHT} from './constants';

export default function render(ctx, state) {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}
