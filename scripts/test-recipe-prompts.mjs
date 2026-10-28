import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initRecipePrompts } from '../src/lib/recipe-prompts.mjs';

function setup(saved = {}) {
  const element = (dataset = {}) => ({ dataset, hidden: true, handlers: {}, addEventListener(n,f){this.handlers[n]=f;}, contains(e){return e === this;}, focus(){doc.activeElement=this;}, setAttribute(){} });
  const doc = { hidden:false, activeElement:null, documentElement:{scrollHeight:3000}, handlers:{}, addEventListener(n,f){this.handlers[n]=f;}, querySelector(){return heading;} };
  const heading=element(), newsletter=element({prompt:'newsletter'}), book=element({prompt:'book'}), open=element(), close=element(), dismiss=element(), bookLink=element();
  open.closest=selector=>selector==='[data-recipe-email-open]'?open:null;
  const dialog=element();dialog.open=false;dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;dialog.handlers.close();};
  const frame={src:'',dataset:{newsletterUrl:'https://preview.mailerlite.io/forms/test/share'}};
  const nodes={'[data-prompt="newsletter"]':newsletter,'[data-prompt="book"]':book,dialog,iframe:frame,'[data-newsletter-open]':open,'[data-newsletter-close]':close};
  const root={dataset:{},ownerDocument:doc,querySelector:s=>nodes[s],querySelectorAll:s=>s==='[data-prompt-close]'?[dismiss]:[bookLink]};
  let now=0, intervalId=0;const intervals=new Map(), events=[], handlers={};
  const env={performance:{now:()=>now},scrollY:400,innerHeight:800,location:{hostname:'127.0.0.1',pathname:'/recettes/test/'},sessionStorage:{getItem:k=>saved[k],setItem:(k,v)=>{saved[k]=v;}},setInterval:f=>{intervals.set(++intervalId,f);return intervalId;},clearInterval:id=>intervals.delete(id),addEventListener:(n,f)=>{handlers[n]=f;},gtag:(...args)=>events.push(args)};
  initRecipePrompts(root,env);
  const advance=seconds=>{for(let i=0;i<seconds;i++){now+=1000;for(const tick of intervals.values())tick();}};
  const requestRecipe=()=>doc.handlers.click({target:open});
  return {root,doc,env,newsletter,book,dialog,frame,open,close,dismiss,bookLink,advance,events,saved,handlers,intervals,requestRecipe};
}

test('Newsletter waits for reading and books wait for 120 visible seconds',()=>{
  const s=setup();s.env.scrollY=0;s.advance(30);assert.ok(s.newsletter.hidden);
  s.env.scrollY=400;s.advance(1);assert.ok(!s.newsletter.hidden);
  s.advance(88);assert.ok(s.book.hidden);s.advance(1);assert.ok(!s.book.hidden);assert.ok(s.newsletter.hidden);
  assert.equal(s.events.length,0);
});
test('Background time never triggers an invitation',()=>{
  const s=setup();s.doc.hidden=true;s.advance(200);assert.ok(s.newsletter.hidden&&s.book.hidden);
  s.doc.hidden=false;s.advance(120);assert.ok(!s.book.hidden);
});
test('Recipe invitation delegates to the recipe form without loading the newsletter',()=>{
  const s=setup();s.advance(30);assert.equal(s.frame.src,'');
  s.requestRecipe();assert.ok(!s.dialog.open);assert.ok(s.newsletter.hidden);
  assert.equal(s.frame.src,'');
  const recipeDialog={open:true};s.doc.querySelector=selector=>selector==='dialog[data-recipe-email][open]'?recipeDialog:null;
  s.advance(100);assert.ok(s.book.hidden);
  recipeDialog.open=false;s.advance(1);assert.ok(!s.book.hidden);
});
test('Dismissed prompts do not reopen across recipes in the same session',()=>{
  const saved={};const s=setup(saved);s.advance(30);s.dismiss.handlers.click();s.advance(90);s.dismiss.handlers.click();
  const next=setup(saved);next.advance(200);assert.ok(next.newsletter.hidden&&next.book.hidden);
});
test('Focused controls and active form input are not interrupted',()=>{
  const s=setup();s.doc.activeElement={tagName:'INPUT'};s.advance(120);assert.ok(s.book.hidden);
  s.doc.activeElement=null;s.advance(1);assert.ok(!s.book.hidden);
});
test('Without session storage, prompts still appear once per page',()=>{
  const s=setup();s.env.sessionStorage.setItem=()=>{throw Error('blocked');};s.advance(30);s.dismiss.handlers.click();s.advance(90);s.dismiss.handlers.click();s.advance(200);assert.ok(s.newsletter.hidden&&s.book.hidden);
});
test('Returning from the back-forward cache resumes visible reading without counting time away',()=>{
  const s=setup();s.advance(20);s.handlers.pagehide();s.advance(300);
  assert.ok(s.newsletter.hidden&&s.book.hidden);assert.equal(s.intervals.size,0);
  s.handlers.pageshow({persisted:true});s.handlers.pageshow({persisted:true});
  assert.equal(s.intervals.size,1);s.advance(9);assert.ok(s.newsletter.hidden);
  s.advance(1);assert.ok(!s.newsletter.hidden);
  s.handlers.pagehide();s.advance(300);s.handlers.pageshow({persisted:true});
  s.advance(89);assert.ok(s.book.hidden);s.advance(1);assert.ok(!s.book.hidden);
});
test('Missed impressions do not suppress a later page and neither card auto-hides',()=>{
  const saved={};const s=setup(saved);s.advance(100);assert.ok(!s.newsletter.hidden);
  assert.deepEqual(saved,{});s.advance(20);assert.ok(!s.book.hidden);
  s.advance(200);assert.ok(!s.book.hidden);assert.deepEqual(saved,{});
  const next=setup(saved);next.advance(30);assert.ok(!next.newsletter.hidden);
});
test('Legacy impression flags no longer suppress invitations',()=>{
  const s=setup({afg_prompt_v1_newsletter:'1',afg_prompt_v1_book:'1'});
  s.advance(30);assert.ok(!s.newsletter.hidden);s.advance(90);assert.ok(!s.book.hidden);
});
test('Newsletter CTA, book CTA and Escape preserve intentional session suppression',()=>{
  const saved={};const s=setup(saved);s.advance(30);s.requestRecipe();
  s.close.handlers.click();s.advance(90);s.bookLink.handlers.click();
  const next=setup(saved);next.advance(120);assert.ok(next.newsletter.hidden&&next.book.hidden);
  const escaped=setup();escaped.advance(30);escaped.doc.handlers.keydown({key:'Escape'});
  const afterEscape=setup(escaped.saved);afterEscape.advance(30);assert.ok(afterEscape.newsletter.hidden);
});
