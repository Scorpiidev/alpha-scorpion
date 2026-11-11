/* ANTARES · reader.mjs
   A small PDF comic reader built on PDF.js (loaded from a CDN only when a comic is opened).
   Pages are rendered to a canvas that fits the screen; "zoom" switches to fit-width with scrolling. */
const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/';

const reader = document.getElementById('reader');
if (reader) {
  const $ = s => reader.querySelector(s);
  const stage = $('[data-r-stage]');
  const canvas = $('[data-r-canvas]');
  const msg = $('[data-r-msg]');
  const pageEl = $('[data-r-page]');
  const totalEl = $('[data-r-total]');
  const titleEl = $('#reader-title');
  const zoomBtn = $('[data-r-zoom]');
  const download = $('[data-r-download]');

  let lib = null, doc = null, url = '', page = 1, zoom = false, task = null, opener = null;
  const cache = new Map();

  const loadLib = async () => {
    if (lib) return lib;
    lib = await import(PDFJS + 'pdf.min.mjs');
    lib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.mjs';
    return lib;
  };

  const say = (text, isError = false) => {
    msg.hidden = !text;
    msg.innerHTML = text || '';
    msg.classList.toggle('is-err', isError);
  };

  const render = async () => {
    if (!doc) return;
    const p = await doc.getPage(page);
    const base = p.getViewport({ scale: 1 });
    const pad = 16;
    const w = stage.clientWidth - pad * 2;
    const h = stage.clientHeight - pad * 2;
    const scale = zoom ? w / base.width : Math.min(w / base.width, h / base.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const vp = p.getViewport({ scale: scale * dpr });
    if (task) { try { task.cancel(); } catch (e) { /* already done */ } }
    const off = document.createElement('canvas');
    off.width = Math.floor(vp.width);
    off.height = Math.floor(vp.height);
    task = p.render({ canvasContext: off.getContext('2d'), viewport: vp });
    try {
      await task.promise;
    } catch (e) {
      if (e && e.name === 'RenderingCancelledException') return;
      throw e;
    }
    canvas.width = off.width;
    canvas.height = off.height;
    canvas.getContext('2d').drawImage(off, 0, 0);
    canvas.style.width = Math.floor(vp.width / dpr) + 'px';
    canvas.style.height = Math.floor(vp.height / dpr) + 'px';
    pageEl.textContent = page;
    say('');
    if (zoom) stage.scrollTop = 0;
  };

  const go = n => {
    if (!doc) return;
    const next = Math.max(1, Math.min(doc.numPages, n));
    if (next === page) return;
    page = next;
    render();
  };

  const open = async (pdfUrl, title, from) => {
    opener = from;
    url = pdfUrl;
    titleEl.textContent = title;
    download.href = pdfUrl;
    reader.hidden = false;
    document.body.classList.add('is-locked');
    canvas.width = canvas.height = 0;
    canvas.style.width = canvas.style.height = '0';
    pageEl.textContent = totalEl.textContent = '–';
    say('opening…');
    stage.focus({ preventScroll: true });
    try {
      const pdfjs = await loadLib();
      if (!cache.has(pdfUrl)) cache.set(pdfUrl, pdfjs.getDocument(pdfUrl).promise);
      doc = await cache.get(pdfUrl);
      if (url !== pdfUrl) return;
      page = 1;
      totalEl.textContent = doc.numPages;
      await render();
    } catch (err) {
      cache.delete(pdfUrl);
      doc = null;
      say(`The reader couldn't load here. <a href="${pdfUrl}" target="_blank" rel="noopener">Open the PDF directly</a>.`, true);
    }
  };

  const close = () => {
    reader.hidden = true;
    doc = null;
    url = '';
    document.body.classList.remove('is-locked');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    opener?.focus({ preventScroll: true });
  };

  const toggleZoom = () => {
    zoom = !zoom;
    zoomBtn.setAttribute('aria-pressed', String(zoom));
    stage.classList.toggle('is-zoomed', zoom);
    render();
  };

  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else reader.requestFullscreen?.().catch(() => {});
  };

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-reader-open]');
    if (!b) return;
    e.preventDefault();
    open(b.dataset.pdf, b.dataset.title || 'Comic', b);
  });
  $('[data-r-close]').addEventListener('click', close);
  $('[data-r-prev]').addEventListener('click', () => go(page - 1));
  $('[data-r-next]').addEventListener('click', () => go(page + 1));
  zoomBtn.addEventListener('click', toggleZoom);
  $('[data-r-full]').addEventListener('click', toggleFull);

  // click on the left / right third of the page to turn it (when not zoomed)
  stage.addEventListener('click', e => {
    if (zoom || e.target !== canvas) return;
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    if (x < .33) go(page - 1); else if (x > .67) go(page + 1);
  });

  document.addEventListener('keydown', e => {
    if (reader.hidden) return;
    if (e.key === 'Escape' && !document.fullscreenElement) close();
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(page - 1); }
    else if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !zoom)) { e.preventDefault(); go(page + 1); }
    else if (e.key === 'Home') go(1);
    else if (e.key === 'End' && doc) go(doc.numPages);
    else if (e.key.toLowerCase() === 'z') toggleZoom();
    else if (e.key.toLowerCase() === 'f') toggleFull();
  });

  let sx = null, sy = null;
  stage.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (sx == null || zoom) return;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(page + (dx < 0 ? 1 : -1));
    sx = sy = null;
  });

  let rt = 0;
  const rerender = () => { clearTimeout(rt); rt = setTimeout(() => { if (!reader.hidden) render(); }, 150); };
  window.addEventListener('resize', rerender);
  document.addEventListener('fullscreenchange', rerender);
}
