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
      assert(m.imageSrc === 'https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-strawberry-bike-lifestyle-cover-20261122.jpg?v=1795384173','Missing approved lifestyle cover at '+width);
      assert(m.heading?.includes('Strawberry Protein Gummies with Fiber & Caffeine'),'Product heading missing at '+width);
      assert(m.headingRect?.width>0,'Heading not visible at '+width);
      assert.equal(m.formCount,1,'Waitlist form must appear once at '+width);
      assert(m.email && m.consent,'Waitlist email or consent missing at '+width);
      assert(m.scrollWidth<=width+2,'Document horizontal overflow at '+width+': '+JSON.stringify(m));
      results.push({width,height,hero:true,waitlist:true,noHorizontalOverflow:true});
      await page.close();
    }
    for (const slug of ['healthy-candy','pre-workout','functional-gummies','weight-management']) {
      for (const width of [320,390,768,1440]) {
        const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
        await page.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:8766'
          ? route.continue() : route.fulfill({status:200,body:''}));
        const hubPath='/blog/category/'+slug;
        const response=await page.goto('http://127.0.0.1:8766'+hubPath,{waitUntil:'networkidle'});
        assert.equal(response.status(),200,slug+' HTTP response');
        assert.equal(await page.locator('h1').count(),1,slug+' heading');
        assert.equal(await page.locator('.hub-card').count(),3,slug+' article cards');
        assert.equal(await page.locator('details').count(),3,slug+' questions');
        assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://velqnutrition.com'+hubPath);
        const layout=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth,display:getComputedStyle(document.querySelector('.hub-card-grid')).display}));
        assert.equal(layout.display,'grid',slug+' stylesheet applied');
        assert(layout.scroll<=layout.viewport+2,slug+' horizontal overflow at '+width+': '+JSON.stringify(layout));
        await page.locator('details summary').first().click();
        assert.equal(await page.locator('details[open]').count(),1,slug+' expandable FAQ');
        await page.close();
      }
    }
    console.log('PASS: four Journal hubs at 320, 390, 768 and 1440px, article cards, canonical and FAQ interaction.');
  } finally {await browser.close();}
  console.log(JSON.stringify({status:'PASS',results,liveSignups:0},null,2));
})().catch(e=>{console.error(e);process.exit(1);});
