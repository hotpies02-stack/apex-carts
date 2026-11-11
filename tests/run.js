// Apex Carts test suite. Run:  cd tests && npm install && npx playwright install chromium && npm test
// Flags: --fast (one track only), --shots (save screenshots to tests/out), --headed (visible browser, real GPU)
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const http=require('http');
const FAST=process.argv.includes('--fast'),SHOTS=process.argv.includes('--shots'),HEADED=process.argv.includes('--headed');
const GAME=path.join(__dirname,'..','index.html'),OUT=path.join(__dirname,'out');
const three=fs.readFileSync(path.join(__dirname,'node_modules/three/build/three.min.js'));
const peerReal=fs.readFileSync(path.join(__dirname,'node_modules/peerjs/dist/peerjs.min.js'));
const peerFake=fs.readFileSync(path.join(__dirname,'fakepeer.js'));
if(SHOTS)fs.mkdirSync(OUT,{recursive:true});
let pass=0,fail=0;const results=[];
function ok(name,cond,info){(cond?pass++:fail++);results.push((cond?'PASS ':'FAIL ')+name+(info!==undefined?'  '+info:''));console.log(results[results.length-1]);}
const srv=http.createServer((q,r)=>{r.setHeader('content-type','text/html');r.end(fs.readFileSync(GAME));});
const args=HEADED?['--ignore-gpu-blocklist']:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'];
async function open(ctx,base,url,{touch=false,low=true,fake=false,errs}={}){
  const p=await ctx.newPage();
  await p.addInitScript(l=>{try{if(l)localStorage.setItem('apex_cfg',JSON.stringify({quality:'low'}));}catch(e){}},low);
  if(touch)await p.addInitScript(()=>{Object.defineProperty(navigator,'maxTouchPoints',{get:()=>5});});
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push('console.error '+m.text().slice(0,200));});
  await p.route('**/three.min.js',r=>r.fulfill({body:three,contentType:'application/javascript'}));
  await p.route('**/peerjs.min.js',r=>r.fulfill({body:fake?peerFake:peerReal,contentType:'application/javascript'}));
  await p.route('**fonts.g**',r=>r.abort());
  await p.goto(base+url,{waitUntil:'domcontentloaded',timeout:120000});
  await p.waitForFunction(()=>window.__apex,null,{timeout:150000});await p.waitForTimeout(800);return p;}
(async()=>{
  await new Promise(r=>srv.listen(0,r));const base='http://localhost:'+srv.address().port+'/';
  const b=await chromium.launch({headless:!HEADED,args});
  // ---------- 1. boot + menu ----------
  {const ctx=await b.newContext({viewport:{width:1280,height:720}});const errs=[];
   const p=await open(ctx,base,'',{low:false,errs});
   await p.waitForFunction(()=>document.getElementById('load').classList.contains('out'),null,{timeout:150000});
   ok('boot: no console/page errors',errs.length===0,errs.slice(0,3).join(' | '));
   ok('boot: debug handle + 3 tracks',await p.evaluate(()=>!!window.__apex&&__apex.TRACKS.length===3));
   const tabs=await p.evaluate(()=>[...document.querySelectorAll('#nav button[data-tab]')].map(b=>b.dataset.tab));
   ok('menu: tabs present',tabs.length>=3,tabs.join(','));
   for(const t of tabs){await p.click('#nav button[data-tab='+t+']');await p.waitForTimeout(150);}
   ok('menu: switching all tabs causes no errors',errs.length===0,errs.slice(0,3).join(' | '));
   if(SHOTS)await p.screenshot({path:path.join(OUT,'menu.png')});await ctx.close();}
  // ---------- 2. full 3-lap AI race on every track ----------
  {const ctx=await b.newContext({viewport:{width:960,height:540}});const errs=[];
   const p=await open(ctx,base,'',{errs});
   for(let ti=0;ti<(FAST?1:3);ti++){
     await p.evaluate(ti=>__apex.selTrack(ti),ti);await p.click('#nav button[data-tab]');
     await p.evaluate(()=>{const b=document.querySelector('#nav button[data-tab=play]')||document.querySelector('#nav button[data-tab]');b.click();});
     await p.click('#mPlay');await p.waitForTimeout(600);
     const r=await p.evaluate(()=>{const A=__apex;A.karts[0].ai=true;let steps=0,maxS=0,nan=false;
       while(A.race.state!=='done'&&steps<60*420){A.simulate(1/60);steps++;for(const k of A.karts){maxS=Math.max(maxS,k.spd);if(!isFinite(k.x)||!isFinite(k.z))nan=true;}}
       return {state:A.race.state,steps,maxS,nan,n:A.karts.length,res:(A.race.results||[]).length};});
     const nm=['alpine','desert','neon'][ti];
     ok(nm+': 6 racers',r.n===6,r.n);
     ok(nm+': race finishes',r.state==='done',(r.steps/60|0)+'s sim');
     ok(nm+': 6 results',r.res===6,r.res);
     ok(nm+': top speed sane (20-120 m/s)',r.maxS>20&&r.maxS<120,r.maxS.toFixed(1));
     ok(nm+': no NaN positions',!r.nan);
     if(SHOTS){await p.waitForTimeout(1500);await p.screenshot({path:path.join(OUT,'result_'+nm+'.png')});}
     await p.click('#rAgain');await p.waitForTimeout(400);
     await p.evaluate(()=>{const A=__apex;A.karts[0].ai=true;for(let i=0;i<60*16;i++)A.simulate(1/60);});
     await p.waitForTimeout(1500);if(SHOTS)await p.screenshot({path:path.join(OUT,'race_'+nm+'.png')});
     await p.evaluate(()=>document.getElementById('hbMenu').click());await p.waitForTimeout(200);await p.click('#pQuit');await p.waitForTimeout(300);}
   ok('races: no console/page errors',errs.length===0,errs.slice(0,3).join(' | '));await ctx.close();}
  // ---------- 3. multiplayer: TV host + phone controller + viewer (mock PeerJS) ----------
  {const ctx=await b.newContext({viewport:{width:480,height:270}});const errs=[];
   const H=await open(ctx,base,'',{fake:true,errs});
   await H.click('#nav button[data-tab=multi]');await H.click('#mHost');await H.waitForTimeout(400);
   await H.click('#hostSeg button[data-m=tv]');const code=await H.textContent('#hCode');
   ok('mp: host room code format',/^CART-\d{4}$/.test((code||'').trim()),code);
   const P1=await open(ctx,base,'?room='+code.trim()+'&role=controller',{fake:true,touch:true,errs});await P1.click('#jGo');
   const V=await open(ctx,base,'?room='+code.trim()+'&role=viewer',{fake:true,errs});await H.waitForTimeout(600);
   await H.click('#hStart');await H.waitForTimeout(2500);
   ok('mp: intro runs on host',await H.evaluate(()=>__apex.race.state)==='intro');
   await P1.evaluate(()=>document.getElementById('bGas').dispatchEvent(new PointerEvent('pointerdown',{pointerId:5,bubbles:true})));
   await H.waitForFunction(()=>__apex.race.state==='race'&&__apex.race.t>4,null,{timeout:150000});
   const h=await H.evaluate(()=>__apex.karts.map(k=>({h:k.human,s:k.spd})));
   ok('mp: TV host has 6 karts, exactly 1 human (the controller)',h.length===6&&h.filter(k=>k.h).length===1,JSON.stringify(h.map(k=>k.h?1:0)));
   ok('mp: host karts moving',h.some(k=>k.s>3));
   const pc=await P1.evaluate(()=>({st:__apex.race.state,cv:getComputedStyle(document.getElementById('c')).display}));
   ok('mp: controller in race, no 3D canvas',pc.st==='race'&&pc.cv==='none',JSON.stringify(pc));
   ok('mp: viewer in race',await V.evaluate(()=>__apex.race.state)==='race');
   ok('mp: no console/page errors',errs.length===0,errs.slice(0,3).join(' | '));
   if(SHOTS)await V.screenshot({path:path.join(OUT,'mp_viewer.png')});await ctx.close();}
  await b.close();srv.close();
  console.log('\n'+pass+' passed, '+fail+' failed');process.exit(fail?1:0);
})().catch(e=>{console.error('SUITE CRASH',e);process.exit(2);});
