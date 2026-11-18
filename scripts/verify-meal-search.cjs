const {createRequire}=require('node:module');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=createRequire(process.env.MEAL_PLAYWRIGHT_PACKAGE || path.resolve('../../outputs/assistant-repas-prototype-2026-11-16/package.json'))('playwright');
const base=process.env.MEAL_BASE_URL || 'http://127.0.0.1:4327';
const origin=new URL(base).origin;
if(!['localhost','127.0.0.1','[::1]'].includes(new URL(base).hostname))throw Error('Use a local preview: this test must not send production events.');
const out=path.resolve(process.env.MEAL_OUTPUT_DIR || '../../outputs/meal-search-verification',new Date().toISOString().replace(/[:.]/g,'-'));
fs.mkdirSync(out,{recursive:true});
async function ready(page){await page.waitForFunction(()=>!document.querySelector('.meal-results').hidden && document.querySelector('.meal-results').getAttribute('aria-busy')==='false');}
async function answer(page,value){await page.locator('#meal-query').fill(value);await page.locator('#meal-query').press('Enter');}
async function edit(page,label,value){
  await page.getByRole('button',{name:`Modifier : ${label}`,exact:true}).click();
  assert.equal(await page.locator('.meal-results').isVisible(),false);
  await answer(page,value);await page.locator('#conversation-update').click();await ready(page);
}
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.MEAL_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const report={checkedAt:new Date().toISOString(),base,api:'simulated only',externalRequestsAllowed:0,viewports:[]};
  try{
    for(const width of [390,1440]){
      const context=await browser.newContext({viewport:{width,height:900},reducedMotion:width===390?'reduce':'no-preference'});
      const page=await context.newPage();page.setDefaultTimeout(10000);
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      let apiCalls=0,apiStatus=200,pendingResponse=null,catalogDown=false,externalBlocked=0;
      // No inference, Analytics, ads, email or other external request can leave this context.
      await context.route('**/*',async route=>{
        const url=new URL(route.request().url());
        if(url.pathname==='/api/recherche'){
          apiCalls++;if(pendingResponse)await pendingResponse;
          return route.fulfill({status:apiStatus,contentType:'application/json',body:JSON.stringify(apiStatus===200?{intent:{terms:['pois chiches'],excluded:[],vegetarian:true,vegan:true,maxMinutes:null}}:{})});
        }
        if(url.origin!==origin){externalBlocked++;return route.abort();}
        if(catalogDown&&url.pathname==='/recherche/catalogue.json')return route.fulfill({status:503,body:'unavailable'});
        return route.continue();
      });
      await page.goto(base+'/');await page.locator('.meal-search-home').scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(out,`accueil-${width}.png`)});
      await page.getByRole('searchbox',{name:'Votre envie du moment'}).fill('repas du soir');
      await page.getByRole('button',{name:'Trouver mon idée'}).click();await page.waitForURL('**/recherche/');
      await page.locator('#conversation-question').filter({hasText:'frigo'}).waitFor();
      assert.match(await page.locator('#conversation-history').textContent(),/repas du soir/);
      assert.equal(await page.locator('.meal-card').count(),0);
      assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'noindex,follow');
      await answer(page,'citron poulet');await answer(page,'4');await answer(page,'30 minutes');await ready(page);
      assert.equal(apiCalls,0);assert.ok(await page.locator('.meal-card').count());
      const first=page.locator('.meal-card').first();assert.match(await first.textContent(),/poulet/i);
      for(const meta of await page.locator('.meal-meta').allTextContents())assert.ok(Number(meta.match(/\d+/)[0])<=30);
      await first.locator('summary').click();assert.match(await first.textContent(),/À vérifier/);
      await first.locator('[data-menu-recipe]').click();const savedMenu=await page.locator('#menu-selection').textContent();
      assert.equal(await page.locator('#menu-people').inputValue(),'4');
      await edit(page,'Qu’avez-vous dans le frigo ou les placards ?','saumon');
      assert.match(await page.locator('.meal-card').first().textContent(),/saumon/i);
      assert.equal(await page.locator('#menu-selection').textContent(),savedMenu);assert.equal(await page.locator('#menu-people').inputValue(),'4');
      await page.getByRole('button',{name:'Modifier : Pour combien de personnes ?',exact:true}).click();
      await answer(page,'13');await page.locator('#conversation-error').waitFor();
      assert.equal(await page.locator('#meal-query').getAttribute('aria-invalid'),'true');
      await answer(page,'deux');await page.locator('#conversation-update').click();await ready(page);
      assert.equal(await page.locator('#menu-people').inputValue(),'2');assert.equal(await page.locator('#menu-selection').textContent(),savedMenu);
      await page.screenshot({path:path.join(out,`resultats-${width}.png`),fullPage:true});
      // Reset keeps the menu; the explicit shortcut completes missing optional answers.
      await page.locator('#conversation-restart').click();assert.equal(await page.locator('#menu-selection').textContent(),savedMenu);
      await answer(page,'saumon');await page.locator('#conversation-skip').click();
      assert.match(await page.locator('#conversation-early').textContent(),/2 personnes par défaut/);
      await page.locator('#conversation-early').click();await ready(page);assert.ok(await page.locator('.meal-card').count());assert.equal(apiCalls,0);
      // One delayed interpretation permits checking the real busy/loader state.
      let finishResponse;
      pendingResponse=new Promise(resolve=>{finishResponse=resolve;});
      await page.goto(base+'/recherche/?q=croquetteslevantines&pantry=&people=2&time=any');
      await page.locator('[data-meal-loader]').waitFor({state:'visible'});
      await page.locator('[data-meal-loader]').screenshot({path:path.join(out,`loader-${width}.png`)});
      if(width===390)assert.equal(await page.locator('.companion-chef').evaluate(e=>getComputedStyle(e).animationName),'none');
      finishResponse();
      pendingResponse=null;
      await ready(page);assert.equal(apiCalls,1);assert.equal(await page.locator('#results-title').textContent(),'Des pistes à explorer');
      assert.ok(await page.locator('.meal-card a[href*=pois-chiches]').count());
      apiStatus=503;
      await page.goto(base+'/recherche/?q=saumon%20dragonfruit&pantry=&people=2&time=any');await ready(page);
      assert.match(await page.locator('#search-note').textContent(),/indisponible/);assert.ok(await page.locator('.meal-card').count());
      assert.match(await page.locator('#results-title').textContent(),/proches/);
      await page.goto(base+'/recherche/?q=xyzabc&pantry=&people=2&time=any');await ready(page);
      assert.match(await page.locator('#results-title').textContent(),/Pas encore/);assert.equal(await page.locator('.meal-card').count(),0);
      await page.locator('#meal-change-pantry').click();await answer(page,'<img src=x onerror=alert(1)>');
      assert.equal(await page.locator('#conversation-history img').count(),0);assert.match(await page.locator('#conversation-history').textContent(),/<img src=x/);
      // A failed catalogue remains retryable without losing the supplied answers.
      catalogDown=true;
      await page.goto(base+'/recherche/?q=saumon&pantry=&people=2&time=any');await ready(page);
      assert.match(await page.locator('#results-title').textContent(),/n’a pas pu/);assert.match(await page.locator('#conversation-history').textContent(),/saumon/);
      catalogDown=false;await page.locator('#meal-retry-button').click();await ready(page);assert.ok(await page.locator('.meal-card').count());
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
      report.viewports.push({width,apiCalls,externalBlocked,errors,overflow:false,passed:true});await context.close();
    }
    const offline=await browser.newContext({javaScriptEnabled:false});
    await offline.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const page=await offline.newPage();await page.goto(base+'/recherche/');assert.ok(await page.locator('noscript a[href="/recettes/"]').count());
    report.noJavaScript=true;await offline.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({...report,out}));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
