/* Animated neural-network canvas — concentrated in the upper hero region */
(function () {
  const canvas = document.getElementById('net-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, dpr, nodes = [], raf;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  function build() {
    nodes = [];
    const band = Math.min(H, 900);
    const count = Math.round(Math.max(26, Math.min(60, W / 26)));
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * band * 1.05,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: 1.4 + Math.random() * 2.6,
        pulse: Math.random() * Math.PI * 2,
        big: Math.random() < 0.16
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const line = css('--net-line') || 'rgba(47,107,246,0.14)';
    const stroke = css('--node-stroke') || 'rgba(47,107,246,0.55)';
    const cyan = css('--accent-cyan') || '#16b9e0';
    const maxD = 168;

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < maxD) {
          const o = (1 - d / maxD);
          ctx.strokeStyle = line.replace(/[\d.]+\)$/, (o * 0.9).toFixed(3) + ')');
          ctx.lineWidth = o * 1.1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const n of nodes) {
      n.pulse += 0.02;
      const glow = (Math.sin(n.pulse) + 1) / 2;
      const r = n.r + (n.big ? 1.4 : 0);

      if (n.big) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 7 + glow * 4, 0, Math.PI * 2);
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r + 11);
        g.addColorStop(0, hexA(cyan, 0.30 + glow * 0.2));
        g.addColorStop(1, hexA(cyan, 0));
        ctx.fillStyle = g; ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = n.big ? cyan : hexA(cyan, 0.7);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  function hexA(hex, a) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  function tick() {
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < -20) n.x = W + 20; if (n.x > W + 20) n.x = -20;
      if (n.y < -20) n.y = Math.min(H, 900) + 20; if (n.y > Math.min(H, 900) + 40) n.y = -20;
    }
    draw();
    raf = requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener('resize', resize);
  if (reduce) { draw(); } else { tick(); }
  window.__netRedraw = draw;
})();
