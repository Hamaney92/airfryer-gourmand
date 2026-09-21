import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const paths = [
  'recettes/hachis-parmentier-air-fryer',
  'dossiers/rechauffer-restes-air-fryer',
  'recettes/wrap-air-fryer',
  'recettes/croque-madame-air-fryer',
  'recettes/pizza-surgelee-air-fryer',
];
for (const path of paths) {
  test(`${path}: indexable server HTML with unchanged canonical`, () => {
    const html = readFileSync(new URL(`../dist/${path}/index.html`, import.meta.url), 'utf8');
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.ok(html.includes(`href="https://airfryergourmand.fr/${path}/"`));
    assert.ok(!/<meta[^>]*content="[^"]*noindex/i.test(html));
    assert.ok(!html.includes('temps de cuisson exact'));
    assert.ok(html.includes('2026-09-21'));
    assert.ok(html.includes('/tableau-temps-cuisson-air-fryer/'));
    const scripts = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
    assert.ok(scripts.length > 0);
    for (const match of scripts) assert.doesNotThrow(() => JSON.parse(match[1]));
  });
}
test('Croque specifies turkey throughout ingredients and steps', () => {
  const source = readFileSync(new URL('../src/content/recipes/croque-madame-air-fryer.md', import.meta.url), 'utf8');
  assert.ok(source.includes('jambon de dinde'));
  assert.ok(!/jambon(?! de dinde)/i.test(source));
});
test('Wrap explicitly excludes raw poultry from short heating method', () => {
  const source = readFileSync(new URL('../src/content/recipes/wrap-air-fryer.md', import.meta.url), 'utf8');
  assert.ok(source.includes('Ce temps ne convient pas pour cuire du poulet cru'));
});
