/* One first-party waitlist client for inline and popup forms.
   Pending receipts contain no email and are retained only for this browser session. */
(() => {
  'use strict';
  if (window.VelqWaitlist) return;
  const PENDING_KEY = 'velq_pending_waitlist';
  const CONTEXT_KEY = 'velq_pending_waitlist_context_v2';
  const JOINED_KEY = 'velq_waitlist_joined_v1';
  const SEEN_KEY = 'velq_confirmed_waitlist_events_v2';
  const MAX_CHECKS = 4;
  const CHECK_WINDOW_MS = 30000;
  const bindings = new WeakMap();
  const seen = new Set();
  let busy = false;
  let pendingMemory = '';
  let joinedMemory = false;
  function read(storage, key) { try { return window[storage].getItem(key); } catch { return null; } }
  function write(storage, key, value) { try { if (value == null) window[storage].removeItem(key); else window[storage].setItem(key, String(value)); } catch {} }
  function receipt() { return pendingMemory || read('sessionStorage', PENDING_KEY) || ''; }
  function validReceipt(value) { return typeof value === 'string' && value.length > 0 && value.length <= 1500; }
  function joined() { return joinedMemory || read('localStorage', JOINED_KEY) === '1' || read('localStorage', 'velq_waitlist_joined') === '1'; }
  function clearPending() { pendingMemory = ''; write('sessionStorage', PENDING_KEY, null); write('sessionStorage', CONTEXT_KEY, null); }
  function safeContext(value = {}) { return { source: value.source === 'popup' ? 'popup' : 'inline', formId: value.formId === 'velq-lead-form' ? 'velq-lead-form' : 'waitlist-form', trigger: ['exit_intent', 'time_on_page'].includes(value.trigger) ? value.trigger : 'onsite' }; }
  function savedContext(fallback) { try { return safeContext(JSON.parse(read('sessionStorage', CONTEXT_KEY) || JSON.stringify(fallback))); } catch { return safeContext(fallback); } }
  function storePending(value, context) { pendingMemory = value; write('sessionStorage', PENDING_KEY, value); write('sessionStorage', CONTEXT_KEY, JSON.stringify(safeContext(context))); }
  try { const ids = JSON.parse(read('sessionStorage', SEEN_KEY) || '[]'); if (Array.isArray(ids)) ids.filter(id => typeof id === 'string').slice(-20).forEach(id => seen.add(id)); } catch {}
  function track(name, context, failureType) {
    if (!['waitlist_form_view', 'waitlist_form_start', 'waitlist_submit', 'waitlist_submit_failed', 'waitlist_confirmation_pending'].includes(name)) return;
    const safe = safeContext(context);
    const details = { form_id: safe.formId, form_source: safe.source };
    if (safe.source === 'popup') details.popup_trigger = safe.trigger;
    if (['validation', 'timeout', 'request_failed', 'suppressed', 'invalid_response'].includes(failureType)) details.failure_type = failureType;
    if (window.VELQ_ANALYTICS?.ga4 && typeof window.gtag === 'function') window.gtag('event', name, details);
    else if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: name, ...details });
  }
  function failure(message, type = 'request_failed') { const error = new Error(message); error.failureType = type; return error; }
  async function request(body, timeout = 15000) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body), signal: controller.signal });
      let result;
      try { result = await response.json(); } catch { throw failure('We could not confirm your signup. Please try again.', 'invalid_response'); }
      if (!result || typeof result !== 'object') throw failure('We could not confirm your signup. Please try again.', 'invalid_response');
      if (result.status === 'suppressed') { clearPending(); throw failure('This address cannot be subscribed through this form. Please contact Velq for help.', 'suppressed'); }
      if (!response.ok || result.ok === false) {
        // A temporary server/network error must not discard a saved request.
        if (response.status >= 400 && response.status < 500 && response.status !== 429) clearPending();
        throw failure(typeof result.error === 'string' ? result.error : 'We could not save your signup. Please try again.');
      }
      if (result.status === 'pending' && validReceipt(result.receipt)) return result;
      if (result.status === 'confirmed' && result.ok === true) return result;
      throw failure('We could not confirm your signup. Please try again.', 'invalid_response');
    } catch (error) {
      if (error.name === 'AbortError') throw failure('That took longer than expected. Please try again.', 'timeout');
      throw error;
    } finally { window.clearTimeout(timer); }
  }
  function confirmed(result, context) {
    clearPending(); joinedMemory = true; write('localStorage', JOINED_KEY, '1');
    const detail = { ...safeContext(context), newLead: result.newLead === true };
    const id = typeof result.eventId === 'string' ? result.eventId.trim() : '';
    if (id) detail.eventId = id;
    if (result.newLead === true && id && !seen.has(id)) {
      seen.add(id); write('sessionStorage', SEEN_KEY, JSON.stringify([...seen].slice(-20)));
      window.dispatchEvent(new CustomEvent('velq:waitlist-success', { detail }));
    }
    // Existing confirmed subscribers also settle the UI, without a new conversion.
    window.dispatchEvent(new CustomEvent('velq:waitlist-confirmed', { detail }));
  }
  async function run(body, context, onPending) {
    if (busy) throw failure('Another signup is being checked. Please wait a moment.');
    busy = true;
    const start = Date.now();
    const activeContext = receipt() ? savedContext(context) : safeContext(context);
    try {
      let result = await request(receipt() ? { receipt: receipt() } : body);
      let checks = 0;
      while (result.status === 'pending') {
        storePending(result.receipt, activeContext); onPending();
        const remaining = CHECK_WINDOW_MS - (Date.now() - start);
        if (checks >= MAX_CHECKS || remaining <= 1500) return { status: 'pending' };
        const delay = Math.min(1500 * (checks + 1), 5000);
        if (remaining <= delay + 500) return { status: 'pending' };
        await new Promise(resolve => window.setTimeout(resolve, delay)); checks += 1;
        result = await request({ receipt: receipt() }, Math.min(15000, CHECK_WINDOW_MS - (Date.now() - start)));
      }
      confirmed(result, activeContext); return result;
    } catch (error) { if (receipt()) return { status: 'pending' }; throw error; }
    finally { busy = false; }
  }
  function bindForm(options) {
    const { form, submit, feedback } = options;
    if (!form || !submit || !feedback) return null;
    if (bindings.has(form)) return bindings.get(form);
    const context = safeContext({ source: options.source, formId: form.id, trigger: options.trigger });
    const originalButton = submit.innerHTML;
    let state = 'idle', submitting = false, started = false, viewed = false, observer;
    const inputStates = new Map();
    if (!feedback.id) feedback.id = `${form.id}-feedback`;
    feedback.setAttribute('role', 'status'); feedback.setAttribute('aria-live', 'polite'); feedback.setAttribute('aria-atomic', 'true'); feedback.tabIndex = -1;
    form.setAttribute('aria-describedby', feedback.id);
    if (form.elements.email) {
      form.elements.email.setAttribute('autocapitalize', 'none'); form.elements.email.setAttribute('spellcheck', 'false'); form.elements.email.setAttribute('inputmode', 'email'); form.elements.email.setAttribute('aria-describedby', feedback.id);
    }
    function view() { if (viewed) return; viewed = true; track('waitlist_form_view', context); observer?.disconnect(); }
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .2)) view(); }, { threshold: .2 }); observer.observe(form);
    }
    form.addEventListener('focusin', event => {
      if (event.target.matches('input:not([type="hidden"]):not([name="company"]),button')) view();
    });
    // Focusing a newly opened popup is accessibility behavior, not a form start.
    function startForm(event) {
      if (started || state === 'confirmed' || !event.target.matches('input:not([type="hidden"]):not([name="company"])')) return;
      view(); started = true; track('waitlist_form_start', context);
    }
    form.addEventListener('input', startForm);
    form.addEventListener('change', startForm);
    let invalidQueued = false;
    form.addEventListener('invalid', () => {
      if (invalidQueued) return; invalidQueued = true; track('waitlist_submit_failed', context, 'validation'); window.setTimeout(() => { invalidQueued = false; }, 0);
    }, true);
    function lockInputs(lock) {
      form.querySelectorAll('input').forEach(input => {
        if (lock) { if (!inputStates.has(input)) inputStates.set(input, input.disabled); input.disabled = true; }
        else if (inputStates.has(input)) { input.disabled = inputStates.get(input); inputStates.delete(input); }
      });
    }
    function setState(value, message) {
      state = value; form.dataset.waitlistState = value; form.setAttribute('aria-busy', String(value === 'submitting' || value === 'checking'));
      feedback.classList.toggle('error', value === 'error'); feedback.classList.toggle('success', value === 'confirmed'); feedback.textContent = message || '';
      submit.type = value === 'pending' ? 'button' : 'submit'; submit.disabled = ['submitting', 'checking', 'confirmed'].includes(value);
      if (value === 'submitting') submit.textContent = 'JOINING…';
      else if (value === 'checking') submit.textContent = 'CONFIRMING…';
      else if (value === 'pending') submit.textContent = 'CHECK CONFIRMATION';
      else if (value === 'confirmed') submit.textContent = 'YOU’RE ON THE LIST';
      else submit.innerHTML = originalButton;
      lockInputs(['submitting', 'checking', 'pending', 'confirmed'].includes(value));
    }
    async function submitForm(resume = false) {
      if (submitting || state === 'confirmed') return;
      if (busy) { feedback.textContent = 'Another signup is being checked. Please wait a moment.'; return; }
      const checking = Boolean(receipt());
      if (!checking && (!form.reportValidity() || !form.elements.consent?.checked)) return;
      const body = checking ? null : { email: form.elements.email.value.trim(), interest: 'strawberry', consent: form.elements.consent.checked, company: form.elements.company?.value || '' };
      submitting = true; if (!checking) track('waitlist_submit', context);
      setState(checking ? 'checking' : 'submitting', checking ? 'Your request is saved. We’re checking confirmation…' : '');
      try {
        const result = await run(body, context, () => { if (form.isConnected) setState('checking', 'Your request is saved. We’re confirming your subscription…'); });
        if (!form.isConnected) return;
        if (result.status === 'pending') { setState('pending', 'Your request is saved. Confirmation is still pending. Check again here; there’s no need to submit your email twice.'); track('waitlist_confirmation_pending', context); }
        else {
          // Confirmation listeners read optional consent before the form is cleared.
          form.reset(); if (form.elements.interest) form.elements.interest.value = 'strawberry';
          setState('confirmed', result.newLead === true ? 'You’re on the list. We’ll email you when Velq launches, with final product details and how to order.' : 'You’re already on the list. We’ll email you when Velq launches, with final product details and how to order.');
          document.querySelectorAll('[data-waitlist-next]').forEach(next => { next.hidden = false; });
          options.onConfirmed?.(result);
        }
        if (!resume && feedback.isConnected) feedback.focus({ preventScroll: true });
      } catch (error) {
        if (!form.isConnected) return; setState('error', error.message || 'Please check your connection and try again.'); track('waitlist_submit_failed', context, error.failureType || 'request_failed'); if (!resume) feedback.focus({ preventScroll: true });
      } finally { submitting = false; }
    }
    form.addEventListener('submit', event => { event.preventDefault(); void submitForm(); });
    submit.addEventListener('click', event => { if (state === 'pending') { event.preventDefault(); void submitForm(true); } });
    const binding = { check: () => submitForm(true), get state() { return state; } };
    bindings.set(form, binding);
    if (options.autoResume && receipt()) void submitForm(true);
    return binding;
  }
  window.VelqWaitlist = Object.freeze({ bindForm, joined, hasPending: () => Boolean(receipt()), isBusy: () => busy, track });
})();
