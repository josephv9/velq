#!/usr/bin/env node
'use strict';
// Local evidence only: no live signup, analytics request, or external HTTP call.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const zlib = require('node:zlib');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const net = require('node:net');
const {spawn, spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
process.chdir(root);

function render(route, body) {
  // Arguments avoid platform-specific child-process stdin/EOF behavior.
  const program = '$_SERVER["REQUEST_URI"]=$argv[1]; require "image-patch.php"; echo base64_decode($argv[2]);';
  const result = spawnSync('php', ['-d', 'display_errors=1', '-r', program, route, Buffer.from(body).toString('base64')], {
    cwd: root, encoding: 'utf8', timeout: 10000, maxBuffer: 8 * 1024 * 1024
  });
  assert.equal(result.status, 0, result.stderr || result.error?.message || 'PHP filter failed');
  assert(!/Fatal error|Warning:|Parse error/.test(result.stdout), 'PHP emitted a diagnostic');
  return result.stdout;
}

const seed = '<!doctype html><html><head><title>Research integration</title></head><body><main><h1>Labels</h1></main></body></html>';
const targets = [
  '/compare', '/guides', '/blog', '/blog/best-fiber-gummies-2026',
  '/blog/protein-gummies-with-fiber-comparison', '/blog/protein-and-fiber-gummies-buying-guide',
  '/blog/protein-gummies-vs-protein-bars', '/blog/protein-and-fiber-gummies-vs-separate-supplements',
  '/blog/fiber-gummies-vs-psyllium-husk', '/blog/protein-gummies-for-adults',
  '/blog/fiber-gummies-for-adults-guide', '/tools/protein-fiber-calculator'
];
const links = ['/research/gummy-serving-study-2026', '/tools/serving-comparison-calculator', '/tools/nutrition-label-value-calculator'];
for (const route of targets) {
  const output = render(route, seed);
  assert.equal((output.match(/id="velq-m3-related"/g) || []).length, 1, 'One research module: ' + route);
  const module = output.match(/<section id="velq-m3-related"[\s\S]*?<\/section>/)?.[0];
  assert(module, 'Research links are in a section');
  for (const link of links) assert(module.includes('href="' + link + '"'), 'Missing link: ' + route + ' -> ' + link);
  assert.equal((output.match(/\/assets\/research\/research\.css/g) || []).length, 1);
  assert(!output.includes('/assets/research/research-events.js'), 'Read-only module needs no added tracking script');
  const repeated = render(route, output);
  assert.equal((repeated.match(/id="velq-m3-related"/g) || []).length, 1, 'Repeated filter duplicates module');
  assert.equal((repeated.match(/\/assets\/research\/research\.css/g) || []).length, 1);
}
for (const route of ['/', '/blog/simple-daily-wellness-routine-that-sticks']) {
  const output = render(route, seed);
  assert(!output.includes('velq-m3-related'), 'Unrelated page received a research module');
  assert(!output.includes('/assets/research/'), 'Unrelated page received research assets');
}
const pageRoutes = ['/research', ...links];
const dispatcherRoutes = [...pageRoutes, '/blog/protein-gummies-with-fiber-comparison'];
const rewrites = fs.readFileSync('.htaccess', 'utf8');
const evidenceRule = rewrites.split(/\r?\n/).find(line => /^\s*RewriteRule /.test(line) && line.includes('research-content.php [END]'));
assert(evidenceRule, 'Evidence dispatcher rewrite is present');
const evidencePattern = new RegExp(evidenceRule.trim().split(/\s+/)[1]);
assert(rewrites.indexOf(evidenceRule) < rewrites.indexOf('nutrition-content.php [END]'), 'Evidence route must precede packed Journal routing');
assert(rewrites.indexOf(evidenceRule) < rewrites.indexOf('velq-site.php [END]'), 'Evidence route must precede packed tool routing');
for (const route of dispatcherRoutes) {
  for (const alias of [route, route + '/', route + '/index.html']) {
    assert(evidencePattern.test(alias.slice(1)), 'Evidence rewrite does not match ' + alias);
  }
}
for (const route of pageRoutes) {
  const output = render(route, seed);
  assert.equal((output.match(/\/assets\/research\/research-events\.js/g) || []).length, 1);
  assert.equal((render(route, output).match(/\/assets\/research\/research-events\.js/g) || []).length, 1);
}
for (const body of ['{"ok":true,"newLead":false}', '{"ok":true,"newLead":true,"eventId":"MOCK"}', '{"error":"Validation failed"}']) {
  assert.equal(render('/api/waitlist', body), body, 'Signup API response changed');
}
console.log('PASS: 12 dynamic buyer/tool routes, 36 contextual links, repeated-filter guards, scoped assets and byte-exact API responses.');

const bundle = fs.readFileSync('velq-site.php', 'utf8').match(/\$assets=json_decode\(base64_decode\('([A-Za-z0-9+/=]+)'\),true\)/);
assert(bundle, 'Main asset bundle is present');
const assets = JSON.parse(Buffer.from(bundle[1], 'base64').toString());
const analytics = Buffer.from(assets['/analytics.js'].data, 'base64').toString();
const patched = render('/analytics.js', analytics);
const oldPart = String.raw`\/compare|\/blog`;
const newPart = String.raw`\/compare|\/research(?:\/[a-z0-9-]+)?|\/blog`;
assert.equal(analytics.split(oldPart).length - 1, 1, 'Expected exactly one original path allowlist');
assert.equal(patched, analytics.replace(oldPart, newPart), 'Analytics changed outside the research route allowlist');
assert.equal(render('/analytics.js', patched), patched, 'Analytics patch is not idempotent');
new vm.Script(patched);

// Exercise the production listener with a research landing page and homepage CTA.
const listeners = new Map(), storage = new Map(), clicks = new Map();
const location = {pathname: '/research/gummy-serving-study-2026', search: ''};
const cta = {dataset: {waitlistCta: 'article-end'}, addEventListener: (kind, fn) => clicks.set(kind, fn)};
const context = {
  location, URL, Date, JSON, Set, Number,
  document: {
    referrer: 'https://www.google.com/', createElement: () => ({}), head: {appendChild() {}},
    querySelectorAll: selector => selector === '[data-waitlist-cta]' ? [cta] : []
  },
  sessionStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
  }
};
context.window = context;
context.VELQ_ANALYTICS = {ga4: 'G-MOCK-LOCAL-ONLY', meta: null, tiktok: null};
context.addEventListener = (kind, fn) => listeners.set(kind, fn);
vm.runInNewContext(patched, context, {filename: 'served:/analytics.js'});
const events = name => context.dataLayer.filter(item => item?.[0] === 'event' && item[1] === name);
assert.equal(storage.get('velq_landing_page'), '/research/gummy-serving-study-2026');
assert.equal(events('waitlist_signup_success').length, 0, 'Page view generated a lead');
clicks.get('click')();
location.pathname = '/';
cta.dataset.waitlistCta = 'home';
clicks.get('click')();
assert.equal(events('waitlist_signup_success').length, 0, 'CTA click generated a lead');
const confirm = listeners.get('velq:waitlist-success');
confirm({detail: {eventId: ''}});
assert.equal(events('waitlist_signup_success').length, 0, 'Missing server event ID generated a lead');
confirm({detail: {eventId: 'local-research-confirmation'}});
confirm({detail: {eventId: 'local-research-confirmation'}});
assert.equal(events('waitlist_signup_success').length, 1, 'Confirmation was missing or counted twice');
assert.equal(events('generate_lead').length, 1);
const parameters = events('waitlist_signup_success')[0][2];
assert.equal(parameters.landing_page, '/research/gummy-serving-study-2026');
assert.equal(parameters.article_path, '/research/gummy-serving-study-2026');
assert.equal(parameters.signup_page, '/');
assert.equal(parameters.entry_referrer_type, 'search_referrer');
assert(!JSON.stringify(parameters).includes('@'), 'Personal information entered event data');
console.log('PASS: exact analytics allowlist change; research attribution survives homepage navigation; page views/clicks are not leads; confirmation stays deduplicated.');

const nutrition = fs.readFileSync('nutrition-content.php', 'utf8').match(/\$pages=json_decode\(gzdecode\(base64_decode\('([^']+)'\)\),true\)/);
assert(nutrition, 'Generated Journal bundle is present');
const nutritionAssets = JSON.parse(zlib.gunzipSync(Buffer.from(nutrition[1], 'base64')).toString());
const originalSitemap = Buffer.from(nutritionAssets['/sitemap.xml'].data, 'base64').toString();
const sitemap = render('/sitemap.xml', originalSitemap);
assert.equal(render('/sitemap.xml', sitemap), sitemap, 'Sitemap repeated filtering changed output');
const xmlProgram = 'import sys,base64,xml.etree.ElementTree as E,json; r=E.fromstring(base64.b64decode(sys.argv[1])); ns={"s":"http://www.sitemaps.org/schemas/sitemap/0.9"}; print(json.dumps([{ "loc":u.findtext("s:loc",namespaces=ns), "lastmod":u.findtext("s:lastmod",namespaces=ns)} for u in r.findall("s:url",ns)]))';
function parseSitemap(xml) {
  const result = spawnSync('python3', ['-c', xmlProgram, Buffer.from(xml).toString('base64')], {encoding: 'utf8', timeout: 10000});
  assert.equal(result.status, 0, result.stderr || 'Sitemap XML is invalid');
  return JSON.parse(result.stdout);
}
const entries = parseSitemap(sitemap);
assert.equal(new Set(entries.map(item => item.loc)).size, entries.length, 'Duplicate sitemap URLs');
for (const route of dispatcherRoutes) {
  const entry = entries.find(item => item.loc === 'https://velqnutrition.com' + route);
  assert(entry, 'New canonical URL absent from generated sitemap: ' + route);
  assert.equal(entry.lastmod, '2026-10-20');
}
for (const entry of parseSitemap(originalSitemap)) {
  const actual = entries.find(item => item.loc === entry.loc);
  assert(actual, 'Original sitemap URL lost');
  if (!dispatcherRoutes.some(route => entry.loc === 'https://velqnutrition.com' + route)) assert.deepEqual(actual, entry);
}
parseSitemap(fs.readFileSync('sitemap.xml', 'utf8'));
console.log('PASS: valid static/generated sitemap XML, three new URLs, two updated URLs, no duplicates or unrelated date changes.');

function request(port, url, method = 'GET', host = 'velqnutrition.com') {
  return new Promise((resolve, reject) => {
    const req = http.request({hostname: '127.0.0.1', port, path: url, method, headers: {Host: host}}, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks).toString()}));
    });
    req.setTimeout(3000, () => req.destroy(new Error('Local dispatcher request timed out')));
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  for (const route of dispatcherRoutes) assert(fs.existsSync(path.join(root, route.slice(1), 'index.html')), 'Missing deliverable for dispatcher: ' + route);
  const port = await new Promise(resolve => {
    const probe = net.createServer();
    probe.listen(0, '127.0.0.1', () => {const selected = probe.address().port; probe.close(() => resolve(selected));});
  });
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'velq-research-integration-'));
  const router = path.join(temporary, 'router.php');
  fs.writeFileSync(router, '<?php require ' + JSON.stringify(path.join(root, 'image-patch.php')) + '; require ' + JSON.stringify(path.join(root, 'research-content.php')) + ';');
  const server = spawn('php', ['-S', '127.0.0.1:' + port, '-t', root, router], {cwd: root, stdio: 'ignore'});
  try {
    let ready = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      try {await request(port, '/does-not-exist'); ready = true; break;} catch {await new Promise(resolve => setTimeout(resolve, 100));}
    }
    assert(ready, 'Local PHP dispatcher did not start');
    for (const route of dispatcherRoutes) {
      const get = await request(port, route);
      assert.equal(get.status, 200, 'GET failed: ' + route);
      assert.match(get.headers['content-type'], /^text\/html/);
      assert(!get.headers['x-robots-tag'], 'Production domain unexpectedly noindexed');
      assert(get.headers['content-security-policy'].includes("script-src 'self'"));
      assert(get.body.includes('https://velqnutrition.com' + route), 'Canonical URL absent: ' + route);
      assert.equal((get.body.match(/\/assets\/research\/research-events\.js/g) || []).length, pageRoutes.includes(route) ? 1 : 0);
      if (route === '/blog/protein-gummies-with-fiber-comparison') {
        const standalone = fs.readFileSync(path.join(root, route.slice(1), 'index.html'), 'utf8');
        assert.equal(get.body, render(route, standalone), 'Comparison must serve the current standalone source rather than the packed copy');
        assert(get.body.includes('id="velq-m3-related"'), 'Updated comparison lost its research module');
      }
      const head = await request(port, route, 'HEAD');
      assert.equal(head.status, 200);
      assert.equal(head.body, '', 'HEAD emitted a body');
      const query = '?compare=example&basis=serving';
      for (const alias of [route + '/', route + '/index.html']) {
        const redirected = await request(port, alias + query);
        assert.equal(redirected.status, 301, 'Alias must redirect: ' + alias);
        assert.equal(redirected.headers.location, route + query, 'Canonical redirect lost query');
        assert.equal(redirected.body, '');
      }
      const post = await request(port, route, 'POST');
      assert.equal(post.status, 405);
      assert.equal(post.headers.allow, 'GET, HEAD');
    }
    const missing = await request(port, '/research/not-an-allowlisted-page');
    assert.equal(missing.status, 404);
    assert.equal((await request(port, '/research/not-an-allowlisted-page', 'HEAD')).body, '');
    assert.equal((await request(port, '/research-content.php')).status, 404, 'Dispatcher filename exposed as a page');
    const preview = await request(port, '/research', 'GET', 'localhost');
    assert.equal(preview.headers['x-robots-tag'], 'noindex, nofollow');
    console.log('PASS: five HTTP pages, standalone comparison takes precedence over bundles, canonical slash/index redirects with query preservation, GET/HEAD/405, unknown 404, production indexing and preview noindex.');
  } finally {
    server.kill('SIGTERM');
    fs.rmSync(temporary, {recursive: true, force: true});
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
