import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';
const source=readFileSync(new URL('../src/components/ConversionTracking.astro',import.meta.url),'utf8');
const script=source.match(/<script is:inline>([\s\S]*?)<\/script>/)[1];
function setup(host='airfryergourmand.fr', analytics=true) {
  const events=[],listeners={};
  class Element { closest(){return null;} }
  class Form extends Element {
    constructor(valid=true){super();this.dataset={leadForm:'mailerlite',leadSource:'recipe'};this.valid=valid;this.email='must-not-be-sent@example.com';}
    checkValidity(){return this.valid;}
  }
  const window=analytics?{gtag:(...args)=>events.push(args)}:{};
  const context=vm.createContext({window,location:{hostname:host,pathname:'/recettes/saumon-air-fryer/'},document:{addEventListener:(key,fn)=>{(listeners[key]||=[]).push(fn);}},Element,HTMLFormElement:Form});
  vm.runInContext(script,context);
  return {events,listeners,Form,Element,context};
}
test('Submission is recorded as an attempt, with no address or input values',()=>{
  const s=setup();s.listeners.submit[0]({target:new s.Form()});
  assert.equal(s.events[0][1],'newsletter_form_submit');
  assert.equal(s.events[0][2].placement,'recipe');
  assert.ok(!JSON.stringify(s.events).includes('@'));
});
test('Invalid and unrelated forms never send events',()=>{
  const s=setup();s.listeners.submit[0]({target:new s.Form(false)});
  const form=new s.Form();form.dataset={};s.listeners.submit[0]({target:form});
  assert.equal(s.events.length,0);
});
test('Preview event identifies only the book and page',()=>{
  const s=setup();const target=new s.Element();target.closest=()=>({dataset:{bookPreview:'petites-portions',previewPage:'seniors-sommaire'}});
  s.listeners.click[0]({target});assert.equal(s.events[0][1],'book_preview_open');
  assert.equal(s.events[0][2].book_id,'petites-portions');
});
test('Local testing and unavailable Analytics do not send or block submissions',()=>{
  for(const s of [setup('127.0.0.1'),setup('airfryergourmand.fr',false)]) {
    assert.doesNotThrow(()=>s.listeners.submit[0]({target:new s.Form()}));assert.equal(s.events.length,0);
  }
});
test('Repeated initialization does not duplicate conversion events',()=>{
  const s=setup();vm.runInContext(script,s.context);assert.equal(s.listeners.submit.length,1);assert.equal(s.listeners.click.length,1);
});
