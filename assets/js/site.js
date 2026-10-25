/* ═══════════════════════════════════════════════════════════════
   ANTARES · site.js
   cursor · hud · star chart · oddities · reveals · small magic
   ═══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const base = body.dataset.base || '';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  const STAR = '<svg class="star4" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 0C53 36 64 47 100 50 64 53 53 64 50 100 47 64 36 53 0 50 36 47 47 36 50 0Z"/></svg>';

  const A = window.Antares = Object.assign(window.Antares || {}, { base, reduce, store, $, $$, STAR });

  /* ── reveal on scroll ─────────────────────────────────────── */
  const reveals = $$('[data-reveal]');
  reveals.forEach(el => { if (el.getBoundingClientRect().top < innerHeight * .95) el.classList.add('is-in'); });
  root.classList.add('js-ready');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(el => { if (!el.classList.contains('is-in')) io.observe(el); });
  } else reveals.forEach(el => el.classList.add('is-in'));

  /* ── toasts ───────────────────────────────────────────────── */
  const toastBox = $('.toasts');
  A.toast = ({ label = '', title = '', text = '', ms = 7000, tiny = false }) => {
    if (!toastBox) return;
    const t = document.createElement('div');
    t.className = tiny ? 'toast toast--tiny' : 'toast';
    t.innerHTML = `<p class="label"></p><h4></h4><p></p>`;
    t.children[0].textContent = label;
    t.children[1].textContent = title;
    t.children[2].textContent = text;
    if (!text) t.children[2].remove();
    if (!title) t.children[1].remove();
    const kill = () => { t.classList.add('is-out'); setTimeout(() => t.remove(), 400); };
    t.addEventListener('click', kill);
    toastBox.appendChild(t);
    while (toastBox.children.length > 2) toastBox.firstElementChild.remove(); // never bury the page
    setTimeout(kill, ms);
  };

  /* ── modal helpers (star chart, drawer) ───────────────────── */
  let lastFocus = null;
  const openModal = (el, opener) => {
    lastFocus = opener || document.activeElement;
    el.hidden = false;
    body.style.overflow = 'hidden';
    if (opener) opener.setAttribute('aria-expanded', 'true');
    const f = el.querySelector('[aria-current], a, button');
    if (f) f.focus({ preventScroll: true });
  };
  const closeModal = el => {
    if (el.hidden) return;
    el.hidden = true;
    body.style.overflow = '';
    $$('[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  };
  A.openModal = openModal; A.closeModal = closeModal;

  const starmap = $('#starmap');
  const drawer = $('#collection');
  document.addEventListener('click', e => {
    const t = e.target;
    const opener = t.closest('[data-starmap-open]');
    if (opener) { starmap.hidden ? openModal(starmap, opener) : closeModal(starmap); return; }
    if (t.closest('[data-starmap-close]') || t === starmap || t.classList.contains('starmap__inner')) closeModal(starmap);
    const dOpen = t.closest('[data-collection-open]');
    if (dOpen) { openModal(drawer, dOpen); return; }
    if (t.closest('[data-collection-close]') || t === drawer) closeModal(drawer);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(starmap); closeModal(drawer); }
    if (e.key === 'Tab') { // keep focus inside an open modal
      const m = [starmap, drawer].find(x => x && !x.hidden);
      if (!m) return;
      const items = $$('a[href], button:not([hidden]), input, [tabindex]:not([tabindex="-1"])', m).filter(x => x.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ── oddities: the hidden collection ──────────────────────── */
  let ODD = [];
  try { ODD = JSON.parse($('#oddity-data').textContent); } catch (e) { ODD = []; }
  const found = new Set(store.get('antares.oddities', []).filter(id => ODD.some(o => o.id === id)));
  const odCount = $$('[data-odd-count]');
  const redBtns = $$('[data-redgiant]');
  const renderOdd = () => {
    odCount.forEach(el => { el.textContent = found.size; });
    $$('.slot').forEach(s => s.classList.toggle('is-found', found.has(s.dataset.slot)));
    $$('[data-oddity]').forEach(b => b.classList.toggle('is-found', found.has(b.dataset.oddity)));
    const on = root.classList.contains('red-giant');
    redBtns.forEach(b => {
      b.setAttribute('aria-pressed', String(on));
      const st = b.querySelector('span:not([class])');
      if (st) st.textContent = on ? 'on' : 'off';
    });
  };
  A.discover = id => {
    const o = ODD.find(x => x.id === id);
    if (!o) return;
    if (found.has(id)) {
      A.toast({ label: `already in your drawer · ${o.name}`, tiny: true, ms: 2600 });
      return;
    }
    found.add(id);
    store.set('antares.oddities', [...found]);
    renderOdd();
    $$('.hud__odd').forEach(b => { b.classList.remove('is-pinged'); void b.offsetWidth; b.classList.add('is-pinged'); });
    A.toast({ label: `oddity acquired · ${found.size}/${ODD.length}`, title: o.name, text: o.note, ms: 9000 });
    if (found.size === ODD.length) {
      setTimeout(() => A.toast({
        label: 'collection complete',
        title: 'Every oddity, catalogued',
        text: 'You found all of them. Now you see the cabinet the way its curator does.',
        ms: 11000
      }), 1400);
    }
  };
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-oddity]');
    if (t) { e.preventDefault(); A.discover(t.dataset.oddity); }
  });
  $('[data-collection-forget]')?.addEventListener('click', () => {
    found.clear(); store.del('antares.oddities');
    root.classList.remove('red-giant'); store.set('antares.redgiant', false);
    renderOdd();
  });
  redBtns.forEach(b => b.addEventListener('click', () => {
    const on = root.classList.toggle('red-giant');
    store.set('antares.redgiant', on);
    renderOdd();
    A.toast(on
      ? { label: 'red giant mode · on', title: 'Antares, swollen', text: 'The cabinet near the end of its star: everything warms, swells and slows down. The heart beats like a dying giant.', ms: 6500 }
      : { label: 'red giant mode · off', tiny: true, ms: 2200 });
  }));
  renderOdd();

  /* ── HUD: clock and the altitude of Antares, seen from Spain ─ */
  const clockEl = $('[data-clock]');
  const altEl = $('[data-antares]');
  const fmt = (() => {
    try { return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); }
    catch (e) { return null; }
  })();
  const RAD = Math.PI / 180;
  const altitude = date => { // Antares: RA 16h29m24s, Dec −26°25′55″ · observer ≈ centre of Spain
    const jd = date.getTime() / 86400000 + 2440587.5;
    const d = jd - 2451545.0;
    const gmst = ((18.697374558 + 24.06570982441908 * d) % 24 + 24) % 24;
    const lst = gmst + (-3.70 / 15);
    const ha = (lst - 16.49) * 15 * RAD;
    const dec = -26.432 * RAD, lat = 40.42 * RAD;
    return Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha)) / RAD;
  };
  A.altitude = altitude;
  const tick = () => {
    const now = new Date();
    if (clockEl && fmt) clockEl.textContent = 'ES ' + fmt.format(now);
    if (altEl) {
      const a = altitude(now), later = altitude(new Date(now.getTime() + 6e5));
      const sign = a >= 0 ? '+' : '−';
      altEl.textContent = `α SCO ${sign}${Math.abs(a).toFixed(1)}° ${a < 0 ? '· below horizon' : later > a ? '↑ rising' : '↓ setting'}`;
    }
  };
  if (clockEl || altEl) { tick(); setInterval(tick, 1000); }

  /* ── text scramble on hover ───────────────────────────────── */
  const GLYPHS = '█▓▒░<>/\\|*+=αβγδεζλπσ∆◇◆✦';
  // scramble(el) decodes the element's current text; scramble(el, text) swaps in new text first.
  // The real text never changes size: the glitch plays in an overlay on top of it,
  // so nothing around it can jump or reflow.
  const scramble = (el, text) => {
    if (text != null) el.textContent = text;
    if (reduce) return;
    if (text == null && el._scr) return;
    const final = el.textContent;
    if (!final.trim()) return;
    const glyphs = el.dataset.glyphs || GLYPHS;
    cancelAnimationFrame(el._raf);
    if (el._ghost) el._ghost.remove();
    const cs = getComputedStyle(el);
    if (cs.position === 'static') el.style.position = 'relative';
    const ghost = document.createElement('span');
    ghost.className = 'scramble-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    Object.assign(ghost.style, { color: cs.color, textShadow: cs.textShadow, padding: cs.padding });
    el._ghost = ghost;
    el.appendChild(ghost);
    el.classList.add('is-scrambling');
    let frame = 0;
    const total = Math.min(36, Math.max(10, final.length * 1.4));
    el._scr = true;
    const step = () => {
      let out = '';
      for (let i = 0; i < final.length; i++) {
        const c = final[i];
        out += (c === ' ' || c === '\n' || i < (frame / total) * final.length) ? c : glyphs[(Math.random() * glyphs.length) | 0];
      }
      ghost.textContent = out;
      if (++frame <= total) el._raf = requestAnimationFrame(step);
      else { ghost.remove(); el._ghost = null; el.classList.remove('is-scrambling'); el._scr = false; }
    };
    step();
  };
  A.scramble = scramble;
  // hovering replays the glitch, but only a couple of times per element
  document.addEventListener('pointerover', e => {
    const el = e.target.closest('[data-scramble]');
    if (!el || el.contains(e.relatedTarget) || el._scr || (el._hovers || 0) >= 2) return;
    el._hovers = (el._hovers || 0) + 1;
    scramble(el);
  });
  // headings decode once when they first appear
  if ('IntersectionObserver' in window && !reduce) {
    const sio = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { scramble(e.target); sio.unobserve(e.target); }
    }), { threshold: .6 });
    $$('h1[data-scramble], h2[data-scramble]').forEach(el => sio.observe(el));
  }

  /* ── pixel decode: images arrive like a slow transmission ─── */
  const decode = img => {
    if (reduce || img._decoded) return;
    img._decoded = true;
    const w = img.clientWidth, h = img.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const c = document.createElement('canvas');
    c.className = 'decode-canvas';
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    Object.assign(c.style, { width: w + 'px', height: h + 'px', left: img.offsetLeft + 'px', top: img.offsetTop + 'px' });
    const parent = img.offsetParent;
    if (!parent) return;
    parent.appendChild(c);
    const ctx = c.getContext('2d');
    const t = document.createElement('canvas');
    const tc = t.getContext('2d');
    const steps = [56, 34, 20, 12, 7, 4];
    let i = 0;
    img.style.opacity = '0';
    const step = () => {
      try {
        const b = steps[i] * dpr;
        t.width = Math.max(1, Math.ceil(c.width / b));
        t.height = Math.max(1, Math.ceil(c.height / b));
        tc.drawImage(img, 0, 0, t.width, t.height);
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.drawImage(t, 0, 0, t.width, t.height, 0, 0, c.width, c.height);
      } catch (e) { i = steps.length; }
      if (++i < steps.length) setTimeout(step, 75);
      else {
        img.style.opacity = '';
        c.classList.add('is-done');
        setTimeout(() => c.remove(), 450);
      }
    };
    step();
  };
  A.decode = decode;
  if ('IntersectionObserver' in window && !reduce) {
    const dio = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const img = e.target;
      dio.unobserve(img);
      const go = () => requestAnimationFrame(() => decode(img));
      if (img.complete && img.naturalWidth) go(); else img.addEventListener('load', go, { once: true });
    }), { threshold: .25 });
    $$('img[data-decode]').forEach(img => dio.observe(img));
  }

  /* ── custom cursor ────────────────────────────────────────── */
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const cur = $('.cursor');
  if (fine && cur) {
    root.classList.add('has-cursor');
    cur.classList.add('is-gone'); // hidden until the pointer first moves
    const dot = $('.cursor__dot', cur), ring = $('.cursor__ring', cur), label = $('.cursor__label', cur);
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, raf = 0, idle = true;
    const coords = () => { // fake sky coordinates, centred on Antares
      const ra = 17.5 - (mx / innerWidth) * 2;
      const dec = -14 - (my / innerHeight) * 26;
      const h = Math.floor(ra), m = Math.floor((ra - h) * 60);
      return `${h}h${String(m).padStart(2, '0')}m ${dec < 0 ? '−' : '+'}${Math.abs(dec).toFixed(0)}°`;
    };
    const loop = () => {
      rx += (mx - rx) * (reduce ? 1 : .2);
      ry += (my - ry) * (reduce ? 1 : .2);
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      if (idle) label.textContent = coords();
      raf = (Math.abs(mx - rx) + Math.abs(my - ry) > .3) ? requestAnimationFrame(loop) : 0;
    };
    addEventListener('pointermove', e => {
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
      cur.classList.remove('is-gone');
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.add('is-gone'));
    addEventListener('blur', () => cur.classList.add('is-gone'));

    const LABELS = { A: 'open', BUTTON: 'press', SUMMARY: 'open' };
    document.addEventListener('pointerover', e => {
      const t = e.target;
      const text = t.closest('input:not([type=checkbox]):not([type=radio]):not([type=submit]), textarea, [contenteditable]');
      const hit = t.closest('[data-cursor], a, button, select, label, .piece, [data-loupe]');
      cur.classList.toggle('is-text', !!text);
      if (text) { idle = false; label.textContent = 'write'; cur.classList.remove('is-hover', 'is-idle', 'is-drag'); return; }
      if (hit) {
        idle = false;
        cur.classList.add('is-hover'); cur.classList.remove('is-idle');
        const isPiece = hit.classList.contains('piece') && !hit.closest('a');
        cur.classList.toggle('is-drag', isPiece);
        label.textContent = hit.dataset.cursor || (isPiece ? 'drag' : LABELS[hit.tagName] || 'look');
      } else {
        idle = true;
        cur.classList.remove('is-hover', 'is-drag'); cur.classList.add('is-idle');
        label.textContent = coords();
      }
    });
    addEventListener('pointerdown', () => cur.classList.add('is-down'));
    addEventListener('pointerup', () => cur.classList.remove('is-down'));

    // a tiny burst of stars on click
    const COLORS = ['#ffe4ae', '#a899ff', '#c66f80', '#b9e36b'];
    addEventListener('click', e => {
      if (reduce || !e.isTrusted || e.detail === 0) return;
      for (let i = 0; i < 6; i++) {
        const s = document.createElement('span');
        s.className = 'spark';
        s.innerHTML = STAR;
        const ang = (i / 6) * Math.PI * 2 + Math.random() * .6;
        const dist = 24 + Math.random() * 30;
        s.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;--dx:${Math.cos(ang) * dist}px;--dy:${Math.sin(ang) * dist}px;--c:${COLORS[i % 4]}`;
        body.appendChild(s);
        setTimeout(() => s.remove(), 750);
      }
    });
  }

  /* ── type "antares" anywhere: supernova ───────────────────── */
  let buf = '';
  document.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
    if (e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-7);
    if (buf === 'antares') { buf = ''; A.supernova(); }
  });
  /* ── supernova: a proper explosion, drawn on a canvas ────── */
  let novaBusy = false;
  A.supernova = (x, y) => {
    A.toast({ label: 'α scorpii · event', title: 'Supernova', text: 'Antares will explode one day. Not today, probably. The heart keeps beating.', ms: 6000 });
    if (reduce || novaBusy) return;
    novaBusy = true;
    const c = document.createElement('canvas');
    c.className = 'nova-canvas';
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const W = innerWidth, H = innerHeight;
    c.width = W * dpr; c.height = H * dpr;
    body.appendChild(c);
    const g = c.getContext('2d');
    g.scale(dpr, dpr);
    const cx = (x ?? 50) / 100 * W, cy = (y ?? 42) / 100 * H;
    const maxR = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
    const COLS = ['255,255,255', '255,228,174', '198,111,128', '168,153,255', '255,140,90', '185,227,107'];
    const parts = Array.from({ length: 320 }, () => {
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() ** 1.8 * 22;
      return { x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, decay: .006 + Math.random() * .014,
               size: .6 + Math.random() * 2.6, col: COLS[(Math.random() * COLS.length) | 0] };
    });
    const nebula = Array.from({ length: 7 }, (_, k) => ({
      a: Math.random() * Math.PI * 2, d: maxR * (.08 + Math.random() * .22), r: maxR * (.25 + Math.random() * .3), col: COLS[2 + (k % 3)]
    }));
    body.classList.remove('supernova'); void body.offsetWidth; body.classList.add('supernova');
    const t0 = performance.now(), DUR = 3400;
    const frame = now => {
      const t = (now - t0) / DUR;
      g.globalCompositeOperation = 'source-over';
      g.clearRect(0, 0, W, H);
      // white-out, then afterglow
      const flash = t < .06 ? t / .06 : Math.max(0, 1 - (t - .06) / .22);
      if (flash > 0) { g.fillStyle = `rgba(255,246,230,${flash * .85})`; g.fillRect(0, 0, W, H); }
      g.globalCompositeOperation = 'lighter';
      // nebula clouds blooming out of the blast
      nebula.forEach(n => {
        const k = Math.min(1, t * 2.2), fade = Math.max(0, 1 - t) * .5;
        const nx = cx + Math.cos(n.a) * n.d * k, ny = cy + Math.sin(n.a) * n.d * k, nr = n.r * (.4 + k);
        const rg = g.createRadialGradient(nx, ny, 0, nx, ny, nr);
        rg.addColorStop(0, `rgba(${n.col},${fade * .55})`); rg.addColorStop(1, `rgba(${n.col},0)`);
        g.fillStyle = rg; g.beginPath(); g.arc(nx, ny, nr, 0, Math.PI * 2); g.fill();
      });
      // core
      const coreR = maxR * (.05 + .25 * Math.min(1, t * 4)) * Math.max(0, 1 - t * .9);
      if (coreR > 1) {
        const cg = g.createRadialGradient(cx, cy, 0, cx, cy, coreR);
        cg.addColorStop(0, 'rgba(255,255,255,1)'); cg.addColorStop(.25, 'rgba(255,228,174,.9)');
        cg.addColorStop(.6, 'rgba(198,111,128,.5)'); cg.addColorStop(1, 'rgba(68,9,46,0)');
        g.fillStyle = cg; g.beginPath(); g.arc(cx, cy, coreR, 0, Math.PI * 2); g.fill();
      }
      // shockwaves
      [0, .08, .2].forEach((delay, k) => {
        const tt = (t - delay) / .7;
        if (tt <= 0 || tt >= 1) return;
        const r = maxR * (1 - Math.pow(1 - tt, 3)) * (1.05 - k * .12);
        g.strokeStyle = `rgba(${k === 1 ? '168,153,255' : k === 2 ? '198,111,128' : '255,228,174'},${(1 - tt) * .8})`;
        g.lineWidth = (1 - tt) * (26 - k * 7) + 1;
        g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
      });
      // debris with trails
      parts.forEach(p => {
        if (p.life <= 0) return;
        const px = p.x, py = p.y;
        p.x += p.vx; p.y += p.vy; p.vx *= .965; p.vy *= .965; p.life -= p.decay;
        g.strokeStyle = `rgba(${p.col},${Math.max(0, p.life)})`;
        g.lineWidth = p.size; g.lineCap = 'round';
        g.beginPath(); g.moveTo(px, py); g.lineTo(p.x, p.y); g.stroke();
      });
      if (t < 1) requestAnimationFrame(frame);
      else { c.remove(); body.classList.remove('supernova'); novaBusy = false; }
    };
    requestAnimationFrame(frame);
  };

  /* ── the sky behind everything: twinkling stars, the odd meteor ─ */
  const sky = $('.atmos__sky');
  if (sky && sky.getContext) {
    const g = sky.getContext('2d');
    let W = 0, H = 0, stars = [], meteor = null, nextMeteor = 4000 + Math.random() * 6000, last = 0, running = true;
    const TINTS = ['255,228,174', '255,255,255', '180,174,255', '198,111,128'];
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = innerWidth; H = innerHeight;
      sky.width = W * dpr; sky.height = H * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(W * H / 5200);
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H, r: Math.random() ** 3 * 1.6 + .3,
        tw: .4 + Math.random() * 2.6, ph: Math.random() * 6.3, tint: TINTS[(Math.random() * TINTS.length) | 0],
        sparkle: Math.random() < .035
      }));
    };
    const draw = now => {
      if (!running) return;
      const dt = Math.min(64, now - last); last = now;
      const t = now / 1000;
      g.clearRect(0, 0, W, H);
      stars.forEach(s => {
        const a = .25 + .75 * (.5 + .5 * Math.sin(t * s.tw + s.ph)) ** 2;
        g.fillStyle = `rgba(${s.tint},${a * (s.r > 1 ? .95 : .6)})`;
        if (s.sparkle && a > .8) { // a four-point glint on the brightest few
          const L = s.r * 5 * a;
          g.fillRect(s.x - L, s.y - .4, L * 2, .8); g.fillRect(s.x - .4, s.y - L, .8, L * 2);
        }
        g.beginPath(); g.arc(s.x, s.y, s.r, 0, Math.PI * 2); g.fill();
      });
      if (!reduce) {
        nextMeteor -= dt;
        if (!meteor && nextMeteor <= 0) {
          const ang = Math.PI * (.12 + Math.random() * .16);
          meteor = { x: Math.random() * W * .8, y: Math.random() * H * .35, vx: Math.cos(ang) * 11, vy: Math.sin(ang) * 11, life: 1 };
          nextMeteor = 7000 + Math.random() * 12000;
        }
        if (meteor) {
          const m = meteor, tail = 14;
          const grd = g.createLinearGradient(m.x, m.y, m.x - m.vx * tail, m.y - m.vy * tail);
          grd.addColorStop(0, `rgba(255,240,220,${m.life})`); grd.addColorStop(1, 'rgba(168,153,255,0)');
          g.strokeStyle = grd; g.lineWidth = 1.6;
          g.beginPath(); g.moveTo(m.x, m.y); g.lineTo(m.x - m.vx * tail, m.y - m.vy * tail); g.stroke();
          m.x += m.vx * dt / 16; m.y += m.vy * dt / 16; m.life -= .012 * dt / 16;
          if (m.life <= 0 || m.x > W + 200 || m.y > H + 200) meteor = null;
        }
        requestAnimationFrame(draw);
      }
    };
    resize();
    addEventListener('resize', () => { resize(); if (reduce) draw(performance.now()); });
    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running && !reduce) { last = performance.now(); requestAnimationFrame(draw); }
    });
    requestAnimationFrame(draw);
  }

  /* ── chrome hearts tilt towards the pointer; the shine follows ─ */
  $$('[data-chrome-heart]').forEach(h => {
    const stack = $('.chrome-heart__stack', h);
    const light = $('[data-chrome-light]', h);
    const grad = $('[data-chrome-gradient]', h);
    let tx = 0, ty = 0, cx = 0, cy = 0, lastMove = 0, visible = true;
    const fine = matchMedia('(pointer: fine)').matches;
    if (fine) addEventListener('pointermove', e => {
      const r = h.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2)));
      ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (innerHeight / 2)));
      lastMove = performance.now();
    }, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) requestAnimationFrame(loop); }).observe(h);
    const loop = now => {
      if (!visible) return;
      let gx = tx, gy = ty;
      if (now - lastMove > 2500) { gx = Math.sin(now / 1900) * .55; gy = Math.cos(now / 2600) * .35; } // idle sway
      const k = reduce ? 1 : .07;
      cx += (gx - cx) * k; cy += (gy - cy) * k;
      stack.style.setProperty('--ry', (cx * 28).toFixed(2) + 'deg');
      stack.style.setProperty('--rx', (-cy * 22).toFixed(2) + 'deg');
      if (light) { light.setAttribute('x', (300 + cx * 320).toFixed(0)); light.setAttribute('y', (220 + cy * 260).toFixed(0)); }
      if (grad) grad.setAttribute('gradientTransform', `rotate(${(cx * 18 - cy * 10).toFixed(1)} .5 .5)`);
      if (!reduce) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });

  /* ── a note for the curious who open the console ──────────── */
  try {
    console.log('%c✶ ANTARES ✶%c\nper tenebras, forma.\nyou opened the console, so you are one of us. type "antares" on the page.',
      'font: 700 18px monospace; color: #ffe4ae; background: #44092e; padding: 4px 10px;', 'color: #a899ff');
  } catch (e) { /* ignore */ }
})();
