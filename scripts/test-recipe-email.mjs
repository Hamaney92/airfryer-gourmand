import assert from 'node:assert/strict';
import { test } from 'node:test';
import { requestRecipeEmail } from '../src/lib/recipe-email.mjs';
test('Recipe request posts fields without URL query and accepts only explicit provider success', async () => {
  const original = globalThis.FormData;
  globalThis.FormData = class extends Map { constructor() { super([['fields[email]','test@example.invalid'],['fields[recette]','Feta'],['fields[url_recette]','https://airfryergourmand.fr/recettes/feta-rotie-air-fryer/']]); } };
  try {
    const form = { action: 'https://provider.invalid/subscribe' };
    await requestRecipeEmail(form, async (url, options) => {
      assert.equal(url,form.action);
      assert.equal(options.method,'POST');
      assert.equal(options.credentials,'omit');
      assert.equal(options.body.get('fields[recette]'),'Feta');
      assert.equal(options.body.get('ajax'),'1');
      return { ok:true, json:async()=>({success:true}) };
    });
    for (const result of [{success:false},{},{fieldsToConfirm:['email']}]) {
      await assert.rejects(requestRecipeEmail(form,async()=>({ok:true,json:async()=>result})));
    }
    await assert.rejects(requestRecipeEmail(form,async()=>({ok:false})));
    await assert.rejects(requestRecipeEmail(form,async()=>{throw Error('network');}));
  } finally { globalThis.FormData = original; }
});
