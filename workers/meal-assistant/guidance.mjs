import {recipes,formatItem} from './public/planner.mjs';
export const catalogue=recipes.map(r=>({id:r.id,title:r.title,servings:r.base,ingredients:r.items.map(([key,label,min,max,unit])=>formatItem({label,min,max,unit})),url:`https://airfryergourmand.fr/recettes/${r.id}/`}));
export const vegetable=id=>!['blanc-de-poulet-air-fryer','saumon-air-fryer'].includes(id);
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[?!.,]/g,'').trim();
const groups={poulet:['blanc-de-poulet-air-fryer','carotte-air-fryer'],poisson:['saumon-air-fryer','patate-douce-air-fryer'],vegetal:['pois-chiches-air-fryer','patate-douce-air-fryer']};
export function guide(query,preference){
 const q=normalize(query);
 const generic=/^(?:(?:un|une|des|idee de|idees de) )?(?:repas(?: du soir| de midi)?|diner|dejeuner|menu|que cuisiner(?: ce soir)?|quoi manger(?: ce soir)?|ce soir)(?: (?:simple|facile|rapide))?$/.test(q);
 const vegetarian=/^(?:(?:un|une|des) )?(?:(?:repas|menu|diner|idee) )?(?:vegetarien|vegetarienne|vegetal|vegan|vegetalien)(?: pour (?:[1-9]|1[0-2])(?: personnes?)?)?$/.test(q);
 const carrots=/^(?:des )?carottes vegetari(?:ennes|ens)(?: pour (?:[1-9]|1[0-2])(?: personnes?)?)?$/.test(q);
 if(!generic&&!vegetarian&&!carrots)return null;
 const valid=Object.hasOwn(groups,preference||'');
 const ids=carrots?['carotte-air-fryer']:vegetarian?groups.vegetal:valid?groups[preference]:[];
 const choices=ids.length?[]:[{label:'Poulet et carottes',value:'poulet'},{label:'Saumon et patate douce',value:'poisson'},{label:'Une idée végétale',value:'vegetal'}];
 const match=q.match(/pour (\d+)/);
 return {status:ids.length?'suggestions':'guide',mode:'guided',usage:null,selection:{recipe_ids:ids,servings:match?Number(match[1]):null,baskets:null,needs_clarification:!ids.length},recipes:ids.map(id=>catalogue.find(r=>r.id===id)),choices,message:ids.length?'Voici une piste du catalogue. Choisis le nombre de personnes dans « Mon menu », puis ajoute les recettes qui te plaisent. Les pois chiches sont une petite portion de garniture ; adapte ton repas à ton appétit.':'Pour ton repas, tu préfères quelle piste ? Choisis ci-dessous, puis indique le nombre de personnes dans « Mon menu ».'};
}
