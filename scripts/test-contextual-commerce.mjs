import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const html = path => readFileSync(new URL(`../dist/${path}/index.html`, import.meta.url), 'utf8');

test('Each published recipe has one equipment section and one book advert with a purchase link', () => {
  const recipes = readdirSync(new URL('../dist/recettes/', import.meta.url), { withFileTypes: true }).filter(entry => entry.isDirectory());
  assert.ok(recipes.length > 100);
  for (const recipe of recipes) {
    const page = html(`recettes/${recipe.name}`);
    assert.equal((page.match(/id="materiel"/g) || []).length, 1, recipe.name);
    assert.equal((page.match(/class="book-offer"/g) || []).length, 1, recipe.name);
    assert.equal((page.match(/data-placement="contextual_book_purchase"/g) || []).length, 1, recipe.name);
    assert.ok(page.includes('Publicité'), recipe.name);
    const commercial = [...page.matchAll(/<a\b[^>]*data-placement="(?:contextual_products|chestnut_gear|contextual_book_purchase)"[^>]*>/g)];
    assert.ok(commercial.length >= 2, recipe.name);
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
  };
  for (const [slug, ids] of Object.entries(expected)) {
    const page = html(`recettes/${slug}`);
    const actual = [...page.matchAll(/data-product-id="([^"]+)"[^>]*data-product-type="kitchen"/g)].map(match => match[1]);
    assert.deepEqual(actual, ids, slug);
  }
  const chestnuts = html('recettes/chataigne-air-fryer');
  assert.equal((chestnuts.match(/data-placement="chestnut_gear"/g) || []).length, 3);
  assert.ok(!chestnuts.includes('GRIFEMA'));
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
