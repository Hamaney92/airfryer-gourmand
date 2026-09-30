// Sélections par usage. Une recherche marchande n'est pas une référence testée.
export type KitchenOffer = { id: string; name: string; reason: string; check: string; query: string };
const items: Record<string, KitchenOffer> = {
  knife: { id: 'office', name: 'Petit couteau d’office', reason: 'Pour éplucher et préparer les petites pièces avant cuisson.', check: 'Privilégie une prise en main confortable ; un couteau déjà disponible convient.', query: 'couteau office cuisine' },
  chef: { id: 'chef', name: 'Couteau de cuisine et planche', reason: 'Pour découper les légumes ou préparer les portions sur un support stable.', check: 'Choisis une lame adaptée à tes aliments et une planche facile à entretenir.', query: 'couteau chef planche decouper cuisine' },
  tongs: { id: 'tongs', name: 'Pince de cuisine à embouts silicone', reason: 'Pour retourner les aliments et servir sans gratter le panier.', check: 'Vérifie la température maximale des embouts et la longueur de la pince.', query: 'pince cuisine silicone resistante chaleur' },
  thermo: { id: 'thermometer', name: 'Thermomètre de cuisson à sonde', reason: 'Pour contrôler la température à cœur des viandes et des volailles, au lieu de juger seulement la coloration.', check: 'La sonde à lecture instantanée s’utilise hors de l’appareil, sauf indication contraire du fabricant.', query: 'thermometre cuisson sonde lecture instantanee' },
  spray: { id: 'oil-spray', name: 'Vaporisateur d’huile rechargeable', reason: 'Pour répartir l’huile sur les frites ou les légumes sans en verser au même endroit.', check: 'Vérifie que le pulvérisateur convient à l’huile ; respecte les consignes de ton appareil.', query: 'vaporisateur huile cuisine rechargeable' },
  cake: { id: 'cake-mould', name: 'Moule à gâteau compatible air fryer', reason: 'Pour contenir la pâte et donner sa forme au gâteau.', check: 'Mesure le panier et garde de l’espace pour l’air ; vérifie la température maximale du moule.', query: 'moule gateau air fryer' },
  muffins: { id: 'individual-moulds', name: 'Moules individuels à muffins', reason: 'Pour répartir la pâte en portions et démouler chaque gâteau séparément.', check: 'Vérifie les dimensions et la température maximale ; les moules ne doivent pas bloquer tout le panier.', query: 'moules individuels muffins air fryer' },
  ramekins: { id: 'ramekins', name: 'Ramequins compatibles four', reason: 'Pour contenir les œufs cocotte, flans ou portions de dessert.', check: 'Vérifie leur compatibilité four et leur taille ; utilise une protection pour les sortir chauds.', query: 'ramequins ceramique four' },
  dish: { id: 'baking-dish', name: 'Petit plat de cuisson', reason: 'Pour contenir la sauce, les gratins et les préparations en couches.', check: 'Vérifie la compatibilité four, les dimensions et l’espace autour du plat.', query: 'petit plat cuisson air fryer' },
  scale: { id: 'scale', name: 'Balance de cuisine', reason: 'Pour peser la pâte et ajuster les quantités de ta préparation.', check: 'Compare la précision, la fonction tare et la capacité selon tes usages.', query: 'balance cuisine numerique' },
  brush: { id: 'pastry-brush', name: 'Pinceau de cuisine', reason: 'Pour étaler la dorure ou une marinade sur la préparation.', check: 'Choisis un modèle adapté au contact alimentaire et facile à nettoyer.', query: 'pinceau cuisine silicone' },
  storage: { id: 'storage', name: 'Boîtes hermétiques pour les restes', reason: 'Pour portionner et ranger les aliments cuits que tu souhaites réutiliser.', check: 'Vérifie les usages autorisés : réfrigérateur, congélateur ou four. Une boîte ne prolonge pas à elle seule la conservation.', query: 'boites conservation hermetiques cuisine' },
  mandoline: { id: 'mandoline', name: 'Mandoline avec protège-doigts', reason: 'Pour préparer des tranches d’épaisseur régulière, notamment pour les chips.', check: 'Utilise le protège-doigts ; un couteau convient aussi pour une petite quantité.', query: 'mandoline cuisine protege doigts' },
};
const pick = (...ids: string[]) => ids.map(id => items[id]);

export function recipeOffers(slug: string, category: string): KitchenOffer[] {
  if (/chips/.test(slug)) return pick('mandoline', 'spray');
  if (/oeuf-cocotte/.test(slug)) return pick('ramekins', 'tongs');
  if (/flan|creme/.test(slug)) return pick('ramekins', 'scale');
  if (/oeuf-dur|oeuf-air|omelette/.test(slug)) return slug.includes('omelette') ? pick('dish', 'tongs') : pick('tongs');
  if (/muffin|madeleine|financier|donut/.test(slug)) return pick('muffins', 'scale');
  if (/cake|brownie|gateau|fondant|moelleux|clafoutis|far-breton|crumble|quiche|tarte/.test(slug)) return pick('cake', 'scale');
  if (/lasagnes|gratin|hachis|feta-rotie|camembert-roti|tomate-farcie/.test(slug)) return pick('dish', 'storage');
  if (/pain-perdu|wrap|panini|croque|quesadilla|pizza|bruschetta|rechauffer/.test(slug)) return pick('tongs', 'storage');
  if (/chausson|feuillete|bricks|samoussa|galette-des-rois|brioche/.test(slug)) return pick('brush', 'scale');
  if (/frite|potato|pomme-de-terre|pommes-de-terre|rosti/.test(slug)) return pick('spray', 'chef');
  if (/poulet|dinde|canard|steak|roti|entrecote|brochette|boulettes|filet-mignon|gigot|bavette/.test(slug)) return pick('thermo', 'tongs');
  if (category === 'Poisson') return pick('tongs', 'thermo');
  if (category === 'Legume' || category === 'Accompagnement') return pick('chef', 'spray');
  if (category === 'Volaille' || category === 'Viande' || category === 'Charcuterie') return pick('thermo', 'tongs');
  if (category === 'Dessert') return pick('scale', 'brush');
  if (category === 'Surgelé' || category === 'Apéro') return pick('tongs');
  return pick('tongs', 'storage');
}

export function pageOffers(path: string): KitchenOffer[] {
  if (/batch-cooking|lunchbox|rechauffer/.test(path)) return pick('storage', 'thermo');
  if (/automne|legumes/.test(path)) return pick('chef', 'spray');
  if (/desserts/.test(path)) return pick('cake', 'scale');
  if (/volaille|viandes|poissons/.test(path)) return pick('thermo', 'tongs');
  if (/minceur/.test(path)) return pick('spray', 'scale');
  if (/air-fryer-pour-2/.test(path)) return pick('dish', 'storage');
  if (/dossiers\/|categorie\/|rapide|temps-de-cuisson|tableau-temps/.test(path)) return pick('tongs', 'scale');
  return [];
}

export function bookFor(path: string, servings?: number): 'anti-gaspi' | 'petites-portions' {
  if (/anti-gaspi|batch-cooking|lunchbox|rechauffer|pain-perdu|hachis|wrap|croque|panini|quesadilla|legumes|chataigne/.test(path)) return 'anti-gaspi';
  if (servings !== undefined && servings <= 2) return 'petites-portions';
  return 'petites-portions';
}

export function isEditorialPage(path: string): boolean {
  return /^\/(guides|dossiers|categorie)\//.test(path) || /^\/(recettes|rapide|minceur|temps-de-cuisson|tableau-temps-cuisson-air-fryer)\/?$/.test(path);
}
