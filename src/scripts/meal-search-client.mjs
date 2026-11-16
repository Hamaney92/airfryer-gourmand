import {searchRecipes,pantryCheck} from '../lib/meal-search.mjs';
const form=document.querySelector('[data-meal-form]');
const query=form.elements.namedItem('q'),pantry=form.elements.namedItem('pantry');
const loader=document.querySelector('[data-meal-loader]'),grid=document.getElementById('meal-results-grid');
const summary=document.getElementById('results-summary'),title=document.getElementById('results-title'),note=document.getElementById('search-note');
const retry=document.getElementById('meal-retry'),region=document.querySelector('.meal-results');
let catalogPromise,controller,run=0;
const node=(tag,text,className)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(className)e.className=className;return e;};
function list(parent,heading,items){if(!items.length)return;parent.append(node('h4',heading));const ul=node('ul');items.forEach(x=>ul.append(node('li',x)));parent.append(ul);}
function card({recipe:r,hits},kind){
  const url=`/recettes/${r.id==='poisson-pane-surgele'?'poisson-pane-surgele-air-fryer':r.id}/`;
  const article=node('article',null,'meal-card');
  if(r.image){const link=node('a');link.href=url;link.tabIndex=-1;link.setAttribute('aria-hidden','true');const img=node('img');img.src=r.image.replace(/^\/img\//,'/img/w/').replace(/\.jpg$/,'-380.webp');img.alt='';img.width=380;img.height=285;img.loading='lazy';img.addEventListener('error',()=>{img.src=r.image;},{once:true});link.append(img);article.append(link);}
  const body=node('div',null,'meal-card-body'),h=node('h3'),a=node('a',r.title);a.href=url;h.append(a);body.append(h,node('p',`${r.minutes} min au total · ${r.servings} personne${r.servings>1?'s':''}`,'meal-meta'));
  if(hits?.length)body.append(node('p',`${kind==='exact'?'Retrouvé':'Point commun'} : ${hits.join(', ')}`,'meal-match'));
  const details=node('details'),s=node('summary',pantry.value.trim()?'Avec ce que j’ai':'Ingrédients & adaptations');details.append(s);
  if(pantry.value.trim()){
    const p=pantryCheck(r,pantry.value);list(details,'Mentionnés dans vos ingrédients',p.present);list(details,'À vérifier ou à prévoir',p.check);
    details.append(node('p','Une correspondance ne vérifie ni les quantités ni tous les éléments d’une ligne.'));
    if(p.swaps.length)list(details,'Une piste pour l’assaisonnement',p.swaps);
    else details.append(node('p','Pas de substitution simple identifiée avec ces ingrédients. Gardez la base de la recette ou choisissez une autre recette.'));
    details.append(node('p','Pour remplacer la viande, le poisson, un légume ou un ingrédient de pâtisserie, choisissez une recette dédiée : les temps et proportions peuvent changer.'));
  }else{
    list(details,'La liste de la recette',r.ingredients);const b=node('button','Adapter à mes ingrédients','meal-adapt');b.type='button';b.addEventListener('click',()=>{document.querySelector('.meal-pantry').open=true;pantry.focus();});details.append(b);
  }
  body.append(details);const open=node('a','Voir la recette →','meal-open');open.href=url;body.append(open);article.append(body);return article;
}
async function catalog(){if(!catalogPromise)catalogPromise=fetch('/recherche/catalogue.json',{signal:AbortSignal.timeout(10000)}).then(r=>{if(!r.ok)throw Error();return r.json();}).catch(e=>{catalogPromise=null;throw e;});return catalogPromise;}
async function search(focus=false){
  const id=++run;controller?.abort();controller=new AbortController();const current=controller;
  const q=query.value.trim();grid.replaceChildren();note.textContent='';retry.hidden=true;
  if(q.length<2){title.textContent='À vous de choisir';summary.textContent='Saisissez une envie ou un ingrédient.';loader.hidden=true;region.setAttribute('aria-busy','false');return;}
  loader.hidden=false;region.setAttribute('aria-busy','true');summary.textContent='Recherche dans nos recettes…';
  const timeout=setTimeout(()=>current.abort(),12000);
  try{
    const data=await catalog();if(id!==run)return;
    let result=searchRecipes(data,q),usedAI=false,aiUnavailable=false;
    // Exact matches and general menus need no tokens. Free-text interpretation is bounded, never retried automatically.
    if(!['exact','ideas','unsupported'].includes(result.kind)){
      try{
        const response=await fetch('https://airfryer-assistant-pilote.youssef-hamane-00.workers.dev/api/recherche',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:q}),signal:current.signal});
        if(!response.ok)throw Error();const body=await response.json();
        if(body.intent){result=searchRecipes(data,q,body.intent);usedAI=true;}else aiUnavailable=true;
      }catch{aiUnavailable=true;}
    }
    if(id!==run)return;
    const labels={exact:['Voici les recettes trouvées',`${result.total} recette${result.total>1?'s':''} retrouve${result.total>1?'nt':''} les mots de votre recherche. Vérifiez la recette pour les autres critères.`],ideas:['Quelques idées pour vous','Voici une sélection du catalogue. Précisez un ingrédient pour affiner.'],related:['Pas de recette exacte, mais des pistes proches','Ces recettes ont des ingrédients ou des mots en commun avec votre recherche. Elles ne réunissent pas forcément tout.'],interpreted:['Des pistes à explorer','L’IA a rapproché votre idée de ces recettes existantes. Vérifiez qu’elles correspondent à votre envie.'],empty:['Pas encore de recette pour cette idée','Essayez un ingrédient principal ou parcourez nos idées pour le soir.'],unsupported:['Cette demande nécessite une vérification','Ce moteur ne traite pas les contraintes médicales ou allergiques. Il propose uniquement une sélection sans porc ni alcool. Reformulez avec un ingrédient ou consultez directement les recettes.']};
    [title.textContent,summary.textContent]=labels[result.kind];
    result.items.forEach(item=>grid.append(card(item,result.kind)));
    retry.hidden=result.items.length>0;
    note.textContent=aiUnavailable?'L’aide IA est indisponible pour le moment. Les correspondances du catalogue restent accessibles.':usedAI?'Recherche aidée par l’IA, résultats issus de notre catalogue.':'';
    if(focus)title.focus();
  }catch{if(id===run){title.textContent='La recherche n’a pas pu se charger';summary.textContent='Réessayez ou ouvrez le catalogue des recettes.';retry.hidden=false;}}
  finally{clearTimeout(timeout);if(id===run){loader.hidden=true;region.setAttribute('aria-busy','false');}}
}
function readURL(){const p=new URLSearchParams(location.search);query.value=(p.get('q')||'').slice(0,300);pantry.value=(p.get('pantry')||'').slice(0,300);if(pantry.value)document.querySelector('.meal-pantry').open=true;search();}
form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const p=new URLSearchParams({q:query.value.trim()});if(pantry.value.trim())p.set('pantry',pantry.value.trim());history.pushState(null,'',`/recherche/?${p}`);search(true);});
window.addEventListener('popstate',readURL);readURL();
