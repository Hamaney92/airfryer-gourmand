import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const html = path => readFileSync(new URL(`../dist/${path}/index.html`, import.meta.url), 'utf8');

test('Each recipe has one equipment section and one relevant book or collection advert', () => {
  const recipes = readdirSync(new URL('../dist/recettes/', import.meta.url), { withFileTypes: true }).filter(entry => entry.isDirectory());
  assert.ok(recipes.length > 100);
  for (const recipe of recipes) {
    const page = html(`recettes/${recipe.name}`);
    assert.equal((page.match(/id="materiel"/g) || []).length, 1, recipe.name);
    assert.equal((page.match(/class="book-offer"/g) || []).length, 1, recipe.name);
    const bookOffer = page.match(/<aside\b[^>]*class="book-offer"[^>]*>[\s\S]*?<\/aside>/)?.[0];
    assert.ok(bookOffer, recipe.name);
    const collection = bookOffer.includes('data-book-id="collection"');
    assert.equal((bookOffer.match(/data-placement="contextual_book_purchase"/g) || []).length, collection ? 0 : 1, recipe.name);
    if (collection) {
      const collectionLink = [...bookOffer.matchAll(/<a\b[^>]*>/g)].find(([tag]) => tag.includes('data-book-entry'))?.[0];
      assert.ok(collectionLink?.includes('href="/livre/"'), recipe.name);
      assert.ok(collectionLink.includes('data-book-id="collection"'), recipe.name);
      assert.ok(!bookOffer.includes('amazon.fr/'), recipe.name);
    }
    assert.ok(page.includes('Publicité'), recipe.name);
    const commercial = [...page.matchAll(/<a\b[^>]*data-placement="(?:contextual_products|chestnut_gear|contextual_book_purchase)"[^>]*>/g)];
    assert.ok(commercial.length >= (collection ? 1 : 2), recipe.name);
    for (const [tag] of commercial) {
      assert.ok(tag.includes('tag=airfryergourm-21'), recipe.name);
      assert.ok(tag.includes('rel="sponsored nofollow noopener"'), recipe.name);
      assert.ok(tag.includes('data-product-name='), recipe.name);
    }
  }
});

test('Equipment changes with preparation, including common category exceptions', () => {
  const expected = {
    'oeuf-dur-air-fryer': ['tongs'],
    'oeuf-cocotte-air-fryer': ['ramekins', 'tongs'],
    'fondant-chocolat-air-fryer': ['cake-mould', 'scale'],
    'muffin-air-fryer': ['individual-moulds', 'scale'],
    'chips-air-fryer': ['mandoline', 'oil-spray'],
    'gratin-dauphinois-air-fryer': ['baking-dish', 'storage'],
    'poulet-roti-air-fryer': ['thermometer', 'tongs'],
    'courgette-air-fryer': ['chef', 'oil-spray'],
    'wrap-air-fryer': ['tongs', 'storage'],
    'samoussa-air-fryer': ['pastry-brush', 'scale'],
    'samoussas-surgeles-air-fryer': ['tongs'],
  };
  for (const [slug, ids] of Object.entries(expected)) {
    const page = html(`recettes/${slug}`);
    const actual = [...page.matchAll(/data-product-id="([^"]+)"[^>]*data-product-type="kitchen"[^>]*data-placement="contextual_products"/g)].map(match => match[1]);
    assert.deepEqual(actual, ids, slug);
  }
  const chestnuts = html('recettes/chataigne-air-fryer');
  assert.equal((chestnuts.match(/data-placement="chestnut_gear"/g) || []).length, 3);
  assert.ok(!chestnuts.includes('GRIFEMA'));
});

test('All recipes link directly to their single optional equipment section', () => {
  const recipes = readdirSync(new URL('../dist/recettes/', import.meta.url), { withFileTypes: true }).filter(entry => entry.isDirectory());
  assert.ok(recipes.length > 100);
  for (const recipe of recipes) {
    const page = html(`recettes/${recipe.name}`);
    const shortcuts = page.match(/<nav\b[^>]*class="recipe-shortcuts"[^>]*>[\s\S]*?<\/nav>/)?.[0];
    assert.match(shortcuts || '', /href="#materiel"/, recipe.name);
    assert.equal((page.match(/id="materiel"/g) || []).length, 1, recipe.name);
    assert.match(shortcuts || '', /facultatif/, recipe.name);
  }
});

test('The documented thermometer opens its verified ASIN, while an explicit search fallback remains', () => {
  const sources = JSON.parse(readFileSync(new URL('../docs/affiliate-references-2026-10-26.json', import.meta.url), 'utf8'));
  const reference = sources.references.find(item => item.offerId === 'thermometer');
  for (const path of ['recettes/poulet-roti-air-fryer', 'recettes/saumon-air-fryer', 'categorie/viandes']) {
    const page = html(path);
    const offer = [...page.matchAll(/<section\b[^>]*class="product-card"[^>]*>[\s\S]*?<\/section>/g)].map(match => match[0]).find(section => section.includes('data-product-id="thermometer"'));
    assert.ok(offer, path);
    assert.ok(offer.includes(reference.manufacturerUrl), path);
    assert.ok(offer.includes(reference.name), path);
    const primary = offer.match(/<a\b[^>]*data-placement="contextual_products"[^>]*>/)?.[0];
    assert.ok(primary?.includes(`/dp/${reference.asin}/?tag=airfryergourm-21`), path);
    assert.ok(primary.includes(`data-product-asin="${reference.asin}"`), path);
    const fallback = offer.match(/<a\b[^>]*data-placement="contextual_products_alternatives"[^>]*>/)?.[0];
    assert.ok(fallback?.includes('/s?k='), path);
    assert.ok(!fallback.includes('data-product-asin='), path);
    assert.ok(!offer.includes('10,99'), 'No stale merchant price embedded');
    assert.ok(page.includes('sans test produit'), path);
  }
  const frozen = html('recettes/samoussas-surgeles-air-fryer');
  assert.ok(!frozen.includes(`data-product-asin="${reference.asin}"`), 'Do not recommend the thermometer on unrelated frozen samoussas');
});

test('Book offers preserve contextual anti-waste and small portions without forcing either on larger recipes', () => {
  const expected = {
    'chataigne-air-fryer': 'anti-gaspi',
    'wrap-air-fryer': 'anti-gaspi',
    'blanc-de-poulet-air-fryer': 'petites-portions',
    'chipolata-air-fryer': 'collection',
    'nems-surgeles-air-fryer': 'collection',
    'samoussa-air-fryer': 'collection',
    'samoussas-surgeles-air-fryer': 'collection',
  };
  for (const [slug, kind] of Object.entries(expected)) {
    const offer = html(`recettes/${slug}`).match(/<aside\b[^>]*class="book-offer"[^>]*>[\s\S]*?<\/aside>/)?.[0];
    assert.ok(offer?.includes(`data-book-id="${kind}"`), slug);
  }
  const generic = html('guides/accessoires-air-fryer').match(/<aside\b[^>]*class="book-offer"[^>]*>[\s\S]*?<\/aside>/)?.[0];
  assert.ok(generic?.includes('data-book-id="collection"'));
});

test('Editorial pages show relevant books while legal pages and book catalogue avoid extra adverts', () => {
  for (const path of ['guides/accessoires-air-fryer', 'dossiers/batch-cooking-air-fryer', 'categorie/legumes', 'temps-de-cuisson']) {
    assert.equal((html(path).match(/class="book-offer"/g) || []).length, 1, path);
  }
  assert.ok(html('dossiers/batch-cooking-air-fryer').includes('data-book-id="anti-gaspi"'));
  for (const path of ['confidentialite', 'mentions-legales', 'contact', 'livre']) {
    assert.ok(!html(path).includes('class="book-offer"'), path);
    assert.ok(!html(path).includes('class="context-products"'), path);
  }
});
