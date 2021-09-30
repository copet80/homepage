import 'regenerator-runtime/runtime';
import { math, random } from 'canvas-sketch-util';
import Stats from 'stats.js';

import ShapeShifter, { SHAPE_CIRCLE, SHAPE_SQUARE } from './core/ShapeShifter';
import Vector2D from './core/Vector2D';
import { getNoiseColor, getRandomColor, getRandomColors } from './utils/draw';
import { SONGS, SONGS_MAP } from './constants/songs';

import './styles.css';
import { ARTWORKS, ARTWORKS_MAP } from './constants/artworks';
import {
  DEBUG,
  CHANGE_MODE_INTERVAL,
  CHANGE_UP_INTERVAL,
  MODE_FLOCK,
  MODE_GRID,
  MODE_WANDER,
  MODES,
  NUM_CHARS,
  NUM_CHAR_COLS,
  NUM_EXPLOSIONS,
  RENDER_CANVAS,
  RENDER_CSS,
  RENDER_WEBGL
} from './constants/general';
import { initArtworks, initCharacters, initExplosions, initLines, initSongs, init3d } from './utils/initializer';
import {
  renderAudioVisualizer,
  renderCharacterCanvas,
  renderCharacterCss,
  renderCharacterWebGL,
  renderExplosionCanvas,
  renderExplosionCss,
  renderLineCanvas,
  renderLineCss
} from './utils/renderer';
import { initTweakPane } from './utils/debug';

window.AudioContext = window.AudioContext || window.webkitAudioContext;

let audioData;
let audioAnalyzer;

const $fgCanvas = document.getElementById('fgCanvas');
const fgCanvasCtx = $fgCanvas.getContext('2d');

const $divCanvas = document.getElementById('divCanvas');
const $svgCanvas = document.getElementById('svgCanvas');

const $bgDiv = document.getElementById('bgDiv');
const $artworksList = document.getElementById('artworksList');
const $songsList = document.getElementById('songsList');

let stats;
let audio;
let audioVisColor;
let vw, vh;
let boundary;
let mouse0 = new Vector2D(0, 0);
let mouse = new Vector2D(0, 0);
let isMouseDown = false;
let mode = MODE_WANDER;
let charRenderer = RENDER_CANVAS;
let explosionRenderer = RENDER_CANVAS;
let lineRenderer = RENDER_CANVAS;
let loadedSong = null;
let selectedSong = SONGS[0].src;
let artworkAssets = {};

let explosions = [];
let $explosions = {};
let chars = [];
let chars3d = [];
let $chars = {};
let $lines = {};
let songAudios = {};
let mouseFlocks = [];
let flocksByColorIds = {};
let explosionsLen = 0;
let charsLen = 0;
let now = Date.now();
let nextChangeUp = now + CHANGE_UP_INTERVAL;
let nextChangeMode = now + CHANGE_MODE_INTERVAL;
let analyzedAudioData = [];
let isViewingArtwork = false;
let medResImage = null;
let selectedArtwork = null;
let render3d = null;
let scene3d = null;
let camera3d = null;

const tweakParams = {
  charRenderer,
  explosionRenderer,
  lineRenderer,
  song: SONGS[0].src,
  artwork: ARTWORKS[0].title,
  mode,
  minSpeed: 0.5,
  maxSpeed: 1,
  minFlockSpeed: 3,
  maxFlockSpeed: 5,
  minRadius: 10,
  maxRadius: 20
};

function init() {
  resize();

  const result3d = init3d($fgCanvas);
  render3d = result3d.render;
  camera3d = result3d.camera;
  scene3d = result3d.scene;

  initSongs(SONGS, $songsList, changeSong);
  artworkAssets = initArtworks(ARTWORKS, $artworksList, (artwork) => changeArtwork(artwork, true));

  const charsResult = initCharacters(
    $divCanvas,
    scene3d,
    NUM_CHARS,
    vw,
    vh,
    tweakParams.minSpeed,
    tweakParams.maxSpeed,
    boundary
  );
  $chars = charsResult.map;
  chars = charsResult.arr;
  chars3d = charsResult.arr3d;
  charsLen = chars.length;

  const linesResult = initLines($svgCanvas, charsLen);
  $lines = linesResult.map;

  const explosionsResult = initExplosions($divCanvas, NUM_EXPLOSIONS);
  $explosions = explosionsResult.map;
  explosions = explosionsResult.arr;
  explosionsLen = explosions.length;

  if (DEBUG) {
    initTweakPane(tweakParams, {
      onMusicPlay: handleMusicPlay,
      onMusicPause: handleMusicPause,
      onArtworkShow: handleArtworkShow,
      onArtworkHide: handleArtworkHide,
      onPaneChange: handlePaneChange
    });
    initStats();
  }
  update();
  changeCharRenderer(charRenderer);
  changeExplosionRenderer(explosionRenderer);
  changeLineRenderer(lineRenderer);
  document.body.style.opacity = '1';
}

function initStats() {
  stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);
}

function handlePaneChange(event) {
  const minSpeed = Math.min(tweakParams.minSpeed, tweakParams.maxSpeed);
  const maxSpeed = Math.max(tweakParams.minSpeed, tweakParams.maxSpeed);
  const minFlockSpeed = Math.min(tweakParams.minFlockSpeed, tweakParams.maxFlockSpeed);
  const maxFlockSpeed = Math.max(tweakParams.minFlockSpeed, tweakParams.maxFlockSpeed);
  const minRadius = Math.min(tweakParams.minRadius, tweakParams.maxRadius);
  const maxRadius = Math.max(tweakParams.minRadius, tweakParams.maxRadius);

  switch (event.presetKey) {
    case 'maxSpeed':
      if (mode === MODE_WANDER) {
        for (let i = 0; i < charsLen; i++) {
          const char = chars[i];
          char.targetMaxSpeed = random.range(minSpeed, maxSpeed);
        }
      }
      break;

    case 'maxFlockSpeed':
      if (mode === MODE_FLOCK) {
        for (let i = 0; i < charsLen; i++) {
          const char = chars[i];
          char.targetMaxSpeed = random.range(minFlockSpeed, maxFlockSpeed);
        }
      }
      break;

    case 'minRadius':
    case 'maxRadius':
      for (let i = 0; i < charsLen; i++) {
        const char = chars[i];
        char.targetRadius = random.range(minRadius, maxRadius);
      }
      break;

    case 'mode':
      changeMode(tweakParams.mode);
      break;

    case 'charRenderer':
      changeCharRenderer(tweakParams.charRenderer);
      break;

    case 'explosionRenderer':
      changeExplosionRenderer(tweakParams.explosionRenderer);
      break;

    case 'lineRenderer':
      changeLineRenderer(tweakParams.lineRenderer);
      break;

    case 'song':
      changeSong(tweakParams.song);
      break;

    case 'artwork':
      changeArtwork(tweakParams.artwork);
      break;

    default:
      break;
  }
}

async function changeSong(song) {
  if (audio && song === selectedSong) {
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
    return;
  }

  if (selectedSong) {
    const $elSong = document.getElementById(`song_${SONGS_MAP[selectedSong].title}`);
    if ($elSong) {
      $elSong.classList.remove('selected');
    }

    const $elSongDesc = document.getElementById(`songDesc_${SONGS_MAP[selectedSong].id}`);
    if ($elSongDesc) {
      $elSongDesc.classList.remove('selected');
    }
  }
  if (song) {
    const $elSong = document.getElementById(`song_${SONGS_MAP[song].title}`);
    if ($elSong) {
      $elSong.classList.add('selected');
    }

    const $elSongDesc = document.getElementById(`songDesc_${SONGS_MAP[song].id}`);
    if ($elSongDesc) {
      $elSongDesc.classList.add('selected');
    }
  }
  selectedSong = song;
  handleMusicPlay();
}

function loadAudio(url) {
  if (loadedSong && audio) {
    audio.pause();
  }

  if (!audioVisColor) {
    audioVisColor = new ShapeShifter();
  }

  loadedSong = null;
  if (!songAudios[url]) {
    const newAudio = new Audio(url);
    newAudio.crossOrigin = 'anonymous';
    const newAudioCtx = new AudioContext();
    const newAudioSource = newAudioCtx.createMediaElementSource(newAudio);
    const newAudioAnalyzer = newAudioCtx.createAnalyser();
    newAudioAnalyzer.fftSize = 2048;
    newAudioSource.connect(newAudioAnalyzer);
    newAudioSource.connect(newAudioCtx.destination);
    const newAudioData = new Uint8Array(newAudioAnalyzer.frequencyBinCount);
    songAudios[url] = {
      audio: newAudio,
      audioCtx: newAudioCtx,
      audioSource: newAudioSource,
      audioAnalyzer: newAudioAnalyzer,
      audioData: newAudioData
    };
  }
  audio = songAudios[url].audio;
  audioAnalyzer = songAudios[url].audioAnalyzer;
  audioData = songAudios[url].audioData;

  audio.currentTime = 0;
  audio.play();
  loadedSong = url;
}

function handleMusicPlay() {
  if (audio && loadedSong === selectedSong) {
    if (audio.currentTime >= audio.duration) {
      audio.currentTime = 0;
    }
    audio.play();
  } else {
    loadAudio(selectedSong);
  }
}

function handleMusicPause() {
  audio.pause();
}

function showMedResImage(image) {
  medResImage = image;
  $bgDiv.appendChild(medResImage);
  medResImage.style.transition = 'opacity 0 0';
  medResImage.style.opacity = 0;
  setTimeout(() => {
    medResImage.style.transition = 'opacity 1s 1s';
    medResImage.style.opacity = 1;
  }, 0.1);
}

async function changeArtwork(artwork, forceShow) {
  if (artwork === selectedArtwork) {
    return;
  }

  if (selectedArtwork) {
    document.getElementById(`artwork_${selectedArtwork}`).classList.remove('selected');
  }
  if (artwork) {
    document.getElementById(`artwork_${artwork}`).classList.add('selected');
  }

  if (isViewingArtwork) {
    await handleArtworkHide();
    selectedArtwork = artwork;
  } else {
    selectedArtwork = artwork;
  }

  if (isViewingArtwork || forceShow) {
    handleArtworkShow();
  }
}

function handleArtworkShow() {
  medResImage = null;
  isViewingArtwork = true;
}

async function handleArtworkHide() {
  isViewingArtwork = false;
  $bgDiv.innerHTML = '';
  medResImage = null;
  changeUp();
}

function updateCharacters() {
  const isSongPlaying = loadedSong && audio && audio.currentTime < audio.duration;

  let artworkInView = isViewingArtwork && selectedArtwork ? ARTWORKS_MAP[selectedArtwork] : null;

  let gridCirc = 0;
  let gridRadius = 0;
  let gridOffsetX = 0;
  let gridOffsetY = 0;
  let bitmapData;

  if (artworkInView) {
    gridCirc = artworkInView.width / artworkInView.cols;
    gridRadius = gridCirc * 0.5;
    gridOffsetX = (vw - gridCirc * artworkInView.cols) * 0.5;
    gridOffsetY = (vh - gridCirc * artworkInView.rows) * 0.5;
    bitmapData = artworkAssets[artworkInView.title].bitmap;
  } else {
    if (mode === MODE_GRID) {
      gridCirc = tweakParams.maxRadius * 2 + 20;
      gridRadius = gridCirc * 0.5;
      gridOffsetX = (vw - gridCirc * NUM_CHAR_COLS) * 0.5;
      gridOffsetY = (vh - gridCirc * NUM_CHAR_COLS) * 0.5;
    }
  }

  let i = -1;
  let char, dx, dy, dist, flocks, leader, colIndex, rowIndex, col, row, radiusValue, colorValue;

  let allSettledToShowImage = Boolean(artworkInView);
  while (++i < charsLen) {
    char = chars[i];
    char.now = now;

    if (artworkInView) {
      colIndex = i % artworkInView.cols;
      rowIndex = Math.floor(i / artworkInView.cols);
      col = gridOffsetX + gridRadius + gridCirc * colIndex;
      row = gridOffsetY + gridRadius + gridCirc * rowIndex;

      dx = col - char.x;
      dy = row - char.y;
      dist = dx * dx + dy * dy;

      if (dist < 1) {
        char.x = col;
        char.y = row;
        if (char.shape !== SHAPE_SQUARE) {
          char.shape = SHAPE_SQUARE;
        }
      } else {
        char.x += dx * 0.1;
        char.y += dy * 0.1;
        allSettledToShowImage = false;
      }

      char.clearSteering();
      char.targetRadius = gridRadius;
      char.targetColor = bitmapData[rowIndex][colIndex];
    } else {
      if (now > char.fleeUntil) {
        if (isMouseDown) {
          dx = mouse.x - char.x;
          dy = mouse.y - char.y;
          dist = dx * dx + dy * dy;
          if (dist < 40000 && !char.seekTarget) {
            mouseFlocks.push(char);
            char.seekTarget = mouse;
            char.targetMaxSpeed = random.range(tweakParams.minSpeed * 5, tweakParams.maxSpeed * 5);
          }
          char.flock(mouseFlocks, mouseFlocks.length, mouse.x, mouse.y);
        } else if (mode === MODE_FLOCK) {
          flocks = flocksByColorIds[char.colorId];
          if (!flocks || flocks.indexOf(char) === 0) {
            char.wander();
          } else {
            leader = flocks[0];
            char.flock(flocks, flocks.length, leader.x, leader.y);
          }
        } else if (mode === MODE_GRID) {
          colIndex = i % NUM_CHAR_COLS;
          rowIndex = Math.floor(i / NUM_CHAR_COLS);
          col = gridOffsetX + gridRadius + gridCirc * colIndex;
          row = gridOffsetY + gridRadius + gridCirc * rowIndex;

          dx = col - char.x;
          dy = row - char.y;
          dist = dx * dx + dy * dy;

          if (dist < 1) {
            char.x = col;
            char.y = row;
            if (char.shape !== SHAPE_SQUARE) {
              char.shape = SHAPE_SQUARE;
            }
          } else {
            char.x += dx * 0.1;
            char.y += dy * 0.1;
          }

          char.clearSteering();

          radiusValue = random.noise3D(char.x * 5, char.y * 5, now * 0.5, 0.0005);
          colorValue = random.noise3D(char.x * 3, char.y * 3, now, 0.0005);
          char.targetRadius =
            tweakParams.minRadius * 0.5 +
            (radiusValue * 0.5 + 1) * (tweakParams.maxRadius - tweakParams.minRadius * 0.75);
          char.radius = char.targetRadius;
          char.targetColor = getNoiseColor(0.5 + colorValue * 0.5);
          char.color = char.targetColor;
        } else {
          char.wander();
        }
      }

      if (isSongPlaying) {
        const audioValue = analyzedAudioData[i];
        char.targetRadius = tweakParams.minRadius + audioValue * (tweakParams.maxRadius - tweakParams.minRadius);
        char.radius = char.targetRadius;
      }
    }

    char.update();

    if (charRenderer === RENDER_CANVAS) {
      renderCharacterCanvas(char, fgCanvasCtx);
    } else if (charRenderer === RENDER_CSS) {
      renderCharacterCss(char, $chars);
    } else if (charRenderer === RENDER_WEBGL) {
      renderCharacterWebGL(char, chars3d[i]);
    }
  }

  if (allSettledToShowImage && !medResImage) {
    showMedResImage(artworkAssets[artworkInView.title].medres);
  }
}

function updateExplosions() {
  for (let i = 0; i < explosionsLen; i++) {
    const explosion = explosions[i];
    if (explosion.isAwake) {
      explosion.update();

      if (explosionRenderer === RENDER_CANVAS) {
        renderExplosionCanvas(explosion, fgCanvasCtx);
      } else if (charRenderer === RENDER_CSS) {
        renderExplosionCss(explosion, $explosions);
      }
    }
  }
}

function updateLines() {
  if (mode !== MODE_WANDER || isViewingArtwork) {
    return;
  }

  for (let i = 0; i < charsLen; i++) {
    const char = chars[i];
    const [r1, g1, b1] = char.color;

    for (let j = i + 1; j < charsLen; j++) {
      const otherChar = chars[j];

      const dist = char.dist(otherChar);

      if (dist > 80) {
        const lineId = `line_${i}_${j}`;
        if ($lines[lineId].line.getAttribute('class') !== '') {
          $lines[lineId].line.setAttribute('class', '');
        }
        continue;
      }

      const [r2, g2, b2] = otherChar.color;
      const lineWidth = math.mapRange(dist, 0, 80, 8, 1);
      const color1 = `rgb(${r1}, ${g1}, ${b1})`;
      const color2 = `rgb(${r2}, ${g2}, ${b2})`;

      if (lineRenderer === RENDER_CANVAS) {
        renderLineCanvas(char, otherChar, lineWidth, color1, color2, fgCanvasCtx);
      } else if (lineRenderer === RENDER_CSS) {
        const lineId = `line_${i}_${j}`;
        const $line = $lines[lineId];
        renderLineCss(char, otherChar, lineWidth, color1, color2, $line);
      }

      if (char.targetRadius >= otherChar.targetRadius) {
        otherChar.targetColor = [...char.targetColor];
      } else {
        char.targetColor = [...otherChar.targetColor];
      }
    }
  }
}

function updateAudioVisualizer() {
  if (!loadedSong) {
    return;
  }
  audioAnalyzer.getByteFrequencyData(audioData);
  const data = [...audioData];
  const dataLen = data.length;
  const segmentWidth = Math.floor((dataLen * 0.8) / charsLen);

  let value;
  let i = -1;
  while (++i < charsLen) {
    const startIndex = i * segmentWidth;
    let sum = 0;
    for (let j = 0; j < segmentWidth; j++) {
      sum += data[startIndex + j];
    }
    value = (sum / segmentWidth) * 0.01;
    analyzedAudioData[charsLen - i - 1] = value;
  }

  // update audio visualizer color based on the max average
  const targetColors = {};
  let char;
  i = -1;
  while (++i < charsLen) {
    char = chars[i];
    if (!targetColors[char.colorId]) {
      targetColors[char.colorId] = 0;
    }
    ++targetColors[char.colorId];
  }
  const colorIds = Object.keys(targetColors);
  const colorIdsLen = colorIds.length;
  i = -1;
  let colorCount,
    maxColorCount = -1,
    colorId,
    maxColorId;
  while (++i < colorIdsLen) {
    colorId = colorIds[i];
    colorCount = targetColors[colorId];
    if (maxColorCount < colorCount) {
      maxColorCount = colorCount;
      maxColorId = colorId;
    }
  }
  if (audioVisColor.colorId !== maxColorId) {
    audioVisColor.targetColor = maxColorId.split('_').map((v) => +v);
  }
  audioVisColor.update();

  const lineSpace = (vw / dataLen) * 0.5;
  renderAudioVisualizer(data, lineSpace, audioVisColor.color, fgCanvasCtx, vw, vh);
}

function update() {
  if (DEBUG) {
    stats.begin();
  }
  now = Date.now();

  if (charRenderer === RENDER_CANVAS || explosionRenderer === RENDER_CANVAS || lineRenderer === RENDER_CANVAS) {
    fgCanvasCtx.clearRect(0, 0, vw, vh);
  }

  updateAudioVisualizer();
  updateExplosions();
  updateCharacters();
  updateLines();

  if (now > nextChangeUp) {
    nextChangeUp = now + CHANGE_UP_INTERVAL;
    changeUp();
  }

  if (now > nextChangeMode) {
    nextChangeMode = now + CHANGE_MODE_INTERVAL;
    changeMode();
  }

  if (DEBUG) {
    stats.end();
  }

  if (charRenderer === RENDER_WEBGL || explosionRenderer === RENDER_WEBGL || lineRenderer === RENDER_WEBGL) {
    render3d();
  }

  window.requestAnimationFrame(update);
}

function explodeAt(x, y) {
  if (isViewingArtwork) {
    return;
  }

  nextChangeUp = now + CHANGE_UP_INTERVAL;
  nextChangeMode = now + CHANGE_MODE_INTERVAL;

  // find free explosion
  let explosion;
  for (let i = 0; i < explosionsLen; i++) {
    if (!explosions[i].isAwake) {
      explosion = explosions[i];
    }
  }

  if (explosion) {
    explosion.x = x;
    explosion.y = y;
    explosion.color = getRandomColor();
    explosion.awake();

    for (let i = 0; i < charsLen; i++) {
      const char = chars[i];
      const dist = char.dist(explosion);

      if (dist < 200) {
        const force = (1 - Math.min(dist / 200, 1)) * 100 + char.maxSpeed;
        char.maxForce = 0.9;
        char.color = explosion.color;
        char.targetColor = explosion.color;
        char.fleeFrom(x, y, Date.now() + 500 + Math.floor(Math.random() * 500), force);
      }
    }
  }
}

function changeUp() {
  const colors = getRandomColors();

  for (let i = 0; i < charsLen; i++) {
    const char = chars[i];
    char.targetColor = colors[Math.floor(Math.random() * colors.length)];

    switch (mode) {
      case MODE_WANDER:
        char.shape = SHAPE_CIRCLE;
        char.targetRadius = random.range(tweakParams.minRadius, tweakParams.maxRadius);
        char.targetMaxSpeed = random.range(tweakParams.minSpeed, tweakParams.maxSpeed);
        break;

      case MODE_FLOCK:
        char.shape = SHAPE_CIRCLE;
        char.targetRadius = tweakParams.minRadius;
        char.targetMaxSpeed = random.range(tweakParams.minFlockSpeed, tweakParams.maxFlockSpeed);
        break;

      case MODE_GRID:
        char.targetMaxSpeed = random.range(tweakParams.minFlockSpeed, tweakParams.maxFlockSpeed);
        break;

      default:
        break;
    }
  }

  updateFlocksByColor();
}

function changeCharRenderer(newRenderer) {
  charRenderer = newRenderer;
  document.body.setAttribute('data-char-renderer', newRenderer);
}

function changeExplosionRenderer(newRenderer) {
  explosionRenderer = newRenderer;
  document.body.setAttribute('data-explosion-renderer', newRenderer);
}

function changeLineRenderer(newRenderer) {
  lineRenderer = newRenderer;
  document.body.setAttribute('data-line-renderer', newRenderer);
}

function changeMode(newMode) {
  mode = typeof newMode === 'number' ? newMode : (mode + 1) % MODES.length;
  tweakParams.mode = mode;
  changeUp();
}

function updateFlocksByColor() {
  flocksByColorIds = {};

  for (let i = 0; i < charsLen; i++) {
    const char = chars[i];
    const colorId = char.colorId;
    if (!flocksByColorIds[colorId]) {
      flocksByColorIds[colorId] = [];
    }
    flocksByColorIds[colorId].push(char);
  }
}

function resize() {
  const { innerWidth, innerHeight } = window;
  $fgCanvas.width = innerWidth;
  $fgCanvas.height = innerHeight;
  vw = $fgCanvas.width;
  vh = $fgCanvas.height;
  boundary = {
    top: 0,
    left: 0,
    bottom: vh,
    right: vw
  };
  for (let i = 0; i < charsLen; i++) {
    const char = chars[i];
    char.boundary = boundary;
  }
}

function handleMouseDown(event) {
  if (event.target !== document.body) {
    return;
  }

  mouse.x = event.clientX;
  mouse.y = event.clientY;
  mouse0.x = mouse.x;
  mouse0.y = mouse.y;
  isMouseDown = true;
}

function handleMouseMove(event) {
  if (!isMouseDown) {
    return;
  }

  mouse.x = event.clientX;
  mouse.y = event.clientY;
}

function handleMouseUp(event) {
  if (!isMouseDown) {
    return;
  }

  mouse.x = event.clientX;
  mouse.y = event.clientY;
  isMouseDown = false;

  for (let i = 0; i < charsLen; i++) {
    const char = chars[i];
    char.seekTarget = null;
    char.maxForce = 0.1;
    switch (mode) {
      case MODE_GRID:
      case MODE_FLOCK:
        char.targetMaxSpeed = random.range(tweakParams.minFlockSpeed, tweakParams.maxFlockSpeed);
        break;

      default:
        char.targetMaxSpeed = random.range(tweakParams.minSpeed, tweakParams.maxSpeed);
        break;
    }
  }

  mouseFlocks = [];

  if (event.target !== document.body) {
    return;
  }

  const dx = mouse.x - mouse0.x;
  const dy = mouse.y - mouse0.y;
  const dist = dx * dx + dy * dy;

  if (dist < 25) {
    if (isViewingArtwork) {
      handleArtworkHide();
    } else {
      explodeAt(event.clientX, event.clientY);
    }
  }
}

window.addEventListener('resize', resize);
document.addEventListener('mousedown', handleMouseDown);
document.addEventListener('mousemove', handleMouseMove);
document.addEventListener('mouseup', handleMouseUp);

init();
