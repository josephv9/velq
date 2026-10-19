// Browser-level waitlist-to-GA4 test using mocked endpoints only.
// Never POSTs to the real waitlist and never sends test leads to Google Analytics.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 const traffic=[];
 const fakeId='velq-qa-server-confirmed-001';
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},userAgent:'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36'});
  let interceptedPosts=0;
  await context.route(/https:\/\/velqnutrition\.com\/api\/waitlist(?:\?|$)/,async route=>{
    assert.equal(route.request().method(),'POST','The test must not intercept another method');
    interceptedPosts++;
    await route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({ok:true,status:'confirmed',newLead:true,eventId:fakeId})});
  });
  await context.route(/https:\/\/(?:www\.google-analytics\.com|region1\.google-analytics\.com)\/g\/collect/,async route=>{
    traffic.push(route.request().url());
    await route.fulfill({status:204,body:''});
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('https://velqnutrition.com/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(2500);
  await page.locator('#waitlist-email').fill('qa-simulated@example.invalid');
  const consent=page.locator('#waitlist-form input[name="consent"]');
  assert.equal(await consent.count(),1,'Missing required consent checkbox');
  await consent.check();
  await page.locator('#waitlist-form').evaluate(f=>f.requestSubmit());
  await page.waitForFunction(()=>Array.from(window.dataLayer||[]).some(x=>x[0]==='event'&&x[1]==='waitlist_signup_success'),{timeout:15000});
  await page.waitForTimeout(1800);
  const actual=await page.evaluate(()=>{
    const get=name=>(window.dataLayer||[]).filter(x=>x&&x[0]==='event'&&x[1]===name);
    return {success:get('waitlist_signup_success'),leads:get('generate_lead'),
      complete:get('waitlist_signup_complete'),feedback:document.querySelector('#signup-feedback')?.textContent||''};
  });
  assert.equal(interceptedPosts,1,'Expected one intercepted backend POST');
  assert.equal(actual.success.length,1,'Expected one successful signup event');
  assert.equal(actual.leads.length,1,'Expected one generate_lead event');
  assert.equal(actual.complete.length,1,'Expected one waitlist_signup_complete event');
  assert.equal(actual.success[0][2].event_id,fakeId,'Backend confirmation identifier not propagated');
  assert(!JSON.stringify(actual).includes('@'),'Email leaked into analytics payload');
  const names=traffic.map(x=>new URL(x).searchParams.get('en')).filter(Boolean);
  assert(names.includes('waitlist_signup_success'),'Confirmed signup was not sent to mocked GA4 endpoint');
  assert(names.includes('generate_lead'),'Lead was not sent to mocked GA4 endpoint');
  assert.equal(errors.length,0,'Browser errors: '+JSON.stringify(errors));
  console.log('PASS: mocked server confirmation emits one signup and one lead; GA4 collector intercepted; zero real signups or GA4 test leads.');
  console.log('RESULT',JSON.stringify({backendRequestsIntercepted:interceptedPosts,confirmedEventCount:actual.success.length,leadEventCount:actual.leads.length,ga4EventNames:[...new Set(names)].filter(n=>n==='generate_lead'||n==='waitlist_signup_success'||n==='waitlist_signup_complete'),hasSuccessMessage:/you.re on the list/i.test(actual.feedback),browserErrors:errors}));
  await context.close();
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
