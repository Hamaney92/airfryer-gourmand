import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePeople,parseTime,emptyConversation,nextStep,answer,complete,fromURL,toURL,aiQuery,searchOptions} from '../src/lib/meal-conversation.mjs';
import {searchRecipes} from '../src/lib/meal-search.mjs';

test('URL starting with an idea proceeds to pantry; complete URL resumes all choices',()=>{
 const s=fromURL('?q=repas+du+soir');assert.equal(nextStep(s),'pantry');
 const full={q:'Repas sans crème',pantry:'citron poulet',people:4,time:30};assert.deepEqual(fromURL(toURL(full).split('?')[1]),full);assert.equal(nextStep(full),null);
 assert.deepEqual(fromURL(toURL(complete(s)).split('?')[1]),complete(s));
});
test('invalid URL choices return to the missing question instead of silently searching',()=>{
 const s=fromURL('?q=repas&pantry=&people=13&time=30');assert.equal(nextStep(s),'people');
 assert.equal(fromURL('?q=x').q,'');assert.equal(fromURL('?q=repas&pantry=&people=2&time=-30').time,undefined);
});
test('people accept bounded natural phrases but reject fractions, multiple numbers and out-of-range answers',()=>{
 for(const [v,n] of [['on est 4',4],['nous sommes quatre',4],['2 personnes',2],['pour six',6],['12 convives',12]])assert.equal(parsePeople(v),n,v);
 for(const v of ['0','13','2.5','2,5','-4','deux adultes et trois enfants','4 ou 6','abc'])assert.equal(parsePeople(v),null,v);
});
test('time accepts simple phrases, hours and no limit without silently relaxing invalid input',()=>{
 for(const [v,n] of [['30 minutes',30],['j’ai vingt minutes',20],['1 heure',60],['quarante-cinq minutes',45],['Peu importe',null]])assert.deepEqual(parseTime(v),{valid:true,value:n});
 for(const v of ['0','301','-30','1.5 heures','20 ou 30 minutes','tout de suite'])assert.equal(parseTime(v).valid,false,v);
});
test('one answer advances one step and invalid answer preserves previous state',()=>{
 let s=emptyConversation();for(const [key,v] of [['q','repas du soir'],['pantry','poulet citron']])s=answer(s,key,v).state;
 assert.equal(nextStep(s),'people');assert.ok(answer(s,'people','13').error);assert.equal(s.pantry,'poulet citron');
 s=answer(s,'people','on est 4').state;assert.equal(nextStep(s),'time');s=answer(s,'time','30 minutes').state;assert.equal(nextStep(s),null);
});
test('optional questions have explicit defaults, AI query keeps complete untruncated clauses',()=>{
 const s=complete({q:'poulet sans crème',pantry:null,people:null,time:undefined});assert.deepEqual(searchOptions(s),{pantry:'',maxMinutes:null});assert.equal(s.people,2);
 assert.equal(aiQuery({...s,pantry:'citron',time:20}),'poulet sans crème. Avec : citron. En 20 minutes');
 assert.equal(complete({...s,people:4,time:20}).people,4);
});
const r=(id,title,ingredients,category,minutes)=>({id,title,ingredients,category,minutes,servings:2});
const recipes=[r('lasagne','Lasagnes',['bolognaise','tomate'],'Plat',25),r('poulet-citron','Poulet citron',['poulet','citron'],'Volaille',25),r('poulet-creme','Poulet crème',['poulet','crème'],'Volaille',20),r('saumon','Saumon citron',['saumon','citron'],'Poisson',20),r('carottes','Carottes',['carottes','cumin'],'Legume',15)];
test('pantry affects selection, changes results and labels incomplete matches as related',()=>{
 const first=searchRecipes(recipes,'repas du soir',null,{pantry:'citron poulet',maxMinutes:30});assert.equal(first.items[0].recipe.id,'poulet-citron');assert.equal(first.kind,'exact');
 const second=searchRecipes(recipes,'repas du soir',null,{pantry:'saumon',maxMinutes:30});assert.deepEqual(second.items.map(x=>x.recipe.id),['saumon']);
 assert.equal(searchRecipes(recipes,'repas du soir',null,{pantry:'poulet courgette'}).kind,'related');
});
test('pantry never overrides exclusions, vegetarian choice or the strictest total duration',()=>{
 assert.equal(searchRecipes(recipes,'végétarien',null,{pantry:'poulet',maxMinutes:20}).items.length,0);
 assert.deepEqual(searchRecipes(recipes,'poulet sans crème',null,{pantry:'citron poulet',maxMinutes:30}).items.map(x=>x.recipe.id),['poulet-citron']);
 assert.equal(searchRecipes(recipes,'poulet en 20 minutes',null,{pantry:'citron',maxMinutes:45}).items.some(x=>x.recipe.minutes>20),false);
 assert.equal(searchRecipes(recipes,'repas',null,{pantry:'saumon en 15 minutes',maxMinutes:30}).items.length,0);
 assert.equal(searchRecipes(recipes,'repas',{terms:['poulet'],maxMinutes:200,vegetarian:false},{pantry:'poulet',maxMinutes:15}).items.length,0);
});
test('allergic or forbidden pantry requests remain unsupported without an AI escape',()=>{
 for(const pantry of ['allergie noix','bacon','poulet au vin'])assert.equal(searchRecipes(recipes,'repas',null,{pantry}).kind,'unsupported');
});
