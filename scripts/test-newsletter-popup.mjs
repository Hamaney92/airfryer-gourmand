import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initNewsletterPopup } from '../src/lib/newsletter-popup.mjs';

function setup({ recipeOwner = false } = {}) {
  const registrations = [];
  const doc = {
    documentElement: { dataset: {} }, handlers: {},
    addEventListener(name, handler) { registrations.push(name); this.handlers[name] = handler; },
    querySelector(selector) {
      if (selector === '[data-recipe-prompts]') return recipeOwner ? {} : null;
      return selector === 'dialog[open]' && dialog.open ? dialog : null;
    },
  };
  const frame = { src: '', dataset: { newsletterUrl: 'https://preview.mailerlite.io/forms/test/share' } };
  const recipeClose = () => {};
  const close = { click: recipeOwner ? recipeClose : null, addEventListener(name, handler) { this[name] = handler; } };
  const dialog = {
    dataset: {}, ownerDocument: doc, open: false, handlers: {},
    hasAttribute() { return true; }, // Historical auto-opening markup must be harmless.
    querySelector(selector) { return selector === 'iframe' ? frame : close; },
    showModal() { this.open = true; },
    close() { this.open = false; this.handlers.close?.(); },
    addEventListener(name, handler) { this.handlers[name] = handler; },
  };
  const scheduled = [];
  const env = {
    setInterval(handler) { scheduled.push(handler); },
    setTimeout(handler) { scheduled.push(handler); },
    addEventListener(name) { registrations.push(name); },
    get sessionStorage() { throw Error('Storage must not be needed to open a form'); },
  };
  initNewsletterPopup(dialog, env);
  return { doc, dialog, frame, close, env, scheduled, registrations, recipeClose };
}

test('Entry never schedules an interruption or loads the external form', () => {
  const s = setup();
  assert.equal(s.scheduled.length, 0);
  assert.equal(s.frame.src, '');
  assert.equal(s.dialog.open, false);
  assert.equal(s.doc.documentElement.dataset.newsletterHandled, undefined);
});

test('A newsletter link opens on demand and restores focus after dismissal', () => {
  const s = setup();
  let prevented = 0, focused = 0;
  const trigger = { focus(options) { assert.equal(options.preventScroll, true); focused++; } };
  const event = { target: { closest: () => trigger }, preventDefault() { prevented++; } };
  s.doc.handlers.click(event);
  assert.equal(prevented, 1);
  assert.equal(s.dialog.open, true);
  assert.equal(s.frame.src, s.frame.dataset.newsletterUrl);
  assert.equal(s.doc.documentElement.dataset.newsletterHandled, 'true');
  s.close.click();
  assert.equal(focused, 1);
  assert.equal(s.dialog.open, false);
  s.doc.handlers.click(event);
  assert.equal(s.dialog.open, true);
});

test('Modified clicks and unavailable dialogs preserve the internal fallback link', () => {
  for (const modify of [e => e.ctrlKey = true, e => e.metaKey = true, e => e.shiftKey = true, e => e.altKey = true, e => e.button = 1, e => e.defaultPrevented = true]) {
    const s = setup();
    const event = { target: { closest: () => ({}) }, preventDefault() { throw Error('redirect prevented'); } };
    modify(event);
    s.doc.handlers.click(event);
    assert.equal(s.dialog.open, false);
  }
  const s = setup();
  s.dialog.showModal = undefined;
  s.doc.handlers.click({ target: { closest: () => ({}) }, preventDefault() { throw Error('fallback blocked'); } });
});

test('A different open dialog prevents newsletter overlap without swallowing navigation', () => {
  const s = setup();
  s.doc.querySelector = selector => selector === 'dialog[open]' ? {} : null;
  s.doc.handlers.click({ target: { closest: () => ({}) }, preventDefault() { throw Error('fallback blocked'); } });
  assert.equal(s.dialog.open, false);
  assert.equal(s.frame.src, '');
});

test('Reinitialization after cached navigation retains one manual listener and no clock', () => {
  const s = setup();
  const original = s.doc.handlers.click;
  initNewsletterPopup(s.dialog, s.env);
  assert.equal(s.doc.handlers.click, original);
  assert.deepEqual(s.registrations, ['click']);
  assert.equal(s.scheduled.length, 0);
  s.doc.handlers.click({ target: { closest: () => ({ focus() {} }) }, preventDefault() {} });
  assert.equal(s.dialog.open, true);
});

test('Recipe prompts keep ownership of the shared dialog close behavior', () => {
  const s = setup({ recipeOwner: true });
  assert.equal(s.close.click, s.recipeClose);
  assert.equal(s.dialog.handlers.close, undefined);
});
