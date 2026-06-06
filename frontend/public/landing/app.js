/* ============ Theme toggle ============ */
(function () {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const stored = localStorage.getItem('ha-theme');
  if (stored) root.setAttribute('data-theme', stored);
  updateIcon();

  btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('ha-theme', next);
    updateIcon();
    if (window.__netRedraw) requestAnimationFrame(window.__netRedraw);
  });

  function updateIcon() {
    const dark = root.getAttribute('data-theme') === 'dark';
    btn.innerHTML = dark
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
})();

/* ============ Forecast chart (Prophet-style with CI band) ============ */
(function () {
  const host = document.getElementById('forecast-chart');
  if (!host) return;
  const W = 560, H = 230, padL = 8, padR = 8, padT = 12, padB = 26;
  const iw = W - padL - padR, ih = H - padT - padB;

  const hist = [];
  let v = 0.46;
  for (let i = 0; i <= 22; i++) {
    v += (Math.sin(i / 2.4) * 0.035) + 0.012 + (Math.random() - 0.5) * 0.02;
    hist.push(Math.max(0.2, v));
  }
  const splitV = hist[hist.length - 1];
  const fc = [];
  let f = splitV;
  for (let i = 1; i <= 16; i++) {
    f += -0.0125 + Math.sin(i / 3) * 0.006;
    fc.push(Math.max(0.15, f));
  }
  const all = hist.concat(fc);
  const n = all.length - 1;
  const min = Math.min(...all) - 0.06, max = Math.max(...all) + 0.06;

  const X = i => padL + (i / n) * iw;
  const Y = val => padT + ih - ((val - min) / (max - min)) * ih;

  function path(arr, startIdx) {
    return arr.map((val, k) => `${k === 0 ? 'M' : 'L'} ${X(startIdx + k).toFixed(1)} ${Y(val).toFixed(1)}`).join(' ');
  }

  const band = fc.map((val, i) => ({ i: hist.length - 1 + i + 1, hi: val + 0.04 + i * 0.006, lo: val - 0.04 - i * 0.006 }));
  const bandTop = band.map((p, k) => `${k === 0 ? 'M' : 'L'} ${X(p.i).toFixed(1)} ${Y(p.hi).toFixed(1)}`).join(' ');
  const bandBot = band.slice().reverse().map(p => `L ${X(p.i).toFixed(1)} ${Y(p.lo).toFixed(1)}`).join(' ');
  const bandPath = `M ${X(hist.length - 1).toFixed(1)} ${Y(splitV).toFixed(1)} ${bandTop} ${bandBot} Z`;

  const months = ['Mei', 'Jun', 'Jul', 'Ags', 'Sep'];
  const ticks = months.map((m, k) => `<text class="chart-axis" x="${(padL + (k / (months.length - 1)) * iw).toFixed(0)}" y="${H - 8}" text-anchor="${k === 0 ? 'start' : k === months.length - 1 ? 'end' : 'middle'}">${m}</text>`).join('');

  const lastX = X(n), lastY = Y(all[all.length - 1]);
  const splitX = X(hist.length - 1);

  host.innerHTML = `
  <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Grafik proyeksi views">
    <defs>
      <linearGradient id="histFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--accent-blue)" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="var(--accent-blue)" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="var(--accent-blue)"/>
        <stop offset="100%" stop-color="var(--accent-cyan)"/>
      </linearGradient>
    </defs>
    ${[0.25, 0.5, 0.75].map(g => `<line x1="${padL}" x2="${W - padR}" y1="${(padT + ih * g).toFixed(0)}" y2="${(padT + ih * g).toFixed(0)}" stroke="var(--glass-hairline)" stroke-width="1" stroke-dasharray="3 5"/>`).join('')}
    <path d="${path(hist, 0)} L ${splitX.toFixed(1)} ${(padT + ih).toFixed(1)} L ${padL} ${(padT + ih).toFixed(1)} Z" fill="url(#histFill)"/>
    <path d="${bandPath}" fill="var(--accent-cyan)" fill-opacity="0.14"/>
    <path d="${path(hist, 0)}" fill="none" stroke="url(#lineGrad)" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M ${splitX.toFixed(1)} ${Y(splitV).toFixed(1)} ${path(fc, hist.length).replace(/^M/, 'L')}" fill="none" stroke="var(--accent-cyan)" stroke-width="2.4" stroke-dasharray="5 5" stroke-linejoin="round" stroke-linecap="round" opacity="0.92"/>
    <line x1="${splitX.toFixed(1)}" x2="${splitX.toFixed(1)}" y1="${padT}" y2="${padT + ih}" stroke="var(--accent-cyan)" stroke-width="1" stroke-dasharray="2 4" opacity="0.5"/>
    <circle cx="${splitX.toFixed(1)}" cy="${Y(splitV).toFixed(1)}" r="3.4" fill="var(--accent-blue)"/>
    <circle cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="4" fill="var(--accent-cyan)"/>
    <circle cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="8" fill="none" stroke="var(--accent-cyan)" stroke-width="1.5" opacity="0.4"/>
    ${ticks}
  </svg>`;
})();

/* ============ Reveal on scroll ============ */
(function () {
  const els = Array.from(document.querySelectorAll('.reveal'));
  const vh = () => window.innerHeight || 800;
  els.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top > vh() * 0.86) el.classList.add('armed');
  });
  const reveal = () => {
    const h = vh();
    els.forEach(e => {
      if (!e.classList.contains('armed') || e.classList.contains('in')) return;
      const r = e.getBoundingClientRect();
      if (r.top < h * 0.9 && r.bottom > 0) e.classList.add('in');
    });
  };
  window.addEventListener('scroll', reveal, { passive: true });
  window.addEventListener('resize', reveal);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    els.forEach(e => io.observe(e));
  }
  requestAnimationFrame(reveal);
  setTimeout(() => els.forEach(e => { if (!e.classList.contains('in')) e.classList.remove('armed'); }), 2200);
})();
