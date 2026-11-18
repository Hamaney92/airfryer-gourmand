import {normalize, needsMealType, mealTypeIn} from './meal-search.mjs';

export const steps=['q','type','pantry','people','time'];
export const questions={q:'Qu’avez-vous envie de cuisiner ?',type:'Vous préférez un plat principal ou un encas ?',pantry:'Qu’avez-vous dans le frigo ou les placards ?',people:'Pour combien de personnes ?',time:'Combien de temps avez-vous, préparation comprise ?'};
const typeLabels={main:'Un plat principal',snack:'Un encas',any:'Peu importe'};
export function conversationSteps(state){return needsMealType(state.q)?steps:steps.filter(key=>key!=='type');}
const smallNumbers={un:1,une:1,deux:2,trois:3,quatre:4,cinq:5,six:6,sept:7,huit:8,neuf:9,dix:10,onze:11,douze:12,vingt:20,trente:30,quarante:40,soixante:60};
function numberText(value){return normalize(value).replace(/\bquarante cinq\b/g,'45').replace(/\b[a-z]+\b/g,w=>smallNumbers[w]??w);}
export function parsePeople(value){
  const raw=String(value).trim();
  if(/[.,]\d|[-−]\s*\d/.test(raw))return null;
  const s=numberText(raw),m=s.match(/^(?:(?:on est|nous sommes|pour|nous sommes au nombre de) )?(\d{1,2})(?: (?:personnes?|convives?|adultes?))?$/);
  const n=m?Number(m[1]):0;return n>=1&&n<=12?n:null;
}
export function parseTime(value){
  const raw=String(value).trim(),s=numberText(raw);
  if(['peu importe','sans limite','any',''].includes(s))return {valid:true,value:null};
  if(/[.,]\d|[-−]\s*\d/.test(raw))return {valid:false};
  const m=s.match(/^(?:(?:j ai|en|maximum|max|moins de) )?(\d{1,3})(?: (min|minutes?|h|heures?))?$/);
  if(!m)return {valid:false};
  const n=Number(m[1])*(/^(h|heure)/.test(m[2]||'')?60:1);
  return n>=1&&n<=300?{valid:true,value:n}:{valid:false};
}
export const emptyConversation=()=>({q:'',pantry:null,people:null,time:undefined});
export function nextStep(state){
  if(!state.q)return 'q';
  if(needsMealType(state.q)&&!state.type)return 'type';
  return state.pantry===null?'pantry':state.people===null?'people':state.time===undefined?'time':null;
}
export function answer(state,key,value){
  if(!steps.includes(key))return {error:'Choisissez une question.'};
  let parsed=String(value).trim();
  if(key==='q'&&(parsed.length<2||parsed.length>300))return {error:'Décrivez votre envie en 2 à 300 caractères.'};
  if(key==='type'){
    const normalized=normalize(parsed);
    parsed=Object.hasOwn(typeLabels,normalized)?normalized:normalized==='peu importe'?'any':mealTypeIn(normalized);
    if(!parsed)return {error:'Choisissez un plat principal, un encas ou « Peu importe ».'};
  }
  if(key==='pantry'&&parsed.length>300)return {error:'Limitez la liste à 300 caractères.'};
  if(key==='people'){parsed=parsePeople(value);if(parsed===null)return {error:'Indiquez un nombre entier de 1 à 12 personnes, par exemple « on est 4 ».'};}
  if(key==='time'){const t=parseTime(value);if(!t.valid)return {error:'Indiquez 1 à 300 minutes, par exemple « 30 minutes », ou choisissez Peu importe.'};parsed=t.value;}
  const updated={...state,[key]:parsed};
  if(key==='q'&&!needsMealType(parsed))delete updated.type;
  return {state:updated};
}
export function complete(state){return {...state,...(needsMealType(state.q)?{type:state.type||'any'}:{}),pantry:state.pantry??'',people:state.people??2,time:state.time??null};}
export function fromURL(search){
  const p=new URLSearchParams(search);let state=emptyConversation();
  for(const key of steps){if(!p.has(key)||(key==='type'&&!needsMealType(state.q)))continue;const a=answer(state,key,p.get(key));if(a.state)state=a.state;}
  return state;
}
export function toURL(state){const p=new URLSearchParams();for(const key of steps){const v=state[key];if(v!==undefined&&v!==null&&!(key==='q'&&!v))p.set(key,String(v));else if(key==='time'&&v===null)p.set(key,'any');}return `/recherche/?${p}`;}
export function displayAnswer(state,key){return key==='type'?typeLabels[state.type]:key==='people'?`${state.people} personne${state.people>1?'s':''}`:key==='time'?(state.time===null?'Peu importe':`${state.time} min au total`):key==='pantry'?(state.pantry||'Rien de précis'):state.q;}
export function searchOptions(state){return {pantry:state.pantry||'',maxMinutes:state.time,...(state.type?{mealType:state.type}:{})};}
// Only the final request may reach AI; separate clauses preserve local exclusions.
export function aiQuery(state){return [state.q,state.pantry?`Avec : ${state.pantry}`:'',state.time?`En ${state.time} minutes`:''].filter(Boolean).join('. ');}
