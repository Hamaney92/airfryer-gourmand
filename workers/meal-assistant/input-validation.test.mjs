import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.mjs';

const origin='https://airfryergourmand.fr';
const intent={terms:['pois chiches'],excluded:[],vegetarian:true,vegan:true,maxMinutes:null};
const request=(route,body)=>new Request(`${origin}/api/${route}`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
function environment(usage){
  const calls={limiter:0,ai:0};
  return {calls,env:{TRIAL_ENABLED:'true',AI_LIMITER:{limit:async()=>{calls.limiter++;return {success:true};}},AI:{run:async()=>{calls.ai++;return {response:intent,usage};}}}};
}

for(const route of ['repas','recherche']){
  test(`${route}: non-object JSON is rejected before limiter and AI`,async()=>{
    for(const body of [null,false,true,0,42,'falafels',[],[{query:'falafels'}]]){
      const {calls,env}=environment();
      const response=await worker.fetch(request(route,body),env);
      assert.equal(response.status,400,JSON.stringify(body));
      assert.equal(typeof (await response.json()).error,'string');
      assert.deepEqual(calls,{limiter:0,ai:0});
    }
  });
}

test('search: absent, negative, fractional and nonnumeric token usage stays unknown',async()=>{
  for(const usage of [undefined,null,{},
    {prompt_tokens:-1,completion_tokens:5},
    {prompt_tokens:5,completion_tokens:-1},
    {prompt_tokens:1.5,completion_tokens:5},
    {prompt_tokens:5,completion_tokens:1.5},
    {prompt_tokens:'5',completion_tokens:1},
    {prompt_tokens:Infinity,completion_tokens:1}]){
    const {calls,env}=environment(usage);
    const response=await worker.fetch(request('recherche',{query:'falafels'}),env);
    assert.equal(response.status,200);
    const result=await response.json();
    assert.deepEqual(result.intent,intent);
    assert.equal(result.usage,null);
    assert.deepEqual(calls,{limiter:1,ai:1});
  }
});

test('search: invalid neuron readings do not discard valid token counts',async()=>{
  for(const neurons of [undefined,null,-1,NaN,Infinity,-Infinity,'2']){
    const {env}=environment({prompt_tokens:20,completion_tokens:10,neurons});
    const result=await (await worker.fetch(request('recherche',{query:'falafels'}),env)).json();
    assert.deepEqual(result.usage,{inputTokens:20,outputTokens:10,neurons:null});
  }
});

test('search: valid counts, including zero, preserve the response contract',async()=>{
  for(const usage of [{prompt_tokens:0,completion_tokens:0,neurons:0},{prompt_tokens:20,completion_tokens:10,neurons:0.25}]){
    const {env}=environment(usage);
    const result=await (await worker.fetch(request('recherche',{query:'falafels'}),env)).json();
    assert.deepEqual(result.usage,{inputTokens:usage.prompt_tokens,outputTokens:usage.completion_tokens,neurons:usage.neurons});
  }
});
