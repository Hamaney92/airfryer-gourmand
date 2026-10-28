import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';
const source=readFileSync(new URL('../src/components/ConversionTracking.astro',import.meta.url),'utf8');
const script=source.match(/<script is:inline>([\s\S]*?)<\/script>/)[1];
function setup(host='airfryergourmand.fr', analytics=true, offer=null) {
  const events=[],listeners={}, observers=[];
  class Element { closest(){return null;} }
  class Form extends Element {
    constructor(valid=true){super();this.dataset={leadForm:'mailerlite',leadSource:'recipe'};this.valid=valid;this.email='must-not-be-sent@example.com';}
    checkValidity(){return this.valid;}
  }
  const window=analytics?{gtag:(...args)=>events.push(args)}:{};
  const banner=offer?{querySelector:()=>offer==='recipe'?{}:null}:null;
  window.IntersectionObserver=class {
    constructor(callback,options){this.callback=callback;this.options=options;observers.push(this);}
    observe(target){this.target=target;}
    unobserve(target){this.unobserved=target;}
  };
  const context=vm.createContext({window,location:{hostname:host,pathname:'/recettes/saumon-air-fryer/'},document:{querySelector:()=>banner,addEventListener:(key,fn)=>{(listeners[key]||=[]).push(fn);}},Element,HTMLFormElement:Form});
  vm.runInContext(script,context);
  return {events,listeners,Form,Element,context,banner,observers};
}
test('Legacy submit attempts are no longer reported as newsletter conversions',()=>{
  const s=setup();
  assert.equal(s.listeners.submit,undefined);
  assert.ok(!script.includes('newsletter_form_submit'));
});
test('Invalid and unrelated forms never send events',()=>{
  const s=setup();
  assert.equal(s.listeners.submit,undefined);
  assert.equal(s.events.length,0);
});
test('Preview event identifies only the book and page',()=>{
  const s=setup();const target=new s.Element();target.closest=selector=>selector==='a[data-book-preview]'?{dataset:{bookPreview:'petites-portions',previewPage:'seniors-sommaire'}}:null;
  s.listeners.click[0]({target});assert.equal(s.events[0][1],'book_preview_open');
  assert.equal(s.events[0][2].book_id,'petites-portions');
  assert.equal(s.events.length,1);
});
test('Hosted newsletter CTA measures an opening, never a confirmed subscription or personal data',()=>{
  const s=setup();const target=new s.Element();
  target.closest=selector=>selector==='a[data-newsletter-signup]'?{dataset:{leadSource:'inline_pdf'},href:'https://example.com/?email=private@example.com'}:null;
  s.listeners.click[0]({target});
  assert.equal(s.events.length,1);
  assert.equal(s.events[0][1],'newsletter_signup_click');
  assert.equal(s.events[0][2].placement,'inline_pdf');
  assert.ok(!JSON.stringify(s.events).includes('@'));
});
test('Newsletter clicks stay silent locally and when analytics is unavailable',()=>{
  for(const s of [setup('127.0.0.1'),setup('airfryergourmand.fr',false)]) {
    const target=new s.Element();target.closest=selector=>selector==='a[data-newsletter-signup]'?{dataset:{leadSource:'recipe'}}:null;
    assert.doesNotThrow(()=>s.listeners.click[0]({target}));assert.equal(s.events.length,0);
  }
});
test('Local testing and unavailable Analytics do not send or block submissions',()=>{
  for(const s of [setup('127.0.0.1'),setup('airfryergourmand.fr',false)]) {
    assert.equal(s.listeners.submit,undefined);assert.equal(s.events.length,0);
  }
});
test('Repeated initialization does not duplicate conversion events',()=>{
  const s=setup();vm.runInContext(script,s.context);assert.equal(s.listeners.submit,undefined);assert.equal(s.listeners.click.length,1);
});

test('Banner exposure needs at least half visibility and is recorded only once per page',()=>{
  for(const offer of ['recipe','newsletter']) {
    const s=setup('airfryergourmand.fr',true,offer), observer=s.observers[0];
    observer.callback([{target:s.banner,isIntersecting:true,intersectionRatio:0.49}]);
    assert.equal(s.events.length,0);
    observer.callback([{target:s.banner,isIntersecting:true,intersectionRatio:0.5}]);
    observer.callback([{target:s.banner,isIntersecting:true,intersectionRatio:1}]);
    assert.equal(s.events.length,1);
    assert.equal(s.events[0][1],'banner_view');
    assert.equal(s.events[0][2].offer_type,offer==='recipe'?'recipe_email':'newsletter');
    assert.equal(observer.unobserved,s.banner);
    vm.runInContext(script,s.context);assert.equal(s.observers.length,1);
  }
});

test('Untracked and local banner visibility emits no fake exposure',()=>{
  for(const s of [setup('localhost',true,'recipe'),setup('airfryergourmand.fr',false,'newsletter')]) {
    s.observers[0].callback([{target:s.banner,isIntersecting:true,intersectionRatio:1}]);
    assert.equal(s.events.length,0);
    assert.equal(s.observers[0].unobserved,undefined);
  }
});
