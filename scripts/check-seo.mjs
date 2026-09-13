import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';

// Run after build. Validate generated pages, not just source templates.
const root = resolve('dist');
const origin = 'https://airfryergourmand.fr';
const failures = [];
const assert = (ok, message) => { if (!ok) failures.push(message); };
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]);
const files = walk(root).filter((file) => file.endsWith('.html'));
let recipeCount = 0;
for (const file of files) {
  const path = '/' + relative(root, file).replaceAll('\\', '/').replace(/index\.html$/, '');
  const html = readFileSync(file, 'utf8');
  if (path === '/404.html') continue;
  assert((html.match(/<h1(?:\s|>)/g) || []).length === 1, `${path}: expected one H1`);
  assert(/<title>[^<]+<\/title>/.test(html), `${path}: missing title`);
  assert(/<meta name="description" content="[^"]+"/.test(html), `${path}: missing description`);
  assert(html.includes(`rel="canonical" href="${origin}${path}"`), `${path}: incorrect canonical`);
  for (const match of html.matchAll(/(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)) {
    const target = decodeURIComponent(match[1]);
    if (target.startsWith('//')) continue;
    assert(existsSync(join(root, target)), `${path}: missing internal target ${target}`);
  }
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .flatMap((match) => { try { return [JSON.parse(match[1])].flat(); } catch { failures.push(`${path}: invalid JSON-LD`); return []; } });
  const recipe = schemas.find((schema) => schema['@type'] === 'Recipe');
  if (recipe) {
    recipeCount++;
    assert(recipe.url === origin + path, `${path}: Recipe URL mismatch`);
    assert(!recipe.aggregateRating, `${path}: unexpected aggregate rating`);
    assert(!recipe.dateModified || recipe.dateModified >= recipe.datePublished, `${path}: invalid modification date`);
    assert(!recipe.dateModified || recipe.dateModified <= new Date().toISOString().slice(0, 10), `${path}: future modification date`);
    for (const step of recipe.recipeInstructions) {
      assert(html.includes(`id="${step.url.split('#')[1]}"`), `${path}: step anchor missing`);
    }
    assert(html.indexOf('id="recette"') < html.indexOf('<picture>'), `${path}: quick answer below photo`);
    assert(html.indexOf('id="etapes"') < html.indexOf('id="materiel"'), `${path}: affiliate box before method`);
  }
}
const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
assert(urls.length === new Set(urls).size, 'Duplicate sitemap URLs');
assert(urls.includes(origin + '/livres/air-fryer-anti-gaspi/'), 'Book missing from sitemap');
for (const url of urls) assert(existsSync(join(root, new URL(url).pathname)), `Sitemap target missing: ${url}`);
for (const block of sitemap.matchAll(/<url>(.*?)<\/url>/g)) {
  assert(block[1].includes('/recettes/') || !block[1].includes('<lastmod>'), 'Static URL has artificial lastmod');
}
if (failures.length) {
  console.error([...new Set(failures)].join('\n'));
  process.exitCode = 1;
} else {
  console.log(`SEO checks passed: ${files.length} HTML pages, ${recipeCount} Recipe schemas, ${urls.length} sitemap URLs; internal targets resolved.`);
}
