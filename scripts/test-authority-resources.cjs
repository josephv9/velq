#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
process.chdir(root);
function render(route, body) {
  const code = 'require "authority-extension.php"; echo velq_authority_response(base64_decode($argv[2]), $argv[1]);';
  const r = spawnSync('php', ['-r', code, route, Buffer.from(body).toString('base64')], {cwd:root, encoding:'utf8', timeout:10000});
  assert.equal(r.status, 0, r.stderr || r.error?.message);
  return r.stdout;
}
const emptyFooter = '<html><head></head><body><main>Existing page</main><footer><p>Existing footer</p></footer></body></html>';
for (const route of ['/', '/compare', '/blog', '/research']) {
  const out = render(route, emptyFooter);
  assert(out.includes('<main>Existing page</main>'));
  for (const url of ['/media','/contact/','/blog/editorial-policy']) assert.equal(out.split('href="'+url+'"').length-1, 1);
  assert.equal(render(route, out), out, 'Discovery must be idempotent');
}
const withContact = emptyFooter.replace('<p>Existing footer</p>','<a href="/contact/">Contact</a><a href="/blog/editorial-policy">Editorial policy</a>');
const noDuplicates = render('/research', withContact);
assert.equal(noDuplicates.split('href="/contact/"').length-1,1);
assert.equal(noDuplicates.split('href="/blog/editorial-policy"').length-1,1);
assert(noDuplicates.includes('href="/media"'));
for (const body of ['{"ok":true,"newLead":true}', '{"ok":true,"newLead":false}', '{"error":"Unavailable"}']) {
  assert.equal(render('/api/waitlist', body),body);
}
assert.equal(render('/assets/growth/nutrition-workbook.html', emptyFooter),emptyFooter);
const xml = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://velqnutrition.com/</loc><lastmod>2026-10-13</lastmod></url></urlset>';
const sitemap = render('/sitemap.xml',xml);
assert(sitemap.includes('<lastmod>2026-10-13</lastmod>'));
assert.equal(sitemap.split('<loc>https://velqnutrition.com/media</loc>').length-1,1);
assert.equal(render('/sitemap.xml',sitemap),sitemap);
const html=fs.readFileSync('media/index.html','utf8');
assert.equal((html.match(/<h1\b/g)||[]).length,1);
assert(html.includes('rel="canonical" href="https://velqnutrition.com/media"'));
assert(html.includes('data-waitlist-cta="media"'));
assert(html.includes('DEVELOPMENT PREVIEW'));
assert(!/<[^>]+\sstyle=/.test(html),'CSP requires external styles');
for(const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) JSON.parse(m[1]);
new vm.Script(fs.readFileSync('assets/velq-media.js','utf8'));
console.log('PASS: media discovery, duplicate-link prevention, API/standalone preservation, sitemap idempotence, canonical markup and JS syntax.');
