#!/usr/bin/env node
'use strict';
// No real network or signups: test PHP output filter and loader behavior.
const vm=require('node:vm'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const mock="'use strict';(()=>{const config={ga4:'G-MOCK'};window.dataLayer=[];window.gtag=function(){dataLayer.push(arguments);};if(config.ga4){const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+config.ga4;document.head.appendChild(script);gtag('js',new Date());gtag('config',config.ga4);}})();";
const php='$_SERVER["REQUEST_URI"]="/analytics.js";include "image-patch.php";echo base64_decode("'+Buffer.from(mock).toString('base64')+'");';
const result=spawnSync('php',['-r',php],{encoding:'utf8',timeout:15000});
assert.equal(result.status,0,result.stderr||'PHP rewrite failed');
const code=result.stdout;
assert(code.includes('tagStarted = false'),'Tracker delay was not injected');
new vm.Script(code);
let apps=0,queuedTimers=[],loadHandlers={},interactions={},frames=0;
const dataLayer=[];
const ctx={
  window:{addEventListener:(type,fn)=>{loadHandlers[type]=fn;},requestAnimationFrame:fn=>{frames++;fn();}},
  document:{readyState:'loading',createElement:()=>({}),head:{appendChild:node=>{apps++;assert.match(node.src,/googletagmanager/)}},addEventListener:(type,fn)=>{interactions[type]=fn;}},
  dataLayer,Date,setTimeout:fn=>{queuedTimers.push(fn);},
  requestAnimationFrame:fn=>{frames++;fn();},
  gtag:function(){dataLayer.push(Array.from(arguments));}
};
ctx.window.dataLayer=dataLayer;ctx.window.gtag=ctx.gtag;
vm.runInNewContext(code,ctx);
assert.equal(apps,0,'External tag inserted before paint');
assert(dataLayer.some(x=>x[0]==='config'),'GA4 config not queued');
assert.equal(typeof loadHandlers.load,'function','No load handler for deferred tag');
loadHandlers.load();
assert.equal(apps,1,'Tag not started after initial paint');
for(const fn of queuedTimers)fn();
if(interactions.pointerdown) interactions.pointerdown();
assert.equal(apps,1,'Tag inserted twice after timer/interactions');
assert(frames>=2,'Expected double animation frame before script insertion');
console.log('PASS: tag scheduled after initial paint, GA4 config queued, single insertion guaranteed, no live traffic.');
