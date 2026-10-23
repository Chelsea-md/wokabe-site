// This isolated preview keeps the roster pager usable in the embedded browser.
document.addEventListener('click', (event) => {
  const button = event.target.closest('#plant-carousel-controls button[data-scroll]');
  if (!button || button.disabled) return;
  const grid = document.querySelector('#plants-grid');
  if (!grid) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  grid.scrollTo({
    left: grid.scrollLeft + Number(button.dataset.scroll) * grid.clientWidth,
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  });
}, true);
