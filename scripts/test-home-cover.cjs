#!/usr/bin/env node
'use strict';
// Responsive smoke test for the CURRENT lifestyle-cover homepage.
// No real signup submissions or external analytics calls.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
  ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright' : 'playwright');
(async () => {
  const browser = await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const results=[];
  try {
    for (const [width,height] of [[320,740],[390,844],[430,932],[768,1024],[820,1180],[1024,768],[1366,768],[1440,900]]) {
      const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
      await page.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:8766'
        ? route.continue() : route.fulfill({status:200,body:''}));
      const response=await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});
      assert.equal(response.status(),200,'Homepage response at '+width);
      const m=await page.evaluate(() => {
        const get=s=>document.querySelector(s);
        const rect=el=>{const r=el?.getBoundingClientRect();return r?{x:r.x,right:r.right,y:r.y,bottom:r.bottom,width:r.width,height:r.height}:null;};
        return {
          viewport:innerWidth, scrollWidth:document.documentElement.scrollWidth,
          cover:rect(get('.hero.lifestyle-cover')),
          image:rect(get('.approved-cover-art')),
          imageSrc:get('.approved-cover-art')?.getAttribute('src'),
          heading:get('#hero-title')?.textContent?.trim(),
          headingRect:rect(get('#hero-title')),
          formCount:document.querySelectorAll('#waitlist-form').length,
          email:!!get('#waitlist-email'),
          consent:!!get('#waitlist-form [name="consent"]'),
          menuCount:document.querySelectorAll('#menu-toggle').length
        };
      });
      assert(m.cover?.width>0 && m.image?.width>0,'Current cover artwork missing at '+width);
      assert(m.imageSrc?.startsWith('/assets/'),'Missing first-party approved cover at '+width);
      assert(m.heading?.includes('Strawberry Protein + Fiber'),'Product heading missing at '+width);
      assert(m.headingRect?.width>0,'Heading not visible at '+width);
      assert.equal(m.formCount,1,'Waitlist form must appear once at '+width);
      assert(m.email && m.consent,'Waitlist email or consent missing at '+width);
      assert(m.scrollWidth<=width+2,'Document horizontal overflow at '+width+': '+JSON.stringify(m));
      results.push({width,height,hero:true,waitlist:true,noHorizontalOverflow:true});
      await page.close();
    }
  } finally {await browser.close();}
  console.log(JSON.stringify({status:'PASS',results,liveSignups:0},null,2));
})().catch(e=>{console.error(e);process.exit(1);});
