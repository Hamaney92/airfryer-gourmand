// Retrieval uses the published catalogue, never model-generated recipes or URLs.
export const normalize = (value = '') => value.toLowerCase().replace(/œ/g, 'oe').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const forbidden = /\b(porc|cochon|lard\w*|bacon|jambon|chorizo|sauciss\w*|knacki|andouill\w*|boudin|rhum|vin|vins|biere|cidre|cognac|armagnac|liqueur|alcool|champagne|kirsch|porto)\b/;
const stop = new Set('je j ai du de des la le les un une et ou avec dans mon ma mes ton ce cette ces pour personnes personne pers repas soir midi idee idees recette recettes air fryer airfryer cuisiner cuisine faire prepare preparer manger veux voudrais aimerais envie propose proposez trouve trouver moi nous on est au aux en a d l il elle disponible disponibles dispose frigo reste restes simple facile rapide minutes minute min maximum moins plus pas sans semaine diner dejeuner bon bonjour stp merci'.split(' '));
const synonyms = {vegetables:'legume',vegetable:'legume',chicken:'poulet',salmon:'saumon',zucchini:'courgette',carrots:'carotte',egg:'oeuf',eggs:'oeuf',veggie:'vegetarien',vege:'vegetarien'};
export function words(value) { return [...new Set(normalize(value).split(' ').filter(w => w.length > 2 && !stop.has(w) && !/^\d+$/.test(w)).map(w => synonyms[w] || (w.endsWith('s') ? w.slice(0,-1) : w)))]; }
export function eligible(recipe) { return !['cordon-bleu-surgele-air-fryer','pizza-surgelee-air-fryer'].includes(recipe.id) && recipe.category !== 'Charcuterie' && !forbidden.test(normalize([recipe.title,...recipe.ingredients].join(' '))); }
const includes = (text, term) => words(text).includes(term);

// Vocabulary checked against catalogue ingredients. A recipe listing both meat and
// a plant alternative is treated as containing meat until a separate variant exists.
const families = {
  fish: /\b(?:poisson|morue|saumon|cabillaud|merlu|colin|truite|sardine|maquereau|lieu noir|filet de lieu|bar de ligne|tilapia|thon|surimi)s?\b|\banchois\b/,
  shellfish: /\b(?:crevette|crustace|crabe|homard|langoustine|huitre|coquillage|calmar|calamar|poulpe|coquille saint jacques?)s?\b|\bgambas\b/,
  poultry: /\b(?:poulet|volaille|dinde|canard|chapon|pintade|chicken|nugget)s?\b/,
  meat: /\b(?:viande|boeuf|veau|agneau|mouton|steak|entrecote|bolognaise|saucisse|merguez|farce|porc|bacon|jambon|charcuterie)s?\b/,
  dairy: /\b(?:lait|beurre|babeurre|fromage|creme|chantilly|yaourt|feta|mozzarella|parmesan|chevre|emmental|camembert|brie|gruyere|cheddar|halloumi|bechamel|comte)s?\b/,
  egg: /\boeufs?\b/,
};
const unknownFilling = /\b(?:gyozas?|nems?|samoussas?|raviolis?|croquettes?|boulettes?)\b.*\b(?:surgeles?|du commerce)\b/;
const meatSpecies = /\b(?:boeuf|veau|agneau|mouton|porc|poulet|dinde|canard|chapon|pintade)s?\b/;
const meatPreparation = /\b(?:bolognaises?|steaks?|viandes?|farces?|merguez|boulettes? de viande)\b/;
// The same word names both mussels and a baking mould. Inspect individual ingredient lines.
const mussels = /^(?:moules?$|.*?\b(?:de |aux )?moules? (?:de bouchot|fraiches?|marinieres?|decortiquees?)\b|.*?\b(?:kg|g|litres?) de moules?\b)/;
function restrictRecipe(recipe, diet, exclusions) {
  const text = normalize([recipe.title,...recipe.ingredients].join(' '));
  const seafood = families.shellfish.test(text) || recipe.ingredients.some(line=>mussels.test(normalize(line)));
  const fish = families.fish.test(text) || (recipe.category === 'Poisson' && !seafood);
  const poultry = families.poultry.test(text) || recipe.category === 'Volaille';
  const meat = poultry || families.meat.test(text) || ['Viande','Charcuterie'].includes(recipe.category);
  if ((diet.vegetarian || diet.vegan) && (fish || seafood || meat || unknownFilling.test(text))) return true;
  if (diet.vegan && (families.dairy.test(text) || families.egg.test(text) || /\bmiel\b/.test(text))) return true;
  return exclusions.some(term => {
    if (term === 'boeuf' && /\bentrecotes?\b/.test(text)) return true;
    if (meatSpecies.test(term) && (unknownFilling.test(text) || recipe.ingredients.some(ingredient => {
      const line=normalize(ingredient);
      return meatPreparation.test(line) && !meatSpecies.test(line);
    }))) return true;
    if (['poisson','viande','volaille','fruitdemer','crustace'].includes(term) && unknownFilling.test(text)) return true;
    if (term === 'poisson') return fish;
    if (['crustace','fruitdemer'].includes(term)) return seafood;
    if (term === 'viande') return meat;
    if (term === 'volaille') return poultry;
    if (term === 'produitlaitier') return families.dairy.test(text);
    return includes(text,term);
  });
}

const mood = /\b(?:reconfort\w*|apres (?:le |mon |la |une )?(?:sport|entrainement|seance)|petite faim|quelque chose|un truc)\b/;
export function mealTypeIn(value) {
  const q = normalize(value);
  if (/\b(?:encas|en cas|collation|gouter|snack)\b/.test(q)) return 'snack';
  if (/\b(?:plat principal|plat complet|diner|dejeuner|repas du soir)\b/.test(q)) return 'main';
  return null;
}
export function needsMealType(query) {
  return mood.test(normalize(query)) && !mealTypeIn(query);
}
function mealTypeFor(recipe) {
  if (['Plat','Poisson','Volaille','Viande'].includes(recipe.category)) return 'main';
  if (['Apéro','Dessert','Œufs'].includes(recipe.category) || /^(?:pois-chiches|chips-de-legumes)-/.test(recipe.id)) return 'snack';
  return 'side';
}

export function intentFor(query) {
  const q = normalize(query);
  const blocked = /allerg|intoleran|diabet|enceinte|regime medical|sans gluten|sans lactose/.test(q);
  const excluded = [];
  const positive = q.replace(/\b(?:sans|sauf|pas de|pas d)\s+(.+?)(?=\b(?:avec|pour|mais|en moins|en \d)\b|$)/g, (_, part) => {
    const grouped = part.replace(/\bfruits? de mer\b/g,'fruitdemer').replace(/\bproduits? laitiers?\b/g,'produitlaitier');
    excluded.push(...words(grouped));
    return ' ';
  });
  const vegan = /\b(?:vegan|vegetalien)\w*\b/.test(q);
  const vegetarian = vegan || /\b(?:vegetarien\w*|veggie|vege)\b/.test(q);
  const durations = [...q.matchAll(/(?:en|moins de|max(?:imum)?)\s*(\d{1,3})\s*(?:min|minutes)/g)].map(m=>Number(m[1])).filter(n=>n>0);
  // These phrases describe an occasion, not an ingredient (e.g. "après" used to
  // match the instruction "pour l’après-cuisson" and return a single boiled egg).
  const ingredients = positive.replace(/\b(?:apres (?:le |mon |la |une )?(?:sport|entrainement|seance)|un truc|quelque chose|petite faim|plat (?:principal|complet)|en cas)\b/g,' ');
  const terms = words(ingredients).filter(w => !/^(vegetarien\w*|vegetalien\w*|vegan\w*|max|reconfort\w*|snack|gouter|encas|collation|sport)$/.test(w));
  return {blocked, excluded, vegan, vegetarian, maxMinutes:durations.length ? Math.min(...durations) : null, terms, generic:terms.length===0, forbidden:forbidden.test(positive)};
}

export function searchRecipes(catalog, query, ai = null, options = {}) {
  const wanted = intentFor(query), pantry = intentFor(options.pantry||'');
  const intent = {...wanted,blocked:wanted.blocked||pantry.blocked,forbidden:wanted.forbidden||pantry.forbidden,
    excluded:[...new Set([...wanted.excluded,...pantry.excluded])],vegetarian:wanted.vegetarian||pantry.vegetarian,vegan:wanted.vegan||pantry.vegan,
    terms:[...new Set([...wanted.terms,...pantry.terms])],generic:wanted.generic&&pantry.generic};
  if (intent.blocked || intent.forbidden) return {kind:'unsupported',items:[],intent};
  const excluded = [...intent.excluded,...intentFor('sans '+(ai?.excluded||[]).join(' et ')).excluded];
  const diet = {vegetarian:intent.vegetarian || ai?.vegetarian === true, vegan:intent.vegan || ai?.vegan === true};
  const maxMinutes = Math.min(intent.maxMinutes || Infinity, pantry.maxMinutes || Infinity, options.maxMinutes || Infinity, ai?.maxMinutes || Infinity);
  const mealType = options.mealType || mealTypeIn(query);
  const pool = catalog.filter(recipe => eligible(recipe) && recipe.minutes <= maxMinutes && !restrictRecipe(recipe,diet,excluded));
  // Explicit ingredient matches stay eligible, including sides for e.g. "brocoli pour le dîner".
  const rank = terms => pool.map(recipe => {
    const ingredientText = [recipe.title,...recipe.ingredients].join(' ');
    const hits = terms.filter(w=>includes(ingredientText,w));
    const score = hits.reduce((n,w)=>n+(includes(recipe.title,w)?4:1),0);
    return {recipe,hits,score,complete:terms.length>0 && hits.length===terms.length};
  }).sort((a,b)=>b.score-a.score || a.recipe.minutes-b.recipe.minutes);
  const ranked = rank(intent.terms);
  const fitsType = item => !options.mealType || options.mealType === 'any' || mealTypeFor(item.recipe) === options.mealType;
  const exact = ranked.filter(r=>r.complete && fitsType(r));
  if (exact.length) return {kind:'exact',items:exact,total:exact.length,intent};
  if (intent.generic) {
    let ideas = pool;
    if (mealType === 'main' || mealType === 'snack') {
      ideas = pool.filter(recipe=>mealTypeFor(recipe)===mealType);
      if (mealType==='main') ideas.sort((a,b)=>Number(b.category==='Plat')-Number(a.category==='Plat'));
      if (!ideas.length && mealType==='main') {
        const sides=pool.filter(recipe=>mealTypeFor(recipe)==='side').slice(0,5);
        if(sides.length)return {kind:'sides',items:sides.map(recipe=>({recipe,hits:[]})),intent};
      }
    } else if (!diet.vegetarian && !diet.vegan) {
      const mains = pool.filter(recipe=>mealTypeFor(recipe)==='main');
      if (mains.length) ideas=mains;
    } else ideas = pool.filter(recipe=>recipe.category!=='Dessert');
    return {kind:ideas.length?'ideas':'empty',items:ideas.slice(0,9).map(recipe=>({recipe,hits:[]})),intent};
  }
  const related = ranked.filter(r=>r.score>0 && fitsType(r));
  const aiTerms = words((ai?.terms || []).join(' ')).filter(w=>!intent.terms.includes(w));
  const semantic = aiTerms.length ? rank(aiTerms).filter(r=>r.score>0 && fitsType(r)) : [];
  if (related.length) {
    const semanticScores = new Map(semantic.map(r=>[r.recipe.id,r.score]));
    related.sort((a,b)=>(b.score+(semanticScores.get(b.recipe.id)||0))-(a.score+(semanticScores.get(a.recipe.id)||0)));
    const chosen=[],covered=new Set();
    for(const item of related) if(item.hits.some(w=>!covered.has(w))){chosen.push(item);item.hits.forEach(w=>covered.add(w));}
    const lexicalIds=new Set(related.map(item=>item.recipe.id));
    const inferred=semantic.filter(item=>!lexicalIds.has(item.recipe.id)).map(item=>({...item,inferred:true}));
    return {kind:'related',items:[...chosen,...inferred.slice(0,2),...related.filter(item=>!chosen.includes(item))].slice(0,9),intent};
  }
  if (semantic.length) return {kind:'interpreted',items:semantic.slice(0,9),intent};
  return {kind:'empty',items:[],intent};
}
export function pantryCheck(recipe, pantry) {
  const {terms,excluded} = intentFor(pantry);
  const owned = terms.filter(term=>!excluded.includes(term));
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
