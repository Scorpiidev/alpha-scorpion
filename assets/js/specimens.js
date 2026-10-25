/* ═══════════════════════════════════════════════════════════════
   ANTARES · specimens.js
   taxonomy filter · the inspection chamber · the loupe
   ═══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  const A = window.Antares;
  if (!A) return;
  const { $, $$ } = A;

  /* ── loupe: a magnifying glass that follows the pointer ───── */
  const ZOOM = 2.6;
  const attachLoupe = stage => {
    const lens = $('.loupe', stage);
    if (!lens || stage._loupe) return;
    stage._loupe = true;
    const img = () => $('img', stage);
    const move = e => {
      const im = img();
      if (!im || !im.naturalWidth) return;
      const b = im.getBoundingClientRect();
      const cs = getComputedStyle(im);
      const pl = parseFloat(cs.paddingLeft) || 0, pt = parseFloat(cs.paddingTop) || 0;
      const r = { left: b.left + pl, top: b.top + pt, width: b.width - pl * 2, height: b.height - pt * 2 };
      const s = stage.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) { lens.classList.remove('is-on'); return; }
      const L = lens.offsetWidth / 2;
      lens.classList.add('is-on');
      lens.style.left = (e.clientX - s.left - L) + 'px';
      lens.style.top = (e.clientY - s.top - L) + 'px';
      if (lens._src !== im.currentSrc) { lens.style.backgroundImage = `url("${im.currentSrc || im.src}")`; lens._src = im.currentSrc; }
      lens.style.backgroundSize = `${r.width * ZOOM}px ${r.height * ZOOM}px`;
      lens.style.backgroundPosition = `${-(x * ZOOM - L)}px ${-(y * ZOOM - L)}px`;
    };
    stage.addEventListener('pointermove', move);
    stage.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') move(e); });
    stage.addEventListener('pointerleave', () => lens.classList.remove('is-on'));
    stage.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') lens.classList.remove('is-on'); });
  };
  $$('[data-loupe]').forEach(attachLoupe);

  /* ── taxonomy filter ──────────────────────────────────────── */
  const hall = $('[data-hall]');
  const taxa = $$('.taxon');
  const items = hall ? $$('.specimen', hall) : [];
  const visible = () => items.filter(i => !i.classList.contains('is-hidden'));
  const filter = tax => {
    taxa.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.taxon === tax)));
    items.forEach(i => {
      const show = tax === '*' || (' ' + i.dataset.taxa + ' ').includes(' ' + tax + ' ');
      i.classList.toggle('is-hidden', !show);
    });
    try { history.replaceState(null, '', tax === '*' ? location.pathname : '#' + tax); } catch (e) { /* file:// */ }
  };
  taxa.forEach(b => b.addEventListener('click', () => filter(b.dataset.taxon)));
  const fromHash = decodeURIComponent(location.hash.slice(1));
  if (fromHash && taxa.some(b => b.dataset.taxon === fromHash)) filter(fromHash);

  /* ── the inspection chamber ───────────────────────────────── */
  const ch = $('#chamber');
  if (!ch || !hall) return;
  const img = $('.chamber__img', ch);
  const no = $('[data-chamber-no]', ch), title = $('[data-chamber-title]', ch), meta = $('[data-chamber-meta]', ch);
  const desc = $('[data-chamber-desc]', ch), link = $('[data-chamber-link]', ch);
  let list = [], idx = 0, opener = null;

  const show = i => {
    idx = (i + list.length) % list.length;
    const item = list[idx];
    const a = $('.specimen__link', item);
    img.removeAttribute('src');
    img.alt = $('img', a)?.alt || '';
    img.src = a.dataset.full;
    no.textContent = a.dataset.no || '';
    if (A.scramble) A.scramble(title, a.dataset.title || ''); else title.textContent = a.dataset.title || '';
    meta.textContent = a.dataset.meta || '';
    const tpl = $('template.specimen__desc', item);
    desc.innerHTML = '';
    if (tpl) desc.appendChild(tpl.content.cloneNode(true));
    link.href = a.getAttribute('href');
    link.textContent = item.classList.contains('specimen--loose') ? 'open the file →' : 'open specimen file →';
  };
  const open = item => {
    list = visible();
    opener = document.activeElement;
    ch.hidden = false;
    document.body.style.overflow = 'hidden';
    show(list.indexOf(item));
    $('.chamber__close', ch).focus({ preventScroll: true });
  };
  const close = () => {
    if (ch.hidden) return;
    ch.hidden = true;
    document.body.style.overflow = '';
    opener?.focus({ preventScroll: true });
  };
  hall.addEventListener('click', e => {
    const a = e.target.closest('[data-chamber]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
    e.preventDefault();
    open(a.closest('.specimen'));
  });
  $('[data-chamber-close]', ch).addEventListener('click', close);
  $('[data-chamber-prev]', ch).addEventListener('click', () => show(idx - 1));
  $('[data-chamber-next]', ch).addEventListener('click', () => show(idx + 1));
  ch.addEventListener('click', e => { if (e.target === ch) close(); });
  document.addEventListener('keydown', e => {
    if (ch.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
    else if (e.key === 'Tab') {
      const f = $$('a[href], button', ch);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  // swipe on touch screens
  let sx = null;
  ch.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  ch.addEventListener('touchend', e => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 60) show(idx + (dx < 0 ? 1 : -1));
    sx = null;
  });
})();
