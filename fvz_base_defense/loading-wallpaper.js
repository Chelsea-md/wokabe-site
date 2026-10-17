// Reuse the game icon atlas as a quiet, seamlessly repeating loading wallpaper.
export async function createLoadingWallpaper(skins) {
  const tile = document.createElement('canvas');
  tile.width = 600;
  tile.height = 400;
  const g = tile.getContext('2d');
  const sources = [skins.sun, skins.coin, skins.helmet, skins.swords,
    new URL('assets/cartoon-v5-plants-sprout-transparent.png', import.meta.url).href];
  try {
    const icons = await Promise.all(sources.map(async src => {
      const im = new Image();
      im.src = src;
      await im.decode();
      return im;
    }));
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        const im = icons[(row * 2 + col) % icons.length];
        const h = 37, w = h * im.width / im.height;
        g.save();
        g.translate(col * 100 + 35 + (row % 2) * 24, row * 100 + 40);
        g.rotate(((row + col) % 3 - 1) * .24);
        g.drawImage(im, -w / 2, -h / 2, w, h);
        g.restore();
      }
    }
    document.documentElement.style.setProperty('--game-wallpaper', `url("${tile.toDataURL()}")`);
  } catch (error) {
    // A decoration failure must never block loading the actual game.
    console.warn('Loading wallpaper unavailable', error);
  }
}
