/* ═══════════════════════════════════════════════════════════════
   ANTARES · synth.js
   The specimen synthesizer: grows radiolarian creatures from noise.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  const A = window.Antares = window.Antares || {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const mulberry = seed => () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const GENUS = ['Umbr', 'Spectr', 'Sanguin', 'Seraph', 'Vitr', 'Noct', 'Cor', 'Lux', 'Tenebr', 'Astr', 'Carnat', 'Glitch', 'Scorpi', 'Relic'];
  const SUFFIX = ['aria', 'ella', 'idium', 'osphaera', 'ocystis', 'oplegma', 'onema', 'ophora', 'olithus'];
  const SPECIES = ['antaresii', 'tenebrosa', 'nocturna', 'spectralis', 'cordata', 'fracta', 'lucida', 'vitrea', 'sanguinea',
    'seraphica', 'minima', 'ignota', 'insomnis', 'errans', 'dormiens', 'oblita', 'curiosa'];

  const name = r => {
    const g = GENUS[(r() * GENUS.length) | 0] + SUFFIX[(r() * SUFFIX.length) | 0];
    return g + ' ' + SPECIES[(r() * SPECIES.length) | 0];
  };

  // build a creature description from a seed
  const design = seed => {
    const r = mulberry(seed);
    const n = 5 + ((r() * 9) | 0);               // radial symmetry
    const rings = 2 + ((r() * 3) | 0);
    const twist = (r() - .5) * .6;
    const spine = .78 + r() * .3;
    const barbs = r() > .45;
    const holes = r() > .3;
    const mesh = 1 + ((r() * 3) | 0);
    const hue = r();
    return { r, n, rings, twist, spine, barbs, holes, mesh, hue, title: name(r) };
  };

  const draw = (ctx, d, t) => {
    const { width: W, height: H } = ctx.canvas;
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) * .42;
    const r = mulberry(d.n * 977 + d.rings * 31 + Math.round(d.hue * 1e4));
    const ease = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
    const line = d.hue > .7 ? '255,228,174' : d.hue > .35 ? '180,174,255' : '198,111,128';
    const accent = d.hue > .7 ? '168,153,255' : '255,228,174';
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = `rgba(${line},.8)`;
    ctx.shadowBlur = 6;

    // concentric lattice rings
    const radii = [];
    for (let k = 0; k < d.rings; k++) radii.push(R * (.22 + (.62 * (k + 1)) / d.rings) * (.9 + r() * .15));
    let prev = null;
    radii.forEach((rad, k) => {
      const p = ease(t * 1.6 - k * .18);
      if (p <= 0) return;
      const m = d.n * (k === 0 ? 1 : d.mesh);
      const pts = [];
      for (let i = 0; i < m; i++) {
        const a = (i / m) * Math.PI * 2 + d.twist * k;
        const wob = 1 + Math.sin(i * 3 + k) * .04;
        pts.push([cx + Math.cos(a) * rad * wob * p, cy + Math.sin(a) * rad * wob * p, a]);
      }
      ctx.strokeStyle = `rgba(${line},${.35 + .5 * p})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.stroke();
      if (prev) { // triangulate between rings
        ctx.strokeStyle = `rgba(${line},${.22 * p})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        pts.forEach(([x, y, a]) => {
          let best = prev[0], bd = 9;
          prev.forEach(q => { const dd = Math.abs(Math.atan2(Math.sin(q[2] - a), Math.cos(q[2] - a))); if (dd < bd) { bd = dd; best = q; } });
          ctx.moveTo(x, y); ctx.lineTo(best[0], best[1]);
        });
        ctx.stroke();
      }
      if (d.holes) {
        ctx.fillStyle = 'rgba(6,3,10,.9)';
        ctx.strokeStyle = `rgba(${accent},${.5 * p})`;
        pts.forEach(([x, y], i) => {
          if (i % 2) return;
          ctx.beginPath(); ctx.arc(x, y, (2 + k * 1.2) * p, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        });
      }
      prev = pts;
    });

    // radial spines
    const sp = ease(t * 1.4 - .45);
    if (sp > 0) {
      const outer = radii[radii.length - 1];
      for (let i = 0; i < d.n; i++) {
        const a = (i / d.n) * Math.PI * 2 + d.twist * (d.rings - 1);
        const len = R * d.spine * (1.02 + Math.sin(i * 7.3) * .08);
        const x0 = cx + Math.cos(a) * outer, y0 = cy + Math.sin(a) * outer;
        const x1 = cx + Math.cos(a) * (outer + (len - outer) * sp + R * .12 * sp), y1 = cy + Math.sin(a) * (outer + (len - outer) * sp + R * .12 * sp);
        ctx.strokeStyle = `rgba(${line},.85)`;
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        if (d.barbs) {
          const bx = x0 + (x1 - x0) * .6, by = y0 + (y1 - y0) * .6;
          [-1, 1].forEach(s => {
            ctx.beginPath(); ctx.moveTo(bx, by);
            ctx.lineTo(bx + Math.cos(a + s * .6) * 10 * sp, by + Math.sin(a + s * .6) * 10 * sp); ctx.stroke();
          });
        }
        ctx.fillStyle = `rgba(${accent},.95)`;
        ctx.beginPath(); ctx.arc(x1, y1, 2.6 * sp, 0, Math.PI * 2); ctx.fill();
      }
    }

    // nucleus
    const np = ease(t * 2);
    const nr = R * .17 * np;
    if (nr > 0) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, nr * 1.6);
      g.addColorStop(0, 'rgba(255,228,174,.95)');
      g.addColorStop(.35, 'rgba(198,111,128,.75)');
      g.addColorStop(1, 'rgba(68,9,46,0)');
      ctx.shadowBlur = 0;
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, nr * 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(12,7,16,.85)';
      for (let i = 0; i < 6; i++) {
        const a = r() * Math.PI * 2, dd = r() * nr * .7;
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * dd, cy + Math.sin(a) * dd, 1.5 + r() * 2, 0, Math.PI * 2); ctx.fill();
      }
    }
  };

  // grow: animate the drawing, returns the design
  A.grow = (canvas, seed) => {
    const ctx = canvas.getContext('2d');
    const d = design(seed);
    if (canvas._raf) cancelAnimationFrame(canvas._raf);
    if (reduce) { draw(ctx, d, 1); return d; }
    const t0 = performance.now(), dur = 1300;
    const frame = now => {
      const t = Math.min(1, (now - t0) / dur);
      draw(ctx, d, t);
      if (t < 1) canvas._raf = requestAnimationFrame(frame);
    };
    canvas._raf = requestAnimationFrame(frame);
    return d;
  };

  // canvases that just want a fixed specimen (vault pages, 404)
  document.querySelectorAll('canvas[data-synth-seed]').forEach(c => {
    const seed = parseInt(c.dataset.synthSeed, 10) || 404;
    A.grow(c, seed * 7919);
  });
})();
