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

// ===== AFFILIATION AMAZON =====
// Tag Amazon.fr Partenaires actif (compte créé le 16/07/2026). Un seul endroit à
// modifier pour tout le site. Les liens de recherche restent conformes (pins → site → Amazon).
export const AMAZON_TAG = 'airfryergourm-21';
export const amazonSearch = (q: string) =>
  `https://www.amazon.fr/s?k=${encodeURIComponent(q)}&tag=${AMAZON_TAG}`;

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
