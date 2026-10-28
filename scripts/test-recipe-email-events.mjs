import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initRecipeEmail } from '../src/lib/recipe-email.mjs';

function setup({ host = 'airfryergourmand.fr', analytics = true, result = { success: true }, unsupported = false } = {}) {
  const events = [], timers = new Set();
  const node = () => ({ dataset: {}, listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; }, focus() { this.focused = true; } });
  const openers = [node(), node()];
  openers[0].dataset.leadSource = 'banner_recipe';
  openers[1].dataset.leadSource = 'reading_recipe';
  openers.forEach(opener => { opener.insertAdjacentText = (_, text) => { opener.fallback = text; }; });
  const button = { disabled: false }, status = {}, close = node(), form = node();
  Object.assign(form, { action: 'https://provider.invalid/subscribe', valid: true, reportValidity() { return this.valid; }, reset() { this.resetCount = (this.resetCount || 0) + 1; }, querySelector() { return button; } });
  const dialog = node();
  dialog.ownerDocument = { querySelectorAll: () => openers, querySelector: () => dialog.open ? dialog : null };
  dialog.querySelector = selector => selector === 'form' ? form : selector === '[data-recipe-email-status]' ? status : close;
  if (!unsupported) dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; dialog.listeners.close(); };
  const env = { location: { hostname: host, pathname: '/recettes/feta-air-fryer/', search: '?email=private@example.invalid' }, fetch: async () => ({ ok: true, json: async () => result }), setTimeout(fn) { timers.add(fn); return fn; }, clearTimeout(fn) { timers.delete(fn); } };
  if (analytics) env.gtag = (...args) => events.push(args);
  initRecipeEmail(dialog, env);
  return { events, env, dialog, form, openers, button, status, close, timers, submit: () => form.listeners.submit({ preventDefault() {} }) };
}

async function withFormData(run) {
  const original = globalThis.FormData;
  globalThis.FormData = class extends Map { constructor() { super([['fields[email]', 'private@example.invalid'], ['fields[recette]', 'Private field'], ['fields[url_recette]', 'https://private.invalid/']]); } };
  try { await run(); } finally { globalThis.FormData = original; }
}

test('All recipe entry points share one dialog and restore focus to the actual opener', () => {
  const s = setup(); s.openers[1].listeners.click();
  assert.equal(s.events[0][1], 'recipe_email_open');
  assert.equal(s.events[0][2].placement, 'reading_recipe');
  s.openers[0].listeners.click(); assert.equal(s.events.length, 1);
  s.close.listeners.click(); assert.equal(s.openers[1].focused, true);
  initRecipeEmail(s.dialog, s.env); assert.equal(s.events.length, 1);
});

test('Acceptance follows explicit provider success and never includes personal fields', async () => withFormData(async () => {
  const s = setup(); s.openers[0].listeners.click(); await s.submit();
  assert.deepEqual(s.events.map(event => event[1]), ['recipe_email_open', 'recipe_email_attempt', 'recipe_email_request_accepted']);
  assert.equal(s.events[2][2].placement, 'banner_recipe');
  assert.ok(!JSON.stringify(s.events).includes('@'));
  assert.ok(!JSON.stringify(s.events).includes('Private field'));
  assert.equal(s.form.resetCount, 1); assert.equal(s.button.disabled, false); assert.equal(s.timers.size, 0);
}));

test('Rejection records error, preserves inputs, and never claims acceptance', async () => withFormData(async () => {
  const s = setup({ result: { success: false } }); await s.submit();
  assert.deepEqual(s.events.map(event => event[1]), ['recipe_email_attempt', 'recipe_email_error']);
  assert.equal(s.form.resetCount, undefined); assert.equal(s.button.disabled, false);
}));

test('Invalid or already-pending submissions do not emit attempts', async () => withFormData(async () => {
  const s = setup(); s.form.valid = false; await s.submit();
  s.form.valid = true; s.button.disabled = true; await s.submit();
  assert.equal(s.events.length, 0);
}));

test('Local previews, absent analytics and analytics failures never block email requests', async () => withFormData(async () => {
  for (const options of [{ host: 'localhost' }, { analytics: false }, {}]) {
    const s = setup(options);
    if (!Object.keys(options).length) s.env.gtag = () => { throw Error('analytics'); };
    await s.submit(); assert.equal(s.form.resetCount, 1); assert.equal(s.events.length, 0);
  }
}));

test('Unsupported dialogs get visible fallback and no false open event', () => {
  const s = setup({ unsupported: true }); s.openers[0].listeners.click();
  assert.match(s.openers[0].fallback, /favoris/);
  assert.deepEqual(s.events.map(event => event[1]), ['recipe_email_unavailable']);
});

test('Unrecognized placement falls back to a constant rather than leaking data', () => {
  const s = setup(); s.openers[0].dataset.leadSource = 'private@example.invalid';
  s.openers[0].listeners.click(); assert.equal(s.events[0][2].placement, 'recipe_save');
});

test('Closing after a hidden reading invitation restores the heading instead of hidden CTA', () => {
  const s = setup();
  const heading = { focus() { this.focused = true; } };
  const query = s.dialog.ownerDocument.querySelector;
  s.dialog.ownerDocument.querySelector = selector => selector === 'h1' ? heading : query(selector);
  s.openers[1].closest = () => ({});
  s.openers[1].listeners.click(); s.close.listeners.click();
  assert.equal(heading.focused, true);
  assert.equal(s.openers[1].focused, undefined);
});
