// Viewport coordinates keep feedback accurate even when the game shell rotates.
document.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0 || !document.body.classList.contains('ready')) return;
  if (!event.target.closest('#game-shell, #garden-dialog-layer')) return;
  const dot = document.createElement('i');
  dot.className = 'game-tap-feedback';
  dot.setAttribute('aria-hidden', 'true');
  dot.style.left = `${event.clientX}px`;
  dot.style.top = `${event.clientY}px`;
  // Bounded transient nodes; no pointer capture or preventDefault on gameplay.
  const old = document.querySelectorAll('.game-tap-feedback');
  if (old.length >= 6) old[0].remove();
  document.body.append(dot);
  dot.addEventListener('animationend', () => dot.remove(), {once:true});
  setTimeout(() => dot.remove(), 600);
}, {capture:true, passive:true});
