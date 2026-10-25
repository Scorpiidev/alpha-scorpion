/* ═══════════════════════════════════════════════════════════════
   ANTARES · cabinet.js  (home page)
   the beating heart · the draggable desk · the terminal · the synth
   ═══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  const A = window.Antares;
  if (!A) return;
  const { $, $$, store, reduce } = A;

  /* ── the heart: cycles through the palette, hides an oddity ── */
  const heart = $('.orrery__heart');
  if (heart) {
    let v = 0, taps = 0;
    heart.addEventListener('click', e => {
      v = (v + 1) % 6;
      heart.dataset.variant = v;
      taps++;
      if (taps === 3) A.discover('heart');
      if (taps === 9) {
        const r = heart.getBoundingClientRect();
        A.supernova((r.left + r.width / 2) / innerWidth * 100, (r.top + r.height / 2) / innerHeight * 100);
        taps = 3;
      }
    });
  }

  /* ── parallax on the orrery ───────────────────────────────── */
  const orrery = $('.orrery');
  if (orrery && !reduce && matchMedia('(pointer: fine)').matches) {
    const lens = $('.orrery__lens', orrery), rings = $('.orrery__rings', orrery);
    addEventListener('pointermove', e => {
      const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      lens.style.transform = `translate(${x * -18}px, ${y * -18}px)`;
      rings.style.transform = `translate(${x * 10}px, ${y * 10}px)`;
    }, { passive: true });
  }

  /* ── the desk ─────────────────────────────────────────────── */
  const desk = $('[data-desk]');
  if (desk) {
    const KEY = 'antares.desk.v1';
    const pieces = $$('.piece', desk);
    const parse = (el, prop) => parseFloat(el.style.getPropertyValue(prop)) || 0;
    const defaults = {};
    pieces.forEach(p => { defaults[p.dataset.id] = { x: parse(p, '--x'), y: parse(p, '--y'), r: parse(p, '--r') }; });
    let saved = store.get(KEY, {});
    let z = 10;
    const place = (p, s) => {
      p.style.setProperty('--x', s.x + '%');
      p.style.setProperty('--y', s.y + '%');
      p.style.setProperty('--r', s.r + 'deg');
      if (s.z) { p.style.zIndex = s.z; z = Math.max(z, s.z); }
    };
    pieces.forEach(p => { const s = saved[p.dataset.id]; if (s) place(p, s); });
    const save = () => {
      const out = {};
      pieces.forEach(p => { out[p.dataset.id] = { x: parse(p, '--x'), y: parse(p, '--y'), r: parse(p, '--r'), z: +p.style.zIndex || 0 }; });
      saved = out;
      store.set(KEY, out);
    };
    const live = matchMedia('(min-width: 901px)');
    const setLive = () => desk.classList.toggle('is-live', live.matches);
    setLive();
    live.addEventListener?.('change', setLive);

    let drag = null;
    desk.addEventListener('pointerdown', e => {
      if (!live.matches || e.button > 0) return;
      const p = e.target.closest('.piece');
      if (!p) return;
      // interactive bits inside a piece keep working; those pieces drag by their title bar
      if (e.target.closest('input, button, textarea, select, canvas') && !e.target.closest('[data-handle]')) return;
      if (p.querySelector('[data-handle]') && !e.target.closest('[data-handle]')) return;
      const rect = desk.getBoundingClientRect();
      drag = { p, id: e.pointerId, sx: e.clientX, sy: e.clientY, x: parse(p, '--x'), y: parse(p, '--y'), rect, moved: false };
      p.style.zIndex = ++z;
    });
    desk.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.moved && Math.hypot(dx, dy) < 5) return;
      if (!drag.moved) {
        // capture only once it's really a drag, so a plain click still reaches links
        drag.moved = true;
        drag.p.classList.add('is-dragging');
        try { drag.p.setPointerCapture(drag.id); } catch (err) { /* pointer already gone */ }
      }
      const pw = drag.p.offsetWidth / drag.rect.width * 100, ph = drag.p.offsetHeight / drag.rect.height * 100;
      const nx = Math.min(100 - pw * .3, Math.max(-pw * .7, drag.x + dx / drag.rect.width * 100));
      const ny = Math.min(100 - ph * .3, Math.max(-ph * .5, drag.y + dy / drag.rect.height * 100));
      drag.p.style.setProperty('--x', nx.toFixed(2) + '%');
      drag.p.style.setProperty('--y', ny.toFixed(2) + '%');
    });
    const end = e => {
      if (!drag || e.pointerId !== drag.id) return;
      const { p, moved } = drag;
      p.classList.remove('is-dragging');
      if (moved) {
        p.dataset.dragged = '1';
        setTimeout(() => { delete p.dataset.dragged; }, 60);
        save();
      }
      drag = null;
    };
    addEventListener('pointerup', end);
    addEventListener('pointercancel', end);
    // a drag is not a click
    desk.addEventListener('click', e => {
      const p = e.target.closest('.piece');
      if (p && p.dataset.dragged) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    const fly = fn => {
      desk.classList.add('is-flying');
      fn();
      setTimeout(() => desk.classList.remove('is-flying'), 950);
    };
    $('[data-desk-shuffle]')?.addEventListener('click', () => fly(() => {
      pieces.forEach(p => {
        const big = p.offsetWidth > desk.offsetWidth * .15;
        place(p, {
          x: +(Math.random() * (big ? 78 : 90)).toFixed(2),
          y: +(Math.random() * (big ? 60 : 85)).toFixed(2),
          r: +((Math.random() - .5) * 16).toFixed(1)
        });
      });
      save();
    }));
    $('[data-desk-tidy]')?.addEventListener('click', () => fly(() => {
      pieces.forEach(p => { place(p, defaults[p.dataset.id]); p.style.zIndex = ''; });
      store.del(KEY);
      saved = {};
    }));
  }

  /* ── the synthesizer ──────────────────────────────────────── */
  const synth = $('[data-synth]');
  if (synth && A.grow) {
    const nameEl = $('[data-synth-name]'), noEl = $('[data-synth-no]');
    let grown = 0;
    const grow = seed => {
      const d = A.grow(synth, seed);
      noEl.textContent = `nº ${String(seed % 10000).padStart(4, '0')} · ${d.n}-fold symmetry`;
      if (A.scramble) A.scramble(nameEl, d.title); else nameEl.textContent = d.title;
    };
    grow(1649 + Math.floor(Date.now() / 864e5)); // a new specimen every day
    $('[data-synth-grow]')?.addEventListener('click', () => {
      grow(Math.floor(Math.random() * 1e9));
      if (++grown === 1) A.discover('specimen');
    });
  }

  /* ── the terminal ─────────────────────────────────────────── */
  const term = $('.term');
  if (term) {
    const out = $('.term__out', term), form = $('.term__line', term), input = $('.term__in', term);
    let data = { rooms: [], posts: [], onDisplay: 0, inVault: 0, base: '' };
    try { data = JSON.parse($('#term-data').textContent); } catch (e) { /* defaults */ }
    const url = u => (data.base || '') + u;
    const print = (html, cls = '') => {
      const p = document.createElement('p');
      if (cls) p.className = cls;
      p.innerHTML = html;
      out.appendChild(p);
      while (out.children.length > 40) out.firstChild.remove();
    };
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const go = room => {
      const r = data.rooms.find(x => x.name.toLowerCase().replace(/\s/g, '') === room || x.url.replace(/\//g, '') === room);
      if (!r) return print(`no room called "${esc(room)}". try <span class="hi">ls</span>.`, 'pink');
      print(`opening ${esc(r.name.toLowerCase())}…`, 'dim');
      setTimeout(() => { location.href = url(r.url); }, 450);
    };
    const CMDS = {
      help: () => print('commands: <span class="hi">ls · open &lt;room&gt; · log · whoami · stars · synth · oddities · date · clear</span>'),
      ls: () => data.rooms.forEach(r => print(`  ${esc(r.name.toLowerCase().padEnd(10))} <span class="dim">${esc(r.note)}</span>`)),
      open: arg => arg ? go(arg) : print('open what? e.g. <span class="hi">open specimens</span>'),
      cd: arg => CMDS.open(arg),
      log: () => {
        if (!data.posts.length) return print('no transmissions yet.', 'dim');
        data.posts.forEach(p => print(`${esc(p.date)}  <a href="${esc(p.url)}">${esc(p.title)}</a>`));
      },
      whoami: () => { print('Antares · Antares', 'hi'); print('animation · illustration · comics · Spain'); print('per tenebras, forma.', 'pink'); },
      stars: () => {
        const a = A.altitude ? A.altitude(new Date()) : 0;
        print('α Scorpii · Antares · red supergiant · ≈ 550 ly', 'hi');
        print(a > 0 ? `right now it is ${a.toFixed(1)}° above the Spanish horizon. look south.` : `right now it is below the Spanish horizon (${a.toFixed(1)}°). it will come back.`);
      },
      synth: () => { $('[data-synth-grow]')?.click(); print('the synthesizer hums. something grows.', 'dim'); },
      oddities: () => { const n = A.store.get('antares.oddities', []).length; print(`oddities in your drawer: ${n}. keep clicking on things.`); },
      date: () => print(new Date().toString(), 'dim'),
      clear: () => { out.innerHTML = ''; },
      antares: () => { A.supernova(); print('...', 'pink'); },
      hello: () => print('hello, traveller. the cabinet is listening.'),
      hi: () => CMDS.hello(),
      sudo: () => print('nice try.', 'pink'),
      exit: () => print('there is no exit. only other rooms.', 'pink')
    };
    form.addEventListener('submit', e => {
      e.preventDefault();
      const raw = input.value.trim();
      input.value = '';
      if (!raw) return;
      print(`&gt; ${esc(raw)}`, 'dim');
      const [cmd, ...rest] = raw.toLowerCase().split(/\s+/);
      const fn = CMDS[cmd];
      if (fn) fn(rest.join('').replace(/^\//, '').replace(/\/$/, ''));
      else if (data.rooms.some(r => r.name.toLowerCase().replace(/\s/g, '') === cmd)) go(cmd);
      else print(`command not found: ${esc(cmd)}. the dark hums politely. try <span class="hi">help</span>.`);
    });
    term.addEventListener('click', e => { if (!e.target.closest('a') && !e.target.closest('[data-handle]')) input.focus({ preventScroll: true }); });

    // boot sequence, typed when the terminal scrolls into view
    const boot = [
      ['booting cabinet.sys', 'dim'],
      ['scanning sector α-sco ........ ok', 'dim'],
      [`specimens on display: ${data.onDisplay} · in the vault: ${data.inVault}`, ''],
      data.posts[0] ? [`latest transmission: “${data.posts[0].title}”`, 'hi'] : ['no transmissions yet', 'dim'],
      ['type help, or just say hi.', 'pink']
    ];
    const typeLines = async () => {
      for (const [text, cls] of boot) {
        const p = document.createElement('p');
        if (cls) p.className = cls;
        out.appendChild(p);
        if (reduce) { p.textContent = text; continue; }
        for (let i = 0; i <= text.length; i++) { p.textContent = text.slice(0, i) + (i < text.length ? '▌' : ''); await new Promise(r => setTimeout(r, 14)); }
        await new Promise(r => setTimeout(r, 160));
      }
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); typeLines(); } }, { threshold: .4 });
      io.observe(term);
    } else typeLines();
  }
})();
