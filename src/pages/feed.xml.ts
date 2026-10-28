import type { APIRoute } from 'astro';
import { SITE, getPublishedRecipes } from '../lib/site';

// Install at src/pages/feed.xml.ts. Uses the site's publication filter.
export const GET: APIRoute = async () => {
  const recipes = await getPublishedRecipes();
  const escapeXml = (value: string) => value.replace(/[<>&"']/g, character => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
  }[character]!));
  const canonicalSlugs: Record<string, string> = {
    'poisson-pane-surgele': 'poisson-pane-surgele-air-fryer',
  };
  const entries = [...recipes].sort((a, b) =>
    b.data.pubDate.getTime() - a.data.pubDate.getTime() || a.id.localeCompare(b.id));
  const seen = new Set<string>();
  const items = entries.map(recipe => {
    const link = new URL(`/recettes/${canonicalSlugs[recipe.id] ?? recipe.id}/`, SITE.url).href;
    if (seen.has(link)) return '';
    seen.add(link);
    const date = recipe.data.pubDate;
    if (!Number.isFinite(date.getTime())) throw new Error(`Invalid publication date: ${recipe.id}`);
    return '<item><title>' + escapeXml(recipe.data.title) + '</title>'
      + '<link>' + escapeXml(link) + '</link>'
      + '<guid isPermaLink="true">' + escapeXml(link) + '</guid>'
      + '<description>' + escapeXml(recipe.data.description) + '</description>'
      + '<pubDate>' + date.toUTCString() + '</pubDate></item>';
  }).filter(Boolean);
  const body = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>'
    + '<title>' + escapeXml(SITE.name) + ' — Recettes</title>'
    + '<link>' + escapeXml(new URL('/', SITE.url).href) + '</link>'
    + '<description>Recettes en français pour cuisiner à l’air fryer.</description>'
    + '<language>fr-fr</language><atom:link href="' + escapeXml(new URL('/feed.xml', SITE.url).href)
    + '" rel="self" type="application/rss+xml" />\n'
    + items.join('\n') + '\n</channel></rss>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
