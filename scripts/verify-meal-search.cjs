const {createRequire}=require('node:module');
const {chromium}=createRequire(process.env.MEAL_PLAYWRIGHT_PACKAGE || require('node:path').resolve('../../outputs/assistant-repas-prototype-2026-11-16/package.json'))('playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const base=process.env.MEAL_BASE_URL || 'http://127.0.0.1:4327';const out=path.resolve('../../outputs/moteur-site-2026-11-16');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:width===390?'reduce':'no-preference'});const page=await context.newPage();let apiCalls=0;const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/recherche',async route=>{apiCalls++;await new Promise(r=>setTimeout(r,900));await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({intent:JSON.parse(route.request().postData()).query.includes('saumon')?{terms:['saumon'],excluded:[],vegetarian:false,vegan:false,maxMinutes:null}:{terms:['pois chiches'],excluded:[],vegetarian:true,vegan:true,maxMinutes:null}})});});
  await page.goto(base+'/');await page.locator('.meal-search-home').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/accueil-${width}.png`});
  await page.getByRole('searchbox',{name:'Votre envie du moment'}).fill('saumon');await page.getByRole('button',{name:'Trouver mon idée'}).click();await page.waitForURL('**/recherche/?q=saumon');await page.waitForFunction(()=>document.querySelectorAll('.meal-card').length>0);
  assert.equal(apiCalls,0);assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'noindex,follow');
  await page.locator('.meal-pantry summary').click();await page.locator('#meal-pantry').fill('saumon, persil, huile olive');await page.getByRole('button',{name:'Trouver mon idée'}).click();await page.waitForFunction(()=>document.querySelector('.meal-results').getAttribute('aria-busy')==='false');
  await page.locator('.meal-card details').first().evaluate(el=>el.open=true);await page.screenshot({path:`${out}/resultats-${width}.png`,fullPage:true});assert.ok((await page.locator('.meal-card').first().textContent()).includes('À vérifier'));
  await page.locator('#meal-query').fill('saumon dragonfruit');await page.getByRole('button',{name:'Trouver mon idée'}).click();await page.locator('[data-meal-loader]').waitFor({state:'visible'});await page.locator('[data-meal-loader]').screenshot({path:`${out}/loader-${width}.png`});
  if(width===390)assert.equal(await page.locator('.santa-chef').evaluate(e=>getComputedStyle(e).animationName),'none');
  await page.locator('[data-meal-loader]').waitFor({state:'hidden'});assert.match(await page.locator('#results-title').textContent(),/proches/);
  await page.locator('#meal-query').fill('croquetteslevantines');await page.getByRole('button',{name:'Trouver mon idée'}).click();await page.waitForFunction(()=>document.querySelector('#results-title').textContent==='Des pistes à explorer');
  assert.ok(await page.locator('.meal-card a[href*=pois-chiches]').count());
  await page.unroute('**/api/recherche');await page.route('**/api/recherche',r=>r.fulfill({status:429,contentType:'application/json',body:'{}'}));
  await page.locator('#meal-query').fill('saumon dragonfruit');await page.getByRole('button',{name:'Trouver mon idée'}).click();await page.waitForFunction(()=>document.querySelector('#search-note').textContent.includes('indisponible'));assert.ok(await page.locator('.meal-card').count());
  await page.locator('#meal-query').fill('xyzabc');await page.getByRole('button',{name:'Trouver mon idée'}).click();await page.waitForFunction(()=>document.querySelector('#results-title').textContent.includes('Pas encore'));assert.equal(await page.locator('.meal-card').count(),0);
  await page.goBack();await page.waitForFunction(()=>document.querySelector('#meal-query').value==='saumon dragonfruit');
  await page.locator('#meal-query').fill('<img src=x onerror=alert(1)>');await page.getByRole('button',{name:'Trouver mon idée'}).click();await page.waitForFunction(()=>document.querySelector('.meal-results').getAttribute('aria-busy')==='false');assert.equal(await page.locator('#meal-results-grid img[src="x"]').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);console.log(JSON.stringify({width,apiCalls,errors,overflow:false,passed:true}));await context.close();
 }
 const offline=await browser.newContext({javaScriptEnabled:false});const page=await offline.newPage();await page.goto(base+'/recherche/');assert.ok(await page.locator('noscript a[href="/recettes/"]').count());await offline.close();
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
