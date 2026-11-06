import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/pages/temps-de-cuisson.astro', import.meta.url), 'utf8');
const script = source.match(/<script is:inline>([\s\S]*?)<\/script>/)[1];
function setup() {
  const nodes = {};
  for (const [id, value] of [['ovenTemp', '200'], ['ovenTime', '30'], ['ovenTemp-error', ''], ['ovenTime-error', ''], ['result', '']]) {
    nodes[id] = {
      value, textContent: '', hidden: true, attributes: {}, handlers: {},
      addEventListener(type, fn) { this.handlers[type] = fn; },
      setAttribute(name, value) { this.attributes[name] = value; },
      removeAttribute(name) { delete this.attributes[name]; },
    };
  }
  vm.runInNewContext(script, { document: { getElementById: id => nodes[id] } });
  return {
    nodes,
    change(temp, time) {
      nodes.ovenTemp.value = temp;
      nodes.ovenTime.value = time;
      nodes.ovenTemp.handlers.input();
      return nodes.result.textContent;
    },
  };
}

// Keep every previously usable value and its rounding, including decimal/step mismatches.
const valid = setup();
for (const [temp, time] of [[200, 30], [180, 45], [80, 1], [280, 240], [201, 31], [202.5, 2.5], [90.1, 239.9]]) {
  const oldResult = `${Math.round((temp - 20) / 5) * 5} °C pendant ${Math.max(1, Math.round(time * 0.8))} min`;
  assert.equal(valid.change(String(temp), String(time)), oldResult);
}

// Incomplete and out-of-range values must immediately remove the previous numeric recommendation.
for (const [temp, time] of [['', '30'], ['  ', '30'], ['200', ''], ['', ''], ['NaN', '30'], ['Infinity', '30'], ['-Infinity', '30'], ['1e', '30'], ['79', '30'], ['281', '30'], ['200', '0'], ['200', '241']]) {
  const state = setup();
  const result = state.change(temp, time);
  assert.doesNotMatch(result, /\d|NaN|Infinity/);
  assert.equal(state.nodes.ovenTemp.value, temp);
  assert.equal(state.nodes.ovenTime.value, time);
  assert.equal(state.nodes.ovenTemp.attributes['aria-invalid'], undefined);
  assert.equal(state.nodes.ovenTime.attributes['aria-invalid'], undefined);
}

// Errors appear only after the affected field is visited, then clear on a valid input.
const recovery = setup();
recovery.change('', '');
recovery.nodes.ovenTemp.handlers.blur();
assert.equal(recovery.nodes.ovenTemp.attributes['aria-invalid'], 'true');
assert.equal(recovery.nodes['ovenTemp-error'].hidden, false);
assert.match(recovery.nodes['ovenTemp-error'].textContent, /^Saisis une température/);
assert.equal(recovery.nodes.ovenTime.attributes['aria-invalid'], undefined);
recovery.change('281', '30');
assert.match(recovery.nodes['ovenTemp-error'].textContent, /^La température/);
assert.equal(recovery.change('200', '30'), '180 °C pendant 24 min');
assert.equal(recovery.nodes.ovenTemp.attributes['aria-invalid'], undefined);
assert.equal(recovery.nodes['ovenTemp-error'].hidden, true);
assert.equal(recovery.nodes['ovenTemp-error'].textContent, '');

const minuteError = setup();
minuteError.change('200', '241');
minuteError.nodes.ovenTime.handlers.blur();
assert.match(minuteError.nodes['ovenTime-error'].textContent, /^Le temps/);
assert.equal(minuteError.nodes.ovenTime.attributes['aria-invalid'], 'true');
assert.equal(minuteError.change('180', '45'), '160 °C pendant 36 min');
assert.equal(minuteError.nodes.ovenTime.attributes['aria-invalid'], undefined);

// Partial pages must not throw if converter elements are absent.
assert.doesNotThrow(() => vm.runInNewContext(script, { document: { getElementById: () => null } }));
console.log('Converter regression checks passed: valid rounding, invalid input, deferred errors, recovery and missing DOM.');
