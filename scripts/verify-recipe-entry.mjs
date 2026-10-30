// Isolated local development browser; all external requests are blocked.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, readdirSync, existsSync, statSync, createReadStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join, sep, extname } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[2] || 'playwright');
const before = process.argv.includes('--before');
const stage = before ? 'before' : 'after';
const dist = resolve('dist');
const output = resolve('../../outputs/recipe-entry-2026-10-30', stage);
await mkdir(output, { recursive: true });
const server = createServer((req, res) => {
  let file = resolve(dist, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (file !== dist && !file.startsWith(dist + sep)) { res.writeHead(403).end(); return; }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' })[extname(file)] || 'application/octet-stream');
  createReadStream(file).pipe(res);
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, ...(process.argv[3] && !process.argv[3].startsWith('--') ? { executablePath: process.argv[3] } : {}) });
const observations = [];
try {
  let recipePages = 0;
  if (!before) {
    for (const entry of readdirSync(join(dist, 'recettes'), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const html = readFileSync(join(dist, 'recettes', entry.name, 'index.html'), 'utf8');
      assert.match(html, /<\/h1>\s*<a[^>]*class="recipe-jump"[^>]*href="#ingredients"/);
      recipePages++;
    }
    assert.ok(recipePages > 0);
  }
  for (const width of [390, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const page = await context.newPage();
    await page.clock.install({ time: new Date('2026-10-30T12:00:00Z') });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const slug of ['feta-rotie-air-fryer', 'pommes-de-terre-grenaille-air-fryer']) {
      const response = await page.goto(`${origin}/recettes/${slug}/`, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      await page.evaluate(async () => { await document.fonts.ready; document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 0); });
      const first = page.locator('article a[href="#ingredients"]').first();
      const box = await first.boundingBox();
      const title = await page.locator('h1').innerText();
      const metrics = { slug, width, title, firstIngredientLinkY: Math.round(box.y), linkHeight: Math.round(box.height) };
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
      await page.screenshot({ path: join(output, `${slug}-${width}.png`) });
      if (!before) {
        const jump = page.locator('.recipe-jump');
        assert.equal(await jump.count(), 1);
        assert.ok(await jump.evaluate(el => el.previousElementSibling?.tagName === 'H1' && el.nextElementSibling?.classList.contains('byline')));
        assert.ok(box.height >= 44, 'Touch target is at least 44px tall');
        assert.ok(box.y + box.height <= 844, `${slug} ${width}: early access is visible in the first viewport`);
        assert.equal(await jump.evaluate(el => ['fixed', 'sticky'].includes(getComputedStyle(el).position)), false);
        assert.equal(await page.locator('.recipe-shortcuts a').count(), 4);
        await jump.focus();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Shift+Tab');
        assert.ok(await jump.evaluate(el => el === document.activeElement));
        assert.ok(await jump.evaluate(el => parseFloat(getComputedStyle(el).outlineWidth) >= 2), 'Keyboard focus remains visible');
        await page.keyboard.press('Enter');
        assert.equal(new URL(page.url()).hash, '#ingredients');
        const target = await page.locator('#ingredients').boundingBox();
        const header = await page.locator('body > header').boundingBox();
        assert.ok(target.y >= header.height - 1 && target.y <= header.height + 120, 'Ingredient heading clears the sticky site header');
        assert.equal(await page.locator('#etapes').count(), 1);
        await page.screenshot({ path: join(output, `${slug}-${width}-ingredients.png`) });
        metrics.ingredientTargetY = Math.round(target.y);
      }
      observations.push(metrics);
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  if (!before) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const page = await context.newPage();
    await page.goto(`${origin}/recettes/feta-rotie-air-fryer/`);
    await page.locator('.recipe-jump').click();
    assert.equal(new URL(page.url()).hash, '#ingredients', 'Native link works without JavaScript');
    await context.close();
  }
  await writeFile(join(output, 'verification.json'), JSON.stringify({ result: 'PASS', stage, recipePages, observations, limitations: 'Isolated Chromium only, third-party requests blocked; no physical Safari or screen-reader audit.' }, null, 2));
  console.log(JSON.stringify({ result: 'PASS', stage, recipePages, journeys: observations.length, output }));
} finally { await browser.close(); await new Promise(done => server.close(done)); }
