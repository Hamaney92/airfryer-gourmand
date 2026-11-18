import {searchRecipes,pantryCheck} from '../lib/meal-search.mjs';
import {conversationSteps,questions,emptyConversation,nextStep,answer,complete,fromURL,toSearchParams,displayAnswer,searchOptions,aiQuery} from '../lib/meal-conversation.mjs';
import {trackMealEvent} from '../lib/meal-analytics.mjs';
import {createMealMenu} from './meal-menu-client.mjs';
const el=id=>document.getElementById(id);
const form=el('conversation-form'),input=el('meal-query'),historyBox=el('conversation-history'),review=el('conversation-review');
const choices=el('conversation-choices'),skip=el('conversation-skip'),early=el('conversation-early'),error=el('conversation-error');
const loader=document.querySelector('[data-meal-loader]'),grid=el('meal-results-grid'),region=document.querySelector('.meal-results');
const summary=el('results-summary'),title=el('results-title'),note=el('search-note'),retry=el('meal-retry'),update=el('conversation-update');
const readState = () => fromURL(history.state?.afgMeal ?? location.search);
let state=readState(),editKey=null,wasEditing=false,catalogPromise,controller,menu,run=0,busy=false;
function writeState(method) {
  history[method]({ ...history.state, afgMeal: toSearchParams(state).toString() }, '', location.pathname + location.search);
}
const node=(tag,text,className)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(className)e.className=className;return e;};
const quick={q:['Repas du soir','Poulet rapide','Végétarien'],type:['Un plat principal','Un encas','Peu importe'],pantry:[],people:['1','2','4','6'],time:['20 min','30 min','45 min','Peu importe']};
const hints={q:'Une idée, un plat ou un ingrédient : dites-le avec vos mots.',pantry:'Exemple : poulet, citron, pommes de terre. Les quantités et ingrédients manquants resteront à vérifier.',people:'Par défaut, nous proposons 2 personnes. Vous pouvez écrire « on est 4 » (de 1 à 12).',time:'Nous filtrons la durée totale des recettes. Les portions ne raccourcissent pas les temps de cuisson.'};
const placeholders={q:'Un repas du soir, du poulet…',type:'Un plat principal ou un encas',pantry:'Poulet, citron, pommes de terre…',people:'2 personnes',time:'30 minutes, ou peu importe'};
function setBusy(value){busy=value;loader.hidden=!value;region.setAttribute('aria-busy',String(value));update.disabled=value;el('meal-retry-button').disabled=value;}
function cancelResults(){run++;controller?.abort();setBusy(false);region.hidden=true;grid.replaceChildren();}
function edit(key){cancelResults();editKey=key;wasEditing=true;render(true);}
function render(focus=false){
  const steps=conversationSteps(state);
  historyBox.replaceChildren();
  for(const key of steps){if(key==='q'&&!state.q||state[key]===null&&key!=='time'||state[key]===undefined)continue;
    const exchange=node('div',null,'conversation-exchange'),prompt=node('p',questions[key],'conversation-prompt'),response=node('div',null,'conversation-answer');
    response.append(node('p',displayAnswer(state,key)));const change=node('button','Modifier','conversation-secondary');change.type='button';change.setAttribute('aria-label',`Modifier : ${questions[key]}`);change.addEventListener('click',()=>edit(key));response.append(change);exchange.append(prompt,response);historyBox.append(exchange);
  }
  const key=editKey||nextStep(state);form.hidden=!key;review.hidden=!!key;error.hidden=true;input.removeAttribute('aria-invalid');
  if(key){
    el('conversation-step').textContent=wasEditing?'Modifier votre réponse':`Étape ${steps.indexOf(key)+1} sur ${steps.length}`;
    el('conversation-question').textContent=questions[key];el('conversation-help').textContent=hints[key]||'';
    input.value=editKey?(key==='type'?displayAnswer(state,'type'):key==='time'?(state.time===null?'Peu importe':String(state.time??'')):String(state[key]??'')):key==='people'?'2':'';
    input.placeholder=placeholders[key];input.inputMode='text';input.maxLength=['q','pantry'].includes(key)?300:60;
    choices.replaceChildren();quick[key].forEach(value=>{const b=node('button',value);b.type='button';b.addEventListener('click',()=>submit(value));choices.append(b);});
    skip.hidden=key!=='pantry';early.hidden=key==='q'||key==='type';early.textContent=`Voir déjà les recettes · ${state.people??2} personnes${state.people===null?' par défaut':''}, ${state.time?'limite de '+state.time+' min':'sans limite ajoutée'}`;
    el('conversation-send').textContent=wasEditing?'Enregistrer ma réponse →':key==='time'?'Trouver mes recettes →':'Continuer →';
    if(focus){el('conversation-announcement').textContent=questions[key];input.focus({preventScroll:true});form.scrollIntoView({block:'start'});}
  }else{
    el('conversation-recap').textContent=steps.map(k=>displayAnswer(state,k)).join(' · ');
    if(focus)el('conversation-review-title').focus();
  }
}
function submit(value){
  const key=editKey||nextStep(state);if(!key)return;
  const result=answer(state,key,value);
  if(result.error){error.textContent=result.error;error.hidden=false;input.setAttribute('aria-invalid','true');input.focus();return;}
  const started = !state.q && Boolean(result.state.q);
  const edited=wasEditing;state=result.state;editKey=null;wasEditing=false;writeState('replaceState');render(true);
  if(started) trackMealEvent('meal_search_started');
  if(!nextStep(state)&&!edited)search(true);
}
function finish(){
  if(!form.hidden){const key=editKey||nextStep(state),result=answer(state,key,input.value);if(result.error){error.textContent=result.error;error.hidden=false;input.setAttribute('aria-invalid','true');input.focus();return;}state=result.state;}
  state=complete(state);editKey=null;wasEditing=false;writeState('pushState');render();search(true);
}
function list(parent,heading,items){if(!items.length)return;parent.append(node('h4',heading));const ul=node('ul');items.forEach(x=>ul.append(node('li',x)));parent.append(ul);}
function card({recipe:r,hits,inferred},kind,snapshot){
  const url=`/recettes/${r.id==='poisson-pane-surgele'?'poisson-pane-surgele-air-fryer':r.id}/`;
  const article=node('article',null,'meal-card');
  if(r.image){const link=node('a');link.href=url;link.tabIndex=-1;link.setAttribute('aria-hidden','true');const img=node('img');img.src=r.image.replace(/^\/img\//,'/img/w/').replace(/\.jpg$/,'-380.webp');img.alt='';img.width=380;img.height=285;img.loading='lazy';img.addEventListener('error',()=>{img.src=r.image;},{once:true});link.append(img);article.append(link);}
  const body=node('div',null,'meal-card-body'),h=node('h3'),a=node('a',r.title);a.href=url;h.append(a);body.append(h,node('p',`${r.minutes} min au total · recette d’origine pour ${r.servings} personne${r.servings>1?'s':''}`,'meal-meta'));
  if(hits?.length)body.append(node('p',`${inferred||kind==='interpreted'?'Suggestion liée à votre envie':kind==='exact'?'Retrouvé':'Point commun'} : ${hits.join(', ')}`,'meal-match'));
  const details=node('details'),s=node('summary',snapshot.pantry?'Ce que j’ai / Ce qu’il manque à vérifier':'Ingrédients & adaptations');details.append(s);
  if(snapshot.pantry){
    const p=pantryCheck(r,snapshot.pantry);list(details,'Mentionnés dans vos ingrédients',p.present);list(details,'À vérifier ou à prévoir',p.check);
    details.append(node('p','Une correspondance ne vérifie ni les quantités ni tous les éléments d’une ligne.'));
    if(p.swaps.length)list(details,'Une piste pour l’assaisonnement',p.swaps);
    else details.append(node('p','Pas de substitution simple identifiée avec ces ingrédients. Gardez la base de la recette ou choisissez une autre recette.'));
    details.append(node('p','Pour remplacer la viande, le poisson, un légume ou un ingrédient de pâtisserie, choisissez une recette dédiée : les temps et proportions peuvent changer.'));
  }else list(details,'La liste de la recette',r.ingredients);
  const adapt=node('button','Adapter à mes ingrédients','meal-adapt');adapt.type='button';adapt.addEventListener('click',()=>edit('pantry'));details.append(adapt);
  body.append(details);const open=node('a','Voir la recette →','meal-open');open.href=url;body.append(open,menu.button(r.id));article.append(body);return article;
}
async function catalog(){if(!catalogPromise)catalogPromise=fetch('/recherche/catalogue.json',{signal:AbortSignal.timeout(10000)}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{menu ||= createMealMenu(data);el('menu-catalog-retry').hidden=true;return data;}).catch(e=>{catalogPromise=null;el('menu-saved-status').textContent='Le catalogue est indisponible. Votre sauvegarde n’a pas été modifiée. Réessayez ou consultez les recettes.';el('menu-catalog-retry').hidden=false;throw e;});return catalogPromise;}
async function search(focus=false, measure=focus){
  if(busy||nextStep(state))return;
  const snapshot={...state},id=++run;controller?.abort();controller=new AbortController();const current=controller;
  grid.replaceChildren();note.textContent='';retry.hidden=true;region.hidden=false;setBusy(true);title.textContent='Je cherche dans nos recettes…';summary.textContent='';
  const timeout=setTimeout(()=>current.abort(),12000);
  try{
    const data=await catalog();if(id!==run)return;menu.setPeople(snapshot.people);
    const options=searchOptions(snapshot);let result=searchRecipes(data,snapshot.q,null,options),usedAI=false,aiUnavailable=false;
    const text=aiQuery(snapshot);
    // One final interpretation at most. Explicit local constraints are reapplied after AI.
    if(!['exact','ideas','sides','unsupported'].includes(result.kind)&&text.length<=300){
      try{
        const response=await fetch('https://airfryer-assistant-pilote.youssef-hamane-00.workers.dev/api/recherche',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:text}),signal:current.signal});
        if(!response.ok)throw Error();const body=await response.json();
        if(body.intent){result=searchRecipes(data,snapshot.q,body.intent,options);usedAI=true;}else aiUnavailable=true;
      }catch{aiUnavailable=true;}
    }
    if(id!==run)return;
    const labels={exact:['Voici les recettes trouvées',`${result.total} recette${result.total>1?'s':''} ${result.total>1?'reprennent':'reprend'} les mots demandés. Ouvrez les ingrédients pour voir ce qu’il vous manque.`],ideas:['Quelques idées pour vous','Voici une sélection du catalogue. Précisez un ingrédient pour affiner.'],related:['Voici des pistes proches de votre envie','Ces recettes partagent certains ingrédients ou mots de votre recherche. Elles ne réunissent pas forcément tout : vérifiez les ingrédients manquants.'],interpreted:['Des pistes à explorer','L’IA a rapproché votre idée de ces recettes existantes. Vérifiez les ingrédients manquants et que la recette correspond à votre envie.'],empty:['Pas encore de correspondance avec ces réponses','Modifiez vos ingrédients ou votre temps pour explorer d’autres pistes. Nous n’avons pas assoupli vos contraintes.'],unsupported:['Cette demande nécessite une vérification','Ce moteur ne traite pas les contraintes médicales ou allergiques. Il propose uniquement une sélection sans porc ni alcool. Reformulez avec un ingrédient ou consultez directement les recettes.']};
    labels.sides=['Des accompagnements pour composer votre assiette','Aucun plat principal du catalogue ne correspond à ces réponses. Ces accompagnements respectent les filtres appliqués. Vous pouvez aussi modifier le temps disponible.'];
    [title.textContent,summary.textContent]=labels[result.kind];result.items.forEach(item=>grid.append(card(item,result.kind,snapshot)));
    if(measure) trackMealEvent('meal_search_completed', {outcome: result.kind, result_count: result.items.length});
    retry.hidden=result.items.length>0;el('meal-retry-button').hidden=false;
    note.textContent=aiUnavailable?'L’aide IA est indisponible pour le moment. Voici les correspondances locales du catalogue.':usedAI?'Recherche aidée par l’IA, résultats issus de notre catalogue.':'';
    if(focus)title.focus();
  }catch{if(id===run){title.textContent='La recherche n’a pas pu se charger';summary.textContent='Vos réponses sont conservées. Réessayez ou ouvrez le catalogue des recettes.';retry.hidden=false;if(focus)title.focus();}}
  finally{clearTimeout(timeout);if(id===run)setBusy(false);}
}
form.addEventListener('submit',e=>{e.preventDefault();submit(input.value);});
skip.addEventListener('click',()=>submit(''));early.addEventListener('click',finish);
update.addEventListener('click',finish);el('conversation-edit').addEventListener('click',()=>edit('q'));
el('conversation-restart').addEventListener('click',()=>{cancelResults();state=emptyConversation();editKey=null;wasEditing=false;writeState('pushState');render(true);});
el('meal-change-pantry').addEventListener('click',()=>edit('pantry'));el('meal-change-time').addEventListener('click',()=>edit('time'));el('meal-retry-button').addEventListener('click',()=>search(true));
window.addEventListener('popstate',()=>{cancelResults();state=readState();editKey=null;wasEditing=false;render();if(!nextStep(state))search();});
const entered = window.__afgMealEntry && Boolean(state.q);
if (entered) trackMealEvent('meal_search_started');
render();if(!nextStep(state))search(false, entered);
// Restore an existing menu without changing its portions while questions are pending.
el('menu-catalog-retry').addEventListener('click',()=>{el('menu-saved-status').textContent='Chargement du catalogue…';catalog().catch(()=>{});});
catalog().catch(()=>{});
