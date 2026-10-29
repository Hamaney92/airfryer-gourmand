import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[3] || 'playwright');
const origin = process.argv[2] || 'http://127.0.0.1:4331';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(origin).hostname));
const browser = await chromium.launch({ headless: true, executablePath: process.argv[4] });
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.clock.install({ time: new Date('2026-12-10T12:00:00Z') });
    await page.goto(origin + '/recettes/feta-rotie-air-fryer/');
    const sleigh = page.locator('.christmas-sleigh');
    assert.equal(await sleigh.isVisible(), false);
    await page.clock.runFor(9000);
    assert.equal(await sleigh.isVisible(), false, 'No early arrival');
    await page.clock.runFor(1100);
    assert.equal(await sleigh.isVisible(), true, 'Arrival after 10 seconds');
    assert.equal(await sleigh.evaluate(el => getComputedStyle(el).pointerEvents), 'none');
    assert.equal(await sleigh.evaluate(el => getComputedStyle(el).animationDuration), '6s');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.clock.runFor(6100);
    assert.equal(await sleigh.isVisible(), false);
    assert.equal(await page.locator('html').getAttribute('data-christmas-arrival'), 'fading');
    assert.equal(await page.locator('.christmas-snow').evaluate(el => getComputedStyle(el).transitionDuration), '5s');
    await page.clock.runFor(5500);
    assert.equal(await page.locator('.christmas-snow').isVisible(), false);
    await page.locator('.christmas-snow-toggle').click();
    assert.equal(await page.locator('.christmas-snow').isVisible(), true, 'Replay');
    await page.clock.runFor(10100);
    assert.equal(await sleigh.isVisible(), true);
    await page.locator('.christmas-snow-toggle').click();
    assert.equal(await sleigh.isVisible(), false, 'Stop cancels Santa too');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await page.clock.runFor(22000);
    assert.equal(await sleigh.isVisible(), false, 'Reduced motion defaults to no animation');
    assert.equal(await page.locator('.christmas-snow').isVisible(), false);
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('PASS: arrival, fade, disappearance, replay, stop, reduced motion; mobile + desktop');
} finally { await browser.close(); }
