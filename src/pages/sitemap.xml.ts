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

  const staticPaths = [
    '/', '/recettes/', '/temps-de-cuisson/', '/guides/', '/a-propos/', '/contact/',
    ...catSlugs.map((s) => `/categorie/${s}/`),
  ];
  const recipePaths = recipes.map((r) => `/recettes/${r.slug}/`);
  const paths = [...staticPaths, ...recipePaths];

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
