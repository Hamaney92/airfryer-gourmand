import {recipes,shoppingList,formatItem} from './planner.mjs';
const $=id=>document.getElementById(id); const measurements=[];
const selected=new Set(),owned=new Set();let currentRows=[];
function el(tag,text){const n=document.createElement(tag);n.textContent=text;return n;}
$('form').addEventListener('submit',e=>{e.preventDefault();search();});
async function search(preference){if($('submit').disabled)return;$('submit').disabled=true;$('results').replaceChildren();$('status').textContent='Recherche en cours…';
try{const response=await fetch('/api/repas',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:$('query').value,preference})});const data=await response.json();
const record={at:new Date().toISOString(),http:response.status,status:data.status||'error',latencyMs:data.latencyMs??null,usage:data.usage??null}; measurements.push(record);$('metrics').textContent=JSON.stringify(record,null,2);
$('status').textContent=data.error||data.message;
for(const choice of data.choices||[]){const b=el('button',choice.label);b.type='button';b.addEventListener('click',()=>search(choice.value));$('results').append(b);}
for(const idea of data.alternatives||[]){const b=el('button','Essayer une autre idée : '+idea);b.type='button';b.addEventListener('click',()=>{$('query').value=idea;search();});$('results').append(b);}
if(data.recipes?.length>1){const b=el('button','Ajouter cette sélection au menu');b.type='button';b.addEventListener('click',()=>{for(const r of data.recipes)selected.add(r.id);owned.clear();render();$('people').focus();});$('results').append(b);}
if(data.selection?.servings && !selected.size)$('people').value=data.selection.servings;
for(const recipe of data.recipes||[]){const card=el('article','');card.append(el('h2',recipe.title));const add=el('button','Ajouter au menu');add.type='button';add.addEventListener('click',()=>{selected.add(recipe.id);owned.clear();render();add.textContent='Ajouté au menu';});card.append(add);$('results').append(card);}
render();
}catch{$('status').textContent='Connexion impossible. Réessaie plus tard ou compose ton menu ci-dessous.';}finally{$('submit').disabled=false;}}
$('export').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(measurements,null,2)],{type:'application/json'}));const a=el('a','');a.href=url;a.download='mesures-assistant.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
function render(){
 $('catalog').replaceChildren();$('shopping').replaceChildren();$('portion-error').textContent='';
 for(const r of recipes){const label=el('label','');label.className='choice';const check=el('input','');check.type='checkbox';check.checked=selected.has(r.id);check.addEventListener('change',()=>{check.checked?selected.add(r.id):selected.delete(r.id);owned.clear();render();});label.append(check,el('span',r.title));$('catalog').append(label);const link=el('a','Voir la fiche : '+r.title);link.href='https://airfryergourmand.fr/recettes/'+r.id+'/';link.target='_blank';link.rel='noopener';$('catalog').append(link);}
 try{currentRows=shoppingList([...selected],Number($('people').value));}catch(e){currentRows=[];$('portion-error').textContent=e.message;}
 $('menu-summary').textContent=selected.size?`${selected.size} recette(s) sélectionnée(s) pour ${$('people').value} personne(s).`:'Choisis au moins une recette.';
 for(const row of currentRows){const label=el('label','');label.className='choice';const check=el('input','');check.type='checkbox';check.checked=owned.has(row.key);check.addEventListener('change',()=>{check.checked?owned.add(row.key):owned.delete(row.key);});label.append(check,el('span',formatItem(row)));$('shopping').append(label);}
 $('download').disabled=!currentRows.length;
}
$('people').addEventListener('input',()=>{owned.clear();render();});
$('download').addEventListener('click',()=>{const rows=currentRows.filter(r=>!owned.has(r.key));const text=`Airfryer Gourmand — ${$('people').value} personnes\n${[...selected].map(id=>recipes.find(r=>r.id===id).title).join(' + ')}\n\n`+(rows.length?rows.map(formatItem).join('\n'):'Tout est déjà disponible.')+'\n\nQuantités proportionnelles ; assaisonnements à ajuster. Consulte les fiches pour la cuisson.';const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=el('a','');a.href=url;a.download='mes-courses-airfryer.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
render();

