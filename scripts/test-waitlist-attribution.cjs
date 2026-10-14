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
