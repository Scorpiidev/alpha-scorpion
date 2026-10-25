/* ═══════════════════════════════════════════════════════════════
   ANTARES · transmit.js
   Sends the contact form through Web3Forms. Your email address never
   appears in this site: Web3Forms knows it from the access key.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  const form = document.getElementById('transmit-form');
  if (!form) return;
  const A = window.Antares || {};
  const status = form.querySelector('[data-console-status]');
  const led = form.querySelector('[data-console-led]');
  const send = form.querySelector('.console__send');
  const wave = form.querySelector('.console__wave');
  const key = (form.dataset.key || '').trim();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const say = (msg, kind = '') => {
    status.textContent = '> ' + msg;
    status.classList.toggle('is-err', kind === 'err');
    led.classList.toggle('is-ok', kind === 'ok');
    led.classList.toggle('is-busy', kind === 'busy');
  };

  /* ── the oscilloscope: idles, then screams while sending ──── */
  let amp = .15, target = .15, phase = 0, typing = 0;
  if (wave) {
    const ctx = wave.getContext('2d');
    const draw = () => {
      const { width: W, height: H } = wave;
      amp += (target + typing - amp) * .08;
      typing *= .94;
      phase += .12 + amp * .3;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(185,227,107,.9)';
      ctx.shadowColor = 'rgba(185,227,107,.8)';
      ctx.shadowBlur = 6;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const t = x / W;
        const y = H / 2 + Math.sin(t * 22 + phase) * H * .3 * amp * Math.sin(t * Math.PI) + Math.sin(t * 61 - phase * 1.7) * H * .08 * amp;
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      if (!reduce) requestAnimationFrame(draw);
    };
    draw();
    form.addEventListener('input', () => { typing = Math.min(.6, typing + .12); });
  }

  const fieldOf = el => el.closest('.field');
  form.querySelectorAll('[required]').forEach(el => el.addEventListener('input', () => fieldOf(el)?.classList.remove('is-invalid')));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!key) { say('transmitter offline: the access key has not been set yet.', 'err'); return; }

    let bad = null;
    form.querySelectorAll('[required]').forEach(el => {
      const ok = el.checkValidity() && el.value.trim() !== '';
      fieldOf(el)?.classList.toggle('is-invalid', !ok);
      if (!ok && !bad) bad = el;
    });
    if (bad) { bad.focus(); say(bad.type === 'email' ? 'that return frequency looks wrong. check the email.' : 'some fields are still empty.', 'err'); return; }

    const data = Object.fromEntries(new FormData(form));
    if (data.botcheck) return; // a bot ticked the invisible box
    delete data.redirect;      // only used when the form is sent without JavaScript
    if (form.querySelector('.h-captcha') && !data['h-captcha-response']) {
      say('tick the little box first. it keeps the kind machines resting.', 'err');
      return;
    }

    send.disabled = true;
    target = 1;
    say('transmitting into the dark…', 'busy');
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        say('signal received. I will answer from the dark soon. ✶', 'ok');
        form.reset();
        A.toast?.({ label: 'transmission sent', title: 'Signal received', text: 'Thank you. Your message reached the cabinet.', ms: 7000 });
      } else {
        say((json.message || 'the signal was lost') + '. try again?', 'err');
      }
    } catch (err) {
      say('no connection to the relay. check your internet and try again.', 'err');
    } finally {
      send.disabled = false;
      target = .15;
      try { window.hcaptcha && window.hcaptcha.reset(); } catch (e) { /* not loaded */ }
    }
  });
})();
