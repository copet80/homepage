import { Pane } from 'tweakpane';
import { ARTWORKS } from '../constants/artworks';
import { MODE_FLOCK, MODE_GRID, MODE_WANDER, RENDER_CANVAS, RENDER_CSS, RENDER_WEBGL } from '../constants/general';
import { SONGS } from '../constants/songs';

export function initTweakPane(params, { onMusicPlay, onMusicPause, onArtworkShow, onArtworkHide, onPaneChange }) {
  const pane = new Pane();

  // renderers
  const rendererFolder = pane.addFolder({
    title: 'Renderers'
  });
  rendererFolder.addInput(params, 'charRenderer', {
    label: 'Agents',
    options: {
      canvas: RENDER_CANVAS,
      css: RENDER_CSS,
      webGL: RENDER_WEBGL
    }
  });
  rendererFolder.addInput(params, 'lineRenderer', {
    label: 'Lines',
    options: {
      canvas: RENDER_CANVAS,
      css: RENDER_CSS,
      webGL: RENDER_WEBGL
    }
  });
  rendererFolder.addInput(params, 'explosionRenderer', {
    label: 'Explosions',
    options: {
      canvas: RENDER_CANVAS,
      css: RENDER_CSS,
      webGL: RENDER_WEBGL
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
  btnMusicPlay.on('click', onMusicPlay);
  btnMusicPause.on('click', onMusicPause);

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
  btnArtworkShow.on('click', onArtworkShow);
  btnArtworkHide.on('click', onArtworkHide);

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

  pane.on('change', onPaneChange);
}
