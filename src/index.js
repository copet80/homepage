import { math, random } from 'canvas-sketch-util';
import { Pane } from 'tweakpane';
import Stats from 'stats.js';

import './styles.css';

import ShapeShifter, { SHAPE_CIRCLE, SHAPE_SQUARE } from './core/ShapeShifter';
import Explosion from './core/Explosion';
import { EDGE_WRAP } from './core/Character';
import Vector2D from './core/Vector2D';
import { roundRect } from './utils/draw';

window.AudioContext = window.AudioContext || window.webkitAudioContext;

const DEBUG = false;

let audioSource;
let audioData;
let audioAnalyzer;

const $fgCanvas = document.getElementById('fgCanvas');
const fgCanvasCtx = $fgCanvas.getContext('2d');

const $divCanvas = document.getElementById('divCanvas');
const $svgCanvas = document.getElementById('svgCanvas');

const $bgDiv = document.getElementById('bgDiv');
const $artworksList = document.getElementById('artworksList');
const $songsList = document.getElementById('songsList');

const RENDER_CANVAS = 0;
const RENDER_CSS = 1;

const MODE_WANDER = 0;
const MODE_FLOCK = 1;
const MODE_GRID = 2;

const modes = [MODE_WANDER, MODE_FLOCK, MODE_GRID];

const NUM_CHAR_COLS = 12;
const NUM_CHAR_ROWS = 12;
const NUM_CHARS = NUM_CHAR_COLS * NUM_CHAR_ROWS;
const NUM_EXPLOSIONS = 20;
const CHANGE_UP_INTERVAL = 10 * 1000;
const CHANGE_MODE_INTERVAL = 60 * 1000;

const SONGS = [
  {
    id: 'ALittleAdventure',
    title: 'A Little Adventure',
    src: '/audio/A Little Adventure.mp3',
    thumb: '/img/ALittleAdventure-thumb.jpg'
  },
  {
    id: 'GrooveAndSmile',
    title: 'Groove and Smile',
    src: '/audio/Groove and Smile.mp3',
    thumb: '/img/GrooveAndSmile-thumb.jpg'
  },
  {
    id: 'MarchingRabbits',
    title: 'Marching Rabbits',
    src: '/audio/Marching Rabbits.mp3',
    thumb: '/img/MarchingRabbits-thumb.jpg'
  },
  {
    id: 'SpacePirate',
    title: 'Space Pirate',
    src: '/audio/Space Pirate.mp3',
    thumb: '/img/SpacePirate-thumb.jpg'
  },
  {
    id: 'SpaceRockin',
    title: "Space Rockin'",
    src: "/audio/Space Rockin'.mp3",
    thumb: '/img/SpaceRockin-thumb.jpg'
  },
  {
    id: 'TodayWillBeBetter',
    title: 'Today Will Be Better',
    src: '/audio/Today will be Better.mp3',
    thumb: '/img/TodayWillBeBetter-thumb.jpg'
  },
  {
    id: 'WildArms',
    title: 'Wild Arms',
    src: '/audio/Wild Arms.mp3',
    thumb: '/img/WildArms-thumb.jpg'
  }
];

const SONGS_MAP = Object.fromEntries(SONGS.map((song) => [song.src, song]));

const ARTWORK_DIMENSIONS = {
  Angel: [600, 600],
  Bokutachi: [338, 600],
  Gent: [338, 600],
  Graduation: [600, 600],
  Igo: [600, 600],
  Mii: [338, 600],
  Ohayou: [600, 600],
  Us: [600, 600],
  Violin: [600, 600]
};

const ARTWORK_GRIDS = {
  Angel: [12, 12],
  Bokutachi: [9, 16],
  Gent: [9, 16],
  Graduation: [12, 12],
  Igo: [12, 12],
  Mii: [9, 16],
  Ohayou: [12, 12],
  Us: [12, 12],
  Violin: [12, 12]
};

const ARTWORK_ASSETS = {};

const ARTWORKS = ['Angel', 'Bokutachi', 'Gent', 'Graduation', 'Igo', 'Mii', 'Ohayou', 'Us', 'Violin'].map((title) => ({
  title,
  src: `img/${title}-medres.jpg`,
  hires: `img/${title}-hires.jpg`,
  thumb: `img/${title}-thumb.jpg`,
  bitmap: `img/${title}-bitmap.jpg`,
  width: ARTWORK_DIMENSIONS[title][0],
  height: ARTWORK_DIMENSIONS[title][1],
  cols: ARTWORK_GRIDS[title][0],
  rows: ARTWORK_GRIDS[title][1]
}));

const ARTWORKS_MAP = Object.fromEntries(ARTWORKS.map((artwork) => [artwork.title, artwork]));

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

const explosions = [];
const $explosions = {};
const chars = [];
const $chars = {};
const $lines = {};
const songAudios = {};
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

const params = {
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
  initSongs();
  initArtworks();
  initCharacters();
  initLines();
  initExplosions();
  if (DEBUG) {
    initTweakPane();
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

function initTweakPane() {
  const pane = new Pane();

  // renderers
  const rendererFolder = pane.addFolder({
    title: 'Renderers'
  });
  rendererFolder.addInput(params, 'charRenderer', {
    label: 'Agents',
    options: {
      canvas: RENDER_CANVAS,
      css: RENDER_CSS
    }
  });
  rendererFolder.addInput(params, 'lineRenderer', {
    label: 'Lines',
    options: {
      canvas: RENDER_CANVAS,
      css: RENDER_CSS
    }
  });
  rendererFolder.addInput(params, 'explosionRenderer', {
    label: 'Explosions',
    options: {
      canvas: RENDER_CANVAS,
      css: RENDER_CSS
    }
  });

  // music
  const musicFolder = pane.addFolder({
    title: 'Music'
  });
  musicFolder.addInput(params, 'song', {
    label: 'Song',
    options: Object.fromEntries(SONGS.map((song) => [song.title, song.src]))
  });
  const btnMusicPlay = musicFolder.addButton({ title: 'Play', label: '' });
  const btnMusicPause = musicFolder.addButton({ title: 'Pause', label: '' });
  btnMusicPlay.on('click', handleMusicPlay);
  btnMusicPause.on('click', handleMusicPause);

  // artwork
  const artworkFolder = pane.addFolder({
    title: 'Art'
  });
  artworkFolder.addInput(params, 'artwork', {
    label: 'Artwork',
    options: Object.fromEntries(ARTWORKS.map((artwork) => [artwork.title, artwork.title]))
  });
  const btnArtworkShow = artworkFolder.addButton({ title: 'Show', label: '' });
  const btnArtworkHide = artworkFolder.addButton({ title: 'Hide', label: '' });
  btnArtworkShow.on('click', handleArtworkShow);
  btnArtworkHide.on('click', handleArtworkHide);

  // agents
  const agentFolder = pane.addFolder({
    title: 'Agents'
  });
  agentFolder.addInput(params, 'mode', {
    label: 'Behaviour',
    options: {
      wander: MODE_WANDER,
      flock: MODE_FLOCK,
      grid: MODE_GRID
    }
  });
  agentFolder.addInput(params, 'maxSpeed', {
    label: 'Wander speed',
    min: 0.5,
    max: 3,
    step: 0.1
  });
  agentFolder.addInput(params, 'maxFlockSpeed', {
    label: 'Flock speed',
    min: 3,
    max: 7,
    step: 0.1
  });
  agentFolder.addInput(params, 'minRadius', {
    label: 'Min radius',
    min: 5,
    max: 30,
    step: 1
  });
  agentFolder.addInput(params, 'maxRadius', {
    label: 'Max radius',
    min: 5,
    max: 30,
    step: 1
  });

  pane.on('change', handlePaneChange);
}

function handlePaneChange(event) {
  const minSpeed = Math.min(params.minSpeed, params.maxSpeed);
  const maxSpeed = Math.max(params.minSpeed, params.maxSpeed);
  const minFlockSpeed = Math.min(params.minFlockSpeed, params.maxFlockSpeed);
  const maxFlockSpeed = Math.max(params.minFlockSpeed, params.maxFlockSpeed);
  const minRadius = Math.min(params.minRadius, params.maxRadius);
  const maxRadius = Math.max(params.minRadius, params.maxRadius);

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
      changeMode(params.mode);
      break;

    case 'charRenderer':
      changeCharRenderer(params.charRenderer);
      break;

    case 'explosionRenderer':
      changeExplosionRenderer(params.explosionRenderer);
      break;

    case 'lineRenderer':
      changeLineRenderer(params.lineRenderer);
      break;

    case 'song':
      changeSong(params.song);
      break;

    case 'artwork':
      changeArtwork(params.artwork);
      break;

    default:
      break;
  }
}

function initArtworks() {
  ARTWORKS.forEach((artwork, i) => {
    ARTWORK_ASSETS[artwork.title] = {};

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
      ARTWORK_ASSETS[artwork.title].bitmap = bitmapColors;
    };

    const medres = new Image();
    medres.src = artwork.src;
    medres.onload = () => {
      ARTWORK_ASSETS[artwork.title].medres = medres;
    };

    // add thumb UI
    const thumbScale = 0.5;
    const thumbCirc = 240 * thumbScale;
    const thumbOffsetX = ARTWORKS.length * -0.5 * thumbCirc + thumbCirc * 0.5;
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
      changeArtwork(artwork.title, true);
    });
  });
}

function initSongs() {
  SONGS.forEach((song, i) => {
    // add thumb UI
    const thumbScale = 0.5;
    const thumbCirc = 240 * thumbScale;
    const thumbOffsetX = SONGS.length * -0.5 * thumbCirc + thumbCirc * 0.5;
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
      changeSong(song.src);
    });
  });
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
  audioSource = songAudios[url].audioSource;
  audioAnalyzer = songAudios[url].audioAnalyzer;
  audioData = songAudios[url].audioData;

  console.log(url, audio.duration);
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

function initLines() {
  const svgns = 'http://www.w3.org/2000/svg';

  const defs = document.createElementNS(svgns, 'defs');
  $svgCanvas.appendChild(defs);

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

      line.setAttribute('stroke', `url(#${lineId})`);
      $svgCanvas.appendChild(line);

      $lines[lineId] = {
        line,
        gradient,
        stop1,
        stop2
      };
    }
  }
}

function initCharacters() {
  for (let i = 0; i < NUM_CHARS; i++) {
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
    char.targetMaxSpeed = random.range(params.minSpeed, params.maxSpeed);
    char.boundary = boundary;
    char.targetRadius = radius;
    chars.push(char);

    const $char = document.createElement('div');
    $char.setAttribute('id', charId);
    $char.className = 'char';
    $divCanvas.appendChild($char);
    $chars[charId] = $char;
  }
  charsLen = chars.length;
}

function initExplosions() {
  for (let i = 0; i < NUM_EXPLOSIONS; i++) {
    const explosionId = `explosion_${i}`;
    const explosion = new Explosion(explosionId);
    explosions.push(explosion);

    const $explosion = document.createElement('div');
    $explosion.setAttribute('id', explosionId);
    $explosion.className = 'explosion';
    $divCanvas.appendChild($explosion);
    $explosions[explosionId] = $explosion;
  }
  explosionsLen = explosions.length;
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
    bitmapData = ARTWORK_ASSETS[artworkInView.title].bitmap;
  } else {
    if (mode === MODE_GRID) {
      gridCirc = params.maxRadius * 2 + 20;
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
            char.targetMaxSpeed = random.range(params.minSpeed * 5, params.maxSpeed * 5);
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
            params.minRadius * 0.5 + (radiusValue * 0.5 + 1) * (params.maxRadius - params.minRadius * 0.75);
          char.radius = char.targetRadius;
          char.targetColor = getNoiseColor(0.5 + colorValue * 0.5);
          char.color = char.targetColor;
        } else {
          char.wander();
        }
      }

      if (isSongPlaying) {
        const audioValue = analyzedAudioData[i];
        char.targetRadius = params.minRadius + audioValue * (params.maxRadius - params.minRadius);
        char.radius = char.targetRadius;
      }
    }

    char.update();
    renderCharacter(char);
  }

  if (allSettledToShowImage && !medResImage) {
    showMedResImage(ARTWORK_ASSETS[artworkInView.title].medres);
  }
}

function renderCharacter(char) {
  const [r, g, b] = char.color;
  const rad = char.radius;
  const circ = rad * 2;
  const shapeStep = char.shapeStep;
  const x = char.x;
  const y = char.y;
  const strokeColor = `rgb(${r}, ${g}, ${b})`;

  if (charRenderer === RENDER_CANVAS) {
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
  } else if (charRenderer === RENDER_CSS) {
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

function updateExplosions() {
  for (let i = 0; i < explosionsLen; i++) {
    const explosion = explosions[i];
    if (explosion.isAwake) {
      explosion.update();
      renderExplosion(explosion);
    }
  }
}

function renderExplosion(explosion) {
  const x = explosion.x;
  const y = explosion.y;
  const life = explosion.life;
  const [r, g, b] = explosion.color;
  const rad = explosion.radius;
  const strokeColor = `rgba(${r}, ${g}, ${b}, ${life})`;

  if (explosionRenderer === RENDER_CANVAS) {
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
  } else if (explosionRenderer === RENDER_CSS) {
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
}

function update() {
  if (DEBUG) {
    stats.begin();
  }
  now = Date.now();

  if (charRenderer === RENDER_CANVAS || explosionRenderer === RENDER_CANVAS || lineRenderer === RENDER_CANVAS) {
    fgCanvasCtx.clearRect(0, 0, vw, vh);
  }

  renderAudioVisualizer();
  updateExplosions();
  updateCharacters();
  renderLines();

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

  window.requestAnimationFrame(update);
}

function renderAudioVisualizer() {
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

  const space = (vw / dataLen) * 0.5;
  const hvw = vw * 0.5;
  const ctx = fgCanvasCtx;
  const halfDataLen = dataLen * 0.25;
  const [r, g, b] = audioVisColor.color;

  i = -1;
  let ix;
  ctx.lineWidth = 1;

  while (++i < halfDataLen) {
    ix = i * 4;
    value = data[ix] * 0.01;
    const x = space * ix;
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

function renderLines() {
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
      } else if (lineRenderer === RENDER_CSS) {
        const lineId = `line_${i}_${j}`;
        const { line, gradient, stop1, stop2 } = $lines[lineId];
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

      if (char.targetRadius >= otherChar.targetRadius) {
        otherChar.targetColor = [...char.targetColor];
      } else {
        char.targetColor = [...otherChar.targetColor];
      }
    }
  }
}

function getNoiseColor(value) {
  const b = Math.sin(value * Math.PI) * 255;
  const g = Math.sin(Math.PI * 0.5 + value * Math.PI) * 255;
  const r = Math.cos(Math.PI + value * Math.PI) * 255;
  return [r, g, b];
}

function getRandomColor() {
  const colorRandom = Math.floor(Math.random() * 3);
  return [
    colorRandom === 0 ? 0 : 155 + Math.floor(Math.random() * 100),
    colorRandom === 1 ? 0 : 155 + Math.floor(Math.random() * 100),
    colorRandom === 2 ? 0 : 155 + Math.floor(Math.random() * 100)
  ];
}

function getRandomColors(count = 5) {
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(getRandomColor());
  }
  return colors;
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
        char.targetRadius = random.range(params.minRadius, params.maxRadius);
        char.targetMaxSpeed = random.range(params.minSpeed, params.maxSpeed);
        break;

      case MODE_FLOCK:
        char.shape = SHAPE_CIRCLE;
        char.targetRadius = params.minRadius;
        char.targetMaxSpeed = random.range(params.minFlockSpeed, params.maxFlockSpeed);
        break;

      case MODE_GRID:
        char.targetMaxSpeed = random.range(params.minFlockSpeed, params.maxFlockSpeed);
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
  mode = typeof newMode === 'number' ? newMode : (mode + 1) % modes.length;
  params.mode = mode;
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
        char.targetMaxSpeed = random.range(params.minFlockSpeed, params.maxFlockSpeed);
        break;

      default:
        char.targetMaxSpeed = random.range(params.minSpeed, params.maxSpeed);
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
