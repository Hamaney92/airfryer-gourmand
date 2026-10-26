import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initBookPreview } from '../src/lib/book-preview.mjs';

function setup(book = 'anti-gaspi', enhanced = true) {
  const element = () => ({ handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; } });
  const image = {}, caption = {}, previous = element(), next = element(), close = element();
  const dialog = { ...element(), open: false, showModal: enhanced ? function () { this.open = true; } : undefined,
    close() { this.open = false; this.handlers.close(); },
    querySelector(selector) { return ({ '[data-preview-image]': image, '[data-preview-caption]': caption, '[data-preview-previous]': previous, '[data-preview-next]': next, '[data-preview-close]': close })[selector]; } };
  const links = Array.from({ length: 4 }, (_, index) => ({ ...element(), href: `/img/books/previews/${book}-${index}.webp`, dataset: { bookPreview: book, previewTitle: `Extrait ${index + 1}` }, querySelector() { return { alt: `${book} page ${index + 1}` }; }, focus() { this.focused = true; } }));
  const doc = { competing: false, querySelector() { return this.competing || dialog.open ? {} : null; } };
  const root = { dataset: {}, ownerDocument: doc, querySelector() { return dialog; }, querySelectorAll() { return links; } };
  initBookPreview(root);
  const click = (index = 0, flags = {}) => {
    const event = { prevented: false, preventDefault() { this.prevented = true; }, ...flags };
    links[index].handlers.click?.(event);
    return event;
  };
  return { root, doc, dialog, links, image, caption, previous, next, close, click };
}

test('Image links open the selected page in the on-site dialog and retain their fallback URL and tracking data', () => {
  const s = setup(); const event = s.click(2);
  assert.ok(event.prevented && s.dialog.open);
  assert.equal(s.image.src, s.links[2].href);
  assert.equal(s.image.alt, 'anti-gaspi page 3');
  assert.match(s.caption.textContent, /^3 \/ 4/);
  assert.equal(s.links[2].dataset.bookPreview, 'anti-gaspi');
  assert.equal(s.links[2].href, '/img/books/previews/anti-gaspi-2.webp');
});

test('Previous and next stay within the book; keyboard navigation and close restore focus', () => {
  const s = setup(); s.click(); assert.ok(s.previous.disabled);
  s.previous.handlers.click(); assert.equal(s.image.src, s.links[0].href);
  s.next.handlers.click(); assert.equal(s.image.src, s.links[1].href);
  const key = key => s.dialog.handlers.keydown({ key, preventDefault() {} });
  key('ArrowRight'); key('ArrowRight'); assert.ok(s.next.disabled);
  key('ArrowRight'); assert.equal(s.image.src, s.links[3].href);
  key('ArrowLeft'); assert.equal(s.image.src, s.links[2].href);
  s.close.handlers.click(); assert.ok(!s.dialog.open && s.links[0].focused);
  // Native Escape produces the same close event; the module does not override cancel.
  s.click(1); s.dialog.close(); assert.ok(s.links[1].focused);
  assert.equal(s.dialog.handlers.cancel, undefined);
});

test('Modified clicks, competing dialogs and missing dialog support preserve image-link navigation', () => {
  for (const flags of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { defaultPrevented: true }]) {
    const s = setup(); assert.equal(s.click(0, flags).prevented, false); assert.equal(s.dialog.open, false);
  }
  const competing = setup(); competing.doc.competing = true; assert.equal(competing.click().prevented, false);
  const fallback = setup('anti-gaspi', false); assert.equal(fallback.links[0].handlers.click, undefined);
});

test('Multiple books keep independent readers and initialization is idempotent', () => {
  const anti = setup(), small = setup('petites-portions');
  const original = anti.links[0].handlers.click; initBookPreview(anti.root);
  assert.equal(anti.links[0].handlers.click, original);
  anti.click(3); small.click(1);
  assert.match(anti.image.src, /anti-gaspi-3/); assert.match(small.image.src, /petites-portions-1/);
  small.next.handlers.click(); assert.match(anti.image.src, /anti-gaspi-3/);
});

test('Template keeps progressive links, distinct dialog labels and book-specific affiliated purchase CTA', () => {
  const template = readFileSync(new URL('../src/components/BookPreview.astro', import.meta.url), 'utf8');
  assert.match(template, /const asin = anti \? 'B0HHZM8TYR' : 'B0HCSM8ZMD'/);
  assert.match(template, /href=\{amazonProduct\(asin\)\}/);
  assert.match(template, /data-book-id=\{book\} data-placement="book_preview_purchase"/);
  assert.match(template, /rel="sponsored nofollow noopener"/);
  assert.match(template, /aria-labelledby=\{`book-preview-dialog-\$\{book\}`\}/);
  assert.match(template, /data-book-preview=\{book\} data-preview-page=\{page.file\}/);
  assert.match(template, /Lien affilié/);
});
