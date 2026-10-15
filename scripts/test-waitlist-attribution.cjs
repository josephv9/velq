#!/usr/bin/env node
'use strict';
// Simulates a confirmed API event locally. Never posts to a real waitlist.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('velq-site.php','utf8');
const match=source.match(/\$assets=json_decode\(base64_decode\('([A-Za-z0-9+/=]+)'\),true\)/);
assert(match,"Site's packaged assets are missing");
const assets=JSON.parse(Buffer.from(match[1],'base64').toString('utf8'));
const js=Buffer.from(assets['/analytics.js'].data,'base64').toString('utf8');
const callbacks=new Map(),store=new Map(),clicks=new Map();
const location={pathname:'/blog/protein-gummies-with-fiber-comparison',search:''};
const link={dataset:{waitlistCta:'article-end'},addEventListener:(kind,fn)=>clicks.set(kind,fn)};
const document={
  referrer:'https://www.google.com/search?q=protein+gummies+with+fiber',
  createElement:()=>({async:false,src:''}),
  head:{appendChild(){}},
  querySelectorAll:selector=>selector==='[data-waitlist-cta]'?[link]:[]
};
const sessionStorage={
  getItem:key=>store.has(key)?store.get(key):null,
  setItem:(key,value)=>store.set(key,String(value)),
  removeItem:key=>store.delete(key)
};
const ctx={document,sessionStorage,location,URL,Date,JSON,Set,Number};
ctx.window=ctx;
ctx.VELQ_ANALYTICS={ga4:'G-MOCK-VALIDATION-ONLY',meta:null,tiktok:null};
ctx.addEventListener=(kind,fn)=>callbacks.set(kind,fn);
vm.runInNewContext(js,ctx,{filename:'packed:/analytics.js'});
const events=key=>ctx.dataLayer.filter(x=>x && x[0]==='event' && x[1]===key);
assert.equal(store.get('velq_landing_page'),'/blog/protein-gummies-with-fiber-comparison');
assert.equal(store.get('velq_entry_referrer_type'),'search_referrer');
assert.equal(events('waitlist_signup_success').length,0,'Page view should not create a lead');
const click=clicks.get('click');
assert(click,'Missing CTA click handler');
click();
location.pathname='/';
link.dataset.waitlistCta='home';
click();
const confirmed=callbacks.get('velq:waitlist-success');
assert(confirmed,'Missing server confirmation listener');
confirmed({detail:{eventId:''}});
assert.equal(events('waitlist_signup_success').length,0,'Missing server event ID created a lead');
confirmed({detail:{eventId:'test-confirmed-001'}});
assert.equal(events('waitlist_signup_success').length,1,'Exactly one signup event required');
assert.equal(events('generate_lead').length,1,'Exactly one GA4 lead event required');
const params=events('waitlist_signup_success')[0][2];
assert.equal(params.landing_page,'/blog/protein-gummies-with-fiber-comparison');
assert.equal(params.article_path,'/blog/protein-gummies-with-fiber-comparison');
assert.equal(params.signup_page,'/');
assert.equal(params.cta_position,'home');
assert.equal(params.content_topic,'protein_fiber');
assert.equal(params.entry_referrer_type,'search_referrer');
assert.equal(params.event_id,'test-confirmed-001');
assert.equal(events('generate_lead')[0][2].event_id,params.event_id);
assert.equal(sessionStorage.getItem('velq_journal_signup'),null,'Attribution context not cleared');
confirmed({detail:{eventId:'test-confirmed-001'}});
assert.equal(events('waitlist_signup_success').length,1,'Duplicate confirmation must not duplicate a lead');
assert.equal(events('generate_lead').length,1,'Duplicate confirmation must not duplicate generate_lead');
assert(!JSON.stringify(params).includes('@'),'No email may go to GA4');
console.log('PASS: buyer article, referrer and conversion context survive homepage navigation; one server-confirmed lead counted, no real submission.');


const {spawnSync}=require('node:child_process');
const originHelper=source.match(/(function velq_is_trusted_signup_request\(array \$headers\): bool \{[\s\S]*?\n\})\nfunction fail\(/);
assert(originHelper,'Expected pure waitlist origin-validation helper');
const originTests = originHelper[1] + `
\$cases = [
  ['public apex via proxy', ['HTTP_ORIGIN' => 'https://velqnutrition.com', 'HTTP_HOST' => '191.96.56.62'], true],
  ['public www via proxy', ['HTTP_ORIGIN' => 'https://www.velqnutrition.com', 'HTTP_HOST' => 'internal-server.local'], true],
  ['same-origin browser without Origin', ['HTTP_SEC_FETCH_SITE' => 'same-origin', 'HTTP_REFERER' => 'https://velqnutrition.com/'], true],
  ['same-origin metadata without referrer', ['HTTP_SEC_FETCH_SITE' => 'same-origin'], true],
  ['referrer fallback without metadata', ['HTTP_REFERER' => 'https://velqnutrition.com/'], true],
  ['foreign explicit origin', ['HTTP_ORIGIN' => 'https://attacker.example', 'HTTP_REFERER' => 'https://velqnutrition.com/'], false],
  ['plain HTTP public origin', ['HTTP_ORIGIN' => 'http://velqnutrition.com'], false],
  ['nonstandard port', ['HTTP_ORIGIN' => 'https://velqnutrition.com:8443'], false],
  ['origin null', ['HTTP_ORIGIN' => 'null', 'HTTP_SEC_FETCH_SITE' => 'same-origin'], false],
  ['foreign referrer', ['HTTP_REFERER' => 'https://other.example', 'HTTP_SEC_FETCH_SITE' => 'same-origin'], false],
  ['cross-site metadata without origin', ['HTTP_REFERER' => 'https://velqnutrition.com/', 'HTTP_SEC_FETCH_SITE' => 'cross-site'], false],
  ['missing origin and trust evidence', [], false]
];
foreach (\$cases as [\$name, \$headers, \$expected]) {
  \$actual=velq_is_trusted_signup_request(\$headers);
  if (\$actual !== \$expected) {fwrite(STDERR, "FAILED: " . \$name . "\\n"); exit(1);}
}
echo 'PASS: ' . count(\$cases) . ' real origin-validation cases, including trusted proxy and CSRF denial.' . PHP_EOL;
`;
const originResult=spawnSync('php',['-r',originTests],{encoding:'utf8',timeout:10000});
assert.equal(originResult.status,0,originResult.stderr || originResult.error?.message || 'Origin tests failed');
console.log(originResult.stdout.trim());
