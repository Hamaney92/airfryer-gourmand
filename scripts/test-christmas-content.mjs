import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const routes = ['/dossiers/menu-noel-air-fryer/', '/guides/cadeaux-cuisine-noel/', '/dossiers/apero-de-noel-air-fryer/'];
for (const route of routes) {
  const html = fs.readFileSync(path.join('dist', route, 'index.html'), 'utf8');
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${route}: one H1`);
  assert.ok(html.includes(`https://airfryergourmand.fr${route}`), `${route}: canonical`);
  assert.ok(!/<meta[^>]+name="robots"[^>]+noindex/i.test(html), `${route}: indexable`);
  for (const [, target] of html.matchAll(/(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)) {
    if (target === '/' || target.startsWith('//')) continue;
    const file = target.endsWith('/') ? `${target}index.html` : target;
    assert.ok(fs.existsSync(path.join('dist', file)), `${route}: missing ${target}`);
    if (target.startsWith('/recettes/') && target !== '/recettes/') {
      const slug = target.split('/').filter(Boolean).at(-1);
      const source = fs.readFileSync(`src/content/recipes/${slug}.md`, 'utf8');
      const date = source.match(/^pubDate:\s*(\d{4}-\d{2}-\d{2})/m)?.[1];
      assert.ok(date && date <= '2026-10-28', `${route}: unpublished ${slug}`);
    }
  }
  for (const [, json] of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) JSON.parse(json);
  assert.ok(fs.readFileSync('dist/sitemap.xml', 'utf8').includes(route), `${route}: sitemap`);
}
const gifts = fs.readFileSync('dist/guides/cadeaux-cuisine-noel/index.html', 'utf8');
assert.equal((gifts.match(/data-placement="christmas_gift_guide"[^>]*data-product-id=/g) || []).length, 7, 'Seven tracked equipment comparison links');
assert.ok(gifts.includes('airfryergourm-21'), 'Existing affiliate tag');
assert.ok(gifts.includes('sponsored nofollow noopener'), 'Affiliate disclosure markup');
assert.ok(gifts.includes('Feuilleter nos deux livres'), 'Book CTA');
const apero = fs.readFileSync('dist/dossiers/apero-de-noel-air-fryer/index.html', 'utf8');
assert.ok(!apero.includes('14 bouchées'), 'No inflated count');
assert.ok(!apero.includes('organisation testée en famille'), 'No unsupported personal test claim');
console.log('Noël : H1, canonicals, JSON-LD, sitemap, assets, published recipe links, affiliate tracking and book CTA verified.');
