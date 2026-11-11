/* ---------------- menus & flow ---------------- */
const screens=['sMenu','sHost','sJoin','sPause','sRes','sPwa'];
function showScreen(id){for(const s of screens)$(s).classList.toggle('hide',s!==id);if(id){const b=$(id).querySelector('.btn.pri');if(b&&!isTouch)setTimeout(()=>b.focus(),30);}}
function loadTrack(ti){perfSkip=3;Probe.reset();buildTrack(ti);applyHDR();Post.cut();views.forEach(v=>v.init=false);for(const k of karts)k.reset(0,0);const s=race.state;gridUp();race.state=s==='idle'?'idle':s;
  for(const m of rocketMeshes)m.visible=false;for(const m of trapMeshes)m.visible=false;}
function lbGet(){return store.get('lb',{});}
function lbAdd(id,t,name){if(!(t>0))return;const lb=lbGet(),a=lb[id]||[];a.push({t:r2(t*10)/10,n:name,d:new Date().toISOString().slice(0,10)});a.sort((x,y)=>x.t-y.t);lb[id]=a.slice(0,5);store.set('lb',lb);}
function drawLB(){const lb=lbGet();$('lbAll').innerHTML=TRACKS.map(t=>{const a=lb[t.id]||[];return '<div class="lbt"><h4>'+t.name+'</h4><table>'+(a.length?a.map((e,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(e.n)+'</td><td>'+e.d+'</td><td>'+fmt(e.t)+'</td></tr>').join(''):'<tr><td class="note">No laps recorded yet.</td></tr>')+'</table></div>';}).join('');
  document.querySelectorAll('.tk .bl').forEach((el,i)=>{const a=lb[TRACKS[i].id];el.textContent=a&&a.length?'BEST '+fmt(a[0].t):'NO RECORD';});}

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hex=c=>'#'+PAINTS[c%8].toString(16).padStart(6,'0');
function drawList(el,r){el.innerHTML=r.map((e,i)=>'<tr'+(i===G.my?' class="me"':'')+'><td>'+(i+1)+'</td><td><i class="dot" style="background:'+hex(e.c)+'"></i>'+esc(e.n)+'</td><td>'+({ai:'AI',host:'Host',player:'Player',ctl:'Controller'}[e.k]||'')+'</td></tr>').join('');}
function drawHostList(){if(G.mode!=='host')return;drawList($('hList'),roster());let v=0;for(const c of Net.clients.values())if(c.role==='viewer')v++;if(G.code&&$('hCode').textContent===G.code)$('hStat').textContent='Room open · '+Net.clients.size+' connected'+(v?' ('+v+' viewer'+(v>1?'s':'')+')':'');}
/* ---------------- menu, garage, settings ---------------- */
const TABS=[['race','Race','flag'],['multi','Multiplayer','users'],['garage','Garage','wrench'],['records','Records','trophy'],['settings','Settings','gear']];
const SET={graphics:[['quality','Quality preset','seg',[['auto','Auto'],['low','Low'],['med','Medium'],['high','High'],['ultra','Ultra']],'Auto adapts resolution to hold a steady frame rate'],
  ['scale','Render scale','range',[.5,1,.05]],['shadows','Dynamic shadows','tog'],['post','HDR post-processing','tog',0,'HDR bloom, filmic tone mapping, grading, atmosphere'],['ao','Ambient occlusion','tog',0,'Contact shadows in creases and under objects'],['ssr','Screen-space reflections','tog',0,'Wet asphalt and ice mirror lights and carts'],['bloom','Bloom intensity','range',[0,1.6,.05]],
  ['rays','Light shafts & lens flare','tog'],['mblur','Motion blur','tog'],['refl','Real-time reflections','tog',0,'Live environment reflections on paint and wet asphalt'],['fps','Performance overlay','tog']],
 audio:[['vMaster','Master volume','range',[0,1,.05]],['vMusic','Music','range',[0,1,.05]],['vSfx','Effects & engine','range',[0,1,.05]]],
 controls:[['steer','Touch steering','seg',[['joy','Stick'],['btn','Buttons'],['gyro','Tilt']]],['sens','Steering sensitivity','range',[.5,1.5,.05]],['autoGas','Auto-accelerate','tog',0,'Throttle stays on unless you brake'],['vib','Vibration','tog']],
 gameplay:[['laps','Race length','seg',[[1,'1 lap'],[3,'3 laps'],[5,'5 laps']]],['diff','AI difficulty','seg',[[0,'Rookie'],[1,'Pro'],[2,'Elite']]],['items','Items','tog'],['units','Speed units','seg',[['kmh','km/h'],['mph','mph']]],
  ['intro','Track fly-in','tog'],['mini','Minimap','tog'],['camDist','Camera distance','range',[.8,1.5,.05]]]};
const FIN=[[.35,.4,1,.07],[.85,.3,1,.05],[.1,.78,0,.4],[1,.1,1,.03]];
let setTabN='graphics';
function ctlHTML(o){const[k,label,type,arg,hint]=o,v=CFG[k];let c='';
  if(type==='seg')c='<div class="seg">'+arg.map(a=>'<button data-k="'+k+'" data-v=\''+JSON.stringify(a[0])+'\''+(a[0]===v?' class="on"':'')+'>'+a[1]+'</button>').join('')+'</div>';
  else if(type==='tog')c='<button class="tog'+(v?' on':'')+'" data-k="'+k+'" data-t="1" aria-label="'+label+'"></button>';
  else c='<span><input type="range" data-k="'+k+'" min="'+arg[0]+'" max="'+arg[1]+'" step="'+arg[2]+'" value="'+v+'" style="--p:'+((v-arg[0])/(arg[1]-arg[0])*100)+'%"><span class="rv">'+Math.round(v*100)+'%</span></span>';
  return '<div class="opt"><label>'+label+(hint?'<small>'+hint+'</small>':'')+'</label>'+c+'</div>';}
function drawSettings(){$('setNav').innerHTML=Object.keys(SET).map(n=>'<button data-s="'+n+'"'+(n===setTabN?' class="on"':'')+'>'+n+'</button>').join('');
  let h=SET[setTabN].map(ctlHTML).join('');
  if(setTabN==='controls')h+='<div class="keys"><kbd>W A S D</kbd><span>or arrow keys — drive and steer</span><kbd>SPACE</kbd><span>drift / handbrake — hold through a corner for a mini-boost</span><kbd>E</kbd><span>or Shift — use item</span><kbd>R</kbd><span>reset to track</span><kbd>C</kbd><span>camera (TV view)</span><kbd>ESC</kbd><span>pause</span><kbd>GAMEPAD</kbd><span>RT gas · LT brake · X drift · Y item</span></div>';
  $('setBody').innerHTML=h;
  $('raceOpts').innerHTML=[SET.gameplay[0],SET.gameplay[1],SET.gameplay[2]].map(ctlHTML).join('');
  $('garOpts').innerHTML=ctlHTML(['finish','Paint finish','seg',[[0,'Gloss'],[1,'Metallic'],[2,'Matte'],[3,'Chrome']]]);
  $('playSub').textContent='YOU VS 5 AI · '+CFG.laps+(CFG.laps>1?' LAPS':' LAP');}
function applyCFG(k){
  if(k==='quality'||k==null){if(PRESET[CFG.quality])Object.assign(CFG,PRESET[CFG.quality]);else if(k==='quality')Object.assign(CFG,{scale:1,shadows:true,post:true,ao:true,ssr:!isTouch,refl:!isTouch,rays:true});
    const sz=CFG.quality==='ultra'?4096:(CFG.quality==='low'||isTouch)?1024:2048;if(sun.shadow.mapSize.x!==sz){sun.shadow.mapSize.set(sz,sz);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}
    if(k==='quality')resScale=1;}
  if(k&&k!=='quality'&&['scale','shadows','post','ao','ssr','refl','rays'].includes(k)&&CFG.quality!=='auto'&&PRESET[CFG.quality]&&PRESET[CFG.quality][k]!==CFG[k])CFG.quality='auto';
  if(CFG.quality!=='auto'||k==='scale')resScale=CFG.scale;
  if(k==null||['quality','scale','shadows','post','ao','ssr','refl'].includes(k)){for(const q2 in RTQ)RTQ[q2]=true;perfSkip=3;}
  shadowsOn=eff('shadows');sun.castShadow=shadowsOn;Post.on=eff('post');Probe.set(eff('refl')?(CFG.quality==='ultra'?256:128):0);
  Snd.vol();setSteerMode(CFG.steer);$('fps').classList.toggle('hide',!CFG.fps);$('mini').style.visibility=CFG.mini?'':'hidden';
  store.set('cfg',CFG);if(k==null||['quality','scale','post','refl'].includes(k)){resize();applyHDR();}if(k==null||k==='finish'||k==='quality')idleLook();}
function bindOpts(el){el.addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(!b||b.tagName==='INPUT')return;Snd.init();Snd.fx('ui');const k=b.dataset.k;CFG[k]=b.dataset.t?!CFG[k]:JSON.parse(b.dataset.v);applyCFG(k);drawSettings();});
  el.addEventListener('input',e=>{const b=e.target;if(b.type!=='range')return;const k=b.dataset.k;CFG[k]=+b.value;b.style.setProperty('--p',((b.value-b.min)/(b.max-b.min)*100)+'%');b.nextElementSibling.textContent=Math.round(b.value*100)+'%';applyCFG(k);});}
function setTab(n){G.tab=n;document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.tab===n));document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('on',t.id==='tab-'+n));if(n==='records')drawLB();}
function trackThumb(cv,t){const W=cv.width=320,H=cv.height=200,c=cv.getContext('2d'),cps=t.pts.map(p=>{const a=p[0]*Math.PI/180;return new THREE.Vector3(Math.cos(a)*p[1],p[2],Math.sin(a)*p[1]);}),cu=new THREE.CatmullRomCurve3(cps,true,'centripetal'),pts=cu.getPoints(160);
  const g=c.createLinearGradient(0,0,W,H);g.addColorStop(0,t.thumb[0]);g.addColorStop(1,t.thumb[1]);c.fillStyle=g;c.fillRect(0,0,W,H);
  c.globalAlpha=.12;c.strokeStyle='#fff';c.lineWidth=1;for(let x=-H;x<W;x+=18){c.beginPath();c.moveTo(x,H);c.lineTo(x+H,0);c.stroke();}c.globalAlpha=1;
  c.lineJoin='round';for(const[w,s,bl]of[[11,'rgba(0,0,0,.45)',0],[5,t.thumb[2],14],[2,'#fff',0]]){c.lineWidth=w;c.strokeStyle=s;c.shadowColor=t.thumb[2];c.shadowBlur=bl;c.beginPath();for(const p of pts)c.lineTo(W/2+p.x*.31,H/2+p.z*.31);c.closePath();c.stroke();}
  c.shadowBlur=0;c.fillStyle='#fff';c.fillRect(W/2+pts[0].x*.31-3,H/2+pts[0].z*.31-6,6,12);t.lenM=Math.round(cu.getLength());}
function buildMenu(){
  $('nav').innerHTML=TABS.map(t=>'<button data-tab="'+t[0]+'">'+ico(t[2])+t[1]+'</button>').join('');
  document.querySelectorAll('#nav button').forEach(b=>b.onclick=()=>{Snd.init();Snd.fx('ui');setTab(b.dataset.tab);});
  document.querySelectorAll('[data-i]').forEach(e=>{e.outerHTML=ico(e.dataset.i);});
  $('hbCam').innerHTML=ico('cam');$('hbFs').innerHTML=$('mFs').innerHTML=ico('fs');$('hbMenu').innerHTML=ico('menu');$('hbSnd').innerHTML=$('mSnd').innerHTML=ico(Snd.muted?'mute':'snd');
  const tw=$('tracks');TRACKS.forEach((t,i)=>{const b=document.createElement('button');b.className='tk';b.innerHTML='<canvas></canvas><div class="tb2"><b>'+t.name+'</b><em>'+t.desc+'</em><div class="stat"><span>Length</span><i></i></div><div class="stat"><span>Grip</span><i style="--v:'+(t.grip*100)+'%"></i></div><div class="stat"><span>Technical</span><i style="--v:'+(t.tech*100)+'%"></i></div><div class="stat bl" style="color:var(--gold);margin-top:.8em"></div></div>';
    tw.appendChild(b);trackThumb(b.querySelector('canvas'),t);b.querySelector('.stat i').style.setProperty('--v',clamp(t.lenM/1700*100,0,100)+'%');b.querySelector('.stat span').textContent=(t.lenM/1000).toFixed(2)+' KM';
    b.onclick=()=>{Snd.init();Snd.fx('ui');selTrack(i);};});
  const sw=$('swatches');PAINTS.forEach((c,i)=>{const b=document.createElement('button');b.className='sw';b.style.background=b.style.color=hex(i);b.title='Paint '+(i+1);b.onclick=()=>{Snd.init();Snd.fx('ui');selColor(i);};sw.appendChild(b);});
  const pn=$('pname');pn.value=G.name==='Player'?'':G.name;pn.oninput=()=>{G.name=pn.value.trim().slice(0,10)||'Player';store.set('name',G.name);idleLook();};
  for(const id of['setBody','raceOpts','garOpts'])bindOpts($(id));
  $('setNav').onclick=e=>{const b=e.target.closest('[data-s]');if(b){setTabN=b.dataset.s;Snd.fx('ui');drawSettings();}};
  $('setReset').onclick=()=>{Object.assign(CFG,CFG_DEF);applyCFG(null);drawSettings();toast('Settings reset');};
  $('ctlHelp').innerHTML=isTouch?'Touch controls · gamepads supported · add to home screen for full-screen play':'<b>WASD</b> drive · <b>SPACE</b> drift · <b>E</b> item · <b>ESC</b> pause · gamepads supported';
  $('mPlay').onclick=startSolo;$('mHost').onclick=hostOpen;$('mJoin').onclick=()=>openJoin('player');$('mView').onclick=()=>openJoin('viewer');
  $('mFs').onclick=$('hbFs').onclick=toggleFS;$('mSnd').onclick=$('hbSnd').onclick=doMute;$('hbCam').onclick=cycleCam;$('hbMenu').onclick=togglePause;
  $('mPwa').onclick=()=>showScreen('sPwa');$('pwaBack').onclick=()=>showScreen('sMenu');$('pwaSave').onclick=saveOffline;
  $('pwaInstall').onclick=()=>{if(installEvt){installEvt.prompt();installEvt=null;}else toast('Use the browser menu ⋮ → “Add to Home screen” / “Install app”',4500);};
  $('hBack').onclick=exitToMenu;$('hStart').onclick=hostStart;$('hCopy').onclick=()=>{const v=$('hLink').value;if(navigator.clipboard)navigator.clipboard.writeText(v).then(()=>toast('Link copied'),()=>toast(v,5000));else{$('hLink').select();toast('Select and copy the link');}};
  document.querySelectorAll('#hostSeg button').forEach(b=>b.onclick=()=>{if(setHostSeat(b.dataset.m==='race'))pushRoster();});
  $('jBack').onclick=exitToMenu;$('jGo').onclick=()=>{const c=normCode($('code').value);if(!c){$('jStat').textContent='Enter a code like CART-1234.';return;}
    const role=Net.joinRole==='viewer'?'viewer':$('jCtl').checked?'ctl':'player';if(isTouch&&role!=='viewer')goFS();joinRoom(c,role);};
  $('code').addEventListener('keydown',e=>{if(e.key==='Enter')$('jGo').click();});
  $('pResume').onclick=togglePause;$('pQuit').onclick=exitToMenu;$('pRestart').onclick=()=>{G.paused=false;if(G.mode==='host')hostStart();else startSolo();};
  $('rMenu').onclick=exitToMenu;$('rAgain').onclick=()=>{if(G.mode==='host')hostStart();else if(G.mode==='solo')startSolo();};
  $('rotOk').onclick=()=>document.body.classList.add('norot');
  document.addEventListener('pointerover',e=>{const b=e.target.closest&&e.target.closest('button');if(b&&b!==hoverB){hoverB=b;if(Snd.ok&&!document.body.classList.contains('racing'))Snd.fx('hover');}else if(!b)hoverB=null;});
  drawSettings();setTab('race');selTrack(G.track,true);selColor(G.color);applyCFG(null);drawLB();
}
let hoverB=null;
function idleLook(){$('profName').textContent=G.name;$('profDot').style.background=hex(G.color);if(race.state!=='idle')return;karts.forEach((k,i)=>{if(i===0)k.setLook(G.name,G.color,true);else k.setLook(AI_NAMES[i],(G.color+i)%8,false);});paintFinish(karts[0]);}
function paintFinish(k){if(!k)return;const f=FIN[CFG.finish]||FIN[0];for(const p of k.m.paints){p.metalness=f[0];p.roughness=f[1];p.clearcoat=f[2];p.clearcoatRoughness=f[3];}}
function selTrack(i,force){const need=!T||T.ti!==i;G.track=i;store.set('track',i);document.querySelectorAll('.tk').forEach((b,n)=>b.classList.toggle('on',n===i));
  const go=()=>{if(!T||T.ti!==i)loadTrack(i);idleLook();if(G.mode==='host')pushRoster();loading(false);};
  if(need&&!force){loading(true,'Building '+TRACKS[i].name+'…');setTimeout(go,60);}else go();}
function loading(on,tip){const l=$('load');if(tip)$('loadTip').textContent=tip;l.classList.toggle('out',!on);}
function selColor(i){G.color=i;store.set('color',i);document.querySelectorAll('.sw').forEach((b,n)=>b.classList.toggle('on',n===i));idleLook();}

function openJoin(role){Snd.init();Net.joinRole=role;showScreen('sJoin');$('jTitle').textContent=role==='viewer'?'Join as TV viewer':'Join as player';$('jCtlRow').classList.toggle('hide',role==='viewer');
  $('jGo').classList.remove('hide');$('jList').innerHTML='';$('jStat').textContent='Enter the code shown on the host screen.';G.mode='joining';}
function startSolo(){Snd.init();G.mode='solo';G.role='player';G.my=0;G.paused=false;if(!T||T.ti!==G.track)loadTrack(G.track);
  karts.forEach((k,i)=>{if(i===0)k.setLook(G.name,G.color,true);else k.setLook(AI_NAMES[i],(G.color+i)%8,false);});
  if(isTouch)goFS();LAPS=CFG.laps;race.diff=CFG.diff;race.items=CFG.items;gridUp();if(!CFG.intro)race.intro=INTRO_T;enterRace();}
function hostStart(){if(G.mode!=='host')return;G.role='player';G.paused=false;if(!T||T.ti!==G.track)loadTrack(G.track);
  setHostSeat(!G.hostTV);const r=roster();karts.forEach(k=>{k.finished=false;});applyRoster(r);LAPS=CFG.laps;race.diff=CFG.diff;race.items=CFG.items;gridUp();if(!CFG.intro)race.intro=INTRO_T;broadcast({t:'start',track:G.track,r,laps:LAPS,items:race.items?1:0});if(isTouch&&!G.hostTV)goFS();enterRace();}
let wakeLock=null;
function enterRace(){showScreen(null);G.paused=false;$('hud').classList.remove('hide');const b=document.body;b.classList.add('racing');b.classList.remove('norot');
  b.classList.toggle('ctl',G.role==='ctl'&&G.mode==='client');b.classList.toggle('spec',spectating());$('board').classList.toggle('hide',!spectating());
  $('hbCam').classList.toggle('hide',!spectating());$('tvCode').textContent=G.code&&G.mode!=='solo'?'ROOM / TV CODE  '+G.code:'';
  views.forEach(v=>v.init=false);G.camMode=0;Snd.music('menu');Snd.fx('intro');$('introName').textContent=T.def.name;$('introSub').textContent=LAPS+(LAPS>1?' LAPS':' LAP')+' · 6 RACERS';karts.forEach(k=>{k.m.g.visible=true;});if(G.my>=0)paintFinish(karts[G.my]);$('introDesc').textContent=T.def.desc;for(const k in hudC)delete hudC[k];$('msg').classList.remove('on');
  try{if(navigator.wakeLock&&!wakeLock)navigator.wakeLock.request('screen').then(w=>{wakeLock=w;w.addEventListener('release',()=>wakeLock=null);}).catch(()=>{});}catch(e){}}
function exitToMenu(){const me=karts[G.my];if(me&&me.bestLap&&race.state==='race'&&T)lbAdd(T.def.id,me.bestLap,G.name);
  netClose();G.mode='menu';G.role='player';G.my=0;G.paused=false;G.code='';race.state='idle';race.results=null;rockets.length=0;traps.length=0;
  document.body.classList.remove('racing','ctl','spec','intro');$('hud').classList.add('hide');$('warp').style.opacity=0;nViews=1;layoutViews();
  gridUp();race.state='idle';idleLook();showScreen('sMenu');drawLB();Snd.music('menu');Snd.drive(false);}
function togglePause(){if(race.state==='idle')return;const open=!$('sPause').classList.contains('hide');
  if(open){showScreen(race.state==='done'&&race.results?'sRes':null);G.paused=false;return;}
  if(!$('sRes').classList.contains('hide'))return;
  G.paused=G.mode==='solo';$('pTitle').textContent=G.mode==='solo'?'Paused':'Menu (race continues)';$('pRestart').classList.toggle('hide',G.mode==='client');showScreen('sPause');}
function doMute(){Snd.init();const m=Snd.toggle();$('hbSnd').innerHTML=$('mSnd').innerHTML=ico(m?'mute':'snd');}
function goFS(){const el=document.documentElement,rq=el.requestFullscreen||el.webkitRequestFullscreen;if(!rq||document.fullscreenElement||document.webkitFullscreenElement)return lockLand();
  try{const p=rq.call(el,{navigationUI:'hide'});if(p&&p.then)p.then(lockLand,()=>{});else lockLand();}catch(e){}}
function lockLand(){try{if(isTouch&&screen.orientation&&screen.orientation.lock)screen.orientation.lock('landscape').catch(()=>{});}catch(e){}}
function toggleFS(){if(document.fullscreenElement||document.webkitFullscreenElement){(document.exitFullscreen||document.webkitExitFullscreen).call(document);}else goFS();}
function onRaceEnd(){const me=karts[G.my];if(me&&me.bestLap&&!spectating())lbAdd(T.def.id,me.bestLap,G.name);
  if(G.mode==='host')broadcast({t:'end',res:race.results});
  setTimeout(()=>{if(race.state!=='done'||!race.results)return;const R=race.results,t0=R[0].t||R[0].e;$('rTrack').textContent=T.def.name;
    const pc=['#ffc83d','#cfd6e4','#d08a4e'],ord=[1,0,2];
    $('rPod').innerHTML=ord.map(i=>{const e=R[i];return e?'<div class="pod'+(i===0?' p1':'')+'" style="--c:'+pc[i]+'"><b>'+(i+1)+SUF[i]+'</b><span><i class="dot" style="background:'+hex(e.c)+'"></i>'+esc(e.n)+'</span><em>'+(e.t?fmt(e.t):'~'+fmt(e.e))+'</em></div>':'';}).join('');
    $('rTab').innerHTML='<tr><th>Pos</th><th>Driver</th><th>Best lap</th><th>Gap</th></tr>'+R.map((e,i)=>'<tr'+(e.i===G.my?' class="me"':'')+'><td>'+(i+1)+'</td><td><i class="dot" style="background:'+hex(e.c)+'"></i>'+esc(e.n)+(e.h?'':' <span class="note">AI</span>')+'</td><td>'+fmt(e.b)+'</td><td>'+(i===0?fmt(t0):'+'+((e.t||e.e)-t0).toFixed(3))+'</td></tr>').join('');
    $('rAgain').classList.toggle('hide',G.mode==='client');$('rNote').textContent=G.mode==='client'?'Waiting for the host to start the next race…':'';showScreen('sRes');Snd.music('menu');},G.mode==='client'?600:1500);}
addEventListener('visibilitychange',()=>{if(document.hidden&&G.mode==='solo'&&race.state==='race'&&!G.paused)togglePause();});

/* ---------------- PWA / offline ---------------- */
if('serviceWorker' in navigator&&/^https:/.test(location.href))navigator.serviceWorker.register('sw.js').catch(()=>{});
let installEvt=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;});
try{const icon='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#19e3ff"/><stop offset="1" stop-color="#ff3d81"/></linearGradient></defs><rect width="512" height="512" rx="96" fill="url(#g)"/><path d="M96 330l70-150h190l60 90v60h-50a45 45 0 0 0-90 0h-70a45 45 0 0 0-90 0z" fill="#0b0d1a"/><circle cx="161" cy="336" r="34" fill="#fff"/><circle cx="321" cy="336" r="34" fill="#fff"/></svg>');
  const base=location.href.split(/[?#]/)[0];if(/^https?:/.test(base)){const mf={name:'Apex Carts',short_name:'Apex Carts',start_url:base,scope:base,display:'fullscreen',orientation:'landscape',background_color:'#0b0d1a',theme_color:'#0b0d1a',icons:[{src:icon,sizes:'512x512',type:'image/svg+xml',purpose:'any maskable'}]};
    const l=document.createElement('link');l.rel='manifest';l.href=URL.createObjectURL(new Blob([JSON.stringify(mf)],{type:'application/manifest+json'}));
    fetch('manifest.webmanifest',{method:'HEAD'}).then(r=>{if(r.ok)l.href='manifest.webmanifest';}).catch(()=>{}).then(()=>document.head.appendChild(l));}
  const ic=document.createElement('link');ic.rel='icon';ic.href=icon;document.head.appendChild(ic);}catch(e){}
async function saveOffline(){toast('Building offline copy…',8000);
  try{let html=await (await fetch(location.href.split(/[?#]/)[0],{cache:'no-store'})).text();
    const re=new RegExp('<script src="(https://[^"]+)"><\\/script>','g'),tags=[];let m;while((m=re.exec(html)))tags.push(m);
    for(const t of tags){const js=await (await fetch(t[1])).text();html=html.split(t[0]).join('<script>'+js.replace(/<\/script/gi,'<\\/script')+'</'+'script>');}
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([html],{type:'text/html'}));a.download='apex-carts-offline.html';document.body.appendChild(a);a.click();a.remove();
    toast(tags.length?'Saved apex-carts-offline.html — open it any time, no connection needed':'This copy is already self-contained — saved.',5000);}
  catch(e){toast('Could not build the offline copy here ('+e.message+'). Open the game from a web address and try again.',6000);}}

