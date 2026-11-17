// Retrieval uses the published catalogue, never model-generated recipes or URLs.
export const normalize = (value = '') => value.toLowerCase().replace(/œ/g, 'oe').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const forbidden = /\b(porc|cochon|lard\w*|bacon|jambon|chorizo|sauciss\w*|knacki|andouill\w*|boudin|rhum|vin|vins|biere|cidre|cognac|armagnac|liqueur|alcool|champagne|kirsch|porto)\b/;
const animal = /\b(poulet|volaille|dinde|canard|boeuf|veau|agneau|mouton|viande|steak|bolognaise|farce|cordon|poisson|saumon|thon|cabillaud|colin|merlu|truite|sardine|anchois|crevette|gambas|crabe|moule|calamar|calmar|saucisse|surimi|chicken|merguez|nugget)\w*\b/;
const stop = new Set('je j ai du de des la le les un une et ou avec dans mon ma mes ton ce cette ces pour personnes personne pers repas soir midi idee idees recette recettes air fryer airfryer cuisiner cuisine faire prepare preparer manger veux voudrais aimerais envie propose proposez trouve trouver moi nous on est au aux en a d l il elle disponible disponibles dispose frigo reste restes simple facile rapide minutes minute min maximum moins plus pas sans semaine diner dejeuner bon bonjour stp merci'.split(' '));
const synonyms = {vegetables:'legume',vegetable:'legume',chicken:'poulet',salmon:'saumon',zucchini:'courgette',carrots:'carotte',egg:'oeuf',eggs:'oeuf',veggie:'vegetarien',vege:'vegetarien'};
export function words(value) { return [...new Set(normalize(value).split(' ').filter(w => w.length > 2 && !stop.has(w) && !/^\d+$/.test(w)).map(w => synonyms[w] || (w.endsWith('s') ? w.slice(0,-1) : w)))]; }
export function eligible(recipe) { return !['cordon-bleu-surgele-air-fryer','pizza-surgelee-air-fryer'].includes(recipe.id) && recipe.category !== 'Charcuterie' && !forbidden.test(normalize([recipe.title,...recipe.ingredients].join(' '))); }
const includes = (text, term) => words(text).includes(term);
export function intentFor(query) {
  const q = normalize(query);
  const blocked = /allerg|intoleran|diabet|enceinte|regime medical|sans gluten|sans lactose/.test(q);
  const excluded = [];
  // Exclusions extend until an explicit new clause. Unknown exclusions stay explicit.
  const positive = q.replace(/\b(?:sans|sauf|pas de|pas d)\s+(.+?)(?=\b(?:avec|pour|mais|en moins|en \d)\b|$)/g, (_, part) => {excluded.push(...words(part));return ' ';});
  const vegan = /\b(vegan|vegetalien)\w*\b/.test(q);
  const vegetarian = vegan || /\bvegetarien\w*\b/.test(q) || /sans (viande|poisson)/.test(q);
  const durations = [...q.matchAll(/(?:en|moins de|max(?:imum)?)\s*(\d{1,3})\s*(?:min|minutes)/g)].map(m=>Number(m[1])).filter(n=>n>0);
  const terms = words(positive).filter(w => !/^(vegetarien|vegetalien|vegan|max)$/.test(w));
  return {blocked, excluded, vegan, vegetarian, maxMinutes:durations.length ? Math.min(...durations) : null, terms, generic:terms.length===0, forbidden:forbidden.test(positive)};
}
export function searchRecipes(catalog, query, ai = null, options = {}) {
  const wanted = intentFor(query), pantry = intentFor(options.pantry||'');
  const intent = {...wanted,blocked:wanted.blocked||pantry.blocked,forbidden:wanted.forbidden||pantry.forbidden,
    excluded:[...new Set([...wanted.excluded,...pantry.excluded])],vegetarian:wanted.vegetarian||pantry.vegetarian,vegan:wanted.vegan||pantry.vegan,
    terms:[...new Set([...wanted.terms,...pantry.terms])],generic:wanted.generic&&pantry.generic};
  if (intent.blocked || intent.forbidden) return {kind:'unsupported',items:[],intent};
  // Model interpretation can narrow constraints, never remove explicit local ones.
  const excluded = [...intent.excluded,...words((ai?.excluded||[]).join(' '))];
  const vegetarian = intent.vegetarian || ai?.vegetarian === true;
  const vegan = intent.vegan || ai?.vegan === true;
  const maxMinutes = Math.min(intent.maxMinutes || Infinity, pantry.maxMinutes || Infinity, options.maxMinutes || Infinity, ai?.maxMinutes || Infinity);
  const pool = catalog.filter(r => eligible(r) && r.minutes <= maxMinutes && !excluded.some(w=>includes([r.title,...r.ingredients].join(' '),w)) &&
    (!vegetarian || (!animal.test(normalize([r.title,...r.ingredients].join(' '))) && !['Viande','Volaille','Poisson','Charcuterie'].includes(r.category))) &&
    (!vegan || !/\b(oeuf\w*|lait|beurre|fromage|creme|miel|yaourt|feta|mozzarella|parmesan|chevre|emmental|camembert|brie)\b/.test(normalize(r.ingredients.join(' ')))));
  const rank = terms => pool.map(r => {
    const hits = terms.filter(w=>includes([r.title,...r.ingredients].join(' '),w));
    return {recipe:r,hits,score:hits.reduce((n,w)=>n+(includes(r.title,w)?4:1),0),complete:terms.length>0 && hits.length===terms.length};
  }).sort((a,b)=>b.score-a.score || a.recipe.minutes-b.recipe.minutes);
  const ranked = rank(intent.terms);
  const exact = ranked.filter(r=>r.complete);
  if (exact.length) return {kind:'exact',items:exact,total:exact.length,intent};
  if (intent.generic) {
    const mains = pool.filter(r=>vegetarian ? !['Dessert'].includes(r.category) : ['Volaille','Poisson','Plat','Viande','Œufs'].includes(r.category));
    return {kind:'ideas',items:(mains.length?mains:pool).slice(0,9).map(recipe=>({recipe,hits:[]})),intent};
  }
  const related = ranked.filter(r=>r.score>0);
  if (related.length) {
    // Show each part of a mixed request before repeating nine variants of one ingredient.
    const chosen=[],covered=new Set();
    for(const item of related)if(item.hits.some(w=>!covered.has(w))){chosen.push(item);item.hits.forEach(w=>covered.add(w));}
    const rest=related.filter(item=>!chosen.includes(item));
    return {kind:'related',items:[...chosen,...rest].slice(0,9),intent};
  }
  const aiTerms = words((ai?.terms || []).join(' '));
  if (aiTerms.length) {
    const semantic=rank(aiTerms).filter(r=>r.score>0);
    if(semantic.length)return {kind:'interpreted',items:semantic.slice(0,9),intent};
  }
  return {kind:'empty',items:[],intent};
}
export function pantryCheck(recipe, pantry) {
  const owned = words(pantry);
  const present=[], check=[];
  for(const ingredient of recipe.ingredients){
    // This is an ingredient-presence hint, not proof that quantity or every item on a compound line is available.
    (owned.some(w=>includes(ingredient,w))?present:check).push(ingredient);
  }
  const herbs=['persil','aneth','coriandre','basilic','ciboulette'];
  const available=herbs.filter(h=>owned.includes(h));
  const original=herbs.filter(h=>recipe.ingredients.some(i=>includes(i,h))&&!owned.includes(h));
  const swaps=available.length&&original.length ? [`Pour l’assaisonnement, ${available[0]} peut remplacer ${original[0]} : le goût sera différent. Ajoutez-en progressivement. Cette variante n’a pas été testée par notre équipe.`] : [];
  return {present,check,swaps};
}
