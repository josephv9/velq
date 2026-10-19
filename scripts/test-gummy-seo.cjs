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
  const program='$_SERVER["REQUEST_URI"]=$argv[1]; require "image-patch.php"; echo stream_get_contents(STDIN);';
  const r=spawnSync('php',['-d','display_errors=1','-r',program,route],{
    input:source,encoding:'utf8',maxBuffer:16*1024*1024,timeout:15000
  });
  assert.equal(r.status,0,'PHP render failed for '+route+': '+(r.stderr||r.error?.message));
  assert(!r.stdout.includes('Fatal error'),'PHP fatal error at '+route);
  return r.stdout;
}
const home=render('/',asset('/index.html'));
assert(home.includes('<title>Strawberry Protein &amp; Prebiotic Fiber Gummies | Velq</title>'),'Home title not refined');
assert(home.includes('with caffeine and L-theanine planned.'),'Home meta description not refined');
assert(home.includes('data-gummy-buyer-paths="home"'),'Home contextual buyer path missing');
assert(home.includes('href="/blog/protein-and-fiber-gummies-buying-guide"'),'Home buying-guide link missing');
assert(home.includes('href="/blog/protein-gummies-with-fiber-comparison"'),'Home serving comparison link missing');
assert.equal((home.match(/data-gummy-buyer-paths="home"/g)||[]).length,1,'Home buyer path duplicated');
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
assert(buyer.includes('How to choose protein and prebiotic fiber gummies: compare complete servings'),'Buying-guide description missing');
const labels=render('/blog/protein-gummies-with-fiber-comparison',asset('/blog/protein-gummies-with-fiber-comparison/index.html'));
assert(labels.includes('Compare protein gummies with fiber using published protein, prebiotic fiber'),'Label-comparison description missing');
assert(labels.includes('from Cutfruit, PROTEDY, Kuma, OAKA and prelaunch Velq'),'Prelaunch disclosure missing');

const api='{"ok":true,"newLead":false}';
assert.equal(render('/api/waitlist',api),api,'Non-HTML API response must not change');
assert(home.includes('final nutrition may change')||home.includes('Final nutrition may change'),'Prelaunch warning removed');
console.log('PASS: 5 gummy SEO pages render expected metadata and buyer links; no duplicate home pathway, waitlist UI intact, API untouched.');
