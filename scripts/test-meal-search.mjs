import test from 'node:test';
import assert from 'node:assert/strict';
import {searchRecipes,pantryCheck,eligible,intentFor} from '../src/lib/meal-search.mjs';
import {siteSearch,validateIntent} from '../workers/meal-assistant/site-search.mjs';
const r=(id,title,ingredients,category='Legume',minutes=20)=>({id,title,ingredients,category,minutes,servings:2});
const catalog=[r('salmon','Saumon au citron',['2 pavés de saumon','aneth','huile olive'],'Poisson'),r('carrot','Carottes rôties',['carottes','huile','cumin']),r('chicken','Poulet à la crème',['poulet','crème'],'Volaille',35),r('chickpeas','Pois chiches',['pois chiches','huile']),r('bacon','Bacon croustillant',['bacon'],'Charcuterie'),r('wine','Poulet au vin',['poulet','vin'],'Volaille')];
test('natural ingredient search ranks published source, accents/plural',()=>{const s=searchRecipes(catalog,"j’ai des carottes");assert.equal(s.kind,'exact');assert.deepEqual(s.items.map(x=>x.recipe.id),['carrot']);});
test('missing combination is related, never exact',()=>assert.equal(searchRecipes(catalog,'saumon courgette').kind,'related'));
test('no match does not invent a recipe',()=>assert.equal(searchRecipes(catalog,'xyzabc').kind,'empty'));
test('edible marrons chauds retrieve chestnuts without inventing a source',()=>{
  const c=[r('chataigne','Châtaignes air fryer',['500 g de châtaignes'])];
  for(const q of ['marrons chauds','un marron chaud','châtaignes']){
    const result=searchRecipes(c,q);assert.equal(result.kind,'exact',q);assert.deepEqual(result.items.map(x=>x.recipe.id),['chataigne'],q);
  }
});
test('horse chestnuts in the query or pantry block retrieval even with AI terms',()=>{
  const c=[r('chataigne','Châtaignes air fryer',['500 g de châtaignes'])];
  for(const q of ["marrons d'Inde",'marron d’Inde','marrons d’Inde chauds']){
    for(const [query,options] of [[q,{}],['marrons chauds',{pantry:q}]]){
      const result=searchRecipes(c,query,{terms:['chataigne']},options);assert.equal(result.kind,'unsupported');assert.equal(result.reason,'horse-chestnut');assert.deepEqual(result.items,[]);
    }
  }
});
test('all exact matches remain accessible beyond twelve results',()=>{const c=Array.from({length:17},(_,i)=>r(`carrot-${i}`,'Carottes',['carottes']));const s=searchRecipes(c,'carottes');assert.equal(s.items.length,s.total);assert.equal(s.total,17);});
test('AI terms only retrieve an existing source',()=>{const s=searchRecipes(catalog,'falafels',{terms:['pois chiches']});assert.equal(s.kind,'interpreted');assert.equal(s.items[0].recipe.id,'chickpeas');});
test('general dinner offers ideas; vegan and duration exclusions survive AI',()=>{assert.equal(searchRecipes(catalog,'repas du soir').kind,'ideas');const s=searchRecipes(catalog,'repas végétarien en 30 minutes',{terms:['poulet'],vegetarian:false,maxMinutes:100});assert.ok(s.items.every(x=>x.recipe.category==='Legume'&&x.recipe.minutes<=30));});
test('explicit exclusions, pork/alcohol filter, allergy blocks',()=>{assert.equal(searchRecipes(catalog,'poulet sans crème').items.length,0);assert.ok(catalog.filter(eligible).every(x=>!['bacon','wine'].includes(x.id)));assert.equal(searchRecipes(catalog,'allergie noix').kind,'unsupported');assert.equal(searchRecipes(catalog,'bacon').kind,'unsupported');assert.equal(intentFor('repas sans porc').forbidden,false);});
test('prepared meat and ambiguous pork products are not vegetarian or promoted',()=>{const c=[r('burger','Burger',['steaks hachés'],'Plat'),r('lasagne','Lasagnes',['sauce bolognaise'],'Plat'),r('carrot','Carottes',['carottes']),r('cordon-bleu-surgele-air-fryer','Cordon bleu',['cordons bleus'],'Surgelé')];assert.deepEqual(searchRecipes(c,'repas végétarien').items.map(x=>x.recipe.id),['carrot']);assert.equal(eligible(r('asparagus','Asperges',['asperges','lard optionnel'])),false);assert.equal(eligible(r('hotdog','Hot dog',['saucisses type Francfort'])),false);});
test('pantry offers only bounded seasoning change and keeps compound quantities',()=>{const p=pantryCheck(catalog[0],'saumon persil');assert.deepEqual(p.present,['2 pavés de saumon']);assert.ok(p.check.includes('aneth'));assert.match(p.swaps[0],/persil.*aneth/);assert.equal(pantryCheck(catalog[0],'courgette').swaps.length,0);});
const request=(body={query:'falafels'},origin='https://airfryergourmand.fr',method='POST')=>new Request('https://worker.test/api/recherche',{method,headers:{Origin:origin,'Content-Type':'application/json'},...(method==='POST'?{body:JSON.stringify(body)}:{})});
const valid={terms:['pois chiches'],excluded:[],vegetarian:true,vegan:true,maxMinutes:null};
test('CORS preflight exact origin; reject other origin before AI',async()=>{let n=0;const env={AI:{run:()=>{n++;}}};assert.equal((await siteSearch(request({},'https://evil.test'),env)).status,403);const p=await siteSearch(request({},'https://airfryergourmand.fr','OPTIONS'),env);assert.equal(p.status,204);assert.equal(p.headers.get('Access-Control-Allow-Origin'),'https://airfryergourmand.fr');assert.equal(n,0);});
test('AI activation, rate limit and body bound stop calls',async()=>{let n=0;const env={TRIAL_ENABLED:'true',AI:{run:()=>{n++;}},AI_LIMITER:{limit:async()=>({success:false})}};assert.equal((await siteSearch(request(),env)).status,429);assert.equal((await siteSearch(request({query:'a'.repeat(3000)}),env)).status,413);assert.equal((await siteSearch(request(),{...env,TRIAL_ENABLED:'false'})).status,503);assert.equal(n,0);});
test('model output validation and failure are closed',async()=>{assert.throws(()=>validateIntent({...valid,terms:['<script>']}));assert.throws(()=>validateIntent({...valid,maxMinutes:'30'}));const env={TRIAL_ENABLED:'true',AI:{run:async()=>({response:JSON.stringify(valid),usage:{prompt_tokens:10,completion_tokens:5}})},AI_LIMITER:{limit:async()=>({success:true})}};const p=await siteSearch(request(),env);assert.equal(p.status,200);assert.deepEqual((await p.json()).intent,valid);env.AI.run=async()=>({response:'bad'});assert.equal((await siteSearch(request(),env)).status,502);});

const dietCatalog = [
  r('accras','Accras',['200 g de morue dessalée','1 œuf'],'Apéro'),
  r('saumon','Saumon citron',['pavé de saumon','citron'],'Poisson'),
  r('poulet','Poulet citron',['poulet','citron'],'Volaille'),
  r('crevettes','Crevettes',['crevettes','ail'],'Poisson'),
  r('tofu','Tofu doré',['tofu','soja'],'Plat'),
  r('gratin','Gratin de légumes',['courgettes','gruyère'],'Plat'),
  r('samoussa','Samoussas',['samoussas surgelés'],'Surgelé'),
];
test('published morue in Apéro stays excluded during lexical, semantic and mixed retrieval',()=>{
  for (const q of ['accras sans poisson','accras végétariens','accras vegan']) {
    const result=searchRecipes(dietCatalog,q,{terms:['morue','tofu'],vegetarian:false,vegan:false},{maxMinutes:30});
    assert.ok(!result.items.some(item=>item.recipe.id==='accras'),q);
  }
  assert.equal(searchRecipes(dietCatalog,'poulet sans poisson').items[0].recipe.id,'poulet');
  assert.equal(searchRecipes(dietCatalog,'saumon sans viande').items[0].recipe.id,'saumon');
  assert.equal(searchRecipes(dietCatalog,'saumon').items[0].recipe.id,'saumon');
  assert.equal(searchRecipes(dietCatalog,'crevettes sans fruits de mer').items.length,0);
  assert.equal(searchRecipes(dietCatalog,'samoussas sans poisson').items.length,0);
  assert.equal(searchRecipes(dietCatalog,'accras',{terms:['morue'],excluded:['poisson']}).items.length,0);
  assert.equal(searchRecipes(dietCatalog,'accras',null,{pantry:'sans poisson'}).items.length,0);
});
test('vegan AI alone filters meat, fish, seafood, egg and dairy',()=>{
  const c=[...dietCatalog,r('oeuf','Œuf dur',['œufs'],'Œufs')];
  const result=searchRecipes(c,'repas',{terms:[],vegan:true,vegetarian:false});
  assert.deepEqual(result.items.map(item=>item.recipe.id),['tofu']);
});
test('generic main and snack yield different dishes with constraints or a labelled side fallback',()=>{
  const s=searchRecipes(dietCatalog,'un truc réconfortant après le sport',null,{mealType:'main',maxMinutes:30});
  assert.equal(s.kind,'ideas');
  assert.ok(s.items.every(item=>['Plat','Volaille','Poisson'].includes(item.recipe.category)));
  const snack=searchRecipes(dietCatalog,'un truc réconfortant après le sport',null,{mealType:'snack',maxMinutes:30});
  assert.deepEqual(snack.items.map(item=>item.recipe.id),['accras']);
  const sides=searchRecipes([r('rosti','Rösti',['pommes de terre'],'Accompagnement')],'dîner végétarien');
  assert.equal(sides.kind,'sides');
});
test('partial lexical retrieval also surfaces eligible inferred alternatives and labels them',()=>{
  const s=searchRecipes(dietCatalog,'citron exotique sans poisson',{terms:['tofu','morue']});
  assert.equal(s.kind,'related');
  assert.equal(s.items[0].recipe.id,'poulet');
  assert.ok(s.items.some(item=>item.inferred && item.recipe.id==='tofu'));
  assert.ok(!s.items.some(item=>item.recipe.id==='accras'));
});

test('named meat exclusions reject meat preparations of unspecified species and preserve known alternatives',()=>{
  const c=[
    r('lasagne','Lasagnes',['Sauce bolognaise, béchamel'],'Plat'),
    r('burger','Burger',['2 steaks hachés'],'Plat'),
    r('farce','Poivron farci',['Farce du boucher'],'Plat'),
    r('beef','Entrecôte',['1 entrecôte'],'Viande'),
    r('chicken','Boulettes maison',['Farce de poulet'],'Volaille'),
    ...dietCatalog,
  ];
  for(const q of ['lasagnes sans bœuf','burger sans bœuf','poivron sans bœuf','entrecôte sans bœuf']){
    const result=searchRecipes(c,q,{terms:['lasagnes','steaks','farce','entrecôte']});
    assert.ok(result.items.every(item=>!['lasagne','burger','farce','beef'].includes(item.recipe.id)),q);
  }
  assert.equal(searchRecipes(c,'lasagnes',null,{pantry:'sans bœuf'}).items.length,0);
  assert.equal(searchRecipes(c,'boulettes maison sans bœuf').items[0].recipe.id,'chicken');
  assert.equal(searchRecipes(c,'saumon sans thon').items[0].recipe.id,'saumon');
});
test('negative pantry terms count neither as available ingredients nor as available substitutions',()=>{
  const result=pantryCheck(catalog[0],'huile, sans saumon ni persil');
  assert.deepEqual(result.present,['huile olive']);
  assert.ok(result.check.includes('2 pavés de saumon'));
  assert.deepEqual(result.swaps,[]);
  assert.deepEqual(pantryCheck(catalog[0],'sans saumon avec aneth').present,['aneth']);
});
