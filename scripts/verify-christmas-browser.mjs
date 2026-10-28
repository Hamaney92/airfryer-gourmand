// Only local isolated browser contexts; no account or third-party access.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[3] || 'playwright');
const origin = new URL(process.argv[2] || 'http://127.0.0.1:4327');
assert.ok(['127.0.0.1', 'localhost'].includes(origin.hostname));
const browser = await chromium.launch({ headless: true, ...(process.argv[4] ? { executablePath: process.argv[4] } : {}) });
const output = resolve('../../outputs/noel-2026');
await mkdir(output, { recursive: true });
let checks = 0;
try {
  for (const width of [375, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin.origin ? route.continue() : route.abort());
    await context.addInitScript(() => sessionStorage.setItem('afg_newsletter_intro_v1', '1'));
    const page = await context.newPage();
    await page.clock.install({ time: new Date('2026-12-10T12:00:00Z') });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const [name, path] of [['accueil', '/'], ['guide', '/guides/'], ['recette', '/recettes/feta-rotie-air-fryer/'], ['menu-noel', '/dossiers/menu-noel-air-fryer/']]) {
      await page.goto(new URL(path, origin).href);
      assert.ok(await page.locator('.christmas-welcome').isVisible());
      assert.equal(await page.locator('h1').count(), 1);
      if (name === 'menu-noel') assert.equal(await page.locator('.seasonal-hero').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(23, 62, 50)');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width} ${path}: overflow`);
      const button = page.locator('.christmas-snow-toggle');
      await button.click();
      assert.equal(await button.getAttribute('aria-pressed'), 'false');
      assert.equal(await page.locator('.christmas-snow').isVisible(), false);
      await page.reload();
      assert.equal(await button.getAttribute('aria-pressed'), 'false');
      await button.click();
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      const flake = page.locator('.christmas-snow span').first();
      const before = await flake.evaluate(el => el.getBoundingClientRect().top);
      await page.waitForTimeout(200);
      const after = await flake.evaluate(el => el.getBoundingClientRect().top);
      assert.ok(Math.abs(after - before) > 1, `${path}: snow really moves`);
      assert.equal(await flake.textContent(), '❄︎');
      await page.screenshot({ path: resolve(output, `${name}-${width}.png`) });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await page.locator('.christmas-snow').isVisible(), true, 'Explicit user choice is retained');
      await page.evaluate(() => sessionStorage.removeItem('afg_christmas_snow'));
      await page.reload();
      assert.equal(await page.locator('.christmas-snow').isVisible(), false);
      assert.equal(await button.isVisible(), true, 'The user can still find the control');
      assert.equal(await button.getAttribute('aria-pressed'), 'false');
      assert.equal(await page.locator('#christmas-motion-note').isVisible(), true);
      await button.click();
      assert.equal(await page.locator('.christmas-snow').isVisible(), true, 'User can explicitly opt in');
      await button.click();
      assert.equal(await page.locator('.christmas-snow').isVisible(), false, 'User can stop snow again');
      await page.evaluate(() => sessionStorage.removeItem('afg_christmas_snow'));
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      checks++;
    }
    await page.locator('.christmas-links a').first().click();
    assert.equal(new URL(page.url()).pathname, '/dossiers/apero-de-noel-air-fryer/');
    assert.deepEqual(errors, []);
    await context.close();
  }
  const context = await browser.newContext();
  await context.route('**/*', route => new URL(route.request().url()).origin === origin.origin ? route.continue() : route.abort());
  const page = await context.newPage();
  await page.clock.install({ time: new Date('2026-10-27T22:59:00Z') });
  for (const [date, active] of [
    ['2026-10-27T22:59:00Z', false], ['2026-10-27T23:01:00Z', true],
    ['2027-01-05T22:59:00Z', true], ['2027-01-05T23:01:00Z', false],
  ]) {
    await page.clock.setFixedTime(new Date(date));
    await page.goto(origin.href);
    assert.equal(await page.locator('.christmas-welcome').isVisible(), active, date);
    assert.equal(await page.locator('html').getAttribute('data-season'), active ? 'christmas' : null);
    checks++;
  }
  await context.close();
  console.log(JSON.stringify({ result: 'PASS', checks, widths: [375, 768, 1440], screenshots: output }));
} finally { await browser.close(); }
