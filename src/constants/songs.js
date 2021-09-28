export const SONGS = [
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

export const SONGS_MAP = Object.fromEntries(SONGS.map((song) => [song.src, song]));
