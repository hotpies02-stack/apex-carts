// Screenshot tool. Usage: node tools/shot.js <track 0|1|2|menu> <outfile.png> [--t=16] [--q=high|med|low|ultra|auto] [--w=1280 --h=720] [--touch] [--site=docs] [--eval="js run before shot"] [--garage]
// Starts a solo race with the player on AI, simulates --t seconds instantly, lets it render ~2.5 s, saves a PNG. Prints console errors and the WebGL renderer.
const {chromium}=require(require('path').join(__dirname,'..','tests','node_modules','playwright'));
const fs=require('fs'),path=require('path'),http=require('http');
const A=process.argv.slice(2),flag=(n,d)=>{const f=A.find(a=>a.startsWith('--'+n+'='));return f?f.split('=').slice(1).join('='):d;};
const track=A[0]||'0',out=A[1]||'shot.png',T=+flag('t',16),Q=flag('q','high'),W=+flag('w',1280),H=+flag('h',720),SITE=path.resolve(flag('site',path.join(__dirname,'..','docs')));
const MIME={html:'text/html',js:'application/javascript',css:'text/css',json:'application/json',glb:'model/gltf-binary',gltf:'model/gltf+json',png:'image/png',jpg:'image/jpeg',webp:'image/webp',svg:'image/svg+xml',mp3:'audio/mpeg',ogg:'audio/ogg',wav:'audio/wav'};
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(SITE,u);if(!f.startsWith(SITE)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.statusCode=404;return r.end('nf');}r.setHeader('content-type',MIME[f.split('.').pop()]||'application/octet-stream');r.end(fs.readFileSync(f));});
(async()=>{await new Promise(r=>srv.listen(0,r));const base='http://localhost:'+srv.address().port+'/';
  const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
  const ctx=await b.newContext({viewport:{width:W,height:H},hasTouch:A.includes('--touch')});const p=await ctx.newPage();const errs=[];
  await p.addInitScript(q=>{try{localStorage.setItem('apex_cfg',JSON.stringify({quality:q}));}catch(e){}},Q);
  if(A.includes('--touch'))await p.addInitScript(()=>{Object.defineProperty(navigator,'maxTouchPoints',{get:()=>5});});
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push(m.text().slice(0,300));});
  await p.route('**fonts.g**',r=>r.abort());
  await p.goto(base,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.__apex,null,{timeout:120000});
  await p.waitForFunction(()=>document.getElementById('load').classList.contains('out'),null,{timeout:120000});
  const gl=await p.evaluate(()=>{const c=document.createElement('canvas').getContext('webgl2'),e=c&&c.getExtension('WEBGL_debug_renderer_info');return e?c.getParameter(e.UNMASKED_RENDERER_WEBGL):'?';});
  if(track!=='menu'){await p.evaluate(ti=>__apex.selTrack(ti),+track);await p.waitForTimeout(500);await p.click('#mPlay');await p.waitForTimeout(600);
    await p.evaluate(t=>{const A=__apex;A.karts[0].ai=true;for(let i=0;i<60*t;i++)A.simulate(1/60);},T);}
  else if(A.includes('--garage'))await p.evaluate(()=>{const b=document.querySelector('#nav button[data-tab=garage]');b&&b.click();});
  const ev=flag('eval','');if(ev)await p.evaluate(ev);
  await p.waitForTimeout(2500);await p.screenshot({path:out});
  const fps=await p.evaluate(()=>new Promise(r=>{let n=0;const t0=performance.now();(function f(){n++;if(performance.now()-t0<2000)requestAnimationFrame(f);else r(Math.round(n/2));})();}));
  console.log(JSON.stringify({out,gl,fps,errs:errs.slice(0,6)}));await b.close();srv.close();})().catch(e=>{console.error(e);process.exit(1);});
