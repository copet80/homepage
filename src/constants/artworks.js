export const ARTWORK_DIMENSIONS = {
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

export const ARTWORK_GRIDS = {
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

export const ARTWORKS = ['Angel', 'Bokutachi', 'Gent', 'Graduation', 'Igo', 'Mii', 'Ohayou', 'Us', 'Violin'].map(
  (title) => ({
    title,
    src: `img/${title}-medres.jpg`,
    hires: `img/${title}-hires.jpg`,
    thumb: `img/${title}-thumb.jpg`,
    bitmap: `img/${title}-bitmap.jpg`,
    width: ARTWORK_DIMENSIONS[title][0],
    height: ARTWORK_DIMENSIONS[title][1],
    cols: ARTWORK_GRIDS[title][0],
    rows: ARTWORK_GRIDS[title][1]
  })
);

export const ARTWORKS_MAP = Object.fromEntries(ARTWORKS.map((artwork) => [artwork.title, artwork]));
