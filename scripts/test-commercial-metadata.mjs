import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const root = new URL('../dist/', import.meta.url);
const pages = readdirSync(root, { recursive: true }).filter(path => path.endsWith('.html'));
const books = { B0HCSM8ZMD: 'petites-portions', B0HHZM8TYR: 'anti-gaspi' };
const attributes = tag => Object.fromEntries(
  [...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value.replaceAll('&amp;', '&')])
);
const html = path => readFileSync(new URL(`${path}index.html`, root), 'utf8');

test('Every generated Amazon book CTA identifies the same book, ASIN and affiliate destination', () => {
  assert.ok(pages.length > 100, 'Requires a complete site build');
  let checked = 0;
  let recipeCtas = 0;
  const found = new Set();
  for (const path of pages) {
    const page = readFileSync(new URL(path.replaceAll('\\', '/'), root), 'utf8');
    for (const tag of page.match(/<a\b[^>]*>/g) || []) {
      const data = attributes(tag);
      const destinationAsin = data.href?.match(/amazon\.fr\/dp\/([A-Z0-9]+)/)?.[1];
      if (data['data-product-type'] !== 'book' && !books[destinationAsin]) continue;
      checked++;
      if (/^recettes[\\/]/.test(path)) recipeCtas++;
      const context = `${path}: ${data['data-placement'] || data.href}`;
      const asin = data['data-product-asin'];
      assert.ok(books[asin], `${context}: known ASIN`);
      assert.equal(destinationAsin, asin, `${context}: destination matches the declared book`);
      assert.equal(data['data-book-id'], books[asin], `${context}: book ID`);
      assert.equal(data['data-product-id'], books[asin], `${context}: product ID`);
      assert.equal(data['data-affiliate-network'], 'amazon', context);
      assert.ok(data['data-placement'], `${context}: attributable placement`);
      const url = new URL(data.href);
      assert.equal(url.hostname, 'www.amazon.fr', context);
      assert.equal(url.searchParams.get('tag'), 'airfryergourm-21', context);
      for (const rel of ['sponsored', 'nofollow', 'noopener'])
        assert.ok(data.rel?.split(/\s+/).includes(rel), `${context}: ${rel}`);
      found.add(books[asin]);
    }
  }
  assert.ok(checked > 0, 'At least one Amazon book CTA exists');
  assert.ok(recipeCtas > 0, 'Check recipe CTAs as well as book pages');
  assert.deepEqual([...found].sort(), ['anti-gaspi', 'petites-portions']);
});

test('Book landing pages use canonical pathnames for explicit commercial page identifiers', () => {
  for (const path of ['livre/', 'livres/air-fryer-anti-gaspi/']) {
    const page = html(path);
    const canonical = page.match(/<link\b[^>]*rel="canonical"[^>]*>/)?.[0];
    assert.equal(new URL(attributes(canonical || '').href).pathname, `/${path}`);
    for (const tag of page.match(/<a\b[^>]*data-product-type="book"[^>]*>/g) || []) {
      const data = attributes(tag);
      if (data['data-page-id']) assert.equal(data['data-page-id'], `/${path}`);
    }
  }
});

test('Catalog preview shortcuts resolve to the correct existing book preview', () => {
  const catalog = html('livre/');
  assert.match(catalog, /href="#apercu-petites-portions"/);
  assert.match(catalog, /id="apercu-petites-portions"/);
  assert.match(catalog, /href="\/livres\/air-fryer-anti-gaspi\/#apercu-anti-gaspi"/);
  assert.match(html('livres/air-fryer-anti-gaspi/'), /id="apercu-anti-gaspi"/);
});
