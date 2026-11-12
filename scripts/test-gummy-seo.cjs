#!/usr/bin/env node
'use strict';
// Render the current packed pages through the production output filter.
// No HTTP requests, waitlist API calls, or GA4 events are generated.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const php=fs.readFileSync('velq-site.php','utf8');
const match=php.match(/\$assets=json_decode\(base64_decode\('([A-Za-z0-9+/=]+)'\),true\)/);
assert(match,'Missing PHP asset map');
const assets=JSON.parse(Buffer.from(match[1],'base64').toString('utf8'));
function asset(path){
  assert(assets[path], 'Missing '+path);
  return Buffer.from(assets[path].data,'base64').toString('utf8');
}
function render(route,source){
  const program='$_SERVER["REQUEST_URI"]=$argv[1]; require "image-patch.php"; echo base64_decode($argv[2]);';
  const r=spawnSync('php',['-d','display_errors=1','-r',program,route,Buffer.from(source).toString('base64')],{
    encoding:'utf8',maxBuffer:16*1024*1024,timeout:15000
  });
  assert.equal(r.status,0,'PHP render failed for '+route+': '+(r.stderr||r.error?.message));
  assert(!r.stdout.includes('Fatal error'),'PHP fatal error at '+route);
  return r.stdout;
}
const home=render('/',asset('/index.html'));
assert(home.includes('<title>Protein Gummies with Fiber &amp; Caffeine | Velq</title>'), 'Current homepage title not rendered');
assert(home.includes('Meet Velq strawberry protein gummies with prebiotic fiber, caffeine and L-theanine.'), 'Current homepage search description missing');
assert(home.includes('id="hero-title">Strawberry Protein Gummies with Fiber &amp; Caffeine</h1>'), 'Product-focused homepage H1 missing');
assert(home.includes('href="/products/strawberry-protein-fiber-gummies"'), 'Homepage product detail path missing');
assert(home.includes('id="velq-seo-related"'), 'Homepage SEO related resources missing');
assert(home.includes('href="/research/gummy-serving-study-2026"'), 'Original research not linked from homepage');
assert(home.includes('/assets/velq-seo-related.css?v=20261111'), 'Responsive SEO link style missing');
assert(home.includes('rel="preconnect" href="https://cdn.shopify.com"'), 'Shopify image CDN preconnect missing');
const repeatHome=render('/',home);
assert.equal((repeatHome.match(/id="velq-seo-related"/g)||[]).length, 1, 'Repeated HTML processing duplicates homepage related links');

assert(!home.includes('data-gummy-buyer-paths="home"'), 'Retired homepage buyer promotion returned');
assert(home.includes('id="waitlist-form"'),'Home waitlist form removed');

const guides=render('/guides',asset('/guides/index.html'));
assert(guides.includes('Protein &amp; Prebiotic Fiber Gummy Guides | Velq'),'Guides title not refined');
assert(guides.includes('Start with the <a href="/blog/protein-and-fiber-gummies-buying-guide">protein and prebiotic fiber gummy buying checklist</a>'),'Guides contextual link missing');
assert(guides.includes('compare protein gummies with fiber by complete serving'),'Guides serving link missing');
const compare=render('/compare',asset('/compare/index.html'));
assert(compare.includes('Protein &amp; Fiber Gummies: Serving Comparisons | Velq'),'Compare title not refined');
assert(compare.includes('Learn how to choose protein and prebiotic fiber gummies'),'Compare contextual buyer link missing');
assert(compare.includes('Compare protein, fiber and caffeine on published serving labels'),'Compare serving comparison link missing');

const buyer=render('/blog/protein-and-fiber-gummies-buying-guide',asset('/blog/protein-and-fiber-gummies-buying-guide/index.html'));
assert(buyer.includes('How to compare protein and fiber gummies by complete serving, protein source, sugar, caffeine and cost.'),'Buyer-guide search snippet not current');
assert(!buyer.includes('while PROTEDY lists 8 g protein and 4 g fiber across eight gummies'), 'Unverified PROTEDY quantities returned');
const labels=render('/blog/protein-gummies-with-fiber-comparison',asset('/blog/protein-gummies-with-fiber-comparison/index.html'));
assert(labels.includes('Compare published Cutfruit, Kuma and OAKA protein gummy labels'),'Updated label-comparison snippet missing');
assert(labels.includes('Velq'), 'Velq prelaunch context missing from comparison');

// Fiber-vs-powder readers now have direct paths to distinct buying intents.
const fiberPowder = fs.readFileSync('blog/fiber-gummies-vs-fiber-powder/index.html','utf8');
assert(fiberPowder.includes('id="gummy-buyer-next"'),'Fiber-vs-powder buyer path missing');
for(const path of [
  '/blog/best-fiber-gummies-2026',
  '/blog/protein-gummies-with-fiber-comparison',
  '/blog/protein-and-fiber-gummies-buying-guide'
]){
  assert(fiberPowder.includes('href="'+path+'"'),'Missing high-intent gummy link '+path);
  assert.equal((fiberPowder.match(new RegExp('href="'+path+'"','g'))||[]).length,1,'Duplicate buyer link '+path);
}
assert(fiberPowder.includes('Velq is still in development; its formula is set, though the retail nutrition label has not been published.'),'Missing prelaunch disclosure on buyer path');

// Guard against stale Velq packet quantities in commercial buying tables.
const fiberShortlist = fs.readFileSync('blog/best-fiber-gummies-2026/index.html','utf8');
const velqFiberRow = fiberShortlist.match(/<tr>\s*<td>Velq \(prelaunch\)<\/td>[\s\S]*?<\/tr>/i)?.[0] || '';
assert(velqFiberRow.includes('<td>10 per packet</td>'), 'Fiber shortlist must show 10 gummies per Velq packet');
assert(!velqFiberRow.includes('<td>6 per packet</td>'), 'Stale six-gummy Velq table row');
assert(fiberShortlist.includes('10-gummy packet'), 'Fiber shortlist must match the product packet format');

// Test packed Journal normalization: the legacy HTML bundle has a stale
// six-gummy Velq comparison row. Competitor counts must not change.
const outdatedTable = '<!doctype html><html><head><title>Fiber comparison</title></head><body><main><table>'
  + '<tr><td>Nature Made</td><td>6 g</td><td>3</td></tr>'
  + '<tr><td>Velq (prelaunch)</td><td>10 g proposed</td><td>6 per packet</td></tr>'
  + '</table></main></body></html>';
const correctedTable = render('/blog/best-fiber-gummies-2026', outdatedTable);
assert(correctedTable.includes('<td>Velq (prelaunch)</td><td>10 g proposed</td><td>10 per packet</td>'),
       'Test packed Journal normalization: rendered Velq table retains old packet count');
assert(correctedTable.includes('<td>Nature Made</td><td>6 g</td><td>3</td>'),
       'Comparison must preserve competitor data');
assert.equal((correctedTable.match(/<td>10 per packet<\/td>/g)||[]).length,1,
             'Velq packet quantity should appear exactly once in this comparison');


const api='{"ok":true,"newLead":false}';
assert.equal(render('/api/waitlist',api),api,'Non-HTML API response must not change');
assert(home.includes('Packaging and nutrition shown are previews and may change.'), 'Current prelaunch disclosure removed');
console.log('PASS: live-target gummy SEO metadata, product journey, buyer links, and prelaunch disclosure; no stale promo, API untouched.');
