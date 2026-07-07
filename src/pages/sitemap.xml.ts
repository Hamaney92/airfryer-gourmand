import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const SITE = 'https://airfryergourmand.fr';

export const GET: APIRoute = async () => {
  const recipes = await getCollection('recipes');

  const staticPaths = ['/', '/recettes/', '/temps-de-cuisson/'];
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
