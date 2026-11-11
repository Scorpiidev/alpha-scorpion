/* ANTARES · contact.js
   Sends the contact form through Web3Forms (the access key does not expose the email address).
   Without JavaScript the form still posts normally and redirects to /contact/received/. */
(() => {
  'use strict';
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = form.querySelector('[data-status]');
  const send = form.querySelector('.form__send');
  const key = (form.dataset.key || '').trim();

  const say = (msg, kind = '') => {
    status.textContent = msg;
    status.classList.toggle('is-err', kind === 'err');
    status.classList.toggle('is-ok', kind === 'ok');
  };

  const fieldOf = el => el.closest('.field');
  form.querySelectorAll('[required]').forEach(el =>
    el.addEventListener('input', () => fieldOf(el)?.classList.remove('is-invalid')));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!key) { say("The form isn't connected yet.", 'err'); return; }

    let bad = null;
    form.querySelectorAll('[required]').forEach(el => {
      const ok = el.checkValidity() && el.value.trim() !== '';
      fieldOf(el)?.classList.toggle('is-invalid', !ok);
      if (!ok && !bad) bad = el;
    });
    if (bad) {
      bad.focus();
      say(bad.type === 'email' ? 'That email address looks wrong.' : 'Please fill in the empty fields.', 'err');
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    if (data.botcheck) return;
    delete data.redirect;
    if (form.querySelector('.h-captcha') && !data['h-captcha-response']) {
      say('Please tick the captcha box first.', 'err');
      return;
    }

    send.disabled = true;
    say('Sending…');
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        say("Thank you! Your message was sent. I'll reply by email soon.", 'ok');
        form.reset();
      } else {
        say((json.message || 'Something went wrong') + '. Please try again.', 'err');
      }
    } catch (err) {
      say('No connection. Check your internet and try again.', 'err');
    } finally {
      send.disabled = false;
      try { window.hcaptcha && window.hcaptcha.reset(); } catch (e) { /* not loaded */ }
    }
  });
})();
