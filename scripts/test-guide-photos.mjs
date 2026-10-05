import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import sharp from 'sharp';
test('Guide cards and cooking tool use six optimized responsive photographs, not placeholders', async () => {
  const page = readFileSync(new URL('../dist/guides/index.html',import.meta.url),'utf8');
  for (const name of ['choisir','double-panier','familial','accessoires','marques','temps-cuisson']) {
    for (const width of name === 'temps-cuisson' ? [600,1000] : [360,720]) {
      const path = `img/guides/${name}-photo-${width}.webp`;
      assert.ok(page.includes(path));
      const file = new URL(`../public/${path}`,import.meta.url);
      assert.ok(statSync(file).size < 65000);
      const info = await sharp(file.pathname.replace(/^\/(\w:)/,'$1')).metadata();
      assert.equal(info.width,width);
      assert.ok(Math.abs(info.height-width*9/16)<1);
      assert.equal(info.format,'webp');
    }
  }
  assert.ok(!page.includes('Aperçu de l\'outil'));
  assert.ok(!/img\/guides\/[^" ]+\.svg/.test(page));
  assert.ok(page.includes('Visuels d’illustration générés par IA'));
});
