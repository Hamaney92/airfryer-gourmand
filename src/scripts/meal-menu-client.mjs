import {buildShoppingList,formatShoppingRow,exportMenu,readMenuState} from '../lib/meal-planner.mjs';
import {MENU_STORAGE_KEY, readSavedMenu, makeSavedMenu} from '../lib/meal-menu-storage.mjs';
const STORAGE='afg_menu_session_v1';
const node=(tag,text,className)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(className)e.className=className;return e;};
const recipeURL=id=>`/recettes/${id==='poisson-pane-surgele'?'poisson-pane-surgele-air-fryer':id}/`;
export function createMealMenu(catalog){
  const box=document.getElementById('my-menu'),shortcut=document.getElementById('menu-shortcut');
  const selection=document.getElementById('menu-selection'),shopping=document.getElementById('menu-shopping');
  const peopleInput=document.getElementById('menu-people'),download=document.getElementById('menu-download');
  const count=document.getElementById('menu-count'),feedback=document.getElementById('menu-feedback'),error=document.getElementById('menu-error');
  const savedStatus=document.getElementById('menu-saved-status'),saveStatus=document.getElementById('menu-save-status');
  const saveButton=document.getElementById('menu-save'),restoreButton=document.getElementById('menu-restore'),deleteButton=document.getElementById('menu-delete-saved');
  const savedRegion=document.getElementById('menu-reprise');
  let saved={status:'empty'};
  const searchFocus=()=>document.getElementById(document.getElementById('conversation-form')?.hidden?'conversation-review-title':'meal-query');
  let people=2,selected=new Set(),owned=new Set(),rows=[];
  try{const state=readMenuState(sessionStorage.getItem(STORAGE),catalog);if(state){people=state.people;selected=new Set(state.ids);}}catch{}
  peopleInput.value=String(people);
  function save(){try{sessionStorage.setItem(STORAGE,JSON.stringify({people,ids:[...selected]}));}catch{box.querySelector('.menu-footnote').textContent='Le navigateur ne conserve pas le menu dans cet onglet. Téléchargez votre liste avant de quitter cette page. Les temps de cuisson ne se multiplient pas avec les portions.';}}
  function valid(){const n=Number(peopleInput.value);const ok=peopleInput.value.trim()!==''&&Number.isInteger(n)&&n>=1&&n<=12;error.hidden=ok;error.textContent=ok?'':'Choisissez un nombre entier de 1 à 12 personnes pour recalculer la liste.';download.disabled=!ok;saveButton.disabled=!ok;shopping.hidden=!ok;peopleInput.setAttribute('aria-invalid',String(!ok));return ok;}
  function updateCount(){count.textContent=`${rows.length-owned.size} élément${rows.length-owned.size>1?'s':''} à prévoir · ${owned.size} déjà disponible${owned.size>1?'s':''}`;}
  function setButton(b,id){const active=selected.has(id);b.setAttribute('aria-pressed',String(active));b.disabled=!active&&selected.size>=6;b.textContent=active?'✓ Dans mon menu · retirer':b.disabled?'Menu complet (6 recettes)':'+ Ajouter à mon menu';}
  function syncButtons(){document.querySelectorAll('[data-menu-recipe]').forEach(b=>setButton(b,b.dataset.menuRecipe));}
  function updateShortcut(){const rect=box.getBoundingClientRect();shortcut.hidden=selected.size===0||(rect.top<innerHeight&&rect.bottom>64);}
  const observer=new IntersectionObserver(updateShortcut);observer.observe(box);
  function render(){
    box.hidden=shortcut.hidden=selected.size===0;document.getElementById('menu-badge').textContent=String(selected.size);
    selection.replaceChildren();shopping.replaceChildren();
    for(const id of selected){const r=catalog.find(r=>r.id===id),li=node('li'),a=node('a',r.title),remove=node('button','Retirer');a.href=recipeURL(id);remove.type='button';remove.setAttribute('aria-label',`Retirer ${r.title} du menu`);remove.addEventListener('click',()=>{toggle(id);if(selected.size)document.getElementById('menu-title').focus();else (document.querySelector(`[data-menu-recipe="${id}"]`)||searchFocus()).focus();});li.append(a,remove);selection.append(li);}
    rows=buildShoppingList(catalog,[...selected],people);
    rows.forEach(row=>{
      const li=node('li'),label=node('label'),check=node('input');check.type='checkbox';check.checked=owned.has(row.key);check.setAttribute('aria-label',`Déjà disponible : ${row.kind==='source'?row.text:formatShoppingRow(row)}`);
      const text=node('span',row.kind==='source'?row.text:formatShoppingRow(row),'menu-item-text');
      if(row.kind==='source')text.append(node('span',`Quantité d’origine pour ${row.base} personnes — à vérifier pour ${people}.`,'source-quantity'));
      label.append(check,text);li.append(label,node('small',row.sources.map(s=>s.title).join(' · ')));li.classList.toggle('is-owned',check.checked);
      check.addEventListener('change',()=>{check.checked?owned.add(row.key):owned.delete(row.key);li.classList.toggle('is-owned',check.checked);updateCount();});shopping.append(li);
    });
    syncButtons();updateCount();valid();save();updateShortcut();document.getElementById('menu-restore-warning').hidden=!selected.size||saved.status!=='ready';
  }
  function toggle(id){
    if(selected.has(id))selected.delete(id);
    else{if(selected.size>=6){feedback.textContent='Le menu contient déjà 6 recettes. Retirez-en une avant d’en ajouter une autre.';return;}selected.add(id);}
    owned.clear();render();feedback.textContent=`${selected.size} recette${selected.size>1?'s':''} dans votre menu. La liste de courses est actualisée ; les cases déjà disponibles ont été réinitialisées.`;
  }
  peopleInput.addEventListener('input',()=>{if(!valid())return;people=Number(peopleInput.value);owned.clear();render();feedback.textContent='Quantités actualisées. Vérifiez de nouveau les ingrédients déjà disponibles.';});
  document.getElementById('menu-clear').addEventListener('click',()=>{selected.clear();owned.clear();render();feedback.textContent='Le menu de cet onglet est vide. La sauvegarde de cet appareil est conservée.';searchFocus().focus();});
  download.addEventListener('click',()=>{if(!valid()||!selected.size)return;const text=exportMenu(catalog,[...selected],people,owned);const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=node('a');a.href=url;a.download='mon-menu-airfryer-gourmand.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);feedback.textContent='La liste de courses a été préparée pour le téléchargement.';});
  function refreshSaved(){
    try{saved=readSavedMenu(localStorage.getItem(MENU_STORAGE_KEY),catalog);}catch{saved={status:'blocked'};}
    restoreButton.hidden=saved.status!=='ready';deleteButton.hidden=!['ready','invalid','unavailable'].includes(saved.status);
    saveButton.textContent=['ready','invalid','unavailable'].includes(saved.status)?'Mettre à jour le menu enregistré':'Garder ce menu sur cet appareil';
    const messages={empty:'Aucun menu enregistré sur cet appareil.',blocked:'Ce navigateur ne permet pas de lire la sauvegarde. Vous pouvez composer un menu et télécharger la liste.',invalid:'La sauvegarde ne peut pas être lue. Supprimez-la ou enregistrez un nouveau menu.',unavailable:'Les recettes de cette sauvegarde ne sont plus disponibles. Composez un nouveau menu.'};
    savedStatus.textContent=saved.status==='ready'?saved.menu.ids.length+' recette(s) pour '+saved.menu.people+' personne(s), enregistrées le '+new Date(saved.menu.savedAt).toLocaleDateString('fr-FR')+'.'+(saved.removed?' '+saved.removed+' recette(s) indisponible(s) seront écartées.':''):messages[saved.status];
    document.getElementById('menu-restore-warning').hidden=!selected.size||saved.status!=='ready';
  }
  saveButton.addEventListener('click',()=>{
    if(!valid()||!selected.size)return;
    try{const snapshot=makeSavedMenu(selected,people,catalog);localStorage.setItem(MENU_STORAGE_KEY,JSON.stringify(snapshot));refreshSaved();saveStatus.textContent='Menu enregistré sur cet appareil. Les cases cochées ne sont pas conservées.';}
    catch{saveStatus.textContent='Ce navigateur ne permet pas d’enregistrer le menu. Vous pouvez télécharger la liste.';}
  });
  restoreButton.addEventListener('click',()=>{
    refreshSaved();if(saved.status!=='ready'){savedRegion.focus();return;}
    people=saved.menu.people;peopleInput.value=String(people);selected=new Set(saved.menu.ids);owned.clear();render();saveStatus.textContent='Menu repris. Vérifiez les ingrédients déjà disponibles. Les prochaines modifications ne seront pas enregistrées automatiquement.';document.getElementById('menu-title').focus();
  });
  deleteButton.addEventListener('click',()=>{
    try{localStorage.removeItem(MENU_STORAGE_KEY);refreshSaved();savedStatus.textContent='Sauvegarde supprimée. Le menu de cet onglet est conservé.';saveStatus.textContent='';}
    catch{savedStatus.textContent='La sauvegarde n’a pas pu être supprimée par ce navigateur.';}
    savedRegion.focus();
  });
  refreshSaved();
  if(location.hash==='#menu-reprise'){savedRegion.scrollIntoView();savedRegion.focus({preventScroll:true});}
  shortcut.addEventListener('click',()=>{box.focus();});render();
  return {setPeople(value){if(!Number.isInteger(value)||value<1||value>12)return false;if(value===people&&peopleInput.value===String(value))return true;people=value;peopleInput.value=String(value);owned.clear();render();feedback.textContent='Quantités actualisées pour votre nombre de personnes. Vérifiez de nouveau les ingrédients déjà disponibles.';return true;},button(id){const b=node('button',null,'meal-add');b.type='button';b.dataset.menuRecipe=id;setButton(b,id);b.addEventListener('click',()=>toggle(id));return b;}};
}
