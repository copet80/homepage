import { roundRect } from './draw';

export function renderCharacterCanvas(char, fgCanvasCtx) {
  const [r, g, b] = char.color;
  const rad = char.radius;
  const circ = rad * 2;
  const shapeStep = char.shapeStep;
  const x = char.x;
  const y = char.y;
  const strokeColor = `rgb(${r}, ${g}, ${b})`;
  const cornerRadius = rad * shapeStep;
  fgCanvasCtx.lineWidth = rad * 0.25;
  fgCanvasCtx.strokeStyle = strokeColor;
  if (shapeStep >= 0.95) {
    fgCanvasCtx.beginPath();
    fgCanvasCtx.arc(x, y, rad, 0, Math.PI * 2);
    fgCanvasCtx.closePath();
  } else {
    roundRect(fgCanvasCtx, x - rad, y - rad, circ, circ, cornerRadius);
  }
  fgCanvasCtx.stroke();
}

export function renderCharacterCss(char, $chars) {
  const [r, g, b] = char.color;
  const rad = char.radius;
  const circ = rad * 2;
  const shapeStep = char.shapeStep;
  const x = char.x;
  const y = char.y;
  const strokeColor = `rgb(${r}, ${g}, ${b})`;
  const $char = $chars[char.id];
  $char.style.transform = `translate(${x}px, ${y}px) scale(${circ / 30})`;
  const borderRadius = `${shapeStep * 50}%`;
  if ($char.style.borderRadius !== borderRadius) {
    $char.style.borderRadius = borderRadius;
  }
  if ($char.style.borderColor !== strokeColor) {
    $char.style.borderColor = strokeColor;
  }
}

export function renderCharacterWebGL(char, mesh) {
  const [r, g, b] = char.color;
  const rad = char.radius;
  const circ = rad * 2;
  // const shapeStep = char.shapeStep;
  const x = char.x;
  const y = char.y;
  mesh.position.x = x;
  mesh.position.y = y;
  mesh.scale.x = mesh.scale.y = circ / 30;
  mesh.material.color.setRGB(r, g, b);
}

export function renderExplosionCanvas(explosion, fgCanvasCtx) {
  const x = explosion.x;
  const y = explosion.y;
  const life = explosion.life;
  const [r, g, b] = explosion.color;
  const rad = explosion.radius;
  const strokeColor = `rgba(${r}, ${g}, ${b}, ${life})`;
  const lineWidth = life * 100;
  fgCanvasCtx.save();
  fgCanvasCtx.beginPath();
  fgCanvasCtx.translate(x, y);
  fgCanvasCtx.lineWidth = lineWidth;
  fgCanvasCtx.strokeStyle = strokeColor;
  fgCanvasCtx.arc(0, 0, rad, 0, 2 * Math.PI);
  fgCanvasCtx.closePath();
  fgCanvasCtx.stroke();
  fgCanvasCtx.restore();
}

export function renderExplosionCss(explosion, $explosions) {
  const x = explosion.x;
  const y = explosion.y;
  const life = explosion.life;
  const [r, g, b] = explosion.color;
  const rad = explosion.radius;
  const strokeColor = `rgba(${r}, ${g}, ${b}, ${life})`;
  const $explosion = $explosions[explosion.id];
  $explosion.style.transform = `translate(${x}px, ${y}px) scale(${rad / 15})`;
  const borderWidth = `${life * 10}px`;
  if ($explosion.style.borderWidth !== borderWidth) {
    $explosion.style.borderWidth = borderWidth;
  }
  if ($explosion.style.borderColor !== strokeColor) {
    $explosion.style.borderColor = strokeColor;
  }
}

export function renderLineCanvas(char, otherChar, lineWidth, color1, color2, fgCanvasCtx) {
  const gradient = fgCanvasCtx.createLinearGradient(char.x, char.y, otherChar.x, otherChar.y);
  gradient.addColorStop('0', color1);
  gradient.addColorStop('1.0', color2);

  fgCanvasCtx.strokeStyle = gradient;
  fgCanvasCtx.lineWidth = lineWidth;
  fgCanvasCtx.beginPath();
  fgCanvasCtx.moveTo(char.x, char.y);
  fgCanvasCtx.lineTo(otherChar.x, otherChar.y);
  fgCanvasCtx.stroke();
  fgCanvasCtx.closePath();
}

export function renderLineCss(char, otherChar, lineWidth, color1, color2, $line) {
  const { line, gradient, stop1, stop2 } = $line;
  gradient.setAttribute('x1', char.x);
  gradient.setAttribute('y1', char.y);
  gradient.setAttribute('x2', otherChar.x);
  gradient.setAttribute('y2', otherChar.y);
  line.setAttribute('x1', char.x);
  line.setAttribute('y1', char.y);
  line.setAttribute('x2', otherChar.x);
  line.setAttribute('y2', otherChar.y);
  line.setAttribute('stroke-width', lineWidth);
  stop1.setAttribute('stop-color', color1);
  stop2.setAttribute('stop-color', color2);
  if (line.getAttribute('class') !== 'active') {
    line.setAttribute('class', 'active');
  }
}

export function renderAudioVisualizer(data, lineSpace, color, fgCanvasCtx, vw, vh) {
  const hvw = vw * 0.5;
  const ctx = fgCanvasCtx;
  const quarterDataLen = data.length * 0.25;
  const [r, g, b] = color;

  let value;
  let i = -1;
  let ix;
  ctx.lineWidth = 1;

  while (++i < quarterDataLen) {
    ix = i * 4;
    value = data[ix] * 0.01;
    const x = lineSpace * ix;
    const y = value * 50;
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.beginPath();
    ctx.moveTo(hvw - x, vh);
    ctx.lineTo(hvw - x, vh - y);
    ctx.moveTo(hvw + x, vh);
    ctx.lineTo(hvw + x, vh - y);
    ctx.stroke();
    ctx.closePath();
  }
}
