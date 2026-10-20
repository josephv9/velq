'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const results=[];
 try{
  for(const [width,height] of [[320,740],[390,844],[430,932],[768,1024],[820,1180],[1024,768],[1366,768],[1440,900]]){
   const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
   await page.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:8766'?route.continue():route.fulfill({status:200,body:''}));
   await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});
   const metrics=await page.evaluate(()=>{
    const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
    return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,menu:rect('#menu-toggle'),logo:rect('.header .wordmark'),join:rect('.header .nav-signup'),copy:rect('.hero-copy'),header:rect('.header'),lines:[...document.querySelectorAll('#hero-title>span')].map(e=>{const r=e.getBoundingClientRect();return {y:r.y,bottom:r.bottom,scroll:e.scrollWidth,width:e.clientWidth}}),align:getComputedStyle(document.querySelector('.hero-copy')).textAlign,fontWeight:getComputedStyle(document.querySelector('#hero-title')).fontWeight};
   });
   assert(metrics.scrollWidth<=width+1,'Page overflow at '+width);
   assert(metrics.menu.right+8<=metrics.logo.x,'Menu overlaps logo at '+width);
   assert(metrics.logo.right+8<=metrics.join.x,'Logo overlaps signup at '+width);
   assert(metrics.copy.y>metrics.header.bottom+24,'Copy overlaps header at '+width);
   assert.equal(metrics.align,'center');
   assert.equal(metrics.fontWeight,'400');
   assert.equal(metrics.lines.length,2);
   assert(metrics.lines[1].y>=metrics.lines[0].bottom-1,'Headline lines overlap at '+width);
   metrics.lines.forEach(line=>assert(line.scroll<=line.width+1,'Headline clipped at '+width));
   await page.locator('#menu-toggle').click();
   assert.equal(await page.locator('#mobile-nav').isVisible(),true,'Menu fails to open at '+width);
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('#mobile-nav').isVisible(),false);
   await page.locator('#hero-cta').click();
   assert.equal(await page.locator('#waitlist-email').isVisible(),true);
   results.push({width,height,noOverlap:true,twoLines:true,menu:true,waitlistCTA:true});
   await page.close();
  }
 }finally{await browser.close()}
 console.log(JSON.stringify({status:'PASS',results},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
