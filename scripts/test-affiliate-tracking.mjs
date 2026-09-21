import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../src/components/AffiliateTracking.astro', import.meta.url), 'utf8');
const script = source.match(/<script is:inline>([\s\S]*?)<\/script>/)[1];

function setup(hasAnalytics = true) {
  const events = [];
  const listeners = [];
  class Element {
    constructor(matches = {}) { this.matches = matches; }
    closest(selector) { return this.matches[selector] || null; }
  }
  class Anchor extends Element {
    constructor(href, dataset = {}) {
      super(); this.href = href; this.dataset = dataset; this.textContent = 'Produit';
    }
  }
  const window = {
    location: { href: 'https://airfryergourmand.fr/tableau-temps-cuisson-air-fryer/', origin: 'https://airfryergourmand.fr', pathname: '/tableau-temps-cuisson-air-fryer/' },
    ...(hasAnalytics ? { gtag: (...args) => events.push(args) } : {}),
  };
  const context = vm.createContext({ window, document: { body: { dataset: {} }, addEventListener: (name, fn) => listeners.push(fn) }, Element, HTMLAnchorElement: Anchor, URL });
  vm.runInContext(script, context);
  return { events, listeners, Element, Anchor, context, click: (matches) => listeners[0]({ target: new Element(matches) }) };
}

test('PDF click is measured once without sending query parameters', () => {
  const s = setup();
  s.click({ 'a[download]': new s.Anchor('https://airfryergourmand.fr/tableau-temps-cuisson-air-fryer.pdf?example=private') });
  assert.equal(s.events.length, 1);
  assert.equal(s.events[0][1], 'cooking_pdf_download');
  assert.equal(s.events[0][2].file_name, 'tableau-temps-cuisson-air-fryer.pdf');
  assert.ok(!JSON.stringify(s.events).includes('private'));
});
test('External PDF and unrelated downloads are ignored', () => {
  const s = setup();
  for (const href of ['https://other.example/tableau-temps-cuisson-air-fryer.pdf', 'https://airfryergourmand.fr/other.pdf']) s.click({ 'a[download]': new s.Anchor(href) });
  assert.equal(s.events.length, 0);
});
test('Book purchase retains affiliate and book events', () => {
  const s = setup();
  s.click({ 'a[data-affiliate-network], a[href*="amazon.fr/"]': new s.Anchor('https://www.amazon.fr/dp/example', { productType: 'book', affiliateNetwork: 'amazon' }) });
  assert.deepEqual(s.events.map(e => e[1]), ['affiliate_click', 'book_cta_click']);
});
test('Internal books CTA preserves its placement', () => {
  const s = setup();
  s.click({ 'a[data-book-entry], a[href="/livre/"], a[href$="/livre/"]': new s.Anchor('https://airfryergourmand.fr/livre/', { placement: 'cooking_table_after_content' }) });
  assert.equal(s.events[0][1], 'book_page_entry_click');
  assert.equal(s.events[0][2].placement, 'cooking_table_after_content');
});
test('Missing Analytics never interrupts a click', () => {
  const s = setup(false);
  assert.doesNotThrow(() => s.click({ 'a[download]': new s.Anchor('https://airfryergourmand.fr/tableau-temps-cuisson-air-fryer.pdf') }));
});
test('Repeated script initialization does not duplicate listeners', () => {
  const s = setup();
  vm.runInContext(script, s.context);
  assert.equal(s.listeners.length, 1);
});
