'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base='https://velqnutrition.com/';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,375,430,768,1280]){
   const ctx=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});
   const page=await ctx.newPage(),posts=[],errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/api/waitlist',async route=>{
     const req=route.request();
     if(req.method()!=='POST')return route.continue();
     try{posts.push(JSON.parse(req.postData()||'{}'));}catch{posts.push({});}
     return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,newLead:true,eventId:'mock-lead-'+width})});
   });
   await page.route(/https:\/\/(?:[^/]*\.)?(?:klaviyo\.com|google-analytics\.com|googletagmanager\.com|facebook\.net|tiktok\.com)\//,route=>route.fulfill({status:200,contentType:'text/javascript',body:''}));
   await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({status:200,contentType:'text/css',body:''}));
   await page.route('https://fonts.gstatic.com/**',route=>route.fulfill({status:200,contentType:'font/woff2',body:''}));
   await page.clock.install();
   let response;
   try{response=await page.goto(base,{waitUntil:'commit',timeout:25000});}
   catch(e){console.log('LIVE_NAV_FAILURE '+JSON.stringify({width,error:e.message,errors:errors.slice(0,5)}));throw e;}
   try{await page.waitForLoadState('domcontentloaded',{timeout:25000});}
   catch(e){console.log('LIVE_DOMCONTENT_TIMEOUT '+JSON.stringify({width,error:e.message}));}
   assert.equal(response.status(),200,'Homepage status');
   await page.clock.fastForward(15100);
   const diag=await page.evaluate(()=>({
     title:document.title,pathname:location.pathname,hidden:document.hidden,
     ready:document.readyState,loaded:window.__velqLeadCaptureLoaded||false,
     popup:!!document.querySelector('#velq-early-access'),
     waitlist:(()=>{let e=document.querySelector('#waitlist');if(!e)return null;let b=e.getBoundingClientRect();return {top:b.top,bottom:b.bottom}})(),
     scripts:[...document.scripts].filter(x=>/lead-capture|analytics/.test(x.src)).map(x=>({src:x.src,async:x.async,defer:x.defer})),
     active:document.activeElement?.tagName,bodyText:document.body?.innerText.slice(0,170),
     storage:{joined:localStorage.getItem('velq_waitlist_joined_v1'),dismissed:localStorage.getItem('velq_early_access_dismissed_until_v1'),tracking:localStorage.getItem('velq_tracking_consent_v1')},
     dialogs:[...document.querySelectorAll('dialog[open], [aria-modal="true"]')].map(e=>({id:e.id,className:e.className,hidden:e.hidden})),
     eventNames:(window.dataLayer||[]).filter(x=>x&&x[0]==='event').map(x=>x[1]).slice(-15)
   }));
   console.log('LIVE_DEBUG '+JSON.stringify({width,diag,errors:errors.slice(0,10)}));
   await page.locator('#velq-early-access').waitFor({state:'visible',timeout:6000});
   const box=await page.locator('.velq-lead-card').boundingBox();
   assert(box&&box.x>=-1&&box.x+box.width<=width+1,'Horizontal overflow '+width+' '+JSON.stringify(box));
   assert(box.y>=-1&&box.y+box.height<=845,'Vertical overflow '+width+' '+JSON.stringify(box));
   const email=page.locator('#velq-lead-email');
   const marketing=page.locator('#velq-lead-form [name=consent]');
   const tracking=page.locator('#velq-lead-form [name=tracking_consent]');
   assert.equal(await marketing.isChecked(),false,'Marketing consent prechecked');
   assert.notEqual(await marketing.getAttribute('required'),null,'Marketing consent not required');
   assert.equal(await tracking.count(),1,'Missing independent tracking consent');
   assert.equal(await tracking.isChecked(),false,'Tracking consent prechecked');
   assert.equal(await tracking.getAttribute('required'),null,'Tracking consent must be optional');
   await email.fill('velq-browser-qa@example.com');
   await page.locator('.velq-lead-submit').click();
   assert.equal(posts.length,0,'Submitted without consent');
   await marketing.check();
   const trackingOn=width===375;
   if(trackingOn)await tracking.check();
   await page.locator('.velq-lead-submit').click();
   await page.locator('.velq-lead-thanks').waitFor({state:'visible',timeout:6000});
   assert.equal(posts.length,1,'Should submit mocked API exactly once');
   assert.equal(posts[0].consent,true,'Backend consent missing');
   const state=await page.evaluate(()=>({
     events:(window.dataLayer||[]).filter(x=>x&&x[0]==='event').map(x=>({name:x[1],params:x[2]})),
     joined:localStorage.getItem('velq_waitlist_joined_v1'),
     tracking:localStorage.getItem('velq_tracking_consent_v1'),
     script:document.querySelector('script[data-velq-consented-klaviyo]')?.src||null
   }));
   const leads=state.events.filter(x=>x.name==='generate_lead');
   assert.equal(leads.length,1,'No queued GA4 generate_lead');
   assert.equal(leads[0].params?.form_id,'velq-lead-form','GA4 popup form incorrect');
   assert.equal(leads[0].params?.cta_position,'popup','GA4 popup position incorrect');
   assert(!JSON.stringify(state.events).includes('velq-browser-qa@example.com'),'PII leaked to GA4');
   assert.equal(state.joined,'1','Joined preference missing');
   if(trackingOn){
      assert.equal(state.tracking,'1','Tracking opt-in preference missing');
      assert(state.script?.includes('RCNCJb/klaviyo.js'),'Klaviyo script missing after optional consent');
   }else{
      assert.notEqual(state.tracking,'1','Tracking activated without optional consent');
      assert(!state.script,'Klaviyo loaded without optional consent');
   }
   console.log('LIVE_BROWSER_PASS '+JSON.stringify({width,layout:true,marketingConsent:true,trackingChoice:true,mockSignup:true,ga4Queued:true,trackingOn,errors:errors.slice(0,2)}));
   await ctx.close();
  }
  console.log('LIVE_BROWSER_ALL_PASS: real production page, intercepted signup and vendor collection; no real leads created');
 }finally{await browser.close()}
})().catch(e=>{console.error('LIVE_BROWSER_FAIL: '+e.message);process.exit(1)});