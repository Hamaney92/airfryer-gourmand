// Isolated local browser: reproduce the title panel covering content on scroll.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[3] || 'playwright');
const origin = new URL(process.argv[2] || 'http://127.0.0.1:4327');
assert.ok(['localhost', '127.0.0.1'].includes(origin.hostname));
const output = resolve('../../outputs/seasonal-scroll-2026-10-28');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.argv[4] ? { executablePath: process.argv[4] } : {}) });
let checks = 0;
try {
  for (const width of [390, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin.origin ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const [name, path] of [['menu', '/dossiers/menu-noel-air-fryer/'], ['cadeaux', '/guides/cadeaux-cuisine-noel/']]) {
      const response = await page.goto(new URL(path, origin).href);
      assert.equal(response.status(), 200);
      const panel = page.locator('.seasonal-hero');
      const initial = await panel.boundingBox();
      const distance = initial.y + initial.height + 240;
      await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), distance);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const after = await panel.boundingBox();
      assert.ok(after.y + after.height < 0, `${path} at ${width}: title must leave the viewport, not cover the article`);
      const menu = page.locator('body > header');
      const menuBox = await menu.boundingBox();
      assert.ok(Math.abs(menuBox.y) < 1, 'Main navigation remains at the top');
      assert.ok(menuBox.height <= 80, 'Only the compact navigation remains fixed');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
      await page.screenshot({ path: resolve(output, `${name}-${width}-scrolled.png`) });
      checks++;
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log(JSON.stringify({ result: 'PASS', scrollJourneys: checks, widths: [390, 768, 1440], output }));
} finally { await browser.close(); }
