import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('Both layouts initialize GA only on the production domain, not local or preview hosts', () => {
  for (const layout of ['Base', 'Layout']) {
    const source = readFileSync(new URL(`../src/layouts/${layout}.astro`, import.meta.url), 'utf8');
    const scripts = [...source.matchAll(/<script is:inline>([\s\S]*?)<\/script>/g)].map(match => match[1]);
    const script = scripts.find(value => value.includes("gtag('config'"));
    assert.ok(script, layout);
    for (const hostname of ['airfryergourmand.fr', '127.0.0.1', 'localhost', 'preview.pages.dev', 'airfryergourmand.fr.example.com']) {
      const context = vm.createContext({ window: { dataLayer: [] }, location: { hostname } });
      context.dataLayer = context.window.dataLayer;
      vm.runInContext(script, context);
      const configs = context.window.dataLayer.filter(args => args[0] === 'config');
      assert.equal(configs.length, hostname === 'airfryergourmand.fr' ? 1 : 0, `${layout}: ${hostname}`);
      if (configs.length) assert.equal(configs[0][1], 'G-J24QNEE9GV');
    }
  }
});
