import type { APIRoute } from 'astro';
import { SITE, getPublishedRecipes, catInfo } from '../lib/site';

export const GET: APIRoute = async () => {
  const recipes = await getPublishedRecipes();
  const catSlugs = [...new Set(recipes.map((recipe) => catInfo(recipe.data.category).slug))];
  const globToPaths = (mods: Record<string, unknown>, base: string) =>
    Object.keys(mods)
      .map((file) => file.split('/').pop()!.replace(/\.astro$/, ''))
      .filter((slug) => slug !== 'index')
      .sort()
      .map((slug) => base + slug + '/');

  const staticPaths = [
    '/', '/recettes/', '/temps-de-cuisson/', '/tableau-temps-cuisson-air-fryer/',
    '/rapide/', '/minceur/', '/guides/', '/livre/', '/a-propos/', '/contact/',
    '/mentions-legales/', '/confidentialite/',
    ...catSlugs.map((slug) => '/categorie/' + slug + '/'),
    ...globToPaths(import.meta.glob('./guides/*.astro'), '/guides/'),
    ...globToPaths(import.meta.glob('./dossiers/*.astro'), '/dossiers/'),
    ...globToPaths(import.meta.glob('./livres/*.astro'), '/livres/'),
  ];
  // Une reconstruction planifiée n'est pas une modification éditoriale.
  // Omettre lastmod lorsqu'aucune date fiable n'est enregistrée pour une page statique.
  const entries: { path: string; lastmod?: string }[] =
    [...new Set(staticPaths)].map((path) => ({ path }));
  for (const recipe of recipes) {
    const published = recipe.data.pubDate;
    const updated = recipe.data.updatedDate;
    const modified = updated && updated >= published && updated.getTime() <= Date.now()
      ? updated : published;
    entries.push({
      path: '/recettes/' + recipe.id + '/',
      lastmod: modified.toISOString().split('T')[0],
    });
  }
  const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const body = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + entries.map(({ path, lastmod }) => '  <url><loc>' + escapeXml(SITE.url + path)
      + '</loc>' + (lastmod ? '<lastmod>' + lastmod + '</lastmod>' : '') + '</url>').join('\n')
    + '\n</urlset>';
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
