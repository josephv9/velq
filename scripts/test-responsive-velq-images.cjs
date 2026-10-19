#!/usr/bin/env node
'use strict';
// Verifies the approved source images now offer responsive WebP derivatives.
// Uses PHP's actual output filter; never requests or edits live customer data.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const assets=[
  'velq-strawberry-gummies-hero-20261015-v3',
  'velq-gummies-packshot-20261015-v2',
];
for(const name of assets){
  for(const width of [480,800,1200]){
    const file='assets/'+name+'-'+width+'.webp';
    assert(fs.existsSync(file),'Missing WebP asset '+file);
    const bytes=fs.readFileSync(file).subarray(0,12);
    assert.equal(bytes.toString('ascii',0,4),'RIFF','Invalid RIFF for '+file);
    assert.equal(bytes.toString('ascii',8,12),'WEBP','Invalid WebP '+file);
  }
}
function phpOutput(html,route='/'){
  const source='$_SERVER["REQUEST_URI"]='+JSON.stringify(route)+';include "image-patch.php";echo base64_decode("'+Buffer.from(html,'utf8').toString('base64')+'");';
  const r=spawnSync('php',['-r',source],{encoding:'utf8',timeout:15000});
  assert.equal(r.status,0,r.stderr||r.error?.message||'PHP image patch failed');
  return r.stdout;
}
const original='<html><head><title>Velq</title></head><body>'
  +'<img id="hero-image" src="/assets/velq-strawberry-gummies-hero-20261015-v3.jpeg" srcset="/stale.jpg 480w" width="1254" height="1254" fetchpriority="high">'
  +'<img src="/assets/velq-gummies-packshot-20261015-v2.jpeg" width="1254" height="1254" loading="lazy">'
  +'<img src="/assets/unrelated.png" width="20" height="20"></body></html>';
const html=phpOutput(original);
assert.equal((html.match(/data-velq-responsive-preload/g)||[]).length,1,'Exactly one preload on homepage');
assert.equal((html.match(/srcset="\/assets\/velq-/g)||[]).length,2,'Exactly two optimized image srcsets expected');
assert(html.includes('src="/assets/velq-strawberry-gummies-hero-20261015-v3-800.webp"'),'Optimized hero not rendered');
assert(html.includes('src="/assets/velq-gummies-packshot-20261015-v2-800.webp"'),'Optimized product packshot not rendered');
assert(!html.includes('/stale.jpg'),'Stale srcset present');
assert(html.includes('src="/assets/unrelated.png"'),'Unrelated images changed');
assert(html.includes('fetchpriority="high"'),'Hero load priority changed');
assert(html.includes('loading="lazy"'),'Product image lazy loading changed');
assert.equal((html.match(/<img\b/g)||[]).length,3,'Unexpected extra image element');
assert(!phpOutput('<html><head></head><body>Test</body></html>','/compare').includes('data-velq-responsive-preload'),'Preload must be homepage only');
console.log('PASS: optimized responsive images, one hero preload, and fallback pages preserved.');
