// Keep world coordinates stable while rendering directly at display resolution.
export function observeWorldResolution(canvas, width, height, onScale) {
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    // A 4096px backing width covers full-HD Retina without unbounded allocations.
    const scale = Math.min(4096 / width, Math.max(.5, rect.width * (devicePixelRatio || 1) / width));
    const pixelWidth = Math.round(width * scale), pixelHeight = Math.round(height * scale);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      const context = canvas.getContext('2d');
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
    }
    onScale(pixelWidth / width);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  window.addEventListener('resize', resize);
  resize();
  return () => { observer.disconnect(); window.removeEventListener('resize', resize); };
}
