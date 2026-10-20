/* Velq early-access lead capture. Email only; no inferred identity or SMS collection. */
(function () {
  'use strict';
  if (window.__velqLeadCaptureLoaded) return;
  window.__velqLeadCaptureLoaded = true;

  var VERSION = 'velq_launch_v1';
  var JOINED_KEY = 'velq_waitlist_joined_v1';
  var DISMISSED_KEY = 'velq_early_access_dismissed_until_v1';
  var path = window.location.pathname;
  if (!/^\/(?:$|blog(?:\/|$)|guides(?:\/|$)|products(?:\/|$)|compare(?:\/|$)|tools(?:\/|$))/.test(path)) return;

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
    if (!window.VelqWaitlist || shown || window.VelqWaitlist.joined() || window.VelqWaitlist.hasPending() || window.VelqWaitlist.isBusy() || Number(read(DISMISSED_KEY)) > Date.now()) return false;
    if (document.hidden) return false;
    var active = document.activeElement;
    if (active && (/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName) || active.isContentEditable)) return false;
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
  var KLAVIYO_PUBLIC_KEY = 'RCNCJb';
  var TRACKING_CONSENT_KEY = 'velq_tracking_consent_v1';
  function loadConsentedKlaviyo() {
    // Email subscription and optional cookie tracking are separate choices.
    if (read(TRACKING_CONSENT_KEY) !== '1') return;
    window.klaviyo = window.klaviyo || [];
    if (document.querySelector('script[data-velq-consented-klaviyo]')) return;
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://static.klaviyo.com/onsite/js/' + KLAVIYO_PUBLIC_KEY + '/klaviyo.js';
    script.setAttribute('data-velq-consented-klaviyo', 'true');
    document.head.appendChild(script);
  }
  function syncIdentifiedKlaviyo(email, source, trackingOptIn) {
    if (!trackingOptIn || typeof email !== 'string' || !email.includes('@')) return;
    save(TRACKING_CONSENT_KEY, '1');
    try { document.cookie = '__kla_off=; Path=/; Max-Age=0; SameSite=Lax; Secure'; } catch (_) {}
    loadConsentedKlaviyo();
    if (!window.klaviyo || typeof window.klaviyo.push !== 'function') return;
    window.klaviyo.push(['identify', { email: email }]);
    window.klaviyo.push(['track', 'Joined Velq Early Access', {
      Product: 'Strawberry Protein + Fiber Gummies', Source: source
    }]);
  }
  function installInlineTrackingChoice() {
    var form = document.getElementById('waitlist-form');
    if (!form || form.querySelector('[name="tracking_consent"]')) return;
    var submit = form.querySelector('[type="submit"]');
    if (!submit) return;
    var details = document.createElement('details');
    details.className = 'velq-tracking-details';
    var summary = document.createElement('summary');
    summary.textContent = 'Personalize my updates (optional)';
    details.appendChild(summary);
    var label = document.createElement('label');
    label.className = 'velq-inline-tracking';
    label.innerHTML = '<input type="checkbox" name="tracking_consent"><span>Optional: let Velq recognize repeat visits for relevant launch updates. <a href="/privacy/">Privacy details</a>.</span>';
    details.appendChild(label);
    form.insertBefore(details, submit);
  }
  // Existing subscribers are recognized through Klaviyo cookies on return visits,
  // but we never store their email address in localStorage.
  loadConsentedKlaviyo();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installInlineTrackingChoice, { once: true });
  else installInlineTrackingChoice();
  window.addEventListener('velq:waitlist-confirmed', function (e) {
    if (!e.detail) return;
    var confirmedForm = document.getElementById(e.detail.formId);
    var email = confirmedForm && confirmedForm.elements && confirmedForm.elements.email;
    var consent = confirmedForm && confirmedForm.elements && confirmedForm.elements.consent;
    var tracking = confirmedForm && confirmedForm.elements && confirmedForm.elements.tracking_consent;
    if (email && consent && consent.checked) syncIdentifiedKlaviyo(email.value.trim(), e.detail.source === 'popup' ? 'popup' : 'inline_waitlist', Boolean(tracking && tracking.checked));
    save(JOINED_KEY, '1');
    if (overlay && e.detail.formId !== 'velq-lead-form') close('other_signup', true);
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
    if (previousFocus && previousFocus.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus();
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
      '<p class="velq-lead-description" id="velq-lead-description">Strawberry protein + fiber gummies are in development. Join for launch news, final product details and your first chance to shop.</p>',
      '<p class="velq-lead-proof">Free to join &middot; No payment today</p>',
      '<form id="velq-lead-form">',
      '<label class="velq-lead-label" for="velq-lead-email">Email address</label>',
      '<input id="velq-lead-email" name="email" type="email" placeholder="you@example.com" autocomplete="email" inputmode="email" maxlength="254" required>',
      '<label class="velq-lead-consent"><input name="consent" type="checkbox" required><span>I agree to receive Velq launch and product updates by email. I can unsubscribe anytime.</span></label>',
      '<details class="velq-tracking-details"><summary>Personalize my updates (optional)</summary><label class="velq-lead-consent velq-tracking-optional"><input name="tracking_consent" type="checkbox"><span>Let Velq recognize repeat visits for relevant launch updates. <a href="/privacy/">Privacy details</a>.</span></label></details>',
      '<input class="velq-lead-honeypot" name="company" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">',
      '<button class="velq-lead-submit" type="submit">JOIN THE WAITLIST <span aria-hidden="true">&rarr;</span></button>',
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
    window.VelqWaitlist.bindForm({
      form: form, submit: submit, feedback: feedback, source: 'popup', trigger: reason,
      onConfirmed: function () {
        if (overlay !== el) return;
        form.innerHTML = '<div class="velq-lead-thanks" role="status"><strong>You’re on the list.</strong><p>We’ll email you at launch with final product details and how to order.</p><button class="velq-lead-done" type="button">BACK TO VELQ</button></div>';
        form.querySelector('button').addEventListener('click', function () { close('completed', true); });
        form.querySelector('button').focus();
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
