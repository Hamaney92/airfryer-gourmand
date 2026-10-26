// Isolated local-browser smoke test. Never opens Amazon or sends production analytics.
// Usage: node scripts/verify-conversion-browser.mjs http://127.0.0.1:4327 [playwright-directory] [chrome-executable]
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[3] || 'playwright');
const origin = new URL(process.argv[2] || 'http://127.0.0.1:4327');
assert.ok(['127.0.0.1', 'localhost'].includes(origin.hostname), 'Local tests only');
const browser = await chromium.launch({ headless: true, ...(process.argv[4] ? { executablePath: process.argv[4] } : {}) });
await mkdir(new URL('../tmp/', import.meta.url), { recursive: true });
let checks = 0;
try {
  for (const viewport of [{ width: 1366, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin.origin ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const [path, book, asin] of [
      ['/livre/', 'petites-portions', 'B0HCSM8ZMD'],
      ['/livres/air-fryer-anti-gaspi/', 'anti-gaspi', 'B0HHZM8TYR'],
    ]) {
      await page.goto(new URL(path, origin).href);
      const link = page.locator(`a[data-book-preview="${book}"]`).first();
      await link.click();
      const dialog = page.locator('[data-book-preview-dialog]');
      await dialog.waitFor({ state: 'visible' });
      assert.equal(await dialog.evaluate(el => el.open), true);
      await page.waitForFunction(() => { const image = document.querySelector('dialog[open] [data-preview-image]'); return image?.complete && image.naturalWidth > 0; });
      assert.match(await dialog.locator('[data-preview-caption]').innerText(), /^1 \/ 4/);
      await dialog.locator('[data-preview-next]').click();
      assert.match(await dialog.locator('[data-preview-caption]').innerText(), /^2 \/ 4/);
      const purchase = dialog.locator('[data-affiliate-network="amazon"]');
      const url = new URL(await purchase.getAttribute('href'));
      assert.equal(url.pathname.replace(/\/$/, ''), `/dp/${asin}`);
      assert.equal(url.searchParams.get('tag'), 'airfryergourm-21');
      assert.equal(await purchase.getAttribute('data-book-id'), book);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: new URL(`../tmp/preview-${book}-${viewport.width}.png`, import.meta.url).pathname.replace(/^\/([A-Z]:)/i, '$1'), fullPage: false });
      await page.keyboard.press('Escape');
      assert.equal(await dialog.evaluate(el => el.open), false);
      assert.equal(await link.evaluate(el => el === document.activeElement), true);
      checks++;
    }
    await page.goto(new URL('/recettes/samoussas-surgeles-air-fryer/', origin).href);
    assert.deepEqual(await page.locator('#materiel [data-product-id]').evaluateAll(links => links.map(link => link.dataset.productId)), ['tongs']);
    assert.equal(await page.locator('.book-offer [data-book-id="collection"]').count(), 1);
    assert.equal(await page.locator('.book-offer [data-affiliate-network]').count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    checks++;
    await context.close();
  }
  console.log(JSON.stringify({ localBrowserChecks: checks, viewports: ['desktop', 'mobile'], externalRequests: 'blocked', result: 'PASS' }));
} finally {
  await browser.close();
}
