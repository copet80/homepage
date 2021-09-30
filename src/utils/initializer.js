import { random } from 'canvas-sketch-util';
import * as THREE from 'three';

import { EDGE_WRAP } from '../core/MovingObject';
import ShapeShifter from '../core/ShapeShifter';
import Explosion from '../core/Explosion';
import { getRandomColor } from './draw';

export function initLines($svgCanvas, charsLen) {
  const svgns = 'http://www.w3.org/2000/svg';

  const defs = document.createElementNS(svgns, 'defs');
  $svgCanvas.appendChild(defs);

  const arr = [];
  const map = {};

  for (let i = 0; i < charsLen; i++) {
    for (let j = i + 1; j < charsLen; j++) {
      const lineId = `line_${i}_${j}`;
      const line = document.createElementNS(svgns, 'line');
      const gradient = document.createElementNS(svgns, 'linearGradient');
      const stop1 = document.createElementNS(svgns, 'stop');
      const stop2 = document.createElementNS(svgns, 'stop');
      gradient.setAttribute('id', lineId);
      gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
      stop1.setAttribute('offset', '0%');
      stop2.setAttribute('offset', '100%');
      gradient.appendChild(stop1);
      gradient.appendChild(stop2);
      defs.appendChild(gradient);
      arr.push(line);

      line.setAttribute('stroke', `url(#${lineId})`);
      $svgCanvas.appendChild(line);

      map[lineId] = {
        line,
        gradient,
        stop1,
        stop2
      };
    }
  }

  return {
    arr,
    map
  };
}

export function initCharacters($divCanvas, scene3d, charsLen, vw, vh, minSpeed, maxSpeed, boundary) {
  const arr = [];
  const arr3d = [];
  const map = {};

  for (let i = 0; i < charsLen; i++) {
    const charId = `char_${i}`;
    const char = new ShapeShifter(charId);
    const radius = random.range(10, 20);
    const color = getRandomColor();
    char.color = color;
    char.targetColor = color;
    char.vx = random.range(-radius, radius * 2);
    char.vy = random.range(-radius, radius * 2);
    char.x = random.range(radius, vw - radius);
    char.y = random.range(radius, vh - radius);
    char.edgeBehavior = EDGE_WRAP;
    char.targetMaxSpeed = random.range(minSpeed, maxSpeed);
    char.boundary = boundary;
    char.targetRadius = radius;
    arr.push(char);

    const $char = document.createElement('div');
    $char.setAttribute('id', charId);
    $char.className = 'char';
    $divCanvas.appendChild($char);
    map[charId] = $char;

    const geometry = new THREE.RingGeometry(radius * 0.8, radius, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);
    arr3d.push(mesh);
    scene3d.add(mesh);
  }

  return {
    arr,
    arr3d,
    map
  };
}

export function initExplosions($divCanvas, explosionsLen) {
  const arr = [];
  const map = {};

  for (let i = 0; i < explosionsLen; i++) {
    const explosionId = `explosion_${i}`;
    const explosion = new Explosion(explosionId);
    arr.push(explosion);

    const $explosion = document.createElement('div');
    $explosion.setAttribute('id', explosionId);
    $explosion.className = 'explosion';
    $divCanvas.appendChild($explosion);
    map[explosionId] = $explosion;
  }

  return {
    arr,
    map
  };
}

export function initArtworks(artworks, $artworksList, onItemClick) {
  const assets = {};

  artworks.forEach((artwork, i) => {
    assets[artwork.title] = {};

    const bitmap = new Image();
    bitmap.crossOrigin = 'anonymous';
    bitmap.src = artwork.bitmap;
    bitmap.onload = () => {
      const bitmapCanvas = document.createElement('canvas');
      const bitmapCtx = bitmapCanvas.getContext('2d');
      bitmapCtx.drawImage(bitmap, 0, 0);
      const bitmapData = bitmapCtx.getImageData(0, 0, artwork.cols, artwork.rows).data;
      const bitmapColors = [];
      let i, r, g, b, colors;
      for (let row = 0; row < artwork.rows; row++) {
        colors = [];
        for (let col = 0; col < artwork.cols; col++) {
          i = row * artwork.cols + col;
          r = bitmapData[i * 4 + 0];
          g = bitmapData[i * 4 + 1];
          b = bitmapData[i * 4 + 2];
          colors.push([r, g, b]);
        }
        bitmapColors.push(colors);
      }
      assets[artwork.title].bitmap = bitmapColors;
    };

    const medres = new Image();
    medres.src = artwork.src;
    medres.onload = () => {
      assets[artwork.title].medres = medres;
    };

    // add thumb UI
    const thumbScale = 0.5;
    const thumbCirc = 240 * thumbScale;
    const thumbOffsetX = artworks.length * -0.5 * thumbCirc + thumbCirc * 0.5;
    const $li = document.createElement('li');
    const $thumb = document.createElement('div');
    const thumbX = thumbOffsetX + i * thumbCirc;
    const thumbY = thumbCirc * 0.5;
    const thumbDivX = -thumbX / thumbScale / 1.2 + (-10 + Math.random() * 20);
    const thumbDivY = -thumbCirc + (-30 + Math.random() * 20);
    $li.setAttribute('id', `artwork_${artwork.title}`);
    $li.style.transform = `translate(${thumbX}px, ${thumbY}px) scale(${thumbScale})`;
    $thumb.style.backgroundImage = `url(${artwork.thumb})`;
    $thumb.style.transitionDelay = `${i * 0.025}s`;
    $thumb.style.transform = `translate(${thumbDivX}px, ${thumbDivY}px) rotate(${-25 + Math.random() * 50}deg)`;
    $li.appendChild($thumb);
    $artworksList.appendChild($li);

    $li.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      onItemClick(artwork.title);
    });
  });

  return assets;
}

export function initSongs(songs, $songsList, onItemClick) {
  songs.forEach((song, i) => {
    // add thumb UI
    const thumbScale = 0.5;
    const thumbCirc = 240 * thumbScale;
    const thumbOffsetX = songs.length * -0.5 * thumbCirc + thumbCirc * 0.5;
    const $li = document.createElement('li');
    const $thumb = document.createElement('div');
    const thumbX = thumbOffsetX + i * thumbCirc;
    const thumbY = thumbCirc * -0.5;
    const thumbDivX = -thumbX / thumbScale / 1.2 + (-10 + Math.random() * 20);
    const thumbDivY = thumbCirc + (-30 + Math.random() * 20);
    $li.setAttribute('id', `song_${song.title}`);
    $li.style.transform = `translate(${thumbX}px, ${thumbY}px) scale(${thumbScale})`;
    $thumb.style.backgroundImage = `url(${song.thumb})`;
    $thumb.style.transitionDelay = `${i * 0.025}s`;
    $thumb.style.transform = `translate(${thumbDivX}px, ${thumbDivY}px) rotate(${-25 + Math.random() * 50}deg)`;
    $li.appendChild($thumb);
    $songsList.appendChild($li);

    $li.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      onItemClick(song.src);
    });
  });
}

export function init3d(insertBefore, ringsLen) {
  const { innerWidth, innerHeight } = window;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);

  const renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setSize(innerWidth, innerHeight);
  if (insertBefore) {
    document.body.insertBefore(renderer.domElement, insertBefore);
  } else {
    document.body.appendChild(renderer.domElement);
  }

  camera.position.x = innerWidth * 0.5;
  camera.position.y = innerHeight * 0.5;
  camera.position.z = 500;

  return {
    camera,
    scene,
    render: () => {
      renderer.render(scene, camera);
    }
  };
}
