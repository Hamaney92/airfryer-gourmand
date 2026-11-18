const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const {createRequire}=require('node:module');
const base=process.env.MEAL_BASE_URL||'http://127.0.0.1:4338';
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw Error('Local preview required');
const out=path.resolve(process.env.MEAL_OUTPUT_DIR||'../../outputs/batch-hub-2026-11-18/author');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const {MENU_STORAGE_KEY:key,readSavedMenu,makeSavedMenu}=await import('../src/lib/meal-menu-storage.mjs');
 const catalog=JSON.parse(fs.readFileSync('dist/recherche/catalogue.json','utf8'));const first=catalog[0].id;
 const raw=JSON.stringify(makeSavedMenu([first],4,catalog));
 assert.equal(readSavedMenu(raw,catalog).status,'ready');
 for(const bad of ['{',JSON.stringify({version:2}),JSON.stringify({version:1,ids:[first],people:0,savedAt:'bad'})])assert.equal(readSavedMenu(bad,catalog).status,'invalid');
 assert.equal(readSavedMenu(null,catalog).status,'empty');
 assert.equal(readSavedMenu(raw,[]).status,'unavailable');
 const old=JSON.parse(raw);old.ids.push('removed-recipe');assert.equal(readSavedMenu(JSON.stringify(old),catalog).removed,1);
 assert.deepEqual(Object.keys(JSON.parse(raw)).sort(),['ids','people','savedAt','version']);
 const {chromium}=createRequire(path.resolve('../../outputs/assistant-repas-prototype-2026-11-16/package.json'))('playwright');
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const report={date:new Date().toISOString(),base,externalAllowed:0,cases:[]};
 try{
 const context=await browser.newContext({viewport:{width:390,height:900}});let down=false;
 await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==new URL(base).origin)return r.abort();if(u.pathname==='/api/recherche')return r.fulfill({status:503,body:'{}'});if(down&&u.pathname==='/recherche/catalogue.json')return r.fulfill({status:503,body:'{}'});return r.continue();});
 let page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/recherche/?q=poulet&pantry=&people=4&time=any');await page.locator('.meal-add').first().waitFor();
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),null);
 await page.locator('.meal-add').first().click();assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),null);
 await page.locator('#menu-save').click();await page.locator('#menu-save-status').filter({hasText:'Menu enregistré'}).waitFor();
 const saved=await page.evaluate(k=>localStorage.getItem(k),key);assert.equal(JSON.parse(saved).people,4);
 await page.locator('#menu-people').fill('6');assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),saved);
 await page.close();page=await context.newPage();await page.goto(base+'/recherche/#menu-reprise');await page.locator('#menu-restore').waitFor();
 assert.equal(await page.locator('#my-menu').isVisible(),false);await page.locator('#menu-restore').click();assert.equal(await page.locator('#menu-people').inputValue(),'4');
 assert.equal(await page.locator('#menu-selection li').count(),1);await page.locator('#menu-clear').click();assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),saved);
 await page.locator('#menu-restore').click();await page.locator('#menu-delete-saved').click();assert.equal(await page.locator('#menu-selection li').count(),1);assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),null);
 assert.equal(await page.evaluate(()=>document.activeElement.id),'menu-reprise');
 await page.evaluate(k=>localStorage.setItem(k,'{'),key);await page.reload();await page.locator('#menu-saved-status').filter({hasText:'ne peut pas être lue'}).waitFor();assert.equal(await page.locator('#menu-restore').isVisible(),false);
 await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw});down=true;await page.reload();await page.locator('#menu-saved-status').filter({hasText:'catalogue est indisponible'}).waitFor();assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),raw);down=false;await page.locator('#menu-catalog-retry').click();await page.locator('#menu-restore').waitFor();
 await page.locator('#menu-restore').click();await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Blocked','SecurityError')};});await page.locator('#menu-save').click();await page.locator('#menu-save-status').filter({hasText:'ne permet pas'}).waitFor();
 report.cases.push('schema validation','no automatic local write','explicit save','edits do not overwrite snapshot','new page restores only on click','portions restored','clear session preserves saved','delete saved preserves session','corrupt JSON','catalog failure and retry','blocked storage honest error');
 await context.close();
 for(const width of [320,390,1101,1440]){
  const ctx=await browser.newContext({viewport:{width,height:900}});await ctx.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());const p=await ctx.newPage();
  for(const route of ['/batch-cooking/','/dossiers/lunchbox-air-fryer/']){
   await p.goto(base+route);assert.equal(await p.locator('#primary-navigation a').count(),6);
   if(width<=1100){assert.equal(await p.locator('#primary-navigation').isVisible(),false);await p.locator('.mobile-menu-trigger').click();await p.locator('#primary-navigation').waitFor();await p.keyboard.press('Escape');assert.equal(await p.locator('#primary-navigation').isVisible(),false);}
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if(route==='/batch-cooking/')await p.screenshot({path:path.join(out,'hub-'+width+'.png'),fullPage:true});
  }
  await ctx.close();report.cases.push('navigation and overflow '+width);
 }
 const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:900}});const p=await nojs.newPage();await nojs.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
 for(const route of ['/batch-cooking/','/dossiers/lunchbox-air-fryer/']){await p.goto(base+route);assert.equal(await p.locator('#primary-navigation').isVisible(),true);assert.equal(await p.locator('.mobile-menu-trigger').isVisible(),false);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
 report.cases.push('noJS navigation both layouts');assert.deepEqual(errors,[]);report.passed=true;fs.writeFileSync(path.join(out,'storage-navigation-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
