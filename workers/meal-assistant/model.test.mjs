import test from 'node:test';
import assert from 'node:assert/strict';
import * as entrypoint from './worker.mjs';
import { catalogue } from './guidance.mjs';
import { runModel } from './model.mjs';
const worker = entrypoint.default;

test('worker entry point only exports its fetch handler', () => {
  assert.deepEqual(Object.keys(entrypoint), ['default']);
  assert.equal(typeof worker.fetch, 'function');
});

const origin = 'https://airfryergourmand.fr';
const request = (route, query) => new Request(`${origin}/api/${route}`, {
  method: 'POST',
  headers: { Origin: origin, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query }),
});

const selection = {
  recipe_ids: ['blanc-de-poulet-air-fryer'], servings: 4, baskets: null, needs_clarification: false,
};
const intent = {
  terms: ['poulet'], excluded: ['crème'], vegetarian: false, vegan: false, maxMinutes: 30,
};

function environment(response) {
  const calls = [];
  const env = {
    TRIAL_ENABLED: 'true',
    AI_LIMITER: { limit: async () => ({success: true}) },
    AI: { run: async (...args) => { calls.push(args); return response; } },
  };
  return { calls, env };
}

for (const [route, query, payload] of [
  ['repas', 'poulet pour quatre', selection],
  ['recherche', 'chicken without cream in 30 minutes', intent],
]) {
  test(`${route} sends one bounded Mistral call with the appropriate JSON schema`, async () => {
    const { calls, env } = environment({response: JSON.stringify(payload)});
    const result = await worker.fetch(request(route, query), env);
    assert.equal(result.status, 200);
    const parsed = await result.json();
    assert.deepEqual(route === 'repas' ? parsed.selection : parsed.intent, payload);
    assert.equal(calls.length, 1);
    const [[model, options]] = calls;
    assert.equal(model, '@cf/mistralai/mistral-small-3.1-24b-instruct');
    assert.equal(options.max_tokens, 220);
    assert.equal(options.temperature, 0);
    assert.equal('response_format' in options, false);
    assert.equal(options.messages[0].role, 'system');
    assert.deepEqual(options.messages[1], {role: 'user', content: query});
    assert.equal(options.guided_json.type, 'object');
    assert.equal(options.guided_json.additionalProperties, false);
    assert.deepEqual(options.guided_json.required, Object.keys(payload));
    const keys = options.guided_json.properties;
    if (route === 'repas') {
      assert.equal(keys.recipe_ids.maxItems, 3);
      assert.deepEqual(keys.recipe_ids.items.enum, catalogue.map(({id}) => id));
    } else {
      assert.equal(keys.terms.maxItems, 6);
      assert.equal(keys.excluded.items.maxLength, 50);
    }
  });

  test(`${route} classifies an empty provider response as invalid output`, async () => {
    const { calls, env } = environment(null);
    const result = await worker.fetch(request(route, query), env);
    assert.equal(result.status, 502);
    assert.equal(calls.length, 1);
  });
}

test('model returns on deadline and does not retry an unresolved request', async () => {
  let calls = 0;
  const ai = { run: () => { calls++; return new Promise(() => {}); } };
  await assert.rejects(runModel(ai, 'system', 'poulet', {}, 5), /deadline exceeded/);
  assert.equal(calls, 1);
});
