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
  A.toast = ({ label = '', title = '', text = '', ms = 7000 }) => {
    if (!toastBox) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<p class="label"></p><h4></h4><p></p>`;
    t.children[0].textContent = label;
    t.children[1].textContent = title;
    t.children[2].textContent = text;
    if (!text) t.children[2].remove();
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
  const redBtn = $('[data-redgiant]');
  const renderOdd = () => {
    odCount.forEach(el => { el.textContent = found.size; });
    $$('.slot').forEach(s => s.classList.toggle('is-found', found.has(s.dataset.slot)));
    $$('[data-oddity]').forEach(b => b.classList.toggle('is-found', found.has(b.dataset.oddity)));
    if (redBtn) {
      redBtn.hidden = found.size < ODD.length;
      redBtn.querySelector('span').textContent = root.classList.contains('red-giant') ? 'on' : 'off';
    }
  };
  A.discover = id => {
    const o = ODD.find(x => x.id === id);
    if (!o) return;
    if (found.has(id)) {
      A.toast({ label: 'already in your drawer', title: o.name, text: o.note, ms: 5000 });
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
        text: 'You found all of them. A switch has appeared in your drawer: red giant mode.',
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
  redBtn?.addEventListener('click', () => {
    const on = root.classList.toggle('red-giant');
    store.set('antares.redgiant', on);
    renderOdd();
  });
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
  // scramble(el) decodes the element's current text; scramble(el, text) decodes into new text
  const scramble = (el, text) => {
    if (reduce) { if (text != null) el.textContent = text; return; }
    if (text == null && el._scr) return;
    const final = text != null ? text : el.textContent;
    cancelAnimationFrame(el._raf);
    let frame = 0;
    const total = Math.max(10, final.length * 1.6);
    el._scr = true;
    const step = () => {
      let out = '';
      for (let i = 0; i < final.length; i++) {
        const c = final[i];
        out += (c === ' ' || i < (frame / total) * final.length) ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (++frame <= total) el._raf = requestAnimationFrame(step);
      else { el.textContent = final; el._scr = false; }
    };
    step();
  };
  A.scramble = scramble;
  document.addEventListener('pointerover', e => {
    const el = e.target.closest('[data-scramble]');
    if (el && !el.contains(e.relatedTarget)) scramble(el);
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
  A.supernova = (x, y) => {
    const flash = $('.flash');
    if (flash) { flash.style.setProperty('--fx', (x ?? 50) + '%'); flash.style.setProperty('--fy', (y ?? 40) + '%'); }
    body.classList.remove('supernova'); void body.offsetWidth;
    body.classList.add('supernova');
    setTimeout(() => body.classList.remove('supernova'), 2700);
    A.toast({ label: 'α scorpii · event', title: 'Supernova', text: 'Antares will explode one day. Not today, probably. The heart keeps beating.', ms: 6000 });
  };

  /* ── a note for the curious who open the console ──────────── */
  try {
    console.log('%c✶ ANTARES ✶%c\nper tenebras, forma.\nyou opened the console, so you are one of us. type "antares" on the page.',
      'font: 700 18px monospace; color: #ffe4ae; background: #44092e; padding: 4px 10px;', 'color: #a899ff');
  } catch (e) { /* ignore */ }
})();
