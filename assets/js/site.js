/* ANTARES · site.js
   gallery filter · lightbox · smooth focus handling. Nothing else. */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ── gallery filter ─────────────────────────────────────── */
  const grid = $('#grid');
  const filters = $$('.filter');
  filters.forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    filters.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    $$('.tile', grid).forEach(t => { t.hidden = !(f === '*' || t.dataset.cat === f); });
  }));

  /* ── lightbox ───────────────────────────────────────────── */
  const lb = $('#lightbox');
  if (grid && lb) {
    const img = $('.lightbox__img', lb);
    const title = $('.lightbox__title', lb);
    const meta = $('.lightbox__meta', lb);
    let list = [], idx = 0, opener = null;

    const show = i => {
      idx = (i + list.length) % list.length;
      const a = list[idx];
      img.removeAttribute('src');
      img.alt = $('img', a).alt;
      img.src = a.href;
      title.textContent = a.dataset.title || '';
      meta.textContent = a.dataset.meta ? '· ' + a.dataset.meta : '';
    };
    const open = a => {
      list = $$('.tile:not([hidden]) [data-lightbox]', grid);
      opener = a;
      lb.hidden = false;
      document.body.classList.add('is-locked');
      show(list.indexOf(a));
      $('[data-lb-close]', lb).focus({ preventScroll: true });
    };
    const close = () => {
      lb.hidden = true;
      img.removeAttribute('src');
      document.body.classList.remove('is-locked');
      opener?.focus({ preventScroll: true });
    };

    grid.addEventListener('click', e => {
      const a = e.target.closest('[data-lightbox]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
      e.preventDefault();
      open(a);
    });
    $('[data-lb-close]', lb).addEventListener('click', close);
    $('[data-lb-prev]', lb).addEventListener('click', () => show(idx - 1));
    $('[data-lb-next]', lb).addEventListener('click', () => show(idx + 1));
    lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lightbox__stage')) close(); });
    document.addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(idx - 1);
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
})();
