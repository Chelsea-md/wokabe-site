// The illustrated welcome is decorative; readiness and elapsed time advance it.
const boot = document.querySelector('#boot-loading');
const art = document.createElement('div');
art.className = 'entry-illustration';
art.innerHTML = '<img class="entry-background" src="../../../assets/intro-background-v2.png" alt=""><div class="entry-logo-position"><img class="entry-logo" src="../../../assets/intro-logo-v2.png" alt="Flower vs Zombie: Base Defense"></div>';
boot.prepend(art);
// Keep loading feedback attached to the illustration, not the browser gutter.
const entryProgress = boot.querySelector('.boot-progress');
if (entryProgress) art.append(entryProgress);
boot.classList.add('illustrated-entry');
window.entryIntroReady = Promise.all(Array.from(art.querySelectorAll('img'), img => img.decode())).then(async () => {
  art.classList.add('loaded');
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await new Promise(resolve => setTimeout(resolve, 3000));
}).catch(error => {
  console.warn('Illustrated welcome unavailable; using loading fallback.', error);
  boot.classList.remove('illustrated-entry');
  if (entryProgress) boot.append(entryProgress);
  art.remove();
});
