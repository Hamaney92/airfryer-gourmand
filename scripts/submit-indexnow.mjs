// Explicit URLs only; dry-run by default. Run after production deployment.
import { readFileSync } from 'node:fs';
const { origin, key } = JSON.parse(readFileSync(new URL('./indexnow-config.json', import.meta.url), 'utf8').replace(/^\uFEFF/, ''));
const submit = process.argv.includes('--submit');
const urls = [...new Set(process.argv.slice(2).filter(arg => arg !== '--submit'))];
if (!urls.length || urls.length > 100) throw new Error('Provide 1–100 changed production URLs. Default: dry-run; --submit sends.');
for (const input of urls) {
  const url = new URL(input);
  if (url.origin !== origin || url.search || url.hash || url.username || url.password) throw new Error('Only canonical production URLs without parameters are accepted');
}
async function get(url) {
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return { response, text: await response.text() };
}
const { text: sitemap } = await get(`${origin}/sitemap.xml`);
const published = new Set([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]));
for (const url of urls) {
  if (!published.has(url)) throw new Error(`Not in public sitemap: ${url}`);
  const { response, text } = await get(url);
  if (!response.headers.get('content-type')?.includes('text/html')) throw new Error(`Not HTML: ${url}`);
  if (/noindex/i.test(response.headers.get('x-robots-tag') || '') || /<meta\b[^>]*content=["'][^"']*noindex/i.test(text)) throw new Error(`Noindex: ${url}`);
  const canonical = text.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1];
  if (canonical !== url) throw new Error(`Canonical mismatch: ${url}`);
}
if (!submit) {
  console.log(JSON.stringify({ mode: 'dry-run', urls, checkedAt: new Date().toISOString() }));
} else {
  const keyLocation = `${origin}/${key}.txt`;
  const { text: publicKey } = await get(keyLocation);
  if (publicKey.trim() !== key) throw new Error('Production verification file mismatch');
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(origin).host, key, keyLocation, urlList: urls }),
    signal: AbortSignal.timeout(30000),
  });
  console.log(JSON.stringify({ mode: 'submit', status: response.status, urls, checkedAt: new Date().toISOString(), meaning: 'Receipt only, not proof of indexing' }));
  if (![200, 202].includes(response.status)) throw new Error('Submission rejected; no automatic retry');
}
