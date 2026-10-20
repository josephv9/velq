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
   if(!diag.popup){
      const currentPopup=await page.evaluate(()=>{
        const panel=document.querySelector('.vlp-card,[role="dialog"],dialog[open]');
        const source=[...document.scripts].filter(s=>(s.textContent||'').includes('lead_popup_view')||(s.textContent||'').includes('vlp-card')).map(s=>({src:s.src||'inline',length:s.textContent.length,summary:s.textContent.slice(0,450)}));
        return {
          found:!!panel,
          visible:!!(panel&&panel.getClientRects().length),
          html:panel?.outerHTML.slice(0,5500)||null,
          scripts:source,
          candidates:[...document.querySelectorAll('form')].map(f=>({id:f.id,className:f.className,fields:[...f.querySelectorAll('input')].map(x=>({type:x.type,name:x.name,required:x.required,checked:x.checked})),button:f.querySelector('button[type=submit]')?.textContent?.trim()})).slice(0,8),
          storageKeys:Object.keys(localStorage).filter(k=>/velq|popup|vlp|cookie/i.test(k)).slice(0,15)
        };
      });
      console.log('LIVE_EXISTING_POPUP_DIAGNOSTIC '+JSON.stringify({width,currentPopup}));
   }
   // Validate the popup implementation the live site actually serves.
   const useExisting=(await page.locator('.vlp-card:visible').count())>0;
   const card=page.locator(useExisting?'.vlp-card':'#velq-early-access .velq-lead-card');
   await card.waitFor({state:'visible',timeout:6000});
   const rect=await card.boundingBox();
   assert(rect&&rect.x>=-1&&rect.x+rect.width<=width+1,'Live popup horizontal overflow at '+width+' '+JSON.stringify(rect));
   assert(rect.y>=-1&&rect.y+rect.height<=845,'Live popup vertical overflow at '+width+' '+JSON.stringify(rect));
   const form=page.locator(useExisting?'#velq-popup-form':'#velq-lead-form');
   const email=form.locator('input[name=email]');
   const consent=form.locator('input[name=consent]');
   const submit=form.locator('button[type=submit]');
   assert.equal(await consent.isChecked(),false,'Consent prechecked');
   assert.notEqual(await consent.getAttribute('required'),null,'Marketing consent must be required');
   assert.equal(await form.locator('input[type=tel]').count(),0,'Unconsented phone field was added');
   await email.fill('velq-browser-qa@example.com');
   await submit.click();
   assert.equal(posts.length,0,'Form submitted without marketing consent');
   await consent.check();
   await submit.click();
   await page.locator(useExisting?'.vlp-success':'.velq-lead-thanks').waitFor({state:'visible',timeout:6000});
   assert.equal(posts.length,1,'Expected exactly one mocked signup');
   assert.equal(posts[0].consent,true,'Backend consent missing');
   const state=await page.evaluate(()=>({
     events:(window.dataLayer||[]).filter(x=>x&&x[0]==='event').map(x=>({name:x[1],params:x[2]})),
     joined:localStorage.getItem('velq_waitlist_joined_v1'),
     tracking:localStorage.getItem('velq_tracking_consent_v1'),
     klaviyo:!!document.querySelector('script[data-velq-consented-klaviyo]'),
     activePopup:document.querySelector('.vlp-card')?'vlp-card':'velq-early-access'
   }));
   console.log('LIVE_BROWSER_POST_SIGNUP '+JSON.stringify({width,mode:useExisting?'existing':'bundled',postCount:posts.length,eventNames:state.events.map(e=>e.name),formIds:state.events.filter(e=>e.name==='generate_lead').map(e=>e.params?.form_id),tracking:state.tracking,klaviyo:state.klaviyo,errors:errors.slice(0,5)}));
   const leads=state.events.filter(x=>x.name==='generate_lead');
   assert.equal(leads.length,1,'Exactly one confirmed GA4 generate_lead should be queued');
   assert(!JSON.stringify(state.events).includes('velq-browser-qa@example.com'),'PII leaked into GA4 event queue');
   assert.equal(errors.length,0,'Browser JavaScript errors at '+width+': '+errors.slice(0,3));
   console.log('LIVE_BROWSER_PASS '+JSON.stringify({width,mode:useExisting?'existing':'bundled',layout:true,marketingConsent:true,mockSignup:true,ga4Queued:true,errors:[]}));
   await ctx.close();
  }
  console.log('LIVE_BROWSER_ALL_PASS: real production page, intercepted signup and vendor collection; no real leads created');
 }finally{await browser.close()}
})().catch(e=>{console.error('LIVE_BROWSER_FAIL: '+e.message);process.exit(1)});