/** Launch brief confetti burst — local canvas, no external service. */
export function launchConfetti(
  canvas: HTMLCanvasElement,
  durationMs: number = 1200,
  origin?: { x: number; y: number }
): void {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    return;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.max(1, Math.floor(width * dpr));
  canvas.height = Math.max(1, Math.floor(height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const originX = origin?.x ?? width / 2;
  const originY = origin?.y ?? height / 2;
  const particleCount = durationMs >= 1200 ? 70 : 45;
  const particles = Array.from({ length: particleCount }, () => ({
    x: originX,
    y: originY,
    vx: (Math.random() - 0.5) * 10,
    vy: Math.random() * -10 - 3,
    color: `hsl(${Math.random() * 360}, 70%, 55%)`,
    size: Math.random() * 6 + 3
  }));
  const start = Date.now();
  const tick = (): void => {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    if (Date.now() - start < durationMs) {
      requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, width, height);
    }
  };
  requestAnimationFrame(tick);
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
