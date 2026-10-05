import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initNewsletterPopup } from '../src/lib/newsletter-popup.mjs';
function setup(saved={}, automatic=true) {
  const handlers={}, callbacks=new Map(), events=[];let now=0,id=0;
  const doc={hidden:false,activeElement:null,documentElement:{dataset:{}},handlers:{},addEventListener(n,f){this.handlers[n]=f;},querySelector(s){return s==='dialog[open]'&&dialog.open?dialog:null;}};
  const frame={src:'',dataset:{newsletterUrl:'https://preview.mailerlite.io/forms/test/share'}};
  const close={addEventListener(n,f){this[n]=f;}};
  const dialog={dataset:{},ownerDocument:doc,open:false,handlers:{},hasAttribute(){return automatic;},querySelector(s){return s==='iframe'?frame:close;},showModal(){this.open=true;},close(){this.open=false;this.handlers.close?.();},addEventListener(n,f){this.handlers[n]=f;}};
  const env={performance:{now:()=>now},location:{hostname:'localhost',pathname:'/recettes/test/'},sessionStorage:{getItem:k=>saved[k],setItem:(k,v)=>saved[k]=v},setInterval:f=>{callbacks.set(++id,f);return id;},clearInterval:i=>callbacks.delete(i),addEventListener:(n,f)=>handlers[n]=f,gtag:(...args)=>events.push(args)};
  const advance=s=>{for(let i=0;i<s;i++){now+=1000;for(const f of callbacks.values())f();}};
  initNewsletterPopup(dialog,env);return {doc,dialog,frame,env,advance,saved,handlers,callbacks,events,close};
}
test('The entry popup waits five visible seconds, keeps the visitor on site and opens once per session',()=>{
  const s=setup();s.advance(4);assert.equal(s.frame.src,'');s.advance(1);assert.ok(s.dialog.open);assert.match(s.frame.src,/preview.mailerlite/);
  s.dialog.close();s.advance(30);assert.ok(!s.dialog.open);const next=setup(s.saved);next.advance(30);assert.ok(!next.dialog.open);
});
test('Background time and focused inputs do not interrupt the visitor',()=>{
  const s=setup();s.doc.hidden=true;s.advance(100);assert.ok(!s.dialog.open);s.doc.hidden=false;s.doc.activeElement={tagName:'INPUT'};s.advance(5);assert.ok(!s.dialog.open);s.doc.activeElement=null;s.advance(1);assert.ok(s.dialog.open);
});
test('A newsletter link opens the existing dialog without redirecting, even after dismissal',()=>{
  const s=setup({},false);s.advance(10);assert.ok(!s.dialog.open);let prevented=false,focused=false;
  const trigger={focus(){focused=true;}};const event={target:{closest:()=>trigger},preventDefault(){prevented=true;}};
  s.doc.handlers.click(event);assert.ok(prevented&&s.dialog.open);s.close.click();assert.ok(focused);s.doc.handlers.click(event);assert.ok(s.dialog.open);
});
test('Modified clicks and unavailable dialogs preserve the internal fallback link',()=>{
  for(const modify of [e=>e.ctrlKey=true,e=>e.metaKey=true,e=>e.button=1,e=>e.defaultPrevented=true]){
    const s=setup({},false);const event={target:{closest:()=>({})},preventDefault(){throw Error('redirect prevented');}};modify(event);s.doc.handlers.click(event);assert.ok(!s.dialog.open);
  }
  const s=setup({},false);s.dialog.showModal=undefined;s.doc.handlers.click({target:{closest:()=>({})},preventDefault(){throw Error('fallback blocked');}});
});
test('History restoration restarts only one clock and initialization is idempotent',()=>{
  const s=setup();s.advance(2);s.handlers.pagehide();s.advance(200);s.handlers.pageshow({persisted:true});s.handlers.pageshow({persisted:true});assert.equal(s.callbacks.size,1);s.advance(3);assert.ok(s.dialog.open);initNewsletterPopup(s.dialog,s.env);assert.equal(s.callbacks.size,1);
});
test('Storage denial does not break the popup and local checks send no analytics',()=>{
  const s=setup();s.env.sessionStorage.setItem=()=>{throw Error('blocked');};s.advance(5);assert.ok(s.dialog.open);assert.equal(s.events.length,0);
});
