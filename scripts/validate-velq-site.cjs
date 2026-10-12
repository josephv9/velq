#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const php = fs.readFileSync('velq-site.php', 'utf8');
const match = php.match(/\$assets=json_decode\(base64_decode\('([A-Za-z0-9+/=]+)'\),true\)/);
assert(match, 'Embedded PHP asset map must be intact');
const assets = JSON.parse(Buffer.from(match[1], 'base64').toString('utf8'));
const paths = Object.keys(assets);
assert(paths.length >= 45, 'Expected at least 45 packed assets');
const content = path => {
  assert(assets[path], 'Missing essential asset ' + path);
  return Buffer.from(assets[path].data, 'base64').toString('utf8');
};
let pages = 0, ld = 0;
for (const [path, info] of Object.entries(assets)) {
  assert(info.type && info.data, 'Invalid asset entry: ' + path);
  if (info.type.includes('javascript')) {
    if (path === '/app.js' || path === '/analytics.js' || path === '/journal.js') {
      new vm.Script(content(path), {filename: path});
    }
  }
  if (!info.type.startsWith('text/html') || path === '/tools/snack-finder/index.html') continue;
  pages++;
  const html = content(path);
  assert(/<title>[^<]+<\/title>/i.test(html), 'Missing page title: ' + path);
  assert(/<h1\b/i.test(html), 'Missing H1: ' + path);
  assert(/rel="canonical"/i.test(html), 'Missing canonical: ' + path);
  assert(!html.includes('https://velqnutrition.comhttps://'), 'Broken absolute image URL: ' + path);
  assert(!/href=["']\/tools\/snack-finder(?:[\/"'?]|$)/i.test(html), 'Link to retired snack finder: ' + path);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    JSON.parse(m[1]);
    ld++;
  }
}
assert(pages >= 30, 'Expected at least 30 active HTML pages');
assert(ld >= 25, 'Expected structured data on site pages');
const home = content('/index.html');
assert(home.includes('id="hero-title">Protein + Fiber <em>Gummies</em>'), 'Homepage product headline changed');
assert(home.includes('id="waitlist-form"') && home.includes('name="email"') && home.includes('name="consent"'), 'Waitlist form missing');
assert(!home.includes('No shaker, no mixing.'), 'Removed homepage copy has returned');
const app = content('/app.js');
assert(app.includes('velq:waitlist-success') && app.includes('result.newLead===true'), 'Confirmed signup dispatch guard missing');
const analytics = content('/analytics.js');
assert(analytics.includes('waitlist_signup_success') && analytics.includes('generate_lead'), 'GA4 signup events missing');
const sitemap = content('/sitemap.xml');
assert(sitemap.includes('<urlset') && sitemap.includes('https://velqnutrition.com/blog'), 'Malformed or incomplete sitemap');
assert(!sitemap.includes('https://velqnutrition.com/tools/snack-finder'), 'Retired URL in sitemap');
console.log('PASS: ' + paths.length + ' packaged assets, ' + pages + ' live pages, ' + ld + ' valid JSON-LD blocks; canonical, mobile-related scripts and waitlist code present.');
