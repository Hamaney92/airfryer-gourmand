import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const SITE = 'https://airfryergourmand.fr';

// Slugs de catégorie dérivés du contenu (doivent matcher src/lib/site.ts).
const CAT_SLUGS: Record<string, string> = {
  'Apéro': 'apero', 'Volaille': 'volaille', 'Charcuterie': 'charcuterie',
  'Legume': 'legumes', 'Viande': 'viandes', 'Dessert': 'desserts',
  'Surgelé': 'surgeles', 'Poisson': 'poissons', 'Plat': 'plats',
  'Accompagnement': 'accompagnements', 'Œufs': 'oeufs',
};

export const GET: APIRoute = async () => {
  const recipes = (await getCollection('recipes')).filter(
    (r) => r.data.pubDate.getTime() <= Date.now()
  );

  const catSlugs = [...new Set(recipes.map((r) => CAT_SLUGS[r.data.category]).filter(Boolean))];

  // Guides d'achat et dossiers : dérivés du système de fichiers, PAS d'une liste écrite à la main.
  // La liste manuelle avait laissé 9 pages (5 guides + 4 dossiers, toutes porteuses de liens
  // affiliés) hors du sitemap ; toute nouvelle page .astro déposée dans ces dossiers y entre
  // désormais automatiquement.
  const globToPaths = (mods: Record<string, unknown>, base: string) =>
    Object.keys(mods)
      .map((f) => f.split('/').pop()!.replace(/\.astro$/, ''))
      .filter((slug) => slug !== 'index')
      .sort()
      .map((slug) => `${base}${slug}/`);

  const guidePaths = globToPaths(import.meta.glob('./guides/*.astro'), '/guides/');
  const dossierPaths = globToPaths(import.meta.glob('./dossiers/*.astro'), '/dossiers/');

  const staticPaths = [
    '/', '/recettes/', '/temps-de-cuisson/', '/tableau-temps-cuisson-air-fryer/',
        '/rapide/', '/minceur/', '/guides/', '/livre/', '/a-propos/', '/contact/',
    '/mentions-legales/', '/confidentialite/',
    ...catSlugs.map((s) => `/categorie/${s}/`),
  ];
  const recipePaths = recipes.map((r) => `/recettes/${r.slug}/`);
  const paths = [...staticPaths, ...guidePaths, ...dossierPaths, ...recipePaths];

  const today = new Date().toISOString().split('T')[0];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
  .map(
    (p) =>
      `  <url><loc>${SITE}${p}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq></url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
