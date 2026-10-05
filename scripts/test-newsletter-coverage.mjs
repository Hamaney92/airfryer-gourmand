import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const root = new URL('../dist/', import.meta.url);
const pages = readdirSync(root, { recursive: true }).filter(path => path.endsWith('.html'));

test('Every generated newsletter banner has exactly one conversion tracker', () => {
  let checked = 0;
  const missing = [];
  for (const path of pages) {
    const page = readFileSync(new URL(path.replaceAll('\\', '/'), root), 'utf8');
    if (!page.includes('class="newsletter-banner"')) continue;
    checked++;
    const initializations = (page.match(/window\.__afgConversionTracking = true/g) || []).length;
    if (initializations !== 1) missing.push(`${path}: ${initializations}`);
  }
  assert.ok(checked > 100, 'Check the complete built site, not an empty or partial build');
  assert.deepEqual(missing, [], 'Missing or duplicate tracking on newsletter pages');
});

test('Both layouts attribute footer newsletter clicks separately from banners', () => {
  for (const path of ['dossiers/recettes-air-fryer-automne/', 'recettes/saumon-air-fryer/', 'livre/']) {
    const page = readFileSync(new URL(`${path}index.html`, root), 'utf8');
    const footer = page.match(/<footer\b[\s\S]*?<\/footer>/)[0];
    const link = footer.match(/<a\b[^>]*>Newsletter recettes et offres<\/a>/)[0];
    assert.match(link, /data-newsletter-signup(?:\s|=|>)/, path);
    assert.match(link, /data-lead-source="footer_[^"]+"/, path);
    assert.match(link, /href="\/newsletter\/"/, path);
  }
});
test('Recipe and editorial newsletter links share one on-site dialog and legal pages have no automatic invitation',()=>{
  for(const path of ['recettes/feta-rotie-air-fryer/','guides/','livre/']) {
    const page=readFileSync(new URL(`${path}index.html`,root),'utf8');
    assert.equal((page.match(/<dialog[^>]*data-newsletter-dialog/g)||[]).length,1,path);
    assert.ok(!/<a[^>]*href="https:\/\/preview\.mailerlite/.test(page),path);
  }
  const legal=readFileSync(new URL('confidentialite/index.html',root),'utf8');
  assert.ok(!/<dialog[^>]*data-auto-newsletter/.test(legal));
});
