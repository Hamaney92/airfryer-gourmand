import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../src/components/AffiliateTracking.astro', import.meta.url), 'utf8');
const script = source.match(/<script is:inline>([\s\S]*?)<\/script>/)[1];

function setup(hasAnalytics = true, hostname = 'airfryergourmand.fr') {
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
    location: { hostname, href: 'https://airfryergourmand.fr/tableau-temps-cuisson-air-fryer/', origin: 'https://airfryergourmand.fr', pathname: '/tableau-temps-cuisson-air-fryer/' },
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
  s.click({ 'a[data-affiliate-network], a[href*="amazon.fr/"]': new s.Anchor('https://www.amazon.fr/dp/B0HHZM8TYR/', { productType: 'book', affiliateNetwork: 'amazon' }) });
  assert.deepEqual(s.events.map(e => e[1]), ['affiliate_click', 'book_cta_click']);
  assert.ok(s.events.every(e => e[2].link_destination === 'amazon_product'));
});

test('Amazon searches are qualified from the destination, not product metadata', () => {
  for (const href of ['https://www.amazon.fr/s?k=pince&tag=airfryergourm-21', 'https://amazon.fr/s/?k=moule']) {
    const s = setup();
    s.click({ 'a[data-affiliate-network], a[href*="amazon.fr/"]': new s.Anchor(href, { productAsin: 'B0HHZM8TYR' }) });
    assert.equal(s.events.length, 1);
    assert.equal(s.events[0][1], 'affiliate_click');
    assert.equal(s.events[0][2].link_destination, 'amazon_search');
    assert.equal(s.events[0][2].affiliate_network, 'amazon');
    assert.equal(s.events[0][2].link_url, href);
  }
});

test('Direct product routes require an ASIN-shaped path on an Amazon domain', () => {
  for (const href of [
    'https://www.amazon.fr/dp/B0HHZM8TYR/?tag=airfryergourm-21',
    'https://amazon.fr/gp/product/B0HHZM8TYR',
    'https://www.amazon.fr/Livre-Air-Fryer/dp/B0HHZM8TYR/ref=example',
    'https://smile.amazon.fr/dp/B0HHZM8TYR',
  ]) {
    const s = setup();
    s.click({ 'a[data-affiliate-network], a[href*="amazon.fr/"]': new s.Anchor(href) });
    assert.equal(s.events.length, 1);
    assert.equal(s.events[0][2].link_destination, 'amazon_product', href);
    assert.equal(s.events[0][2].affiliate_network, 'amazon');
  }
});

test('Unknown Amazon destinations are not claimed to be product pages', () => {
  for (const path of ['/dp/example', '/dp/B0HHZM8TYRX', '/s/example', '/gp/bestsellers', '/?next=/dp/B0HHZM8TYR/']) {
    const s = setup();
    s.click({ 'a[data-affiliate-network], a[href*="amazon.fr/"]': new s.Anchor(`https://www.amazon.fr${path}`, { productAsin: 'B0HHZM8TYR' }) });
    assert.equal(s.events[0][2].link_destination, 'amazon_other', path);
  }
});

test('Lookalike domains and non-web destinations are never inferred as Amazon', () => {
  for (const href of [
    'https://fauxamazon.fr/dp/B0HHZM8TYR/',
    'https://amazon.fr.example.com/dp/B0HHZM8TYR/',
    'https://amazon.fr@example.com/dp/B0HHZM8TYR/',
    'https://other.example/?next=https://amazon.fr/dp/B0HHZM8TYR/',
    'ftp://amazon.fr/dp/B0HHZM8TYR/',
    'https://[invalid',
  ]) {
    const s = setup();
    assert.doesNotThrow(() => s.click({ 'a[data-affiliate-network], a[href*="amazon.fr/"]': new s.Anchor(href) }));
    assert.equal(s.events[0][2].link_destination, 'other', href);
    assert.equal(s.events[0][2].affiliate_network, 'autre', href);
  }
});

test('Local and preview environments never send commercial events to production Analytics', () => {
  for (const host of ['localhost', '127.0.0.1', 'preview.pages.dev', 'airfryergourmand.fr.example.com']) {
    const s = setup(true, host);
    s.click({ 'a[data-affiliate-network], a[href*="amazon.fr/"]': new s.Anchor('https://www.amazon.fr/dp/example', { productType: 'book' }) });
    assert.equal(s.events.length, 0, host);
  }
});

test('Commercial page identifiers use the canonical pathname, never a legacy recipe slug', () => {
  const s = setup(true, 'www.airfryergourmand.fr');
  s.click({ 'a[data-affiliate-network], a[href*="amazon.fr/"]': new s.Anchor('https://www.amazon.fr/dp/example', { productType: 'book', pageId: 'legacy-slug' }) });
  assert.equal(s.events[0][2].page_id, '/tableau-temps-cuisson-air-fryer/');
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
