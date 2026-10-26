// Isolated local browser only: no account access, external requests or purchase.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[3] || 'playwright');
const origin = new URL(process.argv[2] || 'http://127.0.0.1:4327');
assert.ok(['127.0.0.1', 'localhost'].includes(origin.hostname), 'Local tests only');
const browser = await chromium.launch({ headless: true, ...(process.argv[4] ? { executablePath: process.argv[4] } : {}) });
let checks = 0;
try {
  for (const width of [390, 768, 1366]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin.origin ? route.continue() : route.abort());
    const page = await context.newPage();
    // Disable automatic invitation in this isolated session, not production behaviour.
    await page.addInitScript(() => sessionStorage.setItem('afg_newsletter_intro_v1', '1'));
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const path of ['/dossiers/recettes-air-fryer-automne/', '/recettes/frites-maison-air-fryer/']) {
      await page.goto(new URL(path, origin).href);
      const button = page.locator('header button');
      const nav = page.locator('header nav');
      const books = nav.locator('a[href="/livre/"]');
      if (width <= 860) {
        assert.equal(await nav.isVisible(), false, `${path}: menu initially closed`);
        await button.click();
        await books.waitFor({ state: 'visible', timeout: 2000 });
        assert.equal(await button.getAttribute('aria-expanded'), 'true');
        await books.focus();
        await page.keyboard.press('Escape');
        assert.equal(await nav.isVisible(), false);
        assert.equal(await button.getAttribute('aria-expanded'), 'false');
        assert.equal(await button.evaluate(el => el === document.activeElement), true);
        await button.click();
        await page.setViewportSize({ width: 1366, height: 900 });
        await page.waitForFunction(() => document.querySelector('header button').getAttribute('aria-expanded') === 'false');
        assert.equal(await books.isVisible(), true);
        await page.setViewportSize({ width, height: 900 });
        assert.equal(await nav.isVisible(), false);
        await button.click();
      } else {
        assert.equal(await button.isVisible(), false);
        assert.equal(await books.isVisible(), true);
      }
      await books.click();
      await page.waitForURL(new URL('/livre/', origin).href);
      assert.ok(await page.locator('[data-placement="collection_card"]').count() === 2);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      checks++;
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log(JSON.stringify({ result: 'PASS', navigationJourneys: checks, widths: [390, 768, 1366], externalRequests: 'blocked' }));
} finally { await browser.close(); }
