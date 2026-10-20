/* Velq early-access lead capture. Email only; no inferred identity or SMS collection. */
(function () {
  'use strict';
  if (window.__velqLeadCaptureLoaded) return;
  window.__velqLeadCaptureLoaded = true;

  var VERSION = 'velq_launch_v1';
  var JOINED_KEY = 'velq_waitlist_joined_v1';
  var DISMISSED_KEY = 'velq_early_access_dismissed_until_v1';
  var path = window.location.pathname;
  if (!/^\/(?:$|blog(?:\/|$)|guides(?:\/|$)|compare(?:\/|$)|tools(?:\/|$))/.test(path)) return;

  var shown = false;
  var overlay = null;
  var previousFocus = null;
  var startedAt = Date.now();

  function read(key) {
    try { return window.localStorage.getItem(key); } catch (_) { return null; }
  }
  function save(key, value) {
    try { window.localStorage.setItem(key, String(value)); } catch (_) {}
  }
  function eligible() {
    if (shown || read(JOINED_KEY) === '1' || Number(read(DISMISSED_KEY)) > Date.now()) return false;
    if (document.hidden) return false;
    var active = document.activeElement;
    if (active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)) return false;
    if (document.querySelector('dialog[open], [aria-modal="true"], .klaviyo-form[role="dialog"]')) return false;
    var waitlist = document.getElementById('waitlist');
    if (waitlist) {
      var box = waitlist.getBoundingClientRect();
      if (box.top < window.innerHeight * .8 && box.bottom > window.innerHeight * .2) return false;
    }
    return true;
  }
  function event(name, context) {
    var details = { popup_id: VERSION, trigger: context || 'onsite' };
    if (window.VELQ_ANALYTICS && window.VELQ_ANALYTICS.ga4 && typeof window.gtag === 'function') {
      window.gtag('event', name, details);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(Object.assign({ event: name }, details));
    }
  }
  function markJoined() {
    save(JOINED_KEY, '1');
    if (overlay) close('other_signup', true);
  }
  var KLAVIYO_PUBLIC_KEY = 'RCNCJb';
  var KLAVIYO_CONSENT_KEY = 'velq_klaviyo_opted_in_v1';
  function loadConsentedKlaviyo() {
    // No Klaviyo onsite cookie before a successful, explicitly opted-in signup.
    if (read(KLAVIYO_CONSENT_KEY) !== '1') return;
    window._learnq = window._learnq || [];
    if (document.querySelector('script[src*="static.klaviyo.com/onsite/js/"]')) return;
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://static.klaviyo.com/onsite/js/' + KLAVIYO_PUBLIC_KEY + '/klaviyo.js';
    script.setAttribute('data-velq-consented-klaviyo', 'true');
    document.head.appendChild(script);
  }
  function syncIdentifiedKlaviyo(email, source) {
    if (typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
    save(KLAVIYO_CONSENT_KEY, '1');
    loadConsentedKlaviyo();
    // Identity commands are queued until the consent-gated Klaviyo script loads.
    if (!window._learnq || typeof window._learnq.push !== 'function') return;
    window._learnq.push(['identify', { $email: email }]);
    window._learnq.push(['track', 'Joined Velq Early Access', {
      Product: 'Strawberry Protein + Fiber Gummies', Source: source
    }]);
  }
  loadConsentedKlaviyo();
  window.addEventListener('velq:waitlist-success', function (e) {
    if (!e.detail || !e.detail.eventId) return;
    if (e.detail.source !== 'popup') {
      var inline = document.getElementById('waitlist-form');
      var email = inline && inline.elements && inline.elements.email;
      var consent = inline && inline.elements && inline.elements.consent;
      if (email && consent && consent.checked) syncIdentifiedKlaviyo(email.value.trim(), 'inline_waitlist');
    }
    if (e.detail.source === 'popup') save(JOINED_KEY, '1');
    else markJoined();
  });

  function onKey(e) {
    if (!overlay) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close('escape');
    } else if (e.key === 'Tab') {
      var items = Array.prototype.slice.call(overlay.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled])'
      )).filter(function (el) { return el.getClientRects().length > 0; });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  function close(reason, silent) {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.removeEventListener('keydown', onKey, true);
    if (!silent) {
      save(DISMISSED_KEY, Date.now() + 7 * 24 * 60 * 60 * 1000);
      event('velq_early_access_dismiss', reason);
    }
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
  }
  function show(reason) {
    if (!eligible()) return;
    shown = true;
    previousFocus = document.activeElement;
    var el = document.createElement('div');
    el.id = 'velq-early-access';
    el.className = 'velq-lead-overlay';
    el.innerHTML = [
      '<div class="velq-lead-backdrop" data-velq-close="backdrop"></div>',
      '<section class="velq-lead-card" role="dialog" aria-modal="true" aria-labelledby="velq-lead-title" aria-describedby="velq-lead-description">',
      '<button class="velq-lead-close" type="button" data-velq-close="button" aria-label="Close early-access signup">&times;</button>',
      '<p class="velq-lead-eyebrow">VELQ / EARLY ACCESS</p>',
      '<h2 id="velq-lead-title">Something good is coming.</h2>',
      '<p class="velq-lead-description" id="velq-lead-description">Get first access to Velq strawberry protein + fiber gummies and receive launch updates.</p>',
      '<p class="velq-lead-proof">Free to join &middot; No payment today</p>',
      '<form id="velq-lead-form">',
      '<label class="velq-lead-label" for="velq-lead-email">Email address</label>',
      '<input id="velq-lead-email" name="email" type="email" placeholder="you@example.com" autocomplete="email" inputmode="email" maxlength="254" required>',
      '<label class="velq-lead-consent"><input name="consent" type="checkbox" required><span>I agree to receive Velq launch and product updates by email. I can unsubscribe anytime.</span></label>',
      '<input class="velq-lead-honeypot" name="company" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">',
      '<button class="velq-lead-submit" type="submit">GET EARLY ACCESS <span aria-hidden="true">&rarr;</span></button>',
      '<p class="velq-lead-feedback" role="status" aria-live="polite"></p>',
      '</form>',
      '<p class="velq-lead-fineprint">We respect your inbox. Read our <a href="/privacy/">privacy policy</a>.</p>',
      '</section>'
    ].join('');
    document.body.appendChild(el);
    overlay = el;
    document.addEventListener('keydown', onKey, true);
    el.querySelectorAll('[data-velq-close]').forEach(function (btn) {
      btn.addEventListener('click', function () { close(btn.getAttribute('data-velq-close')); });
    });
    var form = el.querySelector('#velq-lead-form');
    var feedback = el.querySelector('.velq-lead-feedback');
    var submit = el.querySelector('.velq-lead-submit');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!form.reportValidity() || submit.disabled) return;
      var email = form.elements.email.value.trim();
      if (!email || !form.elements.consent.checked) return;
      event('velq_early_access_submit', 'submit');
      submit.disabled = true;
      submit.textContent = 'JOINING...';
      feedback.textContent = '';
      var controller = new AbortController();
      var timeout = setTimeout(function () { controller.abort(); }, 15000);
      try {
        var response = await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            email: email, interest: 'strawberry', consent: true, company: form.elements.company.value
          }),
          signal: controller.signal
        });
        var result = await response.json();
        if (!response.ok || result.ok !== true) {
          throw new Error(result.error || 'We could not save your signup. Please try again.');
        }
        if (result.newLead === true && typeof result.eventId === 'string' && result.eventId) {
          window.dispatchEvent(new CustomEvent('velq:waitlist-success', {
            detail: { eventId: result.eventId, source: 'popup', trigger: reason }
          }));
        }
        // Re-identify consented returners; analytics lead events still require newLead.
        syncIdentifiedKlaviyo(email, 'popup');
        save(JOINED_KEY, '1');
        if (overlay === el) {
          form.innerHTML = '<div class="velq-lead-thanks" role="status"><strong>You are on the list!</strong><p>We will email you when Velq launches.</p><button class="velq-lead-done" type="button">DONE</button></div>';
          form.querySelector('button').addEventListener('click', function () { close('completed', true); });
          form.querySelector('button').focus();
        }
      } catch (error) {
        if (overlay === el) {
          feedback.textContent = error.name === 'AbortError'
            ? 'That took longer than expected. Please try again.'
            : (error.message || 'Please check your connection and try again.');
        }
      } finally {
        clearTimeout(timeout);
        if (overlay === el) {
          submit.disabled = false;
          submit.innerHTML = 'GET EARLY ACCESS <span aria-hidden="true">&rarr;</span>';
        }
      }
    });
    event('velq_early_access_view', reason);
    el.querySelector('#velq-lead-email').focus({ preventScroll: true });
  }
  function start() {
    window.setTimeout(function () { show('time_on_page'); }, 14000);
    document.addEventListener('mouseout', function (e) {
      if (Date.now() - startedAt > 7000 && e.clientY <= 0 && !e.relatedTarget) show('exit_intent');
    }, { passive: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();