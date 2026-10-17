// The same approved tile is available before the first game module finishes loading.
export function createLoadingWallpaper() {
  const url = new URL('assets/cartoon-v5-wallpaper-tile.png', import.meta.url).href;
  document.documentElement.style.setProperty('--game-wallpaper', `url("${url}")`);
}
