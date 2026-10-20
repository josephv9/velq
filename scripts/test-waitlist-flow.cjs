#!/usr/bin/env node
'use strict';
// Real browser, synthetic origin, intercepted endpoints. No real signups or analytics traffic.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright' : 'playwright');
const root = path.resolve(__dirname, '..');
const assets = Object.fromEntries(['velq-waitlist.js', 'app.js', 'velq-lead-capture.js', 'velq-lead-capture.css'].map(name => [name, fs.readFileSync(path.join(root, name), 'utf8')]));
const fixture = (popup = false, sparse = false) => `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/velq-lead-capture.css"><style>body{margin:0;padding:16px;font:16px Arial}input[type=email]{width:90%;height:42px}label{display:block;margin:12px 0}form{max-width:430px}button{min-height:44px}[hidden]{display:none!important}</style></head><body>
${sparse ? '<main>A guide without homepage controls.</main>' : `<button id="menu-toggle">Menu</button><nav id="mobile-nav" hidden><a href="#waitlist">Waitlist</a></nav><section id="waitlist" style="margin-top:${popup ? 1500 : 20}px"><form id="waitlist-form"><label>Email<input id="waitlist-email" name="email" type="email" required></label><input id="waitlist-interest" name="interest" value="strawberry" type="hidden"><input name="company" type="hidden"><label><input name="consent" type="checkbox" required>Send launch updates</label><button id="waitlist-submit" type="submit">JOIN THE WAITLIST</button><p id="signup-feedback"></p></form><div data-waitlist-next hidden>Explore Velq</div></section><a class="mobile-early-access" href="#waitlist">Waitlist</a>`}
<script>window.dataLayer=[];window.VELQ_ANALYTICS={ga4:'G-LOCAL-ONLY'};window.gtag=(...args)=>window.dataLayer.push(args);window.__success=[];window.__confirmed=[];window.addEventListener('velq:waitlist-success',e=>window.__success.push(e.detail));window.addEventListener('velq:waitlist-confirmed',e=>window.__confirmed.push(e.detail));</script>
<script src="/velq-waitlist.js" defer></script><script src="/app.js" defer></script><script src="/velq-lead-capture.js" defer></script></body></html>`;
const confirmed = (id = 'test-confirmed-1', isNew = true) => ({ status: 200, result: { ok: true, status: 'confirmed', newLead: isNew, eventId: id } });
const pending = () => ({ status: 202, result: { ok: true, status: 'pending', receipt: 'opaque-test-receipt' } });
let count = 0;

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.VELQ_TEST_CHROME || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  async function scenario(name, options, action) {
    const context = await browser.newContext({ viewport: { width: options.width || 390, height: 844 } });
    const page = await context.newPage();
    const posts = [], errors = [], external = [];
    let response = options.response || confirmed();
    await page.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (url.hostname !== 'velq.test') { external.push(url.hostname); return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }); }
      if (url.pathname === '/api/waitlist') {
        posts.push(JSON.parse(request.postData() || '{}'));
        const current = typeof response === 'function' ? response(posts.length) : response;
        if (current.abort) return route.abort('failed');
        return route.fulfill({ status: current.status, contentType: 'application/json', body: JSON.stringify(current.result) });
      }
      if (assets[url.pathname.slice(1)]) return route.fulfill({ status: 200, contentType: url.pathname.endsWith('.css') ? 'text/css' : 'text/javascript', body: assets[url.pathname.slice(1)] });
      return route.fulfill({ status: 200, contentType: 'text/html', body: fixture(options.popup, options.sparse) });
    });
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install();
    await page.goto('https://velq.test/', { waitUntil: 'domcontentloaded' });
    const submit = async (selector = '#waitlist-form', tracking = false) => {
      await page.locator(selector + ' input[name=email]').fill('local-qa@example.invalid');
      await page.locator(selector + ' input[name=consent]').check();
      if (tracking) { await page.locator(selector + ' .velq-tracking-details summary').click(); await page.locator(selector + ' input[name=tracking_consent]').check(); }
      await page.locator(selector).evaluate(form => form.requestSubmit());
    };
    const waitState = state => page.waitForFunction(value => document.querySelector('#waitlist-form')?.dataset.waitlistState === value, state);
    const state = () => page.evaluate(() => ({
      success: window.__success, confirmed: window.__confirmed, events: window.dataLayer,
      saved: Object.fromEntries(Object.keys(sessionStorage).map(key => [key, sessionStorage.getItem(key)])),
      local: Object.fromEntries(Object.keys(localStorage).map(key => [key, localStorage.getItem(key)])),
      feedback: document.querySelector('#signup-feedback')?.textContent,
      joined: window.VelqWaitlist.joined()
    }));
    try {
      await action({ page, posts, external, submit, waitState, state, respond: value => { response = value; } });
      assert.deepEqual(errors, [], 'Browser errors');
      const snapshot = await state();
      assert(!JSON.stringify([snapshot.events, snapshot.success, snapshot.confirmed, snapshot.saved, snapshot.local]).includes('local-qa@'), 'Email leaked into analytics, DOM events, or storage');
      count += 1;
      console.log('PASS: ' + name);
    } finally { await context.close(); }
  }
  try {
    await scenario('consent, immediate confirmation, one conversion, no second submit', {}, async ({ page, posts, submit, waitState, state }) => {
      await page.locator('#waitlist-email').fill('local-qa@example.invalid');
      await page.locator('#waitlist-form').evaluate(form => form.requestSubmit());
      assert.equal(posts.length, 0, 'Missing consent reached the API');
      await submit(); await waitState('confirmed');
      await page.locator('#waitlist-form').evaluate(form => form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true })));
      const s = await state();
      assert.equal(posts.length, 1); assert.equal(s.success.length, 1); assert.equal(s.confirmed.length, 1);
      assert.equal(s.joined, true); assert.equal(await page.locator('[data-waitlist-next]').isVisible(), true);
      for (const event of ['waitlist_form_view', 'waitlist_form_start', 'waitlist_submit']) assert.equal(s.events.filter(row => row[1] === event).length, 1, event);
      assert.equal(await page.locator('#velq-lead-popup').count(), 0, 'Legacy second popup still created');
    });
    await scenario('existing subscriber settles the UI without a new conversion', { response: confirmed('existing', false) }, async ({ page, submit, waitState, state }) => {
      await submit(); await waitState('confirmed');
      const s = await state(); assert.equal(s.success.length, 0); assert.equal(s.confirmed.length, 1); assert(s.feedback.includes('already'));
      await page.clock.fastForward(16000); assert.equal(await page.locator('#velq-early-access').count(), 0);
    });
    await scenario('non-confirmed OK response cannot become a success; retry works', { response: { status: 200, result: { ok: true, newLead: true, eventId: 'unconfirmed' } } }, async ({ submit, waitState, state, respond }) => {
      await submit(); await waitState('error'); let s = await state(); assert.equal(s.success.length, 0); assert.equal(s.joined, false);
      respond(confirmed()); await submit(); await waitState('confirmed'); s = await state(); assert.equal(s.success.length, 1);
    });
    await scenario('pending receipt polls to a confirmed signup', { response: n => n === 1 ? pending() : confirmed() }, async ({ page, posts, submit, waitState, state }) => {
      await submit(); await waitState('checking'); assert.equal((await state()).success.length, 0);
      await page.clock.fastForward(1600); await waitState('confirmed');
      assert.equal(posts.length, 2); assert.deepEqual(posts[1], { receipt: 'opaque-test-receipt' });
      const s = await state(); assert.equal(s.saved.velq_pending_waitlist, undefined); assert.equal(s.success.length, 1);
    });
    await scenario('pending checks are bounded, retained, and manually resumable', { response: pending() }, async ({ page, posts, submit, waitState, state, respond }) => {
      await submit(); await waitState('checking');
      for (let i = 0; i < 4; i++) { await page.clock.fastForward(5500); await page.waitForFunction(n => !window.VelqWaitlist.isBusy() || window.VelqWaitlist.hasPending(), i); await new Promise(resolve => setTimeout(resolve, 15)); }
      await waitState('pending'); assert.equal(posts.length, 5);
      let s = await state(); assert.equal(s.success.length, 0); assert.equal(s.joined, false); assert.equal(s.saved.velq_pending_waitlist, 'opaque-test-receipt');
      assert.equal(await page.locator('#waitlist-submit').getAttribute('type'), 'button');
      respond(confirmed()); await page.locator('#waitlist-submit').click(); await waitState('confirmed');
      assert.deepEqual(posts[5], { receipt: 'opaque-test-receipt' }); s = await state(); assert.equal(s.success.length, 1);
    });
    await scenario('network interruption keeps a pending receipt and never creates a lead', { response: n => n === 1 ? pending() : { abort: true } }, async ({ page, submit, waitState, state, respond }) => {
      await submit(); await waitState('checking'); await page.clock.fastForward(1600); await waitState('pending');
      const s = await state(); assert.equal(s.success.length, 0); assert.equal(s.saved.velq_pending_waitlist, 'opaque-test-receipt');
      respond(confirmed()); await page.locator('#waitlist-submit').click(); await waitState('confirmed');
    });
    await scenario('suppression clears pending and remains an error', { response: n => n === 1 ? pending() : { status: 200, result: { ok: true, status: 'suppressed' } } }, async ({ page, submit, waitState, state }) => {
      await submit(); await waitState('checking'); await page.clock.fastForward(1600); await waitState('error');
      const s = await state(); assert.equal(s.success.length, 0); assert.equal(s.joined, false); assert.equal(s.saved.velq_pending_waitlist, undefined);
      assert.equal(await page.locator('#waitlist-email').isDisabled(), false);
    });
    await scenario('pending reload checks receipt without asking for email again', { response: pending() }, async ({ page, posts, submit, waitState, respond, state }) => {
      await submit(); await waitState('checking'); respond(confirmed()); await page.reload(); await waitState('confirmed');
      assert.deepEqual(posts[posts.length - 1], { receipt: 'opaque-test-receipt' }); assert.equal((await state()).success.length, 1);
    });
    await scenario('same server event is deduplicated after navigation', {}, async ({ page, submit, waitState, state }) => {
      await submit(); await waitState('confirmed'); await page.reload(); await submit(); await waitState('confirmed');
      const s = await state(); assert.equal(s.success.length, 0); assert.equal(s.confirmed.length, 1);
    });
    await scenario('one mobile popup uses confirmed protocol and separate tracking consent', { popup: true, width: 320 }, async ({ page, posts, submit, state, external }) => {
      await page.clock.fastForward(14100); await page.locator('#velq-early-access').waitFor({ state: 'visible' });
      const rect = await page.locator('.velq-lead-card').boundingBox();
      assert(rect.x >= 0 && rect.x + rect.width <= 321, 'Popup overflow');
      assert.equal((await state()).events.filter(row => row[1] === 'waitlist_form_start').length, 0, 'Automatic focus counted as a form start');
      await submit('#velq-lead-form'); await page.locator('.velq-lead-thanks').waitFor({ state: 'visible' });
      const s = await state(); assert.equal(posts.length, 1); assert.equal(s.success.length, 1); assert.equal(s.success[0].source, 'popup');
      assert.equal(s.success[0].trigger, 'time_on_page'); assert.equal(s.success[0].formId, 'velq-lead-form');
      assert.equal(external.filter(host => host.includes('klaviyo')).length, 0, 'Optional tracking loaded without consent');
    });
    await scenario('optional tracking runs only after confirmed opt-in', {}, async ({ page, submit, waitState, state }) => {
      await submit('#waitlist-form', true); await waitState('confirmed');
      const tracking = await page.evaluate(() => ({ count: (window.klaviyo || []).length, key: localStorage.getItem('velq_tracking_consent_v1') }));
      assert.equal(tracking.count, 2); assert.equal(tracking.key, '1'); assert.equal((await state()).success.length, 1);
    });
    await scenario('shared app works on pages without homepage controls', { sparse: true }, async ({ page }) => {
      assert.equal(await page.locator('#waitlist-form').count(), 0); await page.clock.fastForward(14100); await page.locator('#velq-early-access').waitFor({ state: 'visible' });
    });
    console.log(`PASS: ${count} browser scenarios; all endpoints mocked, zero real signups or analytics calls.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
