import test from 'node:test';
import assert from 'node:assert/strict';
import { articleDateErrors } from './article-date-check.mjs';

const today = '2026-10-29';
test('Article accepts publication only without inventing a modification date', () => {
  assert.deepEqual(articleDateErrors({ '@type': 'Article', datePublished: '2026-08-01' }, today), []);
});
test('Article rejects the observed revision-before-publication regression', () => {
  assert.deepEqual(articleDateErrors({ '@type': 'Article', datePublished: '2026-08-01', dateModified: '2026-07-13' }, today), ['Article modification date precedes publication']);
});
test('Article accepts equal and later revision dates', () => {
  for (const dateModified of ['2026-08-01', '2026-10-28']) {
    assert.deepEqual(articleDateErrors({ '@type': 'Article', datePublished: '2026-08-01', dateModified }, today), []);
  }
});
test('Article dates compare instants, including timezone offsets', () => {
  assert.deepEqual(articleDateErrors({ '@type': ['Article', 'CreativeWork'], datePublished: '2026-08-01T09:00:00+02:00', dateModified: '2026-08-01T08:00:00Z' }, today), []);
});
test('future and unparseable revision dates are reported', () => {
  assert.deepEqual(articleDateErrors({ '@type': 'BlogPosting', dateModified: '2026-10-30' }, today), ['Article modification date is in the future']);
  assert.ok(articleDateErrors({ '@type': 'NewsArticle', dateModified: 'not-a-date' }, today).includes('Article dateModified is not a valid date'));
});
test('unrelated schemas are outside the Article check', () => {
  assert.deepEqual(articleDateErrors({ '@type': 'Recipe', datePublished: '2026-08-01', dateModified: '2026-07-13' }, today), []);
});
