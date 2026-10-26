import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';

test('Both layouts use the same accessible mobile navigation and book-entry metadata', () => {
  for (const path of ['dossiers/recettes-air-fryer-automne', 'recettes/frites-maison-air-fryer', 'livre']) {
    const html = readFileSync(new URL(`../dist/${path}/index.html`, import.meta.url), 'utf8');
    const header = html.match(/<header[\s>][\s\S]*?<\/header>/)?.[0];
    assert.ok(header, path);
    assert.equal((header.match(/id="primary-navigation"/g) || []).length, 1, path);
    assert.match(header, /aria-controls="primary-navigation"/, path);
    assert.match(header, /aria-expanded="false"/, path);
    const link = header.match(/<a\s[^>]*href="\/livre\/"[^>]*>/)?.[0];
    assert.ok(link, path);
    assert.match(link, /data-book-entry/, path);
    assert.match(link, /data-placement="header"/, path);
  }
  for (const layout of ['Base', 'Layout']) {
    const source = readFileSync(new URL(`../src/layouts/${layout}.astro`, import.meta.url), 'utf8');
    assert.match(source, /import \{ initSiteNavigation \} from '\.\.\/lib\/site-navigation\.mjs'/);
    assert.equal((source.match(/initSiteNavigation\(\)/g) || []).length, 1);
  }
});
