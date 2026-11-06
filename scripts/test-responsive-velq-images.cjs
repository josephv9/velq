#!/usr/bin/env node
'use strict';
// Inspect the current rendered production homepage and verify the older
// responsive WebP variants remain valid files for pages still referencing them.
// No live requests, customer signups or analytics events.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');

const assets = [
  'velq-strawberry-gummies-hero-20261015-v3',
  'velq-gummies-packshot-20261015-v2'
];
for (const name of assets) {
  for (const width of [480,800,1200]) {
    const filename = 'assets/' + name + '-' + width + '.webp';
    assert(fs.existsSync(filename), 'Missing existing WebP asset: ' + filename);
    const bytes = fs.readFileSync(filename).subarray(0,12);
    assert.equal(bytes.toString('ascii',0,4), 'RIFF', 'Invalid RIFF: ' + filename);
    assert.equal(bytes.toString('ascii',8,12), 'WEBP', 'Invalid WebP: ' + filename);
  }
}
function php(program) {
  const r = spawnSync('php', ['-d', 'display_errors=1','-r',program],{
    encoding:'utf8',timeout:20000,maxBuffer:16*1024*1024
  });
  assert.equal(r.status,0,r.stderr || r.error?.message || 'PHP response failed');
  return r.stdout;
}
const home = php('$_SERVER["REQUEST_URI"]="/";$_SERVER["HTTP_HOST"]="velqnutrition.com";$_SERVER["REQUEST_METHOD"]="GET"; require "image-patch.php"; require "velq-site.php";');
const current='/assets/velq-cover-cyan-stems-20261104.webp';
const hero=(home.match(/<img\b[^>]*class="approved-cover-art"[^>]*>/i)||[])[0];
assert(hero && hero.includes('src="'+current+'"'),'Current approved homepage WebP hero not rendered');
assert(hero.includes('fetchpriority="high"'),'Approved hero lost its high load priority');
const preloads=(home.match(/<link\b[^>]*data-velq-responsive-preload[^>]*>/gi)||[]);
assert.equal(preloads.length,1,'One current hero preload is required');
assert(preloads[0].includes('href="'+current+'"'),'Preload does not match the visible approved WebP');
assert(home.includes('id="waitlist-form"'),'Current homepage waitlist form missing');
const unrelatedInput=Buffer.from('<html><head></head><body><img src="/assets/unrelated.png" width="20" height="20"></body></html>').toString('base64');
const unrelated=php('$_SERVER["REQUEST_URI"]="/compare";require "image-patch.php";echo base64_decode("'+unrelatedInput+'");');
assert(unrelated.includes('src="/assets/unrelated.png"'),'Unrelated assets should not be rewritten');
assert(!unrelated.includes('data-velq-responsive-preload'),'No homepage preload on unrelated pages');
console.log('PASS: six valid responsive WebPs retained; current approved homepage hero, matching preload, priority and waitlist; unrelated images unchanged.');
