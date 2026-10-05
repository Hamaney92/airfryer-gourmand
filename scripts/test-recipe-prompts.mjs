import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initRecipePrompts } from '../src/lib/recipe-prompts.mjs';

function setup(saved = {}) {
  const element = (dataset = {}) => ({ dataset, hidden: true, handlers: {}, addEventListener(n,f){this.handlers[n]=f;}, contains(e){return e === this;}, focus(){doc.activeElement=this;}, setAttribute(){} });
  const doc = { hidden:false, activeElement:null, documentElement:{scrollHeight:3000}, handlers:{}, addEventListener(n,f){this.handlers[n]=f;}, querySelector(){return heading;} };
  const heading=element(), newsletter=element({prompt:'newsletter'}), book=element({prompt:'book'}), open=element(), close=element(), dismiss=element();
  open.closest=()=>newsletter.hidden?newsletter:null;
  const dialog=element();dialog.open=false;dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;dialog.handlers.close();};
  const frame={src:'',dataset:{newsletterUrl:'https://preview.mailerlite.io/forms/test/share'}};
  const nodes={'[data-prompt="newsletter"]':newsletter,'[data-prompt="book"]':book,dialog,iframe:frame,'[data-newsletter-open]':open,'[data-newsletter-close]':close};
  const root={dataset:{},ownerDocument:doc,querySelector:s=>nodes[s],querySelectorAll:()=>[dismiss]};
  let now=0, tick;const events=[];
  const env={performance:{now:()=>now},scrollY:400,innerHeight:800,location:{hostname:'127.0.0.1',pathname:'/recettes/test/'},sessionStorage:{getItem:k=>saved[k],setItem:(k,v)=>{saved[k]=v;}},setInterval:f=>{tick=f;return 1;},clearInterval(){},addEventListener(){},gtag:(...args)=>events.push(args)};
  initRecipePrompts(root,env);
  const advance=seconds=>{for(let i=0;i<seconds;i++){now+=1000;tick();}};
  return {root,doc,env,newsletter,book,dialog,frame,open,close,dismiss,advance,events,saved};
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
test('The signup form is loaded only on request and prevents a competing offer',()=>{
  const s=setup();s.advance(30);assert.equal(s.frame.src,'');
  s.open.handlers.click({currentTarget:s.open});assert.ok(s.dialog.open);assert.ok(s.newsletter.hidden);
  assert.match(s.frame.src,/preview.mailerlite.io/);s.advance(100);assert.ok(s.book.hidden);
  s.close.handlers.click();s.advance(1);assert.ok(!s.book.hidden);
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
