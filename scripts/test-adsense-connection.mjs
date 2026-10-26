import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { validateAdSenseConnection, adSenseAdsTxt, adSenseVerificationPaths, adSenseAdsTxtResponse } from '../src/lib/adsense-connection.mjs';

// Fictional unit-test ID only; never written into site configuration or public output.
const fixture = { publisherId: 'ca-pub-9876543210123456', verificationEnabled: true };
const config = JSON.parse(readFileSync(new URL('../src/config/adsense.json', import.meta.url), 'utf8'));

test('Missing publisher never emits verification metadata or a fictitious ads.txt entry', async () => {
  const empty = { publisherId: '', verificationEnabled: false };
  assert.equal(validateAdSenseConnection(empty).connectedForReview, false);
  assert.equal(adSenseAdsTxt(empty), null);
  assert.deepEqual(adSenseVerificationPaths(empty), []);
  const response = adSenseAdsTxtResponse(empty);
  assert.equal(response.status, 404);
  assert.equal(await response.text(), '');
});

test('Verification requires a genuine-shaped publisher ID and explicit activation', () => {
  assert.throws(() => validateAdSenseConnection({ publisherId: '', verificationEnabled: true }));
  for (const publisherId of ['pub-9876543210123456', 'ca-pub-0', 'ca-pub-0000000000000000', 'ca-pub-1234567890123456', 'ca-pub-9876543210123456" onload="x', ' ca-pub-9876543210123456']) {
    assert.throws(() => validateAdSenseConnection({ ...fixture, publisherId }), publisherId);
  }
  for (const value of [null, {}, { publisherId: '', verificationEnabled: 'false' }, { publisherId: 123, verificationEnabled: false }])
    assert.throws(() => validateAdSenseConnection(value));
  assert.equal(validateAdSenseConnection({ ...fixture, verificationEnabled: false }).connectedForReview, false);
  assert.equal(adSenseAdsTxt({ ...fixture, verificationEnabled: false }), null);
});

test('Enabled verification uses the same publisher in its root ads.txt response and route', async () => {
  assert.equal(validateAdSenseConnection(fixture).connectedForReview, true);
  assert.deepEqual(adSenseVerificationPaths(fixture), [{ params: { adsenseFile: 'ads' } }]);
  const response = adSenseAdsTxtResponse(fixture);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal(await response.text(), 'google.com, pub-9876543210123456, DIRECT, f08c47fec0942fa0\n');
});

test('Both page layouts share the one verification component; it cannot request ads', () => {
  for (const layout of ['Base', 'Layout']) {
    const source = readFileSync(new URL(`../src/layouts/${layout}.astro`, import.meta.url), 'utf8');
    assert.equal((source.match(/<AdSenseVerification\s*\/>/g) || []).length, 1, layout);
  }
  const component = readFileSync(new URL('../src/components/AdSenseVerification.astro', import.meta.url), 'utf8');
  assert.match(component, /connectedForReview && <meta name="google-adsense-account" content=\{publisherId\}/);
  assert.doesNotMatch(component, /<script|<iframe|<ins|adsbygoogle|googlesyndication/);
});

test('Generated site has no ad requests or placeholder publisher; ads.txt matches configured state', () => {
  const root = new URL('../dist/', import.meta.url);
  const pages = readdirSync(root, { recursive: true }).filter(path => path.endsWith('.html'));
  assert.ok(pages.length > 100);
  const connection = validateAdSenseConnection(config);
  for (const file of pages) {
    const page = readFileSync(new URL(file.replaceAll('\\', '/'), root), 'utf8');
    assert.doesNotMatch(page, /pagead2\.googlesyndication\.com|adsbygoogle|ca-pub-9876543210123456/, file);
    const metas = [...page.matchAll(/<meta\b[^>]*name="google-adsense-account"[^>]*>/g)];
    assert.equal(metas.length, connection.connectedForReview ? 1 : 0, file);
    if (metas.length) assert.ok(metas[0][0].includes(`content="${connection.publisherId}"`), file);
  }
  const adsFile = new URL('ads.txt', root);
  assert.equal(existsSync(adsFile), connection.connectedForReview);
  if (existsSync(adsFile)) assert.equal(readFileSync(adsFile, 'utf8'), adSenseAdsTxt(config));
});
