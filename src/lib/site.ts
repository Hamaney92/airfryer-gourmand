import { getCollection, type CollectionEntry } from 'astro:content';

export const SITE = {
  url: 'https://airfryergourmand.fr',
  name: 'Airfryer Gourmand',
  tagline: "Le guide francophone pour tout réussir à l'air fryer",
  description:
    "Temps de cuisson, températures et astuces pratiques pour réussir vos recettes à l'air fryer.",
};

// Table des catégories : libellé affiché + slug d'URL. La clé correspond
// exactement au champ `category` du frontmatter des recettes.
export const CATEGORIES: Record<string, { slug: string; label: string }> = {
  'Apéro': { slug: 'apero', label: 'Apéro' },
  'Volaille': { slug: 'volaille', label: 'Volaille' },
  'Charcuterie': { slug: 'charcuterie', label: 'Charcuterie' },
  'Legume': { slug: 'legumes', label: 'Légumes' },
  'Viande': { slug: 'viandes', label: 'Viandes' },
  'Dessert': { slug: 'desserts', label: 'Desserts' },
  'Surgelé': { slug: 'surgeles', label: 'Surgelés' },
  'Poisson': { slug: 'poissons', label: 'Poissons' },
  'Plat': { slug: 'plats', label: 'Plats' },
  'Accompagnement': { slug: 'accompagnements', label: 'Accompagnements' },
  'Œufs': { slug: 'oeufs', label: 'Œufs' },
};

// ===== CAPTURE EMAIL =====
// Formulaire MailerLite « Enregistrer cette recette - pages recette »
// (compte 2516614, groupe « Recette enregistrée »). Les champs personnalisés
// {$recette} et {$url_recette} sont remplis par les inputs cachés de SaveRecipe.astro
// et réutilisés dans l'automatisation pour envoyer LA recette consultée.
export const MAILERLITE_FORM_ACTION =
  'https://assets.mailerlite.com/jsonp/2516614/forms/194538633598863135/subscribe';

// ===== AFFILIATION AMAZON =====
// Tag Amazon.fr Partenaires actif (compte créé le 16/07/2026). Un seul endroit à
// modifier pour tout le site. Les liens de recherche restent conformes (pins → site → Amazon).
export const AMAZON_TAG = 'airfryergourm-21';
export const amazonSearch = (q: string) =>
  `https://www.amazon.fr/s?k=${encodeURIComponent(q)}&tag=${AMAZON_TAG}`;
export const amazonProduct = (asin: string) =>
  `https://www.amazon.fr/dp/${asin}/?tag=${AMAZON_TAG}`;

// ===== Accessoire Amazon recommandé PAR recette =====
// `util` = argument de vente : on met en avant une DOULEUR (nettoyage, poulet raté,
// revêtement abîmé) plutôt qu'une caractéristique — c'est ce qui déclenche le clic.
type Gear = {
  emoji: string;
  nom: string;
  util: string;
  /** Accroche courte (une clause), pour la relance placee juste sous la reponse rapide. */
  hook: string;
  query: string;
  /** Référence vérifiée : on préfère une fiche produit à une recherche générique lorsque
      l'accessoire est universel. Les accessoires dépendants du panier gardent une issue de secours. */
  asin?: string;
  model?: string;
  fitNote?: string;
  /** Si present, la relance pointe vers cette page INTERNE au lieu d'Amazon.
      Cas d'usage : la frustration de capacite (« une seule couche ») vend le double panier,
      et cet achat reflechi se travaille sur notre guide (7 %/30 j via Boulanger a terme),
      pas sur un lien Amazon a 3 %/24 h. */
  href?: string;
};

const GEAR: Record<string, Gear> = {
  spray:   { emoji: '💨', nom: 'Spray à huile rechargeable', util: "Un voile d'huile régulier avec 3× moins de gras. Les aérosols du commerce abîment le revêtement anti-adhésif — un spray rechargeable, non.", hook: "un voile d'huile régulier, pas une flaque", query: 'spray huile rechargeable cuisine', asin: 'B0D5H6GFVJ', model: 'FLAIROSOL OLIVIA 200 ml' },
  moule:   { emoji: '🧁', nom: 'Moules & caissettes silicone', util: 'Cakes, muffins, œufs cocotte : démoulage parfait, zéro vaisselle qui colle. Passent au lave-vaisselle.', hook: "un moule qui démoule vraiment, sans gratter", query: 'moule silicone air fryer avec anses', asin: 'B0DK5TDKXT', model: 'IBILI récipient silicone 20 cm', fitNote: 'mesure ton panier : ce modèle fait 20 cm de diamètre.' },
  papier:  { emoji: '📄', nom: 'Papier cuisson perforé', util: "Anti-collage sans bloquer l'air chaud. Le panier reste propre — plus de trempage interminable.", hook: "du papier PERFORÉ, sinon il s'envole sur la résistance", query: 'papier cuisson perforé air fryer', asin: 'B0H2WWGVMB', model: 'Papier perforé 20,5 × 14 cm', fitNote: 'vérifie les dimensions de ton panier avant commande.' },
  liner:   { emoji: '🧽', nom: 'Panier silicone réutilisable', util: "Fini le papier jetable : ce panier protège le revêtement et se lave d'un coup d'éponge. L'accessoire nettoyage n°1.", hook: "un panier qui se lave d'un coup d'éponge", query: 'panier silicone réutilisable air fryer', asin: 'B0F6T45G5S', model: 'GRIFEMA moules silicone 5–8 L', fitNote: 'ce lot est prévu pour des paniers de 5 à 8 L : vérifie la taille de ton appareil.' },
  thermo:  { emoji: '🌡️', nom: 'Thermomètre à viande', util: 'La fin du poulet raté : température à cœur exacte, viande juteuse à tous les coups.', hook: "la température à cœur, c'est la seule façon d'en être sûr", query: 'thermomètre cuisson viande', asin: 'B01LXI5HYH', model: 'ThermoPro TP02S à lecture instantanée' },
  grille:  { emoji: '🍢', nom: 'Grille étagée / rack', util: 'Cuis le plat en bas + les légumes en haut EN MÊME TEMPS. Double la capacité pour les repas de famille.', hook: "deux étages, donc le plat et l'accompagnement en même temps", query: 'grille étagée air fryer rack' },
  grill:   { emoji: '🔥', nom: 'Plaque de gril', util: 'Des marques de saisie « resto » et une belle coloration, sans sortir le barbecue. Idéal viandes et brochettes.', hook: "des marques de saisie sans sortir le barbecue", query: 'plaque gril air fryer grill pan' },
  plat:    { emoji: '🥘', nom: 'Plat rond pour air fryer', util: "Lasagnes, gratins, tomates farcies : il faut un plat qui entre VRAIMENT dans le panier — 18 a 20 cm, avec des bords assez hauts et un fond qui laisse circuler l'air.", hook: "il faut un plat de 18-20 cm qui entre vraiment dans le panier", query: 'plat cuisson rond air fryer 20 cm' },
  capacite:{ emoji: '🍗', nom: 'notre comparatif double panier', util: "Si cette recette remplit ton panier, deux tiroirs synchronises changent la logistique du repas : la volaille d'un cote, l'accompagnement de l'autre, prets en meme temps.", hook: "si ton panier est trop petit pour cette recette, deux tiroirs changent tout", query: 'air fryer double panier', href: '/guides/meilleur-air-fryer-double-panier/' },
  coffret: { emoji: '🎁', nom: "Coffret d'accessoires air fryer", util: "Tout l'équipement en une commande : moules, grille, pinces, papier… Le plus simple pour bien démarrer.", hook: "de quoi bien démarrer en une seule commande", query: 'coffret accessoires air fryer kit universel' },
};

// Upsell universel proposé en 2ᵉ ligne sur toutes les recettes.
const MAGNET = { nom: 'le tableau des temps aimanté', query: 'tableau temps cuisson air fryer magnétique' };

/** Renvoie l'accessoire pertinent pour une recette (même logique que les pins Pinterest). */
export function gearFor(data: { category?: string; slug?: string; keyword?: string }): Gear {
  const sl = (data.slug || data.keyword || '').toLowerCase();
  // Frustration de capacite : recettes qui remplissent le panier -> guide double panier (interne).
  if (/(poulet-entier|poulet-roti|dinde|gratin-dauphinois|lasagnes|hachis-parmentier|legumes-rotis)/.test(sl)) return GEAR.capacite;
  if (/(magret|entrecote|bavette|cote-de|steak|onglet|brochette)/.test(sl)) return GEAR.grill;
  if (/(cake|muffin|cupcake|madeleine|financier|clafoutis|brownie|gateau|gâteau|quatre-quart|far-breton)/.test(sl)) return GEAR.moule;
  if (/(frite|chips|pomme-de-terre|potatoes)/.test(sl)) return GEAR.spray;
  if (sl.includes('papillote')) return GEAR.papier;
  if (sl.includes('oeuf') || sl.includes('œuf')) return GEAR.moule;
  const byCat: Record<string, keyof typeof GEAR> = {
    Volaille: 'thermo', Viande: 'thermo', Plat: 'plat', Poisson: 'papier',
    Dessert: 'moule', Legume: 'spray', Accompagnement: 'liner', 'Apéro': 'liner',
    Charcuterie: 'grille', 'Surgelé': 'liner', 'Œufs': 'moule',
  };
  const key = byCat[data.category || ''] || 'coffret';
  return GEAR[key];
}

export const magnetUpsell = MAGNET;

// ===== MAILLAGE INTERNE PAR USAGE =====
// Le trafic Pinterest repart en ~18 s (contre 2 min 41 s pour Google) : le problème
// n'est pas le contenu, c'est qu'il n'y a nulle part où aller ensuite. On propose donc
// DEUX sorties de nature différente, comme le font les gros blogs recettes :
//   1. « Avec quoi le servir ? » → la suite logique du repas (un plat appelle un
//      accompagnement, un accompagnement appelle un plat). C'est une intention réelle.
//   2. « À tester juste après » → plus de recettes du même genre.
const PLATS = ['Volaille', 'Viande', 'Poisson', 'Plat', 'Charcuterie'];
const COTES = ['Accompagnement', 'Legume'];

/** Catégories à proposer en accompagnement d'une recette, selon sa catégorie. */
export function pairingCategories(category: string): { titre: string; cats: string[] } | null {
  if (PLATS.includes(category)) return { titre: 'Avec quoi le servir ?', cats: COTES };
  if (COTES.includes(category)) return { titre: 'Avec quel plat le servir ?', cats: PLATS };
  if (category === 'Apéro') return { titre: 'Pour compléter l’apéro', cats: ['Apéro', 'Surgelé'] };
  if (category === 'Surgelé') return { titre: 'Pour accompagner', cats: COTES };
  return null; // Desserts et œufs : pas d'accompagnement qui ait du sens.
}

// ===== NAVIGATION PAR USAGE =====
// On navigue comme les gens cherchent (« dîner rapide », « apéro », « minceur »),
// pas comme on range un frigo (« volaille », « charcuterie »). Ces intentions sont
// exactement celles qui convertissent déjà sur Pinterest.
export const USAGES = [
  { slug: '/rapide/', label: 'Dîner rapide' },
  { slug: '/categorie/apero/', label: 'Apéro' },
  { slug: '/minceur/', label: 'Minceur' },
  { slug: '/categorie/surgeles/', label: 'Surgelés' },
  { slug: '/categorie/desserts/', label: 'Desserts' },
  { slug: '/tableau-temps-cuisson-air-fryer/', label: 'Temps de cuisson' },
];

/** Recettes « dîner rapide » : prêtes en 15 min de cuisson ou moins. */
export function isRapide(r: Recipe) {
  return (r.data.cookTime ?? 99) <= 15;
}

/** Recettes « minceur » : légumes, poissons et blancs de volaille, sans friture. */
export function isMinceur(r: Recipe) {
  const c = r.data.category;
  if (c === 'Legume' || c === 'Poisson') return true;
  return c === 'Volaille' && /blanc|aiguillette|filet/i.test(r.id);
}

export type Recipe = CollectionEntry<'recipes'>;

export function catInfo(category: string) {
  return CATEGORIES[category] ?? { slug: slugify(category), label: category };
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// N'expose que les recettes dont la date de publication est arrivée.
// (Les recettes en `pubDate: 2099-01-01` restent dans le backlog.)
export async function getPublishedRecipes(): Promise<Recipe[]> {
  const now = Date.now();
  return (await getCollection('recipes'))
    .filter((r) => r.data.pubDate.getTime() <= now)
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export function fmtDate(d: Date) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(d);
}

export function isoDuration(minutes: number) {
  return `PT${minutes}M`;
}

export function totalTime(r: Recipe) {
  return (r.data.prepTime ?? 0) + (r.data.cookTime ?? 0);
}
