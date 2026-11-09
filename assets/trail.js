/* Traîne du curseur sur le damier : les 4 derniers carreaux traversés se marquent puis s'effacent.
   Calé sur la grille du damier (--check). Souris uniquement, désactivé si "réduire les animations". */
(function () {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const TRAIL = 7, FADE = 450, COLOR = '42, 61, 255', MAXA = 0.8;
  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none';
  document.body.prepend(cv);
  const ctx = cv.getContext('2d');
  let dpr = 1, W = 0, H = 0, S = 11;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    S = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--check')) || 11;
  }
  size(); addEventListener('resize', size);

  let cells = [], last = null, raf = 0, lastMove = 0;
  function push(cx, cy) { cells.push([cx, cy]); if (cells.length > TRAIL) cells.shift(); }
  function line(x0, y0, x1, y1) {            // Bresenham : pas de trou quand la souris va vite
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy, n = 0;
    while (n++ < 400) {
      if (x0 !== last[0] || y0 !== last[1]) push(x0, y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  }
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const o = document.documentElement.getBoundingClientRect();      // origine réelle du damier (suit le défilement, même fractionnaire)
    const cx = Math.floor((e.clientX - o.left) / S), cy = Math.floor((e.clientY - o.top) / S);   // coordonnées de page : la grille suit le damier quand la page défile
    if (!last) { push(cx, cy); }
    else if (cx !== last[0] || cy !== last[1]) line(last[0], last[1], cx, cy);
    last = [cx, cy]; lastMove = performance.now();
    if (!raf) raf = requestAnimationFrame(draw);
  }, { passive: true });
  addEventListener('scroll', () => { if (cells.length && !raf) raf = requestAnimationFrame(draw); }, { passive: true });
  document.addEventListener('mouseleave', () => { last = null; });
  document.addEventListener('visibilitychange', () => { cells = []; last = null; });

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    const o = document.documentElement.getBoundingClientRect(), ox = Math.round(o.left * dpr) / dpr, oy = Math.round(o.top * dpr) / dpr;
    const idle = Math.min(1, Math.max(0, (now - lastMove) / FADE));       // s'efface quand le curseur s'arrête
    const n = cells.length;
    for (let i = 0; i < n; i++) {
      const a = ((i + 1) / n) * MAXA * (1 - idle);                        // le plus ancien est le plus pâle
      ctx.fillStyle = 'rgba(' + COLOR + ',' + a.toFixed(3) + ')';
      ctx.fillRect(cells[i][0] * S + ox, cells[i][1] * S + oy, S, S);
    }
    if (idle < 1) raf = requestAnimationFrame(draw); else { raf = 0; cells = []; }
  }
})();
