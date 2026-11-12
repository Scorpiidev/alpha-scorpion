/* Antares · gallery filter, image lightbox and comic reader */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Overlays use <dialog>. Opening one adds a history entry, so the phone's
     back button closes it instead of leaving the site. */
  const overlay = (dialog, onClose) => {
    dialog.addEventListener('close', () => {
      document.body.classList.remove('is-locked');
      onClose?.();
      if (history.state?.overlay === dialog.id) history.back();
    });
    return {
      open() {
        if (dialog.open) return;
        dialog.showModal();
        document.body.classList.add('is-locked');
        history.pushState({ overlay: dialog.id }, '');
      },
      close() { if (dialog.open) dialog.close(); }
    };
  };
  const overlays = [];
  addEventListener('popstate', () => overlays.forEach(o => o.close()));

  /* ── gallery filter ─────────────────────────────────────── */
  const grid = $('#grid');
  const filters = $$('.filter');
  filters.forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    filters.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    $$('.tile', grid).forEach(t => { t.hidden = !(f === '*' || t.dataset.cat === f); });
  }));

  // works without a "ratio:" line get their shape once the image has loaded
  $$('.tile[data-measure] img').forEach(img => {
    const set = () => img.naturalWidth && img.closest('.tile').style.setProperty('--ar', (img.naturalWidth / img.naturalHeight).toFixed(3));
    img.complete ? set() : img.addEventListener('load', set, { once: true });
  });

  /* ── lightbox ───────────────────────────────────────────── */
  const lb = $('#lightbox');
  if (grid && lb) {
    const img = $('.lightbox__img', lb);
    const title = $('.lightbox__title', lb);
    const meta = $('.lightbox__meta', lb);
    let list = [], idx = 0;
    const box = overlay(lb, () => img.removeAttribute('src'));
    overlays.push(box);

    const show = i => {
      idx = (i + list.length) % list.length;
      const a = list[idx];
      img.removeAttribute('src');
      img.alt = $('img', a).alt;
      img.src = a.href;
      title.textContent = a.dataset.title || '';
      meta.textContent = a.dataset.meta ? '· ' + a.dataset.meta : '';
    };

    grid.addEventListener('click', e => {
      const a = e.target.closest('[data-lightbox]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
      e.preventDefault();
      list = $$('.tile:not([hidden]) [data-lightbox]', grid);
      show(list.indexOf(a));
      box.open();
    });
    $('[data-lb-close]', lb).addEventListener('click', box.close);
    $('[data-lb-prev]', lb).addEventListener('click', () => show(idx - 1));
    $('[data-lb-next]', lb).addEventListener('click', () => show(idx + 1));
    lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lightbox__stage')) box.close(); });
    lb.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
    });
    let sx = null;
    lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      sx = null;
    });
  }

  /* ── comic reader ───────────────────────────────────────── */
  const reader = $('#reader');
  if (reader) {
    const pagesEl = $('[data-r-pages]', reader);
    const pageEl = $('[data-r-page]', reader);
    const totalEl = $('[data-r-total]', reader);
    const titleEl = $('#reader-title');
    const zoomBtn = $('[data-r-zoom]', reader);
    const pageUrl = (dir, n) => dir + String(n).padStart(2, '0') + '.webp';
    let pages = [], cur = 0, loaded = '', zoom = false;
    const box = overlay(reader);
    overlays.push(box);

    const build = (dir, total, title) => {
      if (loaded === dir) return;
      loaded = dir;
      pagesEl.textContent = '';
      pages = [];
      for (let n = 1; n <= total; n++) {
        const img = document.createElement('img');
        img.className = 'reader__page';
        img.alt = `${title}, page ${n} of ${total}`;
        img.decoding = 'async';
        img.draggable = false;
        if (n === 1) img.fetchPriority = 'high';
        if (n > 2) img.loading = 'lazy';
        img.src = pageUrl(dir, n);
        pagesEl.append(img);
        pages.push(img);
      }
      pages[0].addEventListener('load', () => {
        reader.style.setProperty('--ar', (pages[0].naturalWidth / pages[0].naturalHeight).toFixed(4));
      }, { once: true });
    };

    const count = () => {
      const mid = pagesEl.getBoundingClientRect().top + pagesEl.clientHeight / 2;
      let best = 0, dist = Infinity;
      pages.forEach((p, i) => {
        const r = p.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < dist) { dist = d; best = i; }
      });
      cur = best;
      pageEl.textContent = cur + 1;
    };
    let ticking = false;
    pagesEl.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { count(); ticking = false; });
    }, { passive: true });

    const go = i => {
      const p = pages[Math.max(0, Math.min(pages.length - 1, i))];
      p?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: zoom ? 'start' : 'center' });
    };

    const setZoom = on => {
      const keep = cur;
      zoom = on;
      zoomBtn.setAttribute('aria-pressed', String(zoom));
      reader.classList.toggle('is-zoomed', zoom);
      pages[keep]?.scrollIntoView({ block: zoom ? 'start' : 'center' });
    };

    document.addEventListener('click', e => {
      const b = e.target.closest('[data-reader-open]');
      if (!b) return;
      e.preventDefault();
      build(b.dataset.dir, +b.dataset.pages, b.dataset.title);
      titleEl.textContent = b.dataset.title;
      totalEl.textContent = b.dataset.pages;
      box.open();
      pagesEl.scrollTop = 0;
      cur = 0;
      pageEl.textContent = 1;
      pagesEl.focus({ preventScroll: true });
    });
    // start loading page 1 as soon as someone points at a comic
    const warm = e => {
      const b = e.target.closest?.('[data-reader-open]');
      if (b && !b.dataset.warm) { b.dataset.warm = 1; new Image().src = pageUrl(b.dataset.dir, 1); }
    };
    document.addEventListener('pointerover', warm);
    document.addEventListener('focusin', warm);

    $('[data-r-close]', reader).addEventListener('click', box.close);
    zoomBtn.addEventListener('click', () => setZoom(!zoom));

    reader.addEventListener('keydown', e => {
      if (e.target.closest('button') && (e.key === ' ' || e.key === 'Enter')) return;
      const next = ['ArrowRight', 'PageDown', ' ', 'ArrowDown'];
      const prev = ['ArrowLeft', 'PageUp', 'ArrowUp'];
      const native = zoom && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ');
      if (native) return;
      if (next.includes(e.key)) { e.preventDefault(); go(cur + 1); }
      else if (prev.includes(e.key)) { e.preventDefault(); go(cur - 1); }
      else if (e.key === 'Home') { e.preventDefault(); go(0); }
      else if (e.key === 'End') { e.preventDefault(); go(pages.length - 1); }
      else if (e.key.toLowerCase() === 'z') setZoom(!zoom);
    });
  }
})();
