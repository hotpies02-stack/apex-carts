/* ---------------- cinematic track fly-in ---------------- */
const INTRO_T=9;let shadowR=0;
function shadowRange(r){if(shadowR===r)return;shadowR=r;const c=sun.shadow.camera;c.left=-r;c.right=r;c.top=r;c.bottom=-r;c.far=r>100?1200:260;c.updateProjectionMatrix();sun.shadow.bias=r>100?-.004:-.0006;sun.shadow.normalBias=r>100?.5:.04;}
function introCam(v,k,dt){const cam=v.cam,u=clamp(race.intro/INTRO_T,0,1),e=u*u*(3-2*u),w=smooth((u-.6)/.4),a=-.22-3.3*(1-e);
  const rad=lerp(480,310,e),ht=lerp(290,150,e);_a.set(Math.cos(a)*rad,ht+T.py[0],Math.sin(a)*rad);
  const hd=k.hd;_b.set(k.x-Math.sin(hd)*5.5,k.y+2.1,k.z-Math.cos(hd)*5.5);cam.position.copy(_a).lerp(_b,w);
  _a.set(Math.cos(a+.5)*60,T.py[0]-10,Math.sin(a+.5)*60);_b.set(k.x+Math.sin(hd)*6.5,k.y+.7,k.z+Math.cos(hd)*6.5);lookV.copy(_a).lerp(_b,smooth((u-.5)/.45));cam.lookAt(lookV);
  const f=lerp(52,58,w);if(Math.abs(cam.fov-f)>.05){cam.fov=f;cam.updateProjectionMatrix();}
  scene.fog.density=T.def.fog[1]*lerp(.3,1,w);v.init=true;v.hd=hd;v.fov=58;return w;}

/* ---------------- event feedback (sound · haptics · popups) ---------------- */
let msgT=0;function flash(s,ms){const m=$('msg');m.textContent=s;m.classList.add('on');clearTimeout(msgT);msgT=setTimeout(()=>m.classList.remove('on'),ms||1200);}
function onEvent(n,i,a){const mine=i<0||i===G.my,spec=spectating(),v=mine?1:spec?.45:.25,k=i>=0?karts[i]:null;
  if(n==='beep'){if(a===3)Snd.music('none');Snd.fx('beep');flash(String(a),700);}
  else if(n==='go'){Snd.fx('go');flash('GO!',900);Snd.music('race');vib(60);}
  else if(n==='hit'||n==='bump'||n==='land'){if(mine||spec)Snd.fx(n,v*(.4+a*.6));if(mine)vib(30+a*70|0);}
  else if(n==='boost'||n==='mini'){if(mine||spec)Snd.fx(n,v);if(mine)vib(n==='mini'?[25]:[40,30,80]);}
  else if(n==='spin'){Snd.fx('spin',v);if(mine)vib([120,40,120]);}
  else if(n==='boom'){Snd.fx('boom',v);if(k)burst(k,1,.5,.2,26);}
  else if(n==='pick'){if(mine||spec)Snd.fx('pick',v);if(mine)vib(20);}
  else if(n==='fire'||n==='drop'){Snd.fx(n,v);}
  else if(n==='lap'){if(mine){Snd.fx('lap');flash(a>=LAPS?'FINAL LAP':'LAP '+a,1400);}}
  else if(n==='fin'){if(mine){Snd.fx('fin');flash('FINISH!',2200);vib([60,40,60,40,160]);}else if(spec)Snd.fx('lap',.5);}
}

/* ---------------- HUD ---------------- */
const hudC={};function setT(id,s){if(hudC[id]!==s){hudC[id]=s;$(id).textContent=s;}}
const mini=$('mini'),mctx=mini.getContext('2d');
let rumbleT=0,subT=0;
function subMsg(s,cls,ms){const e=$('sub');e.textContent=s;e.className='on '+(cls||'');clearTimeout(subT);subT=setTimeout(()=>{e.className='';},ms||2200);}
const spdTxt=v=>Math.round(Math.abs(v)*KMH*(CFG.units==='mph'?.6214:1));
const ITEM_NAME=['','NITRO','ROCKET','MINE'];
function updateHUD(dt){
  const k=focusKart(),spec=spectating();
  if(race.state==='idle')return;
  const intro=race.state==='intro';if(hudC.intro!==intro){hudC.intro=intro;document.body.classList.toggle('intro',intro);}
  const cnt2=race.state==='count';if(hudC.cnt!==cnt2){hudC.cnt=cnt2;document.body.classList.toggle('counting',cnt2);}
  const multi=spec&&nViews>1;
  $('hudPos').parentElement.style.visibility=spec?'hidden':'visible';$('spdBox').style.visibility=multi||(spec&&G.camMode===2)?'hidden':'visible';
  const p=k.place;if(hudC.pos!==p){const el=$('hudPos');if(hudC.pos&&race.state==='race'){el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');}hudC.pos=p;el.innerHTML=p+'<sup>'+SUF[p-1]+'</sup><small> / '+NK+'</small>';el.classList.toggle('p1',p===1);}
  const lap=clamp(k.lap,1,LAPS);if(hudC.lapn!==lap+'/'+LAPS){hudC.lapn=lap+'/'+LAPS;$('hudLap').textContent='LAP '+lap+' / '+LAPS;let h='';for(let i=1;i<=LAPS;i++)h+='<i'+(i<=lap?' class="on"':'')+'></i>';$('lapPips').innerHTML=h;}
  const lt=k.finished?k.finT:race.state==='race'||race.state==='done'?race.t:0;setT('hudTime',lt>0?fmt(lt):'0:00.000');
  setT('hudBest',spec?(k.name+' · '+T.def.name).toUpperCase():'LAP '+fmt(race.state==='race'&&!k.finished?race.t-k.lapStart:k.lastLap)+'  ·  BEST '+fmt(k.bestLap));
  setT('hudSpeed',String(spdTxt(k.spd)));
  const sN=clamp(Math.abs(k.spd)/(VMAX*1.38),0,1),gf=Math.round(sN*100);if(hudC.gf!==gf){hudC.gf=gf;$('gFg').setAttribute('stroke-dasharray',(405.3*sN).toFixed(1)+' 540.4');}
  const gear=k.spd<-.5?'R':String(Math.min(5,1+Math.floor(clamp(Math.abs(k.spd)/VMAX,0,1.2)*4.2)));setT('hudGear',gear);
  const bo=k.boostT>0;if(hudC.bo!==bo){hudC.bo=bo;$('gauge').classList.toggle('boost',bo);}
  const dw=Math.round(k.draft*50);if(hudC.dr!==dw){hudC.dr=dw;$('gDraft').setAttribute('stroke-dasharray',(348.7*k.draft).toFixed(1)+' 465');}
  if(hudC.item!==k.item){hudC.item=k.item;const s=$('itemSlot'),it=ITEM_ICON[k.item]||'';s.innerHTML=it;s.classList.remove('has');if(it){void s.offsetWidth;s.classList.add('has');}$('bItem').innerHTML=it||'ITEM';}
  $('warn').classList.toggle('hide',!(k.wrong&&!spec));
  // start lights
  const ls=race.state==='count'?4-Math.ceil(race.count):race.state==='race'&&race.t<1.3?9:-1;
  if(hudC.ls!==ls){hudC.ls=ls;const L=$('lights');L.classList.toggle('on',ls>=0);for(let i=0;i<3;i++)L.children[i].className=ls===9?'g':i<ls?'r':'';}
  // standings board (spectators)
  if(spec){let h='';const a=karts.slice().sort((x,y)=>x.place-y.place);for(const o of a)h+='<div><b>'+o.place+'</b><i class="dot" style="background:'+hex(o.color)+'"></i>'+esc(o.name)+'<span>'+(o.finished?fmt(o.finT):'L'+clamp(o.lap,1,LAPS))+'</span></div>';
    if(hudC.board!==h){hudC.board=h;$('board').innerHTML=h;}
    if(nViews>1){const sp=$('split');for(let i=0;i<nViews;i++){const kk=karts[views[i].ki],el=sp.children[i];if(!kk){el.style.display='none';continue;}const s=kk.place+SUF[kk.place-1]+' · '+kk.name+' · L'+clamp(kk.lap,1,LAPS)+' · '+spdTxt(kk.spd)+' '+(CFG.units==='mph'?'mph':'km/h')+(kk.item?' · '+ITEM_NAME[kk.item]:'');if(el.textContent!==s){el.textContent=s;el.style.borderLeftColor=hex(kk.color);}}}}
  // minimap
  if(CFG.mini){const M=T.mini;mctx.clearRect(0,0,180,180);mctx.drawImage(M.c,0,0);
    for(const o of karts){const me=o.i===G.my;mctx.beginPath();mctx.arc(o.x*M.s+M.ox,o.z*M.s+M.oz,me?7:4.5,0,TAU);mctx.fillStyle=hex(o.color);mctx.fill();mctx.lineWidth=me?3:1.5;mctx.strokeStyle=me?'#fff':'rgba(0,0,0,.8)';mctx.stroke();}}
  const sp=Math.abs(k.spd)/VMAX,wv=multi||G.role==='ctl'||Post.ready()?0:clamp((sp-.82)*1.6,0,.3)+(k.boostT>0?.5:0);if(Math.abs((hudC.warp||0)-wv)>.02){hudC.warp=wv;$('warp').style.opacity=wv.toFixed(2);}
  if(!spec&&k.off&&Math.abs(k.spd)>8){rumbleT-=dt;if(rumbleT<=0){rumbleT=.14;vib(18);}}
}


/* ---------------- networking (PeerJS / WebRTC data channels) ----------------
   Host is authoritative: clients send inputs at 30 Hz, host sends world snapshots at 20 Hz.
   Roles: player (full 3D), ctl (phone gamepad, no 3D), viewer (TV broadcast). */
