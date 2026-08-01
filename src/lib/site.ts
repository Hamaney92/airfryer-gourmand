import { getCollection, type CollectionEntry } from 'astro:content';

export const SITE = {
  url: 'https://airfryergourmand.fr',
  name: 'Airfryer Gourmand',
  tagline: "Le guide francophone pour tout réussir à l'air fryer",
  description:
    "Temps de cuisson exacts, températures et astuces testées pour l'air fryer. Chaque recette est testée avant publication.",
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

// ===== Accessoire Amazon recommandé PAR recette =====
// `util` = argument de vente : on met en avant une DOULEUR (nettoyage, poulet raté,
// revêtement abîmé) plutôt qu'une caractéristique — c'est ce qui déclenche le clic.
type Gear = { emoji: string; nom: string; util: string; query: string };

const GEAR: Record<string, Gear> = {
  spray:   { emoji: '💨', nom: 'Spray à huile rechargeable', util: "Un voile d'huile régulier avec 3× moins de gras. Les aérosols du commerce abîment le revêtement anti-adhésif — un spray rechargeable, non.", query: 'spray huile rechargeable cuisine' },
  moule:   { emoji: '🧁', nom: 'Moules & caissettes silicone', util: 'Cakes, muffins, œufs cocotte : démoulage parfait, zéro vaisselle qui colle. Passent au lave-vaisselle.', query: 'moule silicone air fryer avec anses' },
  papier:  { emoji: '📄', nom: 'Papier cuisson perforé', util: "Anti-collage sans bloquer l'air chaud. Le panier reste propre — plus de trempage interminable.", query: 'papier cuisson perforé air fryer' },
  liner:   { emoji: '🧽', nom: 'Panier silicone réutilisable', util: "Fini le papier jetable : ce panier protège le revêtement et se lave d'un coup d'éponge. L'accessoire nettoyage n°1.", query: 'panier silicone réutilisable air fryer' },
  thermo:  { emoji: '🌡️', nom: 'Thermomètre à viande', util: 'La fin du poulet raté : température à cœur exacte, viande juteuse à tous les coups.', query: 'thermomètre cuisson viande' },
  grille:  { emoji: '🍢', nom: 'Grille étagée / rack', util: 'Cuis le plat en bas + les légumes en haut EN MÊME TEMPS. Double la capacité pour les repas de famille.', query: 'grille étagée air fryer rack' },
  grill:   { emoji: '🔥', nom: 'Plaque de gril', util: 'Des marques de saisie « resto » et une belle coloration, sans sortir le barbecue. Idéal viandes et brochettes.', query: 'plaque gril air fryer grill pan' },
  coffret: { emoji: '🎁', nom: "Coffret d'accessoires air fryer", util: "Tout l'équipement en une commande : moules, grille, pinces, papier… Le plus simple pour bien démarrer.", query: 'coffret accessoires air fryer kit universel' },
};

// Upsell universel proposé en 2ᵉ ligne sur toutes les recettes.
const MAGNET = { nom: 'le tableau des temps aimanté', query: 'tableau temps cuisson air fryer magnétique' };

/** Renvoie l'accessoire pertinent pour une recette (même logique que les pins Pinterest). */
export function gearFor(data: { category?: string; slug?: string; keyword?: string }): Gear {
  const sl = (data.slug || data.keyword || '').toLowerCase();
  if (/(magret|entrecote|bavette|cote-de|steak|onglet|brochette)/.test(sl)) return GEAR.grill;
  if (/(cake|muffin|cupcake|madeleine|financier|clafoutis|brownie|gateau|gâteau|quatre-quart|far-breton)/.test(sl)) return GEAR.moule;
  if (/(frite|chips|pomme-de-terre|potatoes)/.test(sl)) return GEAR.spray;
  if (sl.includes('papillote')) return GEAR.papier;
  if (sl.includes('oeuf') || sl.includes('œuf')) return GEAR.moule;
  const byCat: Record<string, keyof typeof GEAR> = {
    Volaille: 'thermo', Viande: 'thermo', Plat: 'coffret', Poisson: 'papier',
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
  return c === 'Volaille' && /blanc|aiguillette|filet/i.test(r.slug);
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
