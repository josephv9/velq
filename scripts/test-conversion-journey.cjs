#!/usr/bin/env node
'use strict';
// Test the local rendered site only. All vendor requests and signup submissions are mocked.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright' : 'playwright');
const base = process.env.VELQ_QA_BASE || 'http://127.0.0.1:8766';
assert(/^http:\/\/127\.0\.0\.1:\d+$/.test(base), 'Only a local test server is permitted');
const output = process.env.VELQ_QA_OUTPUT || '/tmp/velq-conversion-qa';
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.VELQ_CHROMIUM_PATH ? { executablePath: process.env.VELQ_CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const results = [];
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 1000 }, reducedMotion: 'reduce' });
      const errors = []; let signupPosts = 0;
      await context.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== base) return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
        if (url.pathname === '/api/waitlist') {
          signupPosts++;
          return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, status: 'confirmed', newLead: true, eventId: 'local-journey-' + width }) });
        }
        return route.continue();
      });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      let response = await page.goto(base + '/products/strawberry-protein-fiber-gummies', { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('#waitlist-form').count(), 1);
      const scriptNames = await page.locator('script[src]').evaluateAll(nodes => nodes.map(n => new URL(n.src).pathname));
      for (const path of ['/analytics.js', '/velq-analytics.js', '/velq-waitlist.js', '/app.js', '/velq-lead-capture.js']) assert.equal(scriptNames.filter(x => x === path).length, 1, path + ' loaded twice');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'Product page overflows at ' + width);
      assert.equal(await page.evaluate(() => Array.from(window.dataLayer || []).filter(x => x[0] === 'event' && x[1] === 'product_detail_view').length), 1);
      assert.equal(signupPosts, 0, 'Viewing a product must not subscribe');
      await page.screenshot({ path: output + '/product-' + width + '.png', fullPage: true });
      const schema = await page.locator('script[type="application/ld+json"]').allTextContents();
      schema.forEach(json => JSON.parse(json));
      assert(!schema.join('').includes('"offers"'), 'Prelaunch details must not invent a purchasable offer');
      response = await page.goto(base + '/blog/protein-and-fiber-gummies-buying-guide', { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      assert.equal(await page.locator('#waitlist-form').count(), 0, 'Article expectation changed');
      await page.locator('a[data-waitlist-cta][href*="#waitlist"]').first().click();
      await page.waitForURL(base + '/#waitlist');
      await page.locator('#waitlist-email').fill('local-simulation@example.invalid');
      await page.locator('#waitlist-consent').check();
      await page.locator('#waitlist-submit').click();
      await page.waitForFunction(() => document.querySelector('#waitlist-form')?.dataset.waitlistState === 'confirmed');
      const events = await page.evaluate(() => Array.from(window.dataLayer || []).filter(x => x && x[0] === 'event').map(x => ({ name: x[1], params: x[2] })));
      assert.equal(signupPosts, 1, 'One valid form submission should send one initial request');
      const successes = events.filter(x => x.name === 'waitlist_signup_success');
      assert.equal(successes.length, 1, 'Expected exactly one canonical signup conversion');
      assert.equal(successes[0].params.article_path, '/blog/protein-and-fiber-gummies-buying-guide');
      assert.equal(successes[0].params.landing_page, '/products/strawberry-protein-fiber-gummies');
      assert(!JSON.stringify(events).includes('@'), 'No email belongs in analytics');
      assert.equal(await page.locator('[data-waitlist-next]').isVisible(), true, 'Confirmed state lacks a next step');
      assert.equal(await page.locator('#waitlist-submit').isDisabled(), true, 'Confirmed forms must not re-submit');
      await page.locator('#waitlist').scrollIntoViewIfNeeded();
      await page.screenshot({ path: output + '/confirmed-' + width + '.png', fullPage: false });
      assert.equal(errors.length, 0, 'Page errors: ' + errors.join('; '));
      results.push({ width, scriptsLoadedOnce: true, mockedSignups: signupPosts, canonicalConversions: successes.length, articleAttribution: true, productView: true, pageErrors: errors });
      await context.close();
    }
    console.log(JSON.stringify({ status: 'PASS', results, screenshots: output, liveSignups: 0, externalAnalyticsRequests: 0 }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
