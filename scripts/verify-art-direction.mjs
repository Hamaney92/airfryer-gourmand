// Own isolated local browser, never a user's authenticated browser.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[3] || 'playwright');
const origin = new URL(process.argv[2] || 'http://127.0.0.1:4327');
assert.ok(['127.0.0.1','localhost'].includes(origin.hostname));
const stage = process.argv[5] || 'before';
assert.ok(['before','after','after-season'].includes(stage));
const widths=stage==='after-season'?[375,1440]:[375,768,900,1024,1440];
const output = resolve('../../outputs/design-2026-10-28',stage);
await mkdir(output,{recursive:true});
const browser = await chromium.launch({headless:true,...(process.argv[4]?{executablePath:process.argv[4]}:{})});
const results=[];
try {
  for (const width of widths) {
    const context=await browser.newContext({viewport:{width,height:960},reducedMotion:'reduce'});
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin.origin?route.continue():route.abort());
    await context.addInitScript(()=>sessionStorage.setItem('afg_newsletter_intro_v1','1'));
    const page=await context.newPage();
    if(stage==='after-season') await page.clock.install({time:new Date('2027-01-15T12:00:00Z')});
    for (const [name,path] of [['accueil','/'],['recettes','/recettes/'],['recette','/recettes/feta-rotie-air-fryer/'],['guides','/guides/'],['livres','/livre/']]) {
      const errors=[];
      const onError=error=>errors.push(error.message);
      page.on('pageerror',onError);
      const response=await page.goto(new URL(path,origin).href,{waitUntil:'networkidle'});
      assert.equal(response.status(),200,path);
      await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0);});
      await page.evaluate(async()=>{await document.fonts.ready; await Promise.all([...document.images].filter(i=>i.loading!=='lazy').map(i=>i.decode().catch(()=>{})));});
      await page.evaluate(async()=>{window.scrollTo({top:0,behavior:'instant'});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
      await page.screenshot({path:resolve(output,`${name}-${width}-fold.jpg`),type:'jpeg',quality:85});
      await page.evaluate(async()=>{
        document.documentElement.style.scrollBehavior='auto';
        for(let y=0;y<document.documentElement.scrollHeight;y+=800){window.scrollTo(0,y);await new Promise(resolve=>setTimeout(resolve,40));}
        await Promise.race([Promise.all([...document.images].filter(i=>i.getAttribute('src')?.startsWith('/')&&i.getClientRects().length).map(i=>i.decode().catch(()=>{}))),new Promise(resolve=>setTimeout(resolve,3000))]);
        window.scrollTo(0,0);
      });
      const metrics=await page.evaluate(()=>({
        h1:document.querySelector('h1')?.textContent.trim(),
        h1Count:document.querySelectorAll('h1').length,
        overflow:document.documentElement.scrollWidth>innerWidth,
        h1Font:getComputedStyle(document.querySelector('h1')).fontFamily,
        navigation:document.querySelector('header nav')?.getBoundingClientRect().width,
        newsletterHeight:document.querySelector('.newsletter-banner')?.getBoundingClientRect().height,
        images:[...document.querySelectorAll('main img')].filter(i=>i.getAttribute('src')?.startsWith('/')&&i.getClientRects().length).map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0})),
        canonical:document.querySelector('link[rel="canonical"]')?.href,
        buttons:[...document.querySelectorAll('header button, .cta')].map(i=>({text:i.textContent.trim(),width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height}))
      }));
      assert.equal(metrics.h1Count,1,path);
      if(stage!=='before') assert.equal(metrics.overflow,false,`${path} overflow at ${width}`);
      assert.deepEqual(errors,[],path);
      await page.screenshot({path:resolve(output,`${name}-${width}.jpg`),type:'jpeg',quality:75,fullPage:true});
      if(stage!=='before') {
        assert.ok(metrics.images.every(i=>i.loaded),`${path}: visible local images`);
        if(stage==='after-season') assert.equal(await page.locator('.christmas-welcome').isVisible(),false,path);
        const target=page.locator('.skip-link');
        assert.equal(await target.count(),1,path);
        await page.keyboard.press('Tab');
        assert.equal(await target.evaluate(el=>el===document.activeElement),true,path);
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('main').evaluate(el=>el===document.activeElement),true,path);
        if(await page.locator('[aria-controls="primary-navigation"]').isVisible()) {
          await page.locator('[aria-controls="primary-navigation"]').click();
          assert.equal(await page.locator('#primary-navigation').isVisible(),true,path);
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('#primary-navigation').isVisible(),false,path);
        }
      }
      results.push({name,path,width,...metrics});
      page.off('pageerror',onError);
    }
    await context.close();
  }
  await writeFile(resolve(output,'verification.json'),JSON.stringify({stage,result:'PASS',externalRequests:'blocked',results},null,2));
  console.log(JSON.stringify({stage,result:'PASS',pages:5,viewports:widths,output}));
} finally {await browser.close();}
