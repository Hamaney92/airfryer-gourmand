import test from 'node:test';
import assert from 'node:assert/strict';
import { createChristmasSound } from '../src/scripts/christmas-sound.ts';

function fixture(options = {}) {
  const nodes = [], states = [];
  let allowed = true, created = 0;
  const context = {
    currentTime: 10, state: 'running', destination: {},
    resume: options.resume || (async () => {}),
    createOscillator() {
      const node = { frequency: {}, connect() {}, disconnect() { this.disconnected = true; }, start(t) { this.startAt = t; }, stop(t) { this.stopAt = t; } };
      nodes.push(node); return node;
    },
    createGain() {
      const node = { gain: { setValueAtTime() {}, linearRampToValueAtTime(v) { node.peak = v; }, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() { this.disconnected = true; } };
      nodes.push(node); return node;
    },
  };
  const sound = createChristmasSound({ factory: () => { created++; if (options.fail) throw Error('unsupported'); return context; }, available: () => allowed, changed: (...args) => states.push(args) });
  return { sound, nodes, states, context, created: () => created, hide: () => { allowed = false; } };
}
test('initial silence creates no AudioContext, including unsolicited flight', () => {
  const f = fixture(); f.sound.flight(); assert.equal(f.created(), 0); assert.equal(f.nodes.length, 0);
});
test('activation previews immediately; flight is bounded under six seconds and low gain', async () => {
  const f = fixture(); await f.sound.activate();
  assert.equal(f.created(), 1); assert.equal(f.sound.isEnabled(), true); assert.equal(f.nodes.length, 6);
  assert.equal(f.nodes[0].startAt, 10); assert.equal(f.nodes[0].stopAt, 10.32);
  f.sound.flight();
  const flight = f.nodes.slice(6); assert.equal(flight.length, 78);
  assert.ok(flight.filter(n => n.frequency).every(n => n.stopAt < 16));
  assert.ok(flight.filter(n => n.gain).every(n => n.peak <= .022));
  f.sound.mute(); assert.ok(f.nodes.every(n => n.disconnected));
});
test('mute stops scheduled future oscillators and prevents future flights', async () => {
  const f = fixture(); await f.sound.activate(); f.sound.flight(); f.sound.mute();
  assert.equal(f.sound.isEnabled(), false); assert.ok(f.nodes.every(n => n.disconnected));
  const count = f.nodes.length; f.sound.flight(); assert.equal(f.nodes.length, count);
});
test('off-season/hidden cannot create a context', async () => {
  const f = fixture(); f.hide(); await f.sound.activate(); assert.equal(f.created(), 0);
});
test('a resume resolving after mute/hidden cannot play deferred audio', async () => {
  let resolve; const f = fixture({ resume: () => new Promise(r => { resolve = r; }) });
  const pending = f.sound.activate(); f.hide(); f.sound.mute(); resolve(); await pending;
  assert.equal(f.nodes.length, 0); assert.equal(f.sound.isEnabled(), false);
});
test('unsupported AudioContext and rejected resume recover silently', async () => {
  for (const options of [{ fail: true }, { resume: async () => { throw Error('blocked'); } }]) {
    const f = fixture(options); await f.sound.activate(); assert.equal(f.sound.isEnabled(), false);
    assert.deepEqual(f.states.at(-1), [false, true]); assert.equal(f.nodes.length, 0);
  }
});
test('natural ending releases all nodes, stop is idempotent', async () => {
  const f = fixture(); await f.sound.activate();
  for (const n of f.nodes.filter(n => n.frequency)) n.onended();
  assert.ok(f.nodes.every(n => n.disconnected)); f.sound.stop(); f.sound.stop();
});
