#!/usr/bin/env node
'use strict';
// No HTTP requests, analytics network calls, or waitlist signups are made.
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const phpSource=fs.readFileSync('image-patch.php','utf8');
assert(phpSource.includes('MILESTONE2_NAV'),'Milestone 2 commercial journeys not installed');
const pages = {
 '/compare':['/blog/fiber-gummies-vs-fiber-powder','/blog/protein-gummies-for-adults','/blog/fiber-gummies-for-adults-guide'],
 '/guides':['/blog/protein-gummies-for-adults','/blog/fiber-gummies-for-adults-guide','/blog/fiber-gummies-vs-fiber-powder'],
 '/blog/best-fiber-gummies-2026':['/blog/fiber-gummies-vs-psyllium-husk','/blog/fiber-gummies-vs-fiber-powder','/blog/protein-gummies-with-fiber-comparison'],
 '/blog/protein-gummies-with-fiber-comparison':['/blog/protein-and-fiber-gummies-buying-guide','/blog/protein-gummies-vs-protein-bars','/blog/protein-and-fiber-gummies-vs-separate-supplements'],
 '/blog/protein-and-fiber-gummies-buying-guide':['/blog/best-fiber-gummies-2026','/blog/protein-gummies-with-fiber-comparison','/blog/protein-and-fiber-gummies-vs-separate-supplements'],
 '/blog/protein-gummies-vs-protein-bars':['/blog/protein-gummies-with-fiber-comparison','/blog/protein-and-fiber-gummies-buying-guide','/blog/protein-and-fiber-gummies-vs-separate-supplements'],
 '/blog/fiber-gummies-vs-psyllium-husk':['/blog/fiber-gummies-vs-fiber-powder','/blog/best-fiber-gummies-2026','/blog/fiber-gummies-for-adults-guide'],
 '/blog/protein-and-fiber-gummies-vs-separate-supplements':['/blog/protein-gummies-with-fiber-comparison','/blog/protein-and-fiber-gummies-buying-guide','/tools/nutrition-label-value-calculator'],
 '/blog/protein-gummies-for-adults':['/blog/protein-gummies-with-fiber-comparison','/blog/protein-gummies-vs-protein-bars','/blog/protein-and-fiber-gummies-buying-guide'],
 '/blog/fiber-gummies-for-adults-guide':['/blog/best-fiber-gummies-2026','/blog/fiber-gummies-vs-psyllium-husk','/blog/fiber-gummies-vs-fiber-powder']
};
function render(route,html){
 const code='$_SERVER["REQUEST_URI"]=$argv[1]; require "image-patch.php"; echo stream_get_contents(STDIN);';
 const result=spawnSync('php',['-d','display_errors=1','-r',code,route],{
   input:html,encoding:'utf8',timeout:15000,maxBuffer:8*1024*1024
 });
 assert.equal(result.status,0,'PHP error for '+route+': '+(result.stderr||result.error?.message));
 assert(!result.stdout.includes('Fatal error'),'PHP fatal for '+route);
 return result.stdout;
}
const seed='<!doctype html><html><head><title>Test buyer page</title></head><body><main id="main"><article><h1>Testing</h1></article></main></body></html>';
for(const [route,links] of Object.entries(pages)){
 const rendered=render(route,seed);
 assert.equal((rendered.match(/id="velq-m2-related"/g)||[]).length,1,'Buyer links missing or duplicated: '+route);
 assert.equal((rendered.match(/velq-commercial-m2.css/g)||[]).length,1,'CSS link missing or duplicated: '+route);
 assert(rendered.includes('this is not a preorder'),'Prelaunch disclaimer missing: '+route);
 for(const href of links){
  assert(rendered.includes('href="'+href+'"'),'Missing buyer link '+href+' on '+route);
 }
 const retest=render(route,rendered);
 assert.equal((retest.match(/id="velq-m2-related"/g)||[]).length,1,'Repeat filter duplicated module: '+route);
}
assert(!render('/blog/how-much-fiber-do-you-need-every-day',seed).includes('id="velq-m2-related"'),'Unexpected links on unrelated page');
const api='{"ok":true,"newLead":false}';
assert.equal(render('/api/waitlist',api),api,'Waitlist JSON changed');
console.log('PASS: 10 commercial journeys, contextual links, responsive CSS, idempotence, prelaunch and API checks');
