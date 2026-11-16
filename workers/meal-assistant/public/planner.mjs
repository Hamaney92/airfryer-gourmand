// Quantities transcribed from the three source recipe files, checked 2026-11-16.
export const recipes=[
 {id:'pois-chiches-air-fryer',title:'Pois chiches au paprika',base:1,items:[['pois-chiches','pois chiches cuits, poids égoutté',65,65,'g'],['huile','huile d’olive',1,1,'c. à café'],['paprika-doux','paprika doux',0.25,0.25,'c. à café'],['sel','sel',1,1,'pincée']]},
 {id:'patate-douce-air-fryer',title:'Patates douces en cubes',base:3,items:[['patate-douce','patates douces moyennes',2,2,'pièce'],['huile','huile d’olive',1,1,'c. à soupe'],['assaisonnement-patate','Sel, paprika fumé, herbes',null,null,'facultatif']]},
 {id:'blanc-de-poulet-air-fryer',title:'Blanc de poulet',base:2,items:[['poulet','blancs de poulet',2,2,'pièce'],['huile','huile d’olive',1,1,'c. à soupe'],['paprika','paprika ou épices au choix',1,1,'c. à café'],['assaisonnement-poulet','Sel, poivre, herbes',null,null,'selon goût']]},
 {id:'saumon-air-fryer',title:'Pavés de saumon',base:2,items:[['saumon','pavés de saumon',2,2,'pièce'],['huile','huile d’olive',null,null,'filet à ajuster'],['assaisonnement-saumon','Sel, poivre, aneth ou citron',null,null,'selon goût']]},
 {id:'carotte-air-fryer',title:'Carottes rôties',base:4,items:[['carotte','carottes',4,5,'pièce'],['huile','huile d’olive',1,1,'c. à soupe'],['assaisonnement-carotte','Sel, poivre, cumin ou herbes de Provence',null,null,'selon goût'],['options-carotte','Miel, ail, persil',null,null,'facultatif']]}
];
export function shoppingList(ids,people){
 if(!Number.isInteger(people)||people<1||people>12)throw Error('Choisis entre 1 et 12 personnes.');
 const map=new Map();
 for(const id of new Set(ids)){
  const r=recipes.find(r=>r.id===id);if(!r)throw Error('Recette inconnue.');
  for(const [ingredient,label,min,max,unit] of r.items){
   const key=ingredient+'|'+unit;const row=map.get(key)||{key,label,min: min===null?null:0,max:max===null?null:0,unit,sources:[]};
   if(min!==null){row.min+=min*people/r.base;row.max+=max*people/r.base;}
   row.sources.push(r.title);map.set(key,row);
  }
 }
 return [...map.values()];
}
const number=n=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2}).format(n);
export function formatItem(x){return x.min===null?`${x.label} — ${x.unit}`:`${number(x.min)}${x.max!==x.min?' à '+number(x.max):''} ${x.unit==='pièce'?'':x.unit+' de '}${x.label}`;}
