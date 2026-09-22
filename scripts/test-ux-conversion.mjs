import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { matchesRecipe, normalizeSearch } from '../src/lib/recipe-search.mjs';
const recipe = { search:'Œufs cocotte aux épinards 2 œufs', category:'oeufs', minutes:'14', servings:'2' };
const filters = { query:'', category:'', duration:'', portions:'' };
test('Search accepts accents, ligatures, punctuation and empty query', () => {
  assert.equal(normalizeSearch(' ŒUFS, Épinards ! '), 'oeufs epinards');
  for (const query of ['', 'oeuf', 'œuf', 'epinard', 'oeuf epinards']) assert.ok(matchesRecipe(recipe, {...filters,query}));
  assert.ok(!matchesRecipe(recipe, {...filters,query:'poulet'}));
  assert.ok(!matchesRecipe({...recipe,search:'Rôti de bœuf'}, {...filters,query:'oeuf'}));
});
test('Filters intersect: total time, category and original servings', () => {
  assert.ok(matchesRecipe(recipe, {...filters,category:'oeufs',duration:'15',portions:'2'}));
  for (const override of [{duration:'10'},{category:'volaille'},{portions:'3'}]) assert.ok(!matchesRecipe(recipe, {...filters,...override}));
  assert.ok(matchesRecipe({...recipe, minutes:15}, {...filters,duration:'15'}));
});
const html = path => readFileSync(new URL(`../dist/${path}/index.html`,import.meta.url),'utf8');
test('All recipes remain linked in server HTML without JavaScript', () => {
  const listing=html('recettes');
  assert.ok(listing.includes('data-recipe-result'));
  assert.ok(listing.includes('data-search='));
  assert.ok(!/class="recipe-result"[^>]*\bhidden\b/.test(listing));
  assert.ok(listing.includes('https://airfryergourmand.fr/recettes/'));
  assert.ok(listing.includes('id="recipe-filters"'));
});
test('Automatic popups removed; newsletter routes to dedicated consent form', () => {
  for (const path of ['recettes/chataigne-air-fryer','tableau-temps-cuisson-air-fryer']) {
    const page=html(path);
    assert.ok(!page.includes('id="pdfpop"'));
    assert.ok(!page.includes('afg_pdfpop_vu'));
    assert.ok(page.includes('data-newsletter-signup'));
    assert.ok(page.includes('https://preview.mailerlite.io/forms/2516614/199341135344174725/share'));
    assert.ok(!page.includes('194538633598863135/subscribe'));
    assert.ok(!page.includes('name="fields[email]"'));
    assert.ok(!page.includes('class="books-banner"'));
  }
  assert.ok(html('recettes/chataigne-air-fryer').includes('mailto:'));
  assert.ok(html('tableau-temps-cuisson-air-fryer').includes('download'));
});
test('Preview contains real lightweight pages and contextual book links remain', () => {
  const page=html('livre');
  for (const name of ['sommaire','mode-emploi','flan-photo','flan-recette']) {
    const asset=`img/books/previews/seniors-${name}.webp`;
    assert.ok(page.includes(asset));
    assert.ok(existsSync(new URL(`../public/${asset}`,import.meta.url)));
  }
  assert.ok(html('recettes/wrap-air-fryer').includes('data-book-id="anti-gaspi"'));
  assert.ok(html('recettes/saumon-air-fryer').includes('data-book-id="petites-portions"'));
  assert.ok(html('livres/air-fryer-anti-gaspi').includes('data-product-type="book"'));
});

test('Anti-Gaspi matches the verified 214-page edition and offers four real previews', () => {
  const page=html('livres/air-fryer-anti-gaspi');
  for (const path of ['livre','livres/air-fryer-anti-gaspi']) {
    assert.match(html(path), /"numberOfPages":214/);
    assert.doesNotMatch(html(path), /"numberOfPages":114|114 pages/);
  }
  assert.doesNotMatch(page, /22,90|22\.90/);
  assert.match(page, /id="apercu-anti-gaspi"/);
  assert.equal((page.match(/data-book-preview="anti-gaspi"/g)||[]).length,4);
  for (const name of ['sommaire','chapitre','croutons-photo','croutons-recette']) {
    const asset=`img/books/previews/anti-gaspi-${name}.webp`;
    assert.ok(page.includes(asset));
    assert.ok(existsSync(new URL(`../public/${asset}`,import.meta.url)));
  }
});
