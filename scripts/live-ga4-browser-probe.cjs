const { chromium } = require('playwright');
(async () => {
 const browser=await chromium.launch({headless:true, executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try {
  for(const url of ['https://velqnutrition.com/','https://velqnutrition.com/blog/protein-gummies-with-fiber-comparison']){
   const context=await browser.newContext({viewport:{width:390,height:844},userAgent:'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36'});
   const page=await context.newPage();
   const scriptErrors=[],requests=[];
   page.on('pageerror',e=>scriptErrors.push(e.message));
   page.on('request',req=>{if(/gtag\/js\?|google-analytics.com\/g\/collect|velq-analytics.js|analytics-config.js|analytics.js/.test(req.url()))requests.push(req.url().replace(/([?&])cid=[^&]+/,'$1cid=REDACTED').slice(0,220));});
   try{
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForTimeout(4000);
    const data=await page.evaluate(()=>{
     let layer=(window.dataLayer||[]).map(x=>({event:x&&x[0],name:x&&x[1],configId:x&&x[0]==='config'?x[1]:null}));
     return {config:window.VELQ_ANALYTICS?{ga4:window.VELQ_ANALYTICS.ga4,metaPresent:!!window.VELQ_ANALYTICS.meta,tiktokPresent:!!window.VELQ_ANALYTICS.tiktok}:null,gtag:typeof window.gtag,layer:layer.slice(0,20),scripts:[...document.scripts].filter(x=>x.src.includes('analytic')||x.src.includes('tagmanager')).map(x=>({src:x.src,defer:x.defer,async:x.async})),title:document.title};
    });
    console.log('BROWSER',JSON.stringify({url,data,requests:requests.slice(0,15),scriptErrors}));
   }catch(e){console.log('BROWSER_ERROR',JSON.stringify({url,error:String(e),scriptErrors}));}
   await context.close();
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
