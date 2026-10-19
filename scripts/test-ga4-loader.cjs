#!/usr/bin/env node
'use strict';
// No network, no live signups: verify the PHP injection and the GA4 bridge.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {spawnSync}=require('node:child_process');

const code=fs.readFileSync('velq-analytics.js','utf8');
new vm.Script(code);
function runLoader(hasPackedTracker){
  const scripts=[];
  const ctx={
    document:{
      querySelector:selector=>hasPackedTracker&&selector==='script[src="/analytics.js"]'?{}:null,
      createElement:()=>({}),
      head:{appendChild:node=>scripts.push(node)}
    },
    Date
  };
  ctx.window=ctx;
  ctx.VELQ_ANALYTICS={meta:'META-PRESERVE',tiktok:'TIKTOK-PRESERVE',ga4:null};
  vm.runInNewContext(code,ctx,{filename:'velq-analytics.js'});
  assert.equal(ctx.VELQ_ANALYTICS.ga4,'G-F93RK1P0H5');
  assert.equal(ctx.VELQ_ANALYTICS.meta,'META-PRESERVE');
  assert.equal(ctx.VELQ_ANALYTICS.tiktok,'TIKTOK-PRESERVE');
  if(hasPackedTracker){
    assert.equal(scripts.length,0,'Packed site must not receive a second gtag initializer');
    assert.equal(ctx.dataLayer,undefined,'Bundled analytics.js must own dataLayer initialization');
  }else{
    assert.equal(scripts.length,1,'Standalone page requires one GA4 initializer');
    assert.match(scripts[0].src,/gtag\/js\?id=G-F93RK1P0H5/);
    assert.equal(ctx.dataLayer.length,2,'Standalone page should configure GA4 once');
  }
}
runLoader(true);
runLoader(false);

function phpOutput(markup){
  const script='$_SERVER["REQUEST_URI"]="/"; include "image-patch.php"; echo '+JSON.stringify(markup).replace(/^\x22/,'\x27').replace(/\x22$/,'\x27')+';';
  // Use PHP single-quoted source only for markup that does not contain apostrophes.
  const proc=spawnSync('php',['-r',script],{encoding:'utf8',timeout:12000});
  assert.equal(proc.status,0,proc.stderr||proc.error?.message||'PHP filter failed');
  return proc.stdout;
}
const packed='<html><head><script src="/analytics-config.js"></script><script src="/analytics.js" defer></script></head><body>Ready</body></html>';
const packedResult=phpOutput(packed);
assert.equal((packedResult.match(/src="\/velq-analytics\.js"/g)||[]).length,1,'One bridge per page');
assert(packedResult.indexOf('src="/analytics-config.js"')<packedResult.indexOf('src="/analytics.js"'),'Config should load first');
assert(packedResult.indexOf('src="/analytics.js"')<packedResult.indexOf('src="/velq-analytics.js"'),'Bridge must follow deferred bundled tracker');
const standalone=phpOutput('<html><head><title>Test</title></head><body>Ready</body></html>');
assert.equal((standalone.match(/src="\/velq-analytics\.js"/g)||[]).length,1,'Standalone page should load GA4');
assert(standalone.indexOf('src="/velq-analytics.js"')<standalone.indexOf('</head>'),'Standalone load must be in head');
console.log('PASS: single GA4 initializer per page; packed confirmation events retained; Meta/TikTok IDs preserved.');
