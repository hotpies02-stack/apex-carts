'use strict';
const APEX_VERSION='7.0.0';
/* ==== 00-core.js ==== */
function boot(){
/* =====================================================================
   APEX CARTS — single-file 3D cart racer
   Sections: utils · renderer · tracks/world · karts · simulation · AI ·
             audio · input · cameras/FX · HUD · networking · menus · loop
   ===================================================================== */
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t, TAU=Math.PI*2;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
function angDiff(a,b){let d=(a-b)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d;}
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const fmt=t=>{if(!(t>0)||!isFinite(t))return '—';const m=Math.floor(t/60),s=t-m*60;return m+':'+(s<10?'0':'')+s.toFixed(3);};
const isTouch=('ontouchstart' in window)||navigator.maxTouchPoints>0;
if(isTouch)document.body.classList.add('touch');
const store={get(k,d){try{const v=localStorage.getItem('apex_'+k);return v==null?d:JSON.parse(v);}catch(e){return d;}},set(k,v){try{localStorage.setItem('apex_'+k,JSON.stringify(v));}catch(e){}}};
let toastT=0;function toast(s,ms){const t=$('toast');t.textContent=s;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),ms||2600);}
function hash2(x,y){let n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);}
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  return lerp(lerp(hash2(xi,yi),hash2(xi+1,yi),u),lerp(hash2(xi,yi+1),hash2(xi+1,yi+1),u),v);}
function fbm(x,y){return vnoise(x,y)*.55+vnoise(x*2.1+7,y*2.1+3)*.3+vnoise(x*4.3+1,y*4.3+9)*.15;}

/* ---------------- settings (persisted) + vector icons ---------------- */
const CFG_DEF={quality:'auto',scale:1,shadows:true,post:true,ao:true,ssr:!isTouch,bloom:1,mblur:true,refl:!isTouch,rays:true,fps:false,vMaster:.85,vMusic:.6,vSfx:.9,steer:'joy',sens:1,vib:true,autoGas:false,laps:3,diff:1,items:true,units:'kmh',mini:true,camDist:1,intro:true,finish:0};
const CFG=Object.assign({},CFG_DEF,store.get('cfg',{}));
const RTQ={ssr:true,ao:true,refl:true,post:true,shadows:true};const eff=k=>CFG[k]&&RTQ[k];
const PRESET={low:{scale:.7,shadows:false,post:false,ao:false,ssr:false,refl:false,rays:false},med:{scale:.85,shadows:true,post:true,ao:false,ssr:false,refl:false,rays:false},high:{scale:1,shadows:true,post:true,ao:true,ssr:true,refl:true,rays:true},ultra:{scale:1,shadows:true,post:true,ao:true,ssr:true,refl:true,rays:true}};
const IC={bolt:'M13 2L4 14h6l-1 8 9-12h-6z',rocket:'M12 2c3 2 5 6 5 10l2 3v3h-4l-1 2h-4l-1-2H5v-3l2-3c0-4 2-8 5-10zm0 6a2 2 0 100 4 2 2 0 000-4z',
 mine:'M12 6a6 6 0 100 12 6 6 0 000-12zM11 2h2v3h-2zM11 19h2v3h-2zM2 11h3v2H2zM19 11h3v2h-3zM5.6 4.2l2.1 2.1-1.4 1.4-2.1-2.1zM16.3 16.3l2.1 2.1-1.4 1.4-2.1-2.1zM4.2 18.4l2.1-2.1 1.4 1.4-2.1 2.1zM16.3 7.7l2.1-2.1 1.4 1.4-2.1 2.1z',
 flag:'M5 3v18h2v-7h11l-2-4 2-4H7V3z',users:'M8 11a3 3 0 100-6 3 3 0 000 6zm8 0a3 3 0 100-6 3 3 0 000 6zM2 19c0-3 3-5 6-5s6 2 6 5v1H2zm14-5c3 0 6 2 6 5v1h-6v-1c0-2-1-4-2-5z',
 wrench:'M21 7a5 5 0 01-7 4l-8 8-3-3 8-8a5 5 0 016-6l-3 3 2 3 3 2z',trophy:'M7 3h10v2h3v3a4 4 0 01-4 4 5 5 0 01-3 2v3h3v3H8v-3h3v-3a5 5 0 01-3-2 4 4 0 01-4-4V5h3zM6 7v1a2 2 0 001 2V7zm12 0h-1v3a2 2 0 001-2z',
 gear:'M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM10.5 2h3l.5 2.6 1.7.7 2.2-1.5 2.1 2.1-1.5 2.2.7 1.7 2.6.5v3l-2.6.5-.7 1.7 1.5 2.2-2.1 2.1-2.2-1.5-1.7.7-.5 2.6h-3l-.5-2.6-1.7-.7-2.2 1.5-2.1-2.1 1.5-2.2-.7-1.7L2 13.5v-3l2.6-.5.7-1.7-1.5-2.2 2.1-2.1 2.2 1.5 1.7-.7z',
 fs:'M4 4h6v2H6v4H4zm10 0h6v6h-2V6h-4zM4 14h2v4h4v2H4zm14 0h2v6h-6v-2h4z',snd:'M4 9h4l5-4v14l-5-4H4zM16 8.5a5 5 0 010 7zM18.5 5.5a9 9 0 010 13l-1.2-1.2a7.3 7.3 0 000-10.6z',mute:'M4 9h4l5-4v14l-5-4H4zM15.5 9.9l1.4-1.4 2.1 2.1 2.1-2.1 1.4 1.4-2.1 2.1 2.1 2.1-1.4 1.4-2.1-2.1-2.1 2.1-1.4-1.4 2.1-2.1z',
 cam:'M4 7h10a2 2 0 012 2v1l4-2v8l-4-2v1a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2z',menu:'M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z',
 host:'M12 3a9 9 0 019 9h-2a7 7 0 00-14 0H3a9 9 0 019-9zm0 4a5 5 0 015 5h-2a3 3 0 00-6 0H7a5 5 0 015-5zm-1 5h2v9h-2z',tv:'M3 5h18v12H3zm5 14h8v2H8z',
 pad:'M7 8h10a5 5 0 015 5v2a3 3 0 01-5.2 2L15 15H9l-1.8 2A3 3 0 012 15v-2a5 5 0 015-5zm-.5 2.5v1.5H5v1.5h1.5V15H8v-1.5h1.5V12H8v-1.5zM16 10.5a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4zm2 2.5a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z'};
const ico=n=>'<svg class="i" viewBox="0 0 24 24"><path d="'+IC[n]+'"/></svg>';


/* ---------------- constants ---------------- */
const NK=6, VMAX=40, KMH=3.6*1.25;let LAPS=3;
const PAINTS=[0xe8232d,0x1e6bff,0xffc21a,0x19c46b,0xff5fa8,0x8a4dff,0xf2f4f8,0xff7a1a];
const AI_NAMES=['Blaze','Nova','Rex','Viper','Echo','Zed'];
const ITEM_ICON=['',ico('bolt'),ico('rocket'),ico('mine')];
const SUF=['st','nd','rd','th','th','th'];

/* ---------------- renderer ---------------- */
const canvas=$('c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:!isTouch,powerPreference:'high-performance'});
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.info.autoReset=false;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();toast('Graphics context lost — restoring…');});
canvas.addEventListener('webglcontextrestored',()=>{toast('Graphics restored');});
const scene=new THREE.Scene();
const hemi=new THREE.HemisphereLight(0xffffff,0x444444,.8);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffffff,1.2);sun.castShadow=true;
const SHN=isTouch?1024:2048;sun.shadow.mapSize.set(SHN,SHN);
{const c=sun.shadow.camera;c.left=-55;c.right=55;c.top=55;c.bottom=-55;c.near=1;c.far=260;sun.shadow.bias=-0.0006;sun.shadow.normalBias=0.04;sun.shadow.radius=2.2;}
scene.add(sun,sun.target);
const sunDir=new THREE.Vector3(.5,.8,.3);
let resScale=1,shadowsOn=true;
const maxDPR=()=>Math.min(window.devicePixelRatio||1,CFG.quality==='ultra'||!CFG.post?2:1.5);
const pmrem=new THREE.PMREMGenerator(renderer);

function ctex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;}
  t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;}


/* ==== 10-art.js ==== */
/* ---------------- material helpers / procedural surface art ---------------- */
/* write a flag into the scene alpha channel: 0 = moving object (no motion blur), <1 = wet/reflective ground (SSR weight) */
function alphaFlag(m,expr){m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\n\tgl_FragColor.a='+expr+';');};m.customProgramCacheKey=()=>'af'+expr;return m;}
const BRANDS=[['VOLTA','#0b1b3a','#22e4ff'],['NORDWIND','#f4f6fa','#0e2a5c'],['KITE TYRES','#ffc83d','#141414'],['HELIX OIL','#b3122e','#ffffff'],['ZENITH','#101010','#ff7a2f'],['PULSE ENERGY','#16c172','#062014'],['ARC MOTORS','#ffffff','#d8232a'],['LUMEN','#3a1466','#ffd6f1']];
function texOf(cv,srgb){const t=new THREE.CanvasTexture(cv);if(srgb)t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());return t;}
function roadTextures(def,R){const S=isTouch?512:1024,k=S/1024,id=def.id,rd=def.road,H=S/2;
  const cv=document.createElement('canvas');cv.width=cv.height=S;const c=cv.getContext('2d'),rv=document.createElement('canvas');rv.width=rv.height=H;const r=rv.getContext('2d');
  c.fillStyle=rd.base;c.fillRect(0,0,S,S);
  for(let i=0;i<300;i++){const x=R()*S,y=R()*S,rad=(30+R()*130)*k,g=c.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,R()<.5?'rgba(0,0,0,.075)':'rgba(255,255,255,.05)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(x-rad,y-rad,rad*2,rad*2);}
  const n=Math.round(110000*k*k);for(let i=0;i<n;i++){c.fillStyle=rd.spk[i&1];c.globalAlpha=.07+R()*.3;const s=R()<.92?1:2;c.fillRect(R()*S,R()*S,s,s);}c.globalAlpha=1;
  for(let i=0;i<5000*k*k;i++){c.fillStyle=R()<.5?'rgba(0,0,0,.1)':'rgba(255,255,255,.06)';c.beginPath();c.arc(R()*S,R()*S,(1.2+R()*2.2)*k,0,TAU);c.fill();}
  if(id==='alpine'){for(const u of[.3,.42,.58,.7]){const g=c.createLinearGradient(S*(u-.045),0,S*(u+.045),0);g.addColorStop(0,'rgba(60,95,140,0)');g.addColorStop(.5,'rgba(60,95,140,.15)');g.addColorStop(1,'rgba(60,95,140,0)');c.fillStyle=g;c.fillRect(S*(u-.045),0,S*.09,S);}
    for(let i=0;i<700;i++){c.fillStyle='rgba(255,255,255,'+(.15+R()*.3)+')';c.fillRect(R()*S,R()*S,1,1);}}
  else for(const u of[.35,.65]){const g=c.createLinearGradient(S*(u-.08),0,S*(u+.08),0);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.5,id==='neon'?'rgba(0,0,0,.16)':'rgba(45,22,6,.1)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(S*(u-.08),0,S*.16,S);}
  if(id!=='alpine'){c.strokeStyle=id==='neon'?'rgba(0,0,0,.5)':'rgba(40,24,10,.4)';c.lineWidth=Math.max(1,1.3*k);for(let i=0;i<8;i++){let x=S*(.12+R()*.76),y=S*(.08+R()*.55);c.beginPath();c.moveTo(x,y);for(let j=0;j<9;j++){x+=(R()-.5)*64*k;y+=R()*36*k;c.lineTo(x,y);}c.stroke();}}
  if(id==='desert')for(let i=0;i<140;i++){c.fillStyle=R()<.6?'rgba(20,16,12,.5)':'rgba(120,104,90,.4)';const s=(1+R()*3)*k;c.beginPath();c.arc(R()*S,R()*S,s,0,TAU);c.fill();}
  c.lineCap='round';for(let i=0;i<34;i++){const x0=S*(.2+R()*.6),y0=S*(.05+R()*.75),ln=(80+R()*220)*k,bend=(R()-.5)*90*k;c.strokeStyle='rgba(0,0,0,'+(.06+R()*.1)+')';c.lineWidth=(7+R()*6)*k;for(const dx of[0,22*k]){c.beginPath();c.moveTo(x0+dx,y0);c.quadraticCurveTo(x0+dx+bend,y0+ln*.5,x0+dx+bend*.3,y0+ln);c.stroke();}}
  {const g=c.createLinearGradient(S*.3,0,S*.7,0);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.5,'rgba(0,0,0,.16)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(S*.3,0,S*.4,S);}
  if(id==='desert')for(const sd of[0,1]){const g=c.createLinearGradient(sd?S:0,0,sd?S*.78:S*.22,0);g.addColorStop(0,'rgba(196,158,110,.95)');g.addColorStop(.4,'rgba(196,158,110,.45)');g.addColorStop(1,'rgba(196,158,110,0)');c.fillStyle=g;c.fillRect(sd?S*.78:0,0,S*.22,S);for(let i=0;i<1400;i++){c.fillStyle='rgba(196,160,114,'+(.12+R()*.25)+')';const u=Math.pow(R(),2.2)*.3;c.beginPath();c.arc((sd?1-u:u)*S,R()*S,(1+R()*2.5)*k,0,TAU);c.fill();}}
  if(id==='alpine')for(const sd of[0,1]){const g=c.createLinearGradient(sd?S:0,0,sd?S*.8:S*.2,0);g.addColorStop(0,'rgba(240,246,252,.95)');g.addColorStop(.45,'rgba(240,246,252,.4)');g.addColorStop(1,'rgba(240,246,252,0)');c.fillStyle=g;c.fillRect(sd?S*.8:0,0,S*.2,S);for(let i=0;i<700;i++){c.fillStyle='rgba(245,249,253,'+(.3+R()*.5)+')';const u=Math.pow(R(),2)*.24;c.fillRect((sd?1-u:u)*S,R()*S,(2+R()*5)*k,(2+R()*6)*k);}}
  const ew=13*k,ex=9*k;c.fillStyle=rd.edge;c.fillRect(ex,0,ew,S);c.fillRect(S-ex-ew,0,ew,S);
  if(id==='alpine'){c.fillStyle='#f4f6fa';for(let y=0;y<S;y+=S/8){c.fillRect(ex,y,ew,S/16);c.fillRect(S-ex-ew,y,ew,S/16);}}
  if(id==='neon'){c.fillStyle=rd.dash;for(let y=0;y<S;y+=S/4)c.fillRect(S/2-4*k,y+S/32,8*k,S/8);}
  c.globalAlpha=.55;c.fillStyle=rd.base;for(let i=0;i<3200*k;i++){const e=R()<.42?ex+R()*ew:R()<.7?S-ex-ew+R()*ew:S/2-4*k+R()*8*k;c.fillRect(e,R()*S,(1+R()*2)*k,(2+R()*9)*k);}c.globalAlpha=1;
  const rb=Math.round(rd.rough*255);r.fillStyle='rgb(0,'+rb+',0)';r.fillRect(0,0,H,H);
  for(let i=0;i<900;i++){const x=R()*H,y=R()*H,rad=(10+R()*30)*k,g=r.createRadialGradient(x,y,0,x,y,rad),v=clamp(rb+((R()-.5)*50|0),8,255);g.addColorStop(0,'rgba(0,'+v+',0,.35)');g.addColorStop(1,'rgba(0,'+v+',0,0)');r.fillStyle=g;r.fillRect(x-rad,y-rad,rad*2,rad*2);}
  if(def.wet>0){const lo=id==='neon'?12:46,cnt=id==='neon'?30:22;for(let i=0;i<cnt;i++){const x=H*(.16+R()*.68),y=H*(.16+R()*.68),rad=(16+R()*46)*k,g=r.createRadialGradient(x,y,rad*.08,x,y,rad);g.addColorStop(0,'rgba(0,'+lo+',0,.9)');g.addColorStop(.5,'rgba(0,'+lo+',0,.5)');g.addColorStop(1,'rgba(0,'+lo+',0,0)');r.fillStyle=g;r.beginPath();r.ellipse(x,y,rad*(.5+R()*.5),rad,R()*3,0,TAU);r.fill();}
    if(id==='neon')for(const u of[.35,.65]){const g=r.createLinearGradient(H*(u-.07),0,H*(u+.07),0);g.addColorStop(0,'rgba(0,30,0,0)');g.addColorStop(.5,'rgba(0,30,0,.55)');g.addColorStop(1,'rgba(0,30,0,0)');r.fillStyle=g;r.fillRect(H*(u-.07),0,H*.14,H);}}
  const map=texOf(cv,true);return {map,rgh:texOf(rv,false),nrm:canvasNormal(map,id==='neon'?1.6:id==='alpine'?1.4:3)};}
function tireTex(){const cv=document.createElement('canvas');cv.width=512;cv.height=96;const c=cv.getContext('2d');c.fillStyle='#161618';c.fillRect(0,0,512,96);
  c.fillStyle='#0b0b0c';c.fillRect(0,24,512,48);c.strokeStyle='#050505';c.lineWidth=3;for(let x=-40;x<552;x+=14){c.beginPath();c.moveTo(x,24);c.lineTo(x+16,48);c.lineTo(x,72);c.stroke();}
  c.fillStyle='#050505';c.fillRect(0,46,512,4);c.fillStyle='#222226';c.fillRect(0,22,512,2);c.fillRect(0,72,512,2);
  c.fillStyle='#6d6d74';c.font='700 13px "Barlow Condensed","Arial Narrow",sans-serif';c.textBaseline='middle';for(let i=0;i<4;i++){c.fillText('KITE  RACING  S1',i*128+10,11);c.fillText('KITE  RACING  S1',i*128+10,86);}
  c.fillStyle='#c9a227';for(let i=0;i<4;i++){c.fillRect(i*128+2,7,5,8);c.fillRect(i*128+2,82,5,8);}return texOf(cv,true);}
function drawLivery(k){const m=k.m,cv=m.lc,c=cv.getContext('2d'),W=512,H=256,col=hex(k.color),br=BRANDS[(k.i*3+k.color)%BRANDS.length];
  c.globalAlpha=1;c.fillStyle=col;c.fillRect(0,0,W,H);
  // flanks: dark lower swoosh on both sides (u=0/1 is the left side, u=.5 the right side)
  c.fillStyle='rgba(8,9,12,.82)';for(const x0 of[0,W/2,W]){c.beginPath();c.moveTo(x0-W*.13,H);c.lineTo(x0+W*.13,H);c.lineTo(x0+W*.05,H*.18);c.lineTo(x0-W*.05,H*.18);c.fill();}
  c.fillStyle='#f4f6fa';for(const x0 of[0,W/2,W]){c.fillRect(x0-W*.135,H*.2,3,H*.8);c.fillRect(x0+W*.135-3,H*.2,3,H*.8);}
  // centre racing stripes over the top (u=.25)
  c.fillStyle='#f4f6fa';c.fillRect(W*.25-17,0,11,H);c.fillRect(W*.25+6,0,11,H);c.fillStyle='rgba(8,9,12,.85)';c.fillRect(W*.25-4,0,8,H);
  // sponsor lettering along the flanks
  c.fillStyle='#f4f6fa';c.font='italic 900 30px "Barlow Condensed","Arial Narrow",sans-serif';c.textAlign='center';c.textBaseline='middle';
  for(const[x0,rot]of[[W*.5,-Math.PI/2],[4,Math.PI/2],[W-4,Math.PI/2]]){c.save();c.translate(x0,H*.6);c.rotate(rot);c.fillText(br[0],0,0);c.restore();}
  c.fillStyle='#0c0d10';c.fillRect(0,0,W,13);c.fillRect(0,H-9,W,9);m.lt.needsUpdate=true;}
const beamTex=ctex(64,128,c=>{const g=c.createRadialGradient(32,118,2,32,70,74);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.35,'rgba(255,255,255,.4)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,64,128);});
const beamTexG=ctex(64,64,c=>{const g=c.createRadialGradient(32,32,6,32,32,32);g.addColorStop(0,'rgba(255,255,255,.0)');g.addColorStop(.45,'rgba(255,255,255,.75)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,64,64);});
const FT={value:0},flameMat=new THREE.ShaderMaterial({transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,uniforms:{t:FT},
  vertexShader:'varying vec2 vU;varying vec3 vN,vV;void main(){vU=uv;vN=normalMatrix*normal;vec4 mv=modelViewMatrix*vec4(position,1.);vV=-mv.xyz;gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float t;varying vec2 vU;varying vec3 vN,vV;void main(){float v=vU.y,rim=pow(abs(dot(normalize(vN),normalize(vV))),1.4),fk=.82+.18*sin(v*26.-t*46.)*sin(vU.x*37.+t*23.);float a=pow(1.-v,2.1)*rim*fk;vec3 c=mix(vec3(.5,2.2,5.5),vec3(7.,7.5,9.),smoothstep(.34,0.,v));gl_FragColor=vec4(c*a,a);}'});
const headL=new THREE.SpotLight(0xfff0d8,0,60,.52,.7,1.2);


/* ---------------- track definitions ----------------
   Control points are polar [angle°, radius m, height m] → star-shaped loops that never self-intersect. */

/* ==== 20-tracks.js ==== */
const TRACKS=[
 {id:'alpine',name:'Alpine Pass',desc:'Ice & snow · banked sweepers',thumb:['#1d3f73','#8fb9ea','#ffffff'],tech:.55,rays:.55,
  pts:[[0,232,0],[28,246,5],[58,202,15],[88,152,26],[120,208,34],[150,258,30],[180,222,18],[210,160,9],[240,208,3],[270,258,-4],[300,232,-6],[332,196,-3]],
  half:8,sh:5,grip:.6,offGrip:.75,offMax:.5,bankK:12,amp:34,rise:.3,blend:38,rim:.55,
  sky:[0x2468c8,0xd6e8fb],fog:[0xd6e8fb,.0019],sun:[0xffe2bd,2.7,[.45,.62,.35]],hemi:[0x9cc4ff,0x8c98a8,1.4],expo:1.1,lift:[.0,.004,.012],
  road:{base:'#52657c',spk:['#9fb4cc','#3d4e63'],edge:'#d13b3b',dash:'#8fa3ba',rough:.34,metal:.05},
  shoulder:0xf3f7fb,wall:0xdfe9f2,wallH:.9,ter:[0xf4f7fb,0x5f6670,0xdfe8f2],rockMix:1,ridge:210,skySun:0xfff2d0,cloud:.52,bloom:[4.2,.5],wet:.5,lum:2.8,scatter:1.0,mist:.5,mistY:-6,weather:'snow'},
 {id:'desert',name:'Desert Canyon',desc:'Dusty trails · steep drops',thumb:['#6e3015','#e39a52','#fff1d6'],tech:.7,rays:.6,
  pts:[[0,238,22],[24,250,23],[50,192,25],[78,228,10],[104,268,-9],[134,222,-14],[160,152,-7],[190,198,3],[220,268,12],[250,240,29],[280,172,34],[310,208,29],[336,256,24]],
  half:7.5,sh:5,grip:.84,offGrip:.7,offMax:.55,bankK:6,amp:42,rise:.85,blend:16,rim:.4,
  sky:[0x2a78c2,0xf0d2a6],fog:[0xe6c79c,.0016],sun:[0xffdca8,2.9,[-.42,.78,.3]],hemi:[0x8fb6ff,0xc8733a,1.2],expo:.95,lift:[.006,.002,.014],
  road:{base:'#3d3835',spk:['#6a625c','#28241f'],edge:'#e9d3ae',dash:'#a88661',rough:.9,metal:0},
  shoulder:0xc79a62,wall:0x9a5a36,wallH:1.3,ter:[0xd9ad72,0xa8552c,0xc48a4e],rockMix:.9,ridge:150,skySun:0xffe0a8,cloud:.36,bloom:[3.6,.45],wet:0,lum:2.3,scatter:1.4,mist:.5,mistY:-12,weather:'sand'},
 {id:'neon',name:'Neon City Circuit',desc:'High grip · tight chicanes · night',thumb:['#0d0624','#43166f','#22e4ff'],tech:.95,rays:0,
  pts:[[0,204,0],[19,206,0],[38,160,1],[54,202,3],[70,160,5],[90,202,6],[114,232,6],[139,182,3],[160,124,0],[184,170,0],[205,230,0],[224,190,0],[244,236,0],[264,190,0],[289,240,0],[314,204,0],[339,176,0]],
  half:7,sh:4,grip:1,offGrip:.8,offMax:.6,bankK:4,amp:0,rise:0,blend:30,rim:0,
  sky:[0x05030f,0x3a1a66],fog:[0x1d0f3a,.0022],sun:[0x9fb4ff,1.3,[.3,.8,-.4]],hemi:[0x9a80ff,0x3a2460,1.6],expo:1.25,lift:[.005,.003,.012],
  road:{base:'#1b1c24',spk:['#30323d','#101116'],edge:'#19e3ff',dash:'#e9ecf5',rough:.42,metal:0},
  shoulder:0x163526,wall:0x111320,wallH:1.1,ter:[0x15171f,0x15171f,0x1d202b],rockMix:0,ridge:0,skySun:0xb9c6ff,cloud:0,bloom:[1.5,.55],wet:.85,lum:1,scatter:0,mist:.24,mistY:2,weather:'none'}
];

let T=null;           // current track runtime
/* r128 treats material colours as linear: convert authored sRGB hex values once per material */
function linMat(m){if(!m||m.userData.lin||m.isShaderMaterial)return m;m.userData.lin=1;if(m.color)m.color.convertSRGBToLinear();if(m.emissive)m.emissive.convertSRGBToLinear();return m;}
function linGroup(g){g.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(linMat);});}
const tmpV=new THREE.Vector3();
function disposeGroup(g){g.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry)o.geometry.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{for(const k in m){const v=m[k];if(v&&v.isTexture&&!v.shared)v.dispose();}
  if(m.uniforms)for(const k in m.uniforms){const v=m.uniforms[k].value;if(v&&v.isTexture)v.dispose();}m.dispose();});}});}

function buildTrack(ti){
  if(T){scene.remove(T.group);disposeGroup(T.group);if(T.env)T.env.dispose();scene.environment=null;}
  const def=TRACKS[ti],R=rng(1337+ti*101),g=new THREE.Group();
  const cps=def.pts.map(p=>{const a=p[0]*Math.PI/180;return new THREE.Vector3(Math.cos(a)*p[1],p[2],Math.sin(a)*p[1]);});
  const curve=new THREE.CatmullRomCurve3(cps,true,'centripetal');curve.arcLengthDivisions=1500;
  const len=curve.getLength(),N=Math.round(len/3),sp=curve.getSpacedPoints(N),seg=len/N;
  const F=()=>new Float32Array(N);
  const px=F(),py=F(),pz=F(),tx=F(),tz=F(),rx=F(),rz=F(),psi=F(),grade=F(),slope=F(),curv=F();
  for(let i=0;i<N;i++){px[i]=sp[i].x;py[i]=sp[i].y;pz[i]=sp[i].z;}
  for(let i=0;i<N;i++){const a=(i+N-1)%N,b=(i+1)%N,dx=px[b]-px[a],dz=pz[b]-pz[a],h=Math.hypot(dx,dz);
    tx[i]=dx/h;tz[i]=dz/h;grade[i]=(py[b]-py[a])/h;psi[i]=Math.atan2(tx[i],tz[i]);rx[i]=-tz[i];rz[i]=tx[i];}
  for(let i=0;i<N;i++)curv[i]=angDiff(psi[(i+1)%N],psi[(i+N-1)%N])/(2*seg);
  {const raw=F();for(let i=0;i<N;i++)raw[i]=clamp(curv[i]*def.bankK,-.3,.3);
   for(let i=0;i<N;i++){let s=0;for(let o=-6;o<=6;o++)s+=raw[(i+o+N)%N];slope[i]=s/13;}}
  const half=def.half,sh=def.sh,limit=half+sh-1.3;
  const at=(i,off,dy,out)=>(out||tmpV).set(px[i]+rx[i]*off,py[i]+off*slope[i]+(dy||0),pz[i]+rz[i]*off);
  let nd=0;
  function nearest(x,z,step){let b=0,bd=1e18;for(let i=0;i<N;i+=step){const dx=x-px[i],dz=z-pz[i],d=dx*dx+dz*dz;if(d<bd){bd=d;b=i;}}nd=Math.sqrt(bd);return b;}
  function terrH(x,z){const i=nearest(x,z,2),d0=nd,dx=x-px[i],dz=z-pz[i],lat=dx*rx[i]+dz*rz[i],flat=half+sh+3,lc=clamp(lat,-flat,flat);
    const e=Math.max(0,d0-flat),s=smooth(e/def.blend),n=fbm(x*.011+ti*9,z*.011);let base=py[i];
    if(e>0){let sw=0,sy=0;for(let j=0;j<N;j+=4){const ax=x-px[j],az=z-pz[j],w=1/(ax*ax+az*az+1),w2=w*w;sw+=w2;sy+=w2*py[j];}base=lerp(py[i],sy/sw,smooth(e/30));}
    let up=n*def.amp+Math.min(e,90)*def.rise;if(def.id==='desert'){const rg=1-Math.abs(vnoise(x*.045+3,z*.045)*2-1);up+=rg*rg*7*Math.min(1,e/14);up=lerp(up,Math.floor(up/6)*6+smooth((up/6-Math.floor(up/6))*3)*6,.5);}
    return base+lc*slope[i]*(1-s)-1.15-s*1.2+s*up+Math.max(0,Math.hypot(x,z)-330)*def.rim;}

  /* --- ribbons --- */
  const sdx=def.sun[2][0],sdy=def.sun[2][1],sdz=def.sun[2][2],shl=Math.hypot(sdx,sdz),rowSh=new Float32Array(N).fill(1);
  if(def.id!=='neon')for(let i=0;i<N;i++){let m=0;for(let s2=7;s2<=26;s2++){const d=s2*7,ex=terrH(px[i]+sdx/shl*d,pz[i]+sdz/shl*d)-(py[i]+d*sdy/shl);if(ex>1)m=Math.max(m,Math.min(1,ex/7));}rowSh[i]=1-.5*m;}
  {const t=rowSh.slice();for(let i=0;i<N;i++){let a=0;for(let o=-2;o<=2;o++)a+=t[(i+o+N)%N];rowSh[i]=a/5;}}
  function strip(o1,o2,y1,y2,vRep,uA,uB,mask){const pos=[],uv=[],idx=[],cl=[];
    for(let i=0;i<=N;i++){const j=i%N,a=at(j,o1,y1);pos.push(a.x,a.y,a.z);const b=at(j,o2,y2);pos.push(b.x,b.y,b.z);
      const v=i/N*vRep,sh2=rowSh[j];cl.push(sh2,sh2,sh2,sh2,sh2,sh2);uv.push(uA==null?0:uA,v,uB==null?1:uB,v);if(i<N&&(!mask||mask[i])){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(cl,3));
    geo.setIndex(idx);geo.computeVertexNormals();return geo;}
  function prof(pts,vRep,mask){const K=pts.length,pos=[],uv=[],idx=[],cl=[];
    for(let i=0;i<=N;i++){const j=i%N,v=i/N*vRep,s2=rowSh[j];for(let k=0;k<K;k++){const a=at(j,pts[k][0],pts[k][1]);pos.push(a.x,a.y,a.z);uv.push(k/(K-1),v);cl.push(s2,s2,s2);}
      if(i<N&&(!mask||mask[j]))for(let k=0;k<K-1;k++){const o=i*K+k;idx.push(o,o+1,o+K,o+1,o+K+1,o+K);}}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(cl,3));geo.setIndex(idx);geo.computeVertexNormals();return geo;}
  const rd=def.road;
  const RTX=roadTextures(def,R),vRep=Math.round(len/18);
  const roadMat=new THREE.MeshStandardMaterial({map:RTX.map,normalMap:RTX.nrm,roughnessMap:RTX.rgh,roughness:1,metalness:rd.metal,vertexColors:true,envMapIntensity:def.id==='neon'?1.3:1});
  if(def.wet>0)alphaFlag(roadMat,'1.-min(.75,'+def.wet.toFixed(2)+'*(1.-roughnessFactor))');
  if(def.id==='neon'){roadMat.emissiveMap=ctex(64,64,(c,w,h)=>{c.fillStyle='#000';c.fillRect(0,0,w,h);c.fillStyle='#19e3ff';c.fillRect(1,0,2,h);c.fillRect(w-3,0,2,h);},true);roadMat.emissive=new THREE.Color(0xffffff);roadMat.emissiveIntensity=.6;}
  const road=new THREE.Mesh(strip(-half,half,.02,.02,vRep),roadMat);road.receiveShadow=true;g.add(road);
  const shMat=new THREE.MeshStandardMaterial({color:def.shoulder,roughness:1,metalness:0,vertexColors:true});
  const shL=new THREE.Mesh(strip(-half-sh,-half,0,.02,vRep),shMat),shR=new THREE.Mesh(strip(half,half+sh,.02,0,vRep),shMat);
  shL.receiveShadow=shR.receiveShadow=true;g.add(shL,shR);
  /* barriers */
  let wallMat,neonTex=null;
  if(def.id==='neon'){neonTex=ctex(128,32,(c,w,h)=>{c.fillStyle='#07070d';c.fillRect(0,0,w,h);
      const gr=c.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#ff2d7a');gr.addColorStop(.5,'#19e3ff');gr.addColorStop(1,'#ff2d7a');c.fillStyle=gr;
      c.fillRect(0,5,w,6);c.fillRect(0,21,w,4);c.fillStyle='#fff';for(let x=0;x<w;x+=32){c.beginPath();c.moveTo(x,12);c.lineTo(x+12,16);c.lineTo(x,20);c.fill();}},true);
    neonTex.rotation=Math.PI/2;neonTex.center.set(.5,.5);
    wallMat=new THREE.MeshStandardMaterial({color:0x0b0b12,roughness:.4,metalness:.6,emissive:0xffffff,emissiveMap:neonTex,emissiveIntensity:2.2,side:THREE.DoubleSide});}
  else wallMat=new THREE.MeshStandardMaterial({color:def.wall,roughness:.95,side:THREE.DoubleSide});
  const wRep=Math.round(len/12);
  for(const s of[-1,1]){const w=new THREE.Mesh(strip(s*(half+sh),s*(half+sh+.5),-3,def.wallH,wRep,-2.727,1),wallMat);w.receiveShadow=true;w.castShadow=true;g.add(w);
    const cap=new THREE.Mesh(strip(s*(half+sh+.5),s*(half+sh+3.2),def.wallH,-2.4,wRep),def.id==='neon'?new THREE.MeshStandardMaterial({color:0x0b0b12,roughness:.6,side:THREE.DoubleSide}):wallMat);g.add(cap);}

  /* --- motorsport dressing: kerbs, guard rails, billboards, grandstand, start lights --- */
  {const cm=new Uint8Array(N);for(let i=0;i<N;i++){let m=0;for(let o=-3;o<=3;o++)m=Math.max(m,Math.abs(curv[(i+o+N)%N]));cm[i]=m>.0065?1:0;}
   const kt=ctex(64,64,(c,w,h)=>{c.fillStyle='#e9e9ee';c.fillRect(0,0,w,h);c.fillStyle=def.id==='neon'?'#ff2e6c':'#d8232a';c.fillRect(0,0,w,h/2);},true);
   const km=new THREE.MeshStandardMaterial({map:kt,roughness:.55});if(def.id==='neon'){km.emissive=new THREE.Color(0xffffff);km.emissiveMap=kt;km.emissiveIntensity=.1;}
   km.bumpMap=ctex(8,64,(c,w,h)=>{for(let y=0;y<h;y+=8){c.fillStyle='#fff';c.fillRect(0,y,w,4);c.fillStyle='#555';c.fillRect(0,y+4,w,4);}},true);km.bumpMap.repeat.set(1,6);km.bumpScale=.03;km.vertexColors=true;
   for(const s of[-1,1]){const kp=s>0?[[half-.22,.03],[half+.02,.11],[half+.8,.15],[half+1.08,.03]]:[[-half-1.08,.03],[-half-.8,.15],[-half-.02,.11],[-half+.22,.03]];km.polygonOffset=true;km.polygonOffsetFactor=-2;km.polygonOffsetUnits=-2;const kb=new THREE.Mesh(prof(kp,Math.round(len/2.4),cm),km);kb.receiveShadow=true;g.add(kb);}
   if(def.id!=='neon'){const rm=new THREE.MeshStandardMaterial({color:0xb9c0c8,roughness:.38,metalness:.9,side:THREE.DoubleSide});
     const np=Math.floor(N/2)*2,post=new THREE.InstancedMesh(new THREE.BoxGeometry(.12,1,.12),new THREE.MeshStandardMaterial({color:0x6b7178,roughness:.6,metalness:.7}),np),m4=new THREE.Matrix4();let n=0;
     for(const s of[-1,1]){const o=s*(half+sh-.35);{const d=-s*.085,r=new THREE.Mesh(prof([[o,.38],[o+d,.44],[o+d,.5],[o,.56],[o,.64],[o+d,.7],[o+d,.76],[o,.82]],wRep),rm);r.castShadow=true;g.add(r);}
       for(let i=0;i<N&&n<np;i+=2){at(i,o+s*.08,.45);m4.makeTranslation(tmpV.x,tmpV.y,tmpV.z);post.setMatrixAt(n++,m4);}}
     post.count=n;post.castShadow=false;g.add(post);}
   const BR=[['VOLTA','#0b1b3a','#22e4ff'],['NORDWIND','#f4f6fa','#0e2a5c'],['KITE TYRES','#ffc83d','#141414'],['HELIX OIL','#b3122e','#ffffff'],['ZENITH','#101010','#ff7a2f'],['PULSE ENERGY','#16c172','#062014'],['ARC MOTORS','#ffffff','#d8232a'],['LUMEN','#3a1466','#ffd6f1']];
   const lm=new THREE.MeshStandardMaterial({color:0x2a2d34,roughness:.5,metalness:.7}),lgG=new THREE.BoxGeometry(.25,1,.25),bgG=new THREE.PlaneGeometry(12,3.4);
   for(let b=0;b<8;b++){const i=Math.floor((b+.35)/8*N),s=b%2?1:-1,br=BR[b],tx=ctex(512,144,(c,w,h)=>{c.fillStyle=br[1];c.fillRect(0,0,w,h);c.fillStyle=br[2];c.fillRect(0,h-14,w,14);c.font='italic 900 84px "Barlow Condensed","Arial Narrow",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(br[0],w/2,h/2-4);});
     const mat=new THREE.MeshStandardMaterial({map:tx,roughness:.5,side:THREE.DoubleSide});if(def.id==='neon'){mat.emissive=new THREE.Color(0xffffff);mat.emissiveMap=tx;mat.emissiveIntensity=1.5;}
     const grp=new THREE.Group(),bd=new THREE.Mesh(bgG,mat);bd.position.y=4.6;bd.castShadow=true;grp.add(bd);for(const x of[-4.5,4.5]){const l=new THREE.Mesh(lgG,lm);l.scale.y=7;l.position.set(x,1,-.15);grp.add(l);}
     at(i,s*(half+sh+4.2),def.wallH,grp.position);grp.rotation.y=Math.atan2(s*tz[i],-s*tx[i]);g.add(grp);}
   // grandstand with crowd on the left of the grid
   {const i=(N-10+N)%N,gs=new THREE.Group(),sm=new THREE.MeshStandardMaterial({color:0x4d535c,roughness:.8,metalness:.2}),rows=6,L=44;
     for(let r=0;r<rows;r++){const st=new THREE.Mesh(new THREE.BoxGeometry(1.7,1+r*.85,L),sm);st.position.set(r*1.7,(1+r*.85)/2,0);st.castShadow=st.receiveShadow=true;gs.add(st);}
     const roof=new THREE.Mesh(new THREE.BoxGeometry(rows*1.7+2.5,.25,L+2),new THREE.MeshStandardMaterial({color:0x1b1e26,roughness:.4,metalness:.6}));roof.position.set(rows*.85+.4,rows*.85+4.6,0);roof.rotation.z=.08;roof.castShadow=true;gs.add(roof);
     for(const z of[-L/2,0,L/2]){const p=new THREE.Mesh(lgG,lm);p.scale.y=rows*.85+4.6;p.position.set(rows*1.7+.6,(rows*.85+4.6)/2,z);gs.add(p);}
     const cn=isTouch?260:520,cr=new THREE.InstancedMesh(new THREE.SphereGeometry(.25,7,6),new THREE.MeshStandardMaterial({roughness:.9}),cn),hd2=new THREE.InstancedMesh(new THREE.SphereGeometry(.13,7,6),new THREE.MeshStandardMaterial({color:0xc99a7a,roughness:.8}),cn),m4=new THREE.Matrix4(),col=new THREE.Color(),sc=new THREE.Vector3(),ps=new THREE.Vector3(),q=new THREE.Quaternion();
     for(let n=0;n<cn;n++){const r=n%rows,cx=r*1.7+(R()-.5)*.6,cz=(R()-.5)*(L-1.5),cy=1+r*.85+.42;sc.set(.85,1.25+R()*.3,.6);m4.compose(ps.set(cx,cy,cz),q,sc);cr.setMatrixAt(n,m4);col.setHSL(R(),.25+R()*.45,.18+R()*.3).convertSRGBToLinear();cr.setColorAt(n,col);sc.set(1,1,1);m4.compose(ps.set(cx,cy+.47,cz),q,sc);hd2.setMatrixAt(n,m4);}
     gs.add(cr);gs.add(hd2);at(i,-(half+sh+7.5),-.2,gs.position);gs.rotation.y=psi[i];g.add(gs);}
  }


  {const hm=[],m4=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(1,1,1),ps=new THREE.Vector3(),ax=new THREE.Vector3(0,1,0),col=new THREE.Color(),cnt=[0,0,0],HN=110;
   const btex=(br,w2,h2,fs)=>ctex(w2,h2,(c,w,h)=>{c.fillStyle=br[1];c.fillRect(0,0,w,h);c.fillStyle=br[2];c.fillRect(0,0,w,h*.07);c.fillRect(0,h*.93,w,h*.07);c.font='italic 900 '+fs+'px "Barlow Condensed","Arial Narrow",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(br[0],w/2,h/2+2);});
   for(let b=0;b<3;b++){const tx2=btex(BRANDS[(b*3+ti*2)%8],512,128,78),mat=new THREE.MeshStandardMaterial({map:tx2,roughness:.55});if(def.id==='neon'){mat.emissive=new THREE.Color(0xffffff);mat.emissiveMap=tx2;mat.emissiveIntensity=1.1;}
     hm.push(new THREE.InstancedMesh(new THREE.BoxGeometry(.16,1.1,5.95),mat,HN));}
   for(let i=0;i<N;i+=2){let c=0;for(let o=-2;o<=2;o++)c+=curv[(i+o+N)%N];c/=5;if(Math.abs(c)<.004)continue;const s=c>0?1:-1,b=((i/16)|0)%3;if(cnt[b]>=HN)continue;
     at(i,s*(half+sh+.7),def.wallH+.6);q.setFromAxisAngle(ax,psi[i]);m4.compose(ps.copy(tmpV),q,sc);hm[b].setMatrixAt(cnt[b]++,m4);}
   hm.forEach((m,b)=>{m.count=cnt[b];m.castShadow=true;g.add(m);});
   const tg2=mergeGeo([0,1,2].map(j=>[new THREE.TorusGeometry(.36,.15,8,16),new THREE.Matrix4().makeRotationX(Math.PI/2).setPosition(0,.15+j*.3,0),c=>c.setHex(0xffffff)])),TN=160,ts=new THREE.InstancedMesh(tg2,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92}),TN);let tn2=0;
   for(let i=0;i<0;i++){if(Math.abs(curv[i])<.011)continue;const s=curv[i]>0?-1:1;at(i,s*(half+sh-.25),0);m4.makeTranslation(tmpV.x,tmpV.y,tmpV.z);ts.setMatrixAt(tn2,m4);ts.setColorAt(tn2,col.setHex(((i>>1)&1)?0x9a9aa0:(def.id==='neon'?0x8c1840:0x8e1a20)).convertSRGBToLinear());tn2++;}
   ts.count=tn2;ts.castShadow=ts.receiveShadow=true;g.add(ts);
   for(const f of[.34,.67]){const i=Math.floor(f*N),ar=new THREE.Group(),pm2=new THREE.MeshStandardMaterial({color:0x22252e,metalness:.8,roughness:.35}),tx3=btex(BRANDS[(i+ti)%8],1024,128,96),bm3=new THREE.MeshStandardMaterial({map:tx3,roughness:.5,emissive:0xffffff,emissiveMap:tx3,emissiveIntensity:def.id==='neon'?1.2:.12});
     for(const s of[-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(.45,7.4,.45),pm2);p.position.set(s*(half+sh+.4),3.7,0);p.castShadow=true;ar.add(p);}
     const bmm=new THREE.Mesh(new THREE.BoxGeometry((half+sh)*2+1.4,1.5,.5),bm3);bmm.position.y=6.9;bmm.castShadow=true;ar.add(bmm);at(i,0,0,ar.position);ar.rotation.y=psi[i];g.add(ar);}
  }
  const flagU={value:0};
  {const fm=[0x9c1a20,0x8e939b,0x1a6ea0].map(cx=>{const m=new THREE.MeshStandardMaterial({color:cx,roughness:.8,side:THREE.DoubleSide});m.onBeforeCompile=sh=>{sh.uniforms.ft=flagU;sh.vertexShader='uniform float ft;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.z+=sin(position.x*3.2-ft*7.+position.y*1.3)*.16*position.x;transformed.y+=cos(position.x*2.6-ft*6.)*.05*position.x;');};m.customProgramCacheKey=()=>'flag';return m;});
   const pg=new THREE.CylinderGeometry(.05,.06,6.5,6),pmm=new THREE.MeshStandardMaterial({color:0xcfd4da,metalness:.8,roughness:.35}),fg=new THREE.PlaneGeometry(1.9,1.15,10,3);fg.translate(.95,0,0);
   let fi=0;for(let i=N-34;i<N+26;i+=4){const j=(i+N)%N,sd=(fi&1)?1:-1,grp=new THREE.Group(),po=new THREE.Mesh(pg,pmm);po.position.y=3.25;po.castShadow=true;grp.add(po);const fl=new THREE.Mesh(fg,fm[fi%3]);fl.position.y=5.85;fl.castShadow=true;grp.add(fl);
     at(j,sd*(half+sh+5.5),0,grp.position);grp.position.y=Math.max(terrH(grp.position.x,grp.position.z),grp.position.y-1.5)-.3;grp.rotation.y=psi[j]+Math.PI/2;g.add(grp);fi++;}}
  /* --- terrain: slope-shaded heightfield with tiled detail + normal map --- */
  const S=920,GN=isTouch?128:232,tg=new THREE.PlaneGeometry(S,S,GN,GN);tg.rotateX(-Math.PI/2);
  {const p=tg.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,terrH(p.getX(i),p.getZ(i)));tg.computeVertexNormals();
   const shd=new Float32Array(p.count).fill(1);if(def.id!=='neon'){const W1=GN+1,cell=S/GN,ux=sdx/shl,uz=sdz/shl,sl2=sdy/shl;
     for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=p.getY(i);let m=0;for(let s2=6;s2<=30;s2++){const d=s2*7,gx=Math.round((x+ux*d+S/2)/cell),gz=Math.round((z+uz*d+S/2)/cell);if(gx<0||gz<0||gx>GN||gz>GN)break;const ex=p.getY(gz*W1+gx)-(y+d*sl2);if(ex>1)m=Math.max(m,Math.min(1,ex/7));}shd[i]=1-.5*m;}}
   const nr=tg.attributes.normal,col=new Float32Array(p.count*3),cA=new THREE.Color(def.ter[0]).convertSRGBToLinear(),cB=new THREE.Color(def.ter[1]).convertSRGBToLinear(),cC=new THREE.Color(def.ter[2]).convertSRGBToLinear(),c=new THREE.Color();
   for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=p.getY(i),sl=1-nr.getY(i),n=fbm(x*.035+5,z*.035+2),rock=smooth((sl-.07+(n-.5)*.1)/.2)*def.rockMix;
     c.copy(cA).lerp(cC,clamp(n*1.5-.4,0,1)*.7).lerp(cB,rock);if(def.id==='desert')c.multiplyScalar(.84+.16*Math.sin(y*.6+n*4));
     c.multiplyScalar(shd[i]);col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
   tg.setAttribute('color',new THREE.BufferAttribute(col,3));}
  const tH=noiseField(128,77+ti,[[8,.5],[24,.3],[64,.2]]),tMap=grainTex(tH,128,def.id==='desert'?.88:.72),tNrm=normalFromHeight(tH,128,128,def.id==='neon'?1.5:def.id==='alpine'?2.2:2.2);tMap.repeat.set(120,120);
  let tM2=tMap;if(def.id==='neon'){tMap.dispose();tM2=ctex(256,256,(c,w,h)=>{c.fillStyle='#23262f';c.fillRect(0,0,w,h);c.fillStyle='#0d0f15';for(const x of[16,144])for(const y of[16,144])c.fillRect(x,y,96,96);c.fillStyle='#8d8f72';for(let k=0;k<w;k+=16){c.fillRect(k,127,8,2);c.fillRect(k,255,8,1);c.fillRect(127,k,2,8);c.fillRect(255,k,1,8);}},true);tM2.repeat.set(22,22);}
  const terrain=new THREE.Mesh(tg,new THREE.MeshStandardMaterial({vertexColors:def.id!=='neon',map:tM2,normalMap:def.id==='neon'?null:tNrm,roughness:def.id==='alpine'?.62:def.id==='neon'?.8:.95,metalness:0}));terrain.receiveShadow=true;terrain.castShadow=def.id!=='neon';g.add(terrain);
  if(def.id!=='neon'){const tid=def.id;terrain.material.onBeforeCompile=sh=>{
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWp;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWp=position;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
varying vec3 vWp;float th(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}
float tn(vec2 q){vec2 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);return mix(mix(th(i),th(i+vec2(1,0)),f.x),mix(th(i+vec2(0,1)),th(i+vec2(1,1)),f.x),f.y);}
float tf(vec2 q){return tn(q)*.5+tn(q*2.07+3.1)*.3+tn(q*4.3+7.7)*.2;}`).replace('#include <color_fragment>',tid==='desert'?`#include <color_fragment>
{float m=tf(vWp.xz*.045),f=tf(vWp.xz*.9+vWp.y*.4),st=sin(vWp.y*1.55+m*5.)*.5+.5,st2=sin(vWp.y*2.1+m*7.)*.5+.5;
diffuseColor.rgb*=(.74+.3*st)*(.95+.06*st2)*(.8+.4*f);diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.72,.55,.6),smoothstep(.55,.9,m)*.5);
float bd=tn(vec2(vWp.y*.3+m*2.4,3.7));diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.56,.42,.4),smoothstep(.56,.62,bd)*.75);diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.2,1.02,.9),smoothstep(.36,.3,bd)*.6);
diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.86,.74,.56)*.9,smoothstep(.5,.85,st*tf(vWp.xz*.02+9.))*.22);}`:`#include <color_fragment>
{float m=tf(vWp.xz*.05),f=tf(vWp.xz*1.3);diffuseColor.rgb*=(.86+.2*m)*(.93+.12*f);diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.8,.9,1.08),smoothstep(.45,.8,m)*.6);}`)
    .replace('#include <emissivemap_fragment>',tid==='alpine'?`#include <emissivemap_fragment>
{vec2 cq=floor(vWp.xz*9.);float sp2=step(.993,th(cq))*step(.5,fract(th(cq+3.)*7.+dot(normalize(vViewPosition),vec3(3.1,1.7,2.3))*3.));totalEmissiveRadiance+=vec3(5.)*sp2*smoothstep(90.,10.,length(vViewPosition));}`:'#include <emissivemap_fragment>');};
    terrain.material.customProgramCacheKey=()=>'terr'+tid;}
  /* distant ridge line */
  if(def.ridge)for(const[rs,hs,ft]of[[1,1,0],[1.3,1.7,.55]]){const M=120,pos=[],colr=[],idx=[],c=new THREE.Color(),c1=new THREE.Color(def.ter[1]).convertSRGBToLinear(),c0=new THREE.Color(def.ter[0]).convertSRGBToLinear(),fgc=new THREE.Color(def.fog[0]).convertSRGBToLinear();
    for(let j=0;j<=M;j++){const a=j/M*TAU,k=j%M,pk=def.ridge*(.35+.65*Math.pow(fbm(Math.cos(k/M*TAU)*2.2+ti*5+3,Math.sin(k/M*TAU)*2.2+1),1.4))*(1+.35*Math.sin(k*1.7)*Math.sin(k*.37));
      for(const[r,hh,t]of[[540,-30,0],[640,pk*.5,.45],[720,pk,1],[900,pk*.2,.3]]){pos.push(Math.cos(a+rs)*r*rs,hh*hs,Math.sin(a+rs)*r*rs);c.copy(c1).lerp(c0,def.id==='alpine'?smooth(t*1.6-.3):t*.4).lerp(fgc,ft);colr.push(c.r,c.g,c.b);}
      if(j<M){const o=j*4;for(let q=0;q<3;q++)idx.push(o+q,o+q+1,o+q+4,o+q+1,o+q+5,o+q+4);}}
    const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));rg.setAttribute('color',new THREE.Float32BufferAttribute(colr,3));rg.setIndex(idx);rg.computeVertexNormals();
    g.add(new THREE.Mesh(rg,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9,flatShading:true,side:THREE.DoubleSide})));}

  /* --- start line + gantry --- */
  const chk=ctex(128,32,(c,w,h)=>{for(let y=0;y<2;y++)for(let x=0;x<8;x++){c.fillStyle=(x+y)&1?'#111':'#f4f4f4';c.fillRect(x*16,y*16,16,16);}});
  const sl=new THREE.Mesh(new THREE.PlaneGeometry(half*2,2.2),new THREE.MeshStandardMaterial({map:chk,roughness:.6}));
  sl.rotation.set(-Math.PI/2,0,0);const slp=new THREE.Group();slp.add(sl);slp.position.copy(at(0,0,.05));slp.rotation.y=psi[0];g.add(slp);
  const gan=new THREE.Group(),gm=new THREE.MeshStandardMaterial({color:0x22252e,metalness:.8,roughness:.35});
  for(const s of[-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(.5,7,.5),gm);p.position.set(s*(half+1.2),3.5,0);p.castShadow=true;gan.add(p);}
  const beam=new THREE.Mesh(new THREE.BoxGeometry(half*2+3.4,1.3,.6),new THREE.MeshStandardMaterial({map:chk,emissive:0xffffff,emissiveMap:chk,emissiveIntensity:def.id==='neon'?.22:.1,roughness:.5}));
  beam.position.y=6.6;beam.castShadow=true;gan.add(beam);
  const lamps=[];for(let i=0;i<3;i++){const hs=new THREE.Mesh(new THREE.BoxGeometry(1.25,1.25,.5),gm);hs.position.set((i-1)*1.6,5.3,-.25);gan.add(hs);const lp=new THREE.Mesh(new THREE.SphereGeometry(.44,16,10),new THREE.MeshBasicMaterial({color:0x140304}));lp.material.userData.lin=1;lp.position.set((i-1)*1.6,5.3,-.48);gan.add(lp);lamps.push(lp.material);}gan.position.copy(at(0,0,0));gan.rotation.y=psi[0];g.add(gan);

  /* --- item boxes --- */
  const boxes=[],bg=rbox(1.5,1.5,1.5,.3),gdG=new THREE.PlaneGeometry(4.2,4.2),gdM=new THREE.MeshBasicMaterial({map:pTexW(),color:0xffc83d,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});gdG.rotateX(-Math.PI/2);
  const qtex=ctex(64,64,(c,w,h)=>{c.fillStyle='#120a2a';c.fillRect(0,0,w,h);c.strokeStyle='#ffd24a';c.lineWidth=5;c.strokeRect(4,4,56,56);c.fillStyle='#fff';c.font='900 44px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('?',32,35);});
  const bm=new THREE.MeshStandardMaterial({color:0xffffff,map:qtex,emissive:0xffffff,emissiveMap:qtex,emissiveIntensity:.9,metalness:.9,roughness:.18,transparent:true,opacity:.93});
  for(const f of[.1,.27,.44,.61,.78,.92]){const i=Math.floor(f*N);for(const o of[-.62,-.21,.21,.62]){const m=new THREE.Mesh(bg,bm);at(i,o*half,1.25,m.position);m.castShadow=true;g.add(m);const gd=new THREE.Mesh(gdG,gdM);at(i,o*half,.06,gd.position);gd.layers.set(1);g.add(gd);
    boxes.push({x:m.position.x,y:m.position.y,z:m.position.z,mesh:m,gd,t:0,ph:R()*6});}}

  /* --- roadside posts / lights --- */
  {const np=Math.floor(N/7)*2,pole=new THREE.InstancedMesh(new THREE.CylinderGeometry(.09,.11,def.id==='neon'?6:1.8,6),new THREE.MeshStandardMaterial({color:def.id==='neon'?0x30323c:0x7a4a2a,roughness:.7,metalness:def.id==='neon'?.8:0}),np);
   const capC=def.id==='neon'?0xffffff:def.id==='alpine'?0xff5a1e:0xfff0c0;
   const cap=new THREE.InstancedMesh(new THREE.SphereGeometry(def.id==='neon'?.28:.2,8,6),new THREE.MeshStandardMaterial({color:capC,emissive:capC,emissiveIntensity:def.id==='neon'?3.5:.5}),np);
   const m4=new THREE.Matrix4(),col=new THREE.Color();let n=0;const hh=def.id==='neon'?3:.9;
   for(let i=0;i<N&&n<np;i+=7){for(const s of[-1,1]){at(i,s*(half+sh+1.1),def.wallH*.6+hh);m4.makeTranslation(tmpV.x,tmpV.y,tmpV.z);pole.setMatrixAt(n,m4);
     m4.makeTranslation(tmpV.x,tmpV.y+hh+.1,tmpV.z);cap.setMatrixAt(n,m4);if(def.id==='neon'){col.setHex(((i/7)|0)%2?0xff3d81:0x19e3ff).convertSRGBToLinear();cap.setColorAt(n,col);}n++;}}
   pole.count=cap.count=n;g.add(pole,cap);}

  /* --- scenery --- */
  const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),ps=new THREE.Vector3(),eul=new THREE.Euler(),col=new THREE.Color(),MX=()=>new THREE.Matrix4();
  function scatter(count,minD,maxR,cb,maxSl){let n=0,tries=0;while(n<count&&tries<count*22){tries++;const a=R()*TAU,r=Math.sqrt(R())*maxR,x=Math.cos(a)*r,z=Math.sin(a)*r;nearest(x,z,3);if(nd<minD)continue;const dd=nd,y=terrH(x,z);if(maxSl!=null&&Math.hypot(terrH(x+2,z)-y,terrH(x,z+2)-y)/2>maxSl)continue;cb(n,x,y,z,dd);n++;}return n;}
  const VM=o=>new THREE.MeshStandardMaterial(Object.assign({vertexColors:true},o));
  const blobs=[];let beacon=null;
  const inst=(geo,mat,cnt)=>{const m=new THREE.InstancedMesh(geo,mat,cnt);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
  if(def.id==='alpine'){
    const parts=[[new THREE.CylinderGeometry(.13,.34,3,9),MX().makeTranslation(0,1.5,0),(c,x,y,z)=>c.setHex(0x3a281b).lerp(col.setHex(0x1d130c),hash2(x*20,y*3))]];
    for(let t=0;t<8;t++){const f=t/7,r=2.9*(1-f*.8),h=2.6-f*.9,y=2.4+t*1.12,y0=y-h/2,cg=new THREE.ConeGeometry(r,h,22,3),cp=cg.attributes.position;
      for(let i=0;i<cp.count;i++){const ax=cp.getX(i),az=cp.getZ(i),ay=cp.getY(i),rr=Math.hypot(ax,az);if(rr>.01){const ai=Math.round(Math.atan2(az,ax)*22/TAU),low=ay<-h/2+.01,kk=(low?1:.45)*((hash2(ai+t*7,3)-.5)*.6+.3*Math.sin(ai*TAU/22*6+t*1.7));cp.setXYZ(i,ax*(1+kk*.7),ay-(low?.25+hash2(ai,t)*.55:0),az*(1+kk*.7));}}
      cg.computeVertexNormals();
      parts.push([cg,MX().makeRotationY(t*1.3).setPosition(0,y,0),(c,x,yy,z)=>{const up=(yy-y0)/h,e=Math.hypot(x,z)/r;c.setHex(0x12331f).lerp(col.setHex(0x2a5a3a),hash2(x*7,z*7)*.9).multiplyScalar(.45+.55*Math.min(1,e*1.15)).lerp(col.setHex(0xf4f7fb),smooth((up*1.4-.35+hash2(x*4+yy,z*4)*.42-e*.2)*1.6)*(.35+.65*Math.min(1,e*1.3)));}]);}
    const pine=mergeGeo(parts),cnt=isTouch?260:520,XT=80,tr=inst(pine,VM({roughness:.85}),cnt+XT);
    tr.count=scatter(cnt,half+sh+7,430,(i,x,y,z)=>{const s=.75+R()*1.5;q.setFromAxisAngle(ps.set(0,1,0),R()*TAU);sc.set(s,s*(.9+R()*.4),s);m4.compose(ps.set(x,y-.5,z),q,sc);tr.setMatrixAt(i,m4);tr.setColorAt(i,col.setScalar(.72+R()*.42));blobs.push(x,y,z,s*5.5);},.75);
    {let tn3=tr.count;for(let i=5;i<N&&tn3<cnt+XT;i+=6){const sd=R()<.5?-1:1;at(i,sd*(half+sh+10+R()*10),0);const x=tmpV.x,z=tmpV.z,y=terrH(x,z),s=1.0+R()*.45;q.setFromAxisAngle(ps.set(0,1,0),R()*TAU);sc.set(s,s*(.95+R()*.3),s);m4.compose(ps.set(x,y-.4,z),q,sc);tr.setMatrixAt(tn3,m4);tr.setColorAt(tn3,col.setScalar(.7+R()*.4));blobs.push(x,y,z,s*5.5);tn3++;}tr.count=tn3;}
    const rc=isTouch?50:110,rk=inst(rockGeo(3,2,(c,x,y,z,d)=>{c.setHex(0x5d646d).lerp(col.setHex(0x848b94),d-.7).lerp(col.setHex(0xf3f6fa),smooth((y-.1)*2.2));}),VM({roughness:.8}),rc);
    rk.count=scatter(rc,half+sh+4,420,(i,x,y,z)=>{eul.set(0,R()*TAU,0);q.setFromEuler(eul);const s=.8+R()*R()*4;sc.set(s,s*(.6+R()*.5),s);m4.compose(ps.set(x,y-s*.12,z),q,sc);rk.setMatrixAt(i,m4);},.7);}
  else if(def.id==='desert'){
    const strata=(c,x,y,z,d)=>{c.setHex(0xb0683c).lerp(col.setHex(0xd9a066),.5+.5*Math.sin(y*9+d*4)).lerp(col.setHex(0x7d4326),smooth(-y*1.5));};
    const rc=isTouch?130:260,rk=inst(rockGeo(5,2,strata),VM({roughness:.95}),rc);
    rk.count=scatter(rc,half+sh+4,430,(i,x,y,z,dd)=>{eul.set(R()*.4,R()*TAU,R()*.4);q.setFromEuler(eul);const big=dd>70&&R()<.25,s=big?8+R()*9:.6+R()*R()*4.5;sc.set(s,s*(big?1.3+R():.6+R()*.7),s);m4.compose(ps.set(x,y-s*.2,z),q,sc);rk.setMatrixAt(i,m4);},1.1);
    const gc=(c,x,y,z)=>c.setHex(0x3f7d3c).lerp(col.setHex(0x5c9a4f),hash2(x*3+z,y*2)*.6),cy=(r,h)=>new THREE.CylinderGeometry(r,r,h,10),sp=r=>new THREE.SphereGeometry(r,10,8);
    const cactus=mergeGeo([[cy(.32,3.6),MX().makeTranslation(0,1.8,0),gc],[sp(.32),MX().makeTranslation(0,3.6,0),gc],
      [cy(.2,.9),MX().makeRotationZ(Math.PI/2).setPosition(.6,1.7,0),gc],[sp(.2),MX().makeTranslation(1.05,1.7,0),gc],[cy(.2,1.3),MX().makeTranslation(1.05,2.35,0),gc],[sp(.2),MX().makeTranslation(1.05,3.0,0),gc],
      [cy(.18,.7),MX().makeRotationZ(Math.PI/2).setPosition(-.5,2.3,0),gc],[sp(.18),MX().makeTranslation(-.85,2.3,0),gc],[cy(.18,.9),MX().makeTranslation(-.85,2.75,0),gc],[sp(.18),MX().makeTranslation(-.85,3.2,0),gc]]);
    const cc=isTouch?70:140,ca=inst(cactus,VM({roughness:.75}),cc);ca.count=scatter(cc,half+sh+4,400,(i,x,y,z)=>{const s=1.3+R()*1.5;q.setFromAxisAngle(ps.set(0,1,0),R()*TAU);sc.set(s,s,s);m4.compose(ps.set(x,y-.3,z),q,sc);ca.setMatrixAt(i,m4);blobs.push(x,y,z,s*2.6);},.75);
    const bc=isTouch?120:300,bu=inst(rockGeo(9,1,(c,x,y)=>{c.setHex(0x6b6a34).lerp(col.setHex(0x9a9150),y*.5+.5);}),VM({roughness:1}),bc);bu.castShadow=false;
    bu.count=scatter(bc,half+sh+2,400,(i,x,y,z)=>{const s=.35+R()*.6;q.identity();sc.set(s*1.3,s*.8,s*1.3);m4.compose(ps.set(x,y+s*.3,z),q,sc);bu.setMatrixAt(i,m4);});}
  else{ /* neon city: glass towers, roof caps, neon signs, lamp glows */
    const lit=['#ffd98a','#ffe9bf','#19e3ff','#ff3d81','#c9d4ff','#ffb347'],signs=[],placed=[],bcn=[],ant=[],edges=[];
    for(const[cnt0,cols,rows,wr,hr]of[[70,8,26,[16,26],[70,170]],[80,8,13,[16,30],[26,70]],[50,16,8,[30,46],[16,36]]]){const cnt=isTouch?Math.round(cnt0*.6):cnt0;
      const mk=(em)=>ctex(256,512,(c,w,h)=>{c.globalAlpha=1;c.fillStyle=em?'#000':'#0b0e18';c.fillRect(0,0,w,h);const cw=w/cols,ch=h/rows,RR=rng(99+cols*rows);
        const acc=lit[2+((cols*rows)%4)];for(let y=0;y<rows;y++){const fl=RR(),run=RR();for(let x=0;x<cols;x++){const on=fl<.6&&RR()<(.05+run*.4),colr=RR()<.82?(RR()<.5?'#ffe2b0':'#fff1d8'):acc,a=.45+RR()*.55;if(on){c.globalAlpha=em?a:a*.8;c.fillStyle=colr;}else{if(em)continue;c.globalAlpha=1;c.fillStyle=RR()<.5?'#141b2c':'#101624';}c.fillRect(x*cw+cw*.1,y*ch+ch*.22,cw*.8,ch*.56);}}c.globalAlpha=1;if(!em){c.fillStyle='rgba(0,0,0,.55)';for(let y=0;y<rows;y++)c.fillRect(0,y*ch,w,ch*.14);}},true);
      const mat=new THREE.MeshStandardMaterial({map:mk(0),emissive:0xffffff,emissiveMap:mk(1),emissiveIntensity:2.0,roughness:.22,metalness:.75,envMapIntensity:1.3});
      mat.map.repeat.set(2,2);const bd=inst(new THREE.BoxGeometry(1,1,1),mat,cnt*2),roof=inst(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0x0c0d14,roughness:.7,metalness:.3}),cnt*2);bd.castShadow=roof.castShadow=false;m4.makeScale(0,0,0);for(let z2=0;z2<cnt*2;z2++){bd.setMatrixAt(z2,m4);roof.setMatrixAt(z2,m4);}
      scatter(cnt,half+sh+18,440,(i,x,y,z)=>{const w=wr[0]+R()*(wr[1]-wr[0]),d=wr[0]+R()*(wr[1]-wr[0]),h=hr[0]+R()*R()*(hr[1]-hr[0]),ry=Math.floor(R()*4)*Math.PI/2;let clash=false;const rad=Math.max(w,d)*.62;for(let b=0;b<placed.length;b+=3)if(Math.hypot(placed[b]-x,placed[b+1]-z)<placed[b+2]+rad){clash=true;break;}q.setFromAxisAngle(ps.set(0,1,0),ry);
        if(clash){m4.makeScale(0,0,0);bd.setMatrixAt(i,m4);roof.setMatrixAt(i,m4);return;}placed.push(x,z,rad);
        sc.set(w,h,d);m4.compose(ps.set(x,y+h/2-3,z),q,sc);bd.setMatrixAt(i,m4);sc.set(w*1.03,1.6,d*1.03);m4.compose(ps.set(x,y+h-2.3,z),q,sc);roof.setMatrixAt(i,m4);
        if(h>34){const h2=h*(.22+R()*.25),w2=w*(.5+R()*.22),d2=d*(.5+R()*.22);sc.set(w2,h2,d2);m4.compose(ps.set(x,y+h-3+h2/2,z),q,sc);bd.setMatrixAt(cnt+i,m4);sc.set(w2*1.04,1.2,d2*1.04);m4.compose(ps.set(x,y+h-3+h2,z),q,sc);roof.setMatrixAt(cnt+i,m4);if(h>70){bcn.push(x,y+h+h2+3,z);ant.push(x,y+h-3+h2,z);}}
        if(R()<.3)edges.push(x+(Math.cos(ry)*w-Math.sin(ry)*d)*.5,y+h/2-3,z+(-Math.sin(ry)*w-Math.cos(ry)*d)*.5,h);
        if(R()<.45)signs.push([x+Math.cos(ry)*(w/2+.3),y+h*(.2+R()*.5),z-Math.sin(ry)*(w/2+.3),ry+Math.PI/2,d*(.3+R()*.4),3+R()*9]);});}
    const sg=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,.4),new THREE.MeshBasicMaterial({color:0xffffff}),signs.length),NC=[0xff3d81,0x19e3ff,0xffd24a,0x9d5cff,0x3dff9e];
    signs.forEach((s,i)=>{q.setFromAxisAngle(ps.set(0,1,0),s[3]);sc.set(s[4],s[5],1);m4.compose(ps.set(s[0],s[1],s[2]),q,sc);sg.setMatrixAt(i,m4);sg.setColorAt(i,col.setHex(NC[i%NC.length]).convertSRGBToLinear().multiplyScalar(2.6));});g.add(sg);
    {const eg=new THREE.InstancedMesh(new THREE.BoxGeometry(.7,1,.7),new THREE.MeshBasicMaterial({color:0xffffff}),Math.max(1,edges.length/4));for(let i=0;i<edges.length/4;i++){q.identity();sc.set(1,edges[i*4+3],1);m4.compose(ps.set(edges[i*4],edges[i*4+1],edges[i*4+2]),q,sc);eg.setMatrixAt(i,m4);eg.setColorAt(i,col.setHex(NC[i%NC.length]).convertSRGBToLinear().multiplyScalar(2.2));}g.add(eg);
     const an=new THREE.InstancedMesh(new THREE.CylinderGeometry(.12,.2,6,5),new THREE.MeshStandardMaterial({color:0x2a2c36,metalness:.8,roughness:.4}),Math.max(1,ant.length/3));for(let i=0;i<ant.length/3;i++){m4.makeTranslation(ant[i*3],ant[i*3+1]+3,ant[i*3+2]);an.setMatrixAt(i,m4);}g.add(an);
     if(bcn.length){const bg3=new THREE.BufferGeometry();bg3.setAttribute('position',new THREE.Float32BufferAttribute(bcn,3));beacon=new THREE.Points(bg3,new THREE.PointsMaterial({color:0xff2020,size:9,map:pTexW(),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));beacon.material.color.setRGB(6,.3,.3);beacon.material.userData.lin=1;beacon.layers.set(1);g.add(beacon);}}
    const lp=[],lc=[];for(let i=0;i<N;i+=7)for(const s of[-1,1]){at(i,s*(half+sh+1.1),def.wallH*.6+6.1);lp.push(tmpV.x,tmpV.y,tmpV.z);col.setHex(((i/7)|0)%2?0xff3d81:0x19e3ff);lc.push(col.r*.22,col.g*.22,col.b*.22);}
    const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lp,3));lg.setAttribute('color',new THREE.Float32BufferAttribute(lc,3));
    const glow=new THREE.Points(lg,new THREE.PointsMaterial({size:3,map:pTexW(),vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));g.add(glow);
    const st=new Float32Array(1200*3);for(let i=0;i<1200;i++){const a=R()*TAU,e=.06+R()*1.45,r=1400;st[i*3]=Math.cos(a)*Math.cos(e)*r;st[i*3+1]=Math.sin(e)*r;st[i*3+2]=Math.sin(a)*Math.cos(e)*r;}
    const sgeo=new THREE.BufferGeometry();sgeo.setAttribute('position',new THREE.BufferAttribute(st,3));
    const stars=new THREE.Points(sgeo,new THREE.PointsMaterial({color:0xffffff,size:1.7,sizeAttenuation:false,fog:false,transparent:true,opacity:.9,depthWrite:false}));stars.frustumCulled=false;stars.layers.set(1);glow.layers.set(1);g.add(stars);}

  if(blobs.length){const bn=blobs.length/4,bg2=new THREE.PlaneGeometry(1,1);bg2.rotateX(-Math.PI/2);const bm2=new THREE.InstancedMesh(bg2,new THREE.MeshBasicMaterial({map:aoTex,transparent:true,opacity:.8,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),bn);
    for(let i=0;i<bn;i++){q.identity();sc.set(blobs[i*4+3],1,blobs[i*4+3]);m4.compose(ps.set(blobs[i*4],blobs[i*4+1]+.25,blobs[i*4+2]),q,sc);bm2.setMatrixAt(i,m4);}bm2.layers.set(1);bm2.renderOrder=1;g.add(bm2);}
  /* --- sky (sun disc, haze, procedural clouds) + environment + lights --- */
  sunDir.set(def.sun[2][0],def.sun[2][1],def.sun[2][2]).normalize();
  const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:new THREE.Color(def.sky[0])},bot:{value:new THREE.Color(def.sky[1])},sunC:{value:new THREE.Color(def.skySun)},sunD:{value:sunDir.clone()},hg:{value:new THREE.Color(def.id==='neon'?0x7a2a8c:0x000000)},cloud:{value:def.cloud},time:{value:0},hdr:{value:0},gain:{value:def.id==='neon'?1.15:1.45}},
    vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform vec3 top,bot,sunC,sunD;uniform vec3 hg;uniform float cloud,time,hdr,gain;varying vec3 p;
float h2(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}
float ns(vec2 q){vec2 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
float fb(vec2 q){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*ns(q);q=q*2.03+7.1;a*=.5;}return v;}
void main(){vec3 d=normalize(p);float h=d.y;vec3 c=mix(bot,top,pow(clamp(h*1.25+.03,0.,1.),.55));
float s=max(dot(d,sunD),0.);c+=sunC*(pow(s,600.)*3.+pow(s,40.)*.35+pow(s,5.)*.12);
if(cloud>0.&&h>.015){vec2 q=d.xz/(h+.14)*1.3+time*.006;float n=fb(q),m=smoothstep(1.-cloud,1.-cloud+.32,n)*smoothstep(.015,.22,h);
vec3 cc=mix(bot*.92,vec3(1.)+sunC*.25,smoothstep(.3,.9,n+pow(s,6.)*.3));c=mix(c,cc,m*.88);}
c+=hg*pow(1.-clamp(h,0.,1.),7.);if(hdr>.5){c=pow(c,vec3(2.2))*gain;c+=sunC*(pow(s,1500.)*40.+pow(s,90.)*.6);}
gl_FragColor=vec4(c,1.);}`});
  const sky=new THREE.Mesh(new THREE.SphereGeometry(1500,32,16),skyMat);sky.frustumCulled=false;sky.layers.set(1);g.add(sky);
  const envS=new THREE.Scene();envS.add(new THREE.Mesh(sky.geometry,skyMat));
  {const gnd=new THREE.Mesh(new THREE.CircleGeometry(1400,24),new THREE.MeshBasicMaterial({color:new THREE.Color(def.ter[0]).multiplyScalar(def.id==='neon'?1.2:.7)}));gnd.rotation.x=-Math.PI/2;gnd.position.y=-40;envS.add(gnd);}
  if(def.id==='neon'){for(let i=0;i<10;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(50,260,50),new THREE.MeshBasicMaterial({color:i%2?0xff3d81:0x19e3ff}));const a=i/10*TAU;b.position.set(Math.cos(a)*600,60,Math.sin(a)*600);envS.add(b);}}
  const env=pmrem.fromScene(envS,.02);scene.environment=env.texture;
  envS.traverse(o=>{if(o.isMesh&&o.geometry!==sky.geometry){o.geometry.dispose();o.material.dispose();}});
  scene.fog=new THREE.FogExp2(def.fog[0],def.fog[1]);renderer.setClearColor(def.fog[0]);
  sun.color.setHex(def.sun[0]);sun.intensity=def.sun[1];
  hemi.color.setHex(def.hemi[0]);hemi.groundColor.setHex(def.hemi[1]);hemi.intensity=def.hemi[2];renderer.toneMappingExposure=def.expo;

  /* --- weather particles --- */
  let weather=null;
  if(def.weather!=='none'){const n=isTouch?700:1500,p=new Float32Array(n*3);for(let i=0;i<n*3;i++)p[i]=(R()-.5)*90;
    const wg=new THREE.BufferGeometry();wg.setAttribute('position',new THREE.BufferAttribute(p,3));
    const snow=def.weather==='snow';
    weather=new THREE.Points(wg,new THREE.PointsMaterial({color:snow?0xffffff:0xe7c08a,size:snow?.13:.08,map:pTexW(),transparent:true,opacity:snow?.9:.55,depthWrite:false}));
    weather.frustumCulled=false;weather.layers.set(1);weather.userData={snow,n};g.add(weather);}

  if(def.id==='neon'){g.add(headL);g.add(headL.target);}
  /* r128: the depth pre-pass shares one program, so every instanced mesh needs an instanceColor buffer */
  /* r128 culls an InstancedMesh by its geometry's sphere at the mesh origin: give every one real bounds, and split big scatters into sectors */
  {const _m=new THREE.Matrix4(),_p=new THREE.Vector3(),_q=new THREE.Quaternion(),_s=new THREE.Vector3(),_c=new THREE.Color();
   const bound=(m)=>{const geo=m.geometry;if(!geo.boundingSphere)geo.computeBoundingSphere();const gr=geo.boundingSphere.radius+geo.boundingSphere.center.length(),n=m.count;let cx=0,cy=0,cz=0,ms=0,k=0;const P=[];
     for(let i=0;i<n;i++){m.getMatrixAt(i,_m);_m.decompose(_p,_q,_s);const sm=Math.max(_s.x,_s.y,_s.z);if(sm<=0)continue;P.push(_p.x,_p.y,_p.z,sm);cx+=_p.x;cy+=_p.y;cz+=_p.z;k++;}
     if(!k){m.visible=false;return;}cx/=k;cy/=k;cz/=k;let r=0;for(let i=0;i<P.length;i+=4)r=Math.max(r,Math.hypot(P[i]-cx,P[i+1]-cy,P[i+2]-cz)+gr*P[i+3]);
     const ng=new THREE.BufferGeometry();for(const a in geo.attributes)ng.setAttribute(a,geo.attributes[a]);ng.setIndex(geo.index);ng.boundingSphere=new THREE.Sphere(new THREE.Vector3(cx,cy,cz),r);m.geometry=ng;};
   for(const m of g.children.slice()){if(!m.isInstancedMesh)continue;const n=m.count;if(n<48){bound(m);continue;}
     const K=8,bins=[];for(let b=0;b<K;b++)bins.push([]);for(let i=0;i<n;i++){m.getMatrixAt(i,_m);_p.setFromMatrixPosition(_m);bins[Math.min(K-1,Math.floor((Math.atan2(_p.z,_p.x)+Math.PI)/TAU*K))].push(i);}
     for(const bn of bins){if(!bn.length)continue;const sm=new THREE.InstancedMesh(m.geometry,m.material,bn.length);bn.forEach((i,j)=>{m.getMatrixAt(i,_m);sm.setMatrixAt(j,_m);if(m.instanceColor){m.getColorAt(i,_c);sm.setColorAt(j,_c);}});
       sm.castShadow=m.castShadow;sm.receiveShadow=m.receiveShadow;sm.layers.mask=m.layers.mask;sm.renderOrder=m.renderOrder;bound(sm);g.add(sm);}
     g.remove(m);m.dispose();}
   g.traverse(o=>{if(o.isInstancedMesh&&o.parent!==g)bound(o);});}
  g.traverse(o=>{if(o.isInstancedMesh&&!o.instanceColor)o.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(o.instanceMatrix.count*3).fill(1),3);});
  linGroup(g);scene.add(g);
  /* minimap prerender */
  let mnx=1e9,mxx=-1e9,mnz=1e9,mxz=-1e9;for(let i=0;i<N;i++){mnx=Math.min(mnx,px[i]);mxx=Math.max(mxx,px[i]);mnz=Math.min(mnz,pz[i]);mxz=Math.max(mxz,pz[i]);}
  const ms=160/Math.max(mxx-mnx,mxz-mnz),mox=90-(mnx+mxx)/2*ms,moz=90-(mnz+mxz)/2*ms;
  const mc=document.createElement('canvas');mc.width=mc.height=180;{const c=mc.getContext('2d');c.lineJoin='round';
    for(const[w,s]of[[9,'rgba(0,0,0,.55)'],[5,'#e8eefc']]){c.lineWidth=w;c.strokeStyle=s;c.beginPath();for(let i=0;i<=N;i+=2){const j=i%N;c.lineTo(px[j]*ms+mox,pz[j]*ms+moz);}c.closePath();c.stroke();}
    c.fillStyle='#ff3d81';c.fillRect(px[0]*ms+mox-3,pz[0]*ms+moz-3,6,6);}

  T={ti,def,group:g,beacon,flagU,terrain,skyMat,roadMat,lamps,N,seg,len,px,py,pz,tx,tz,rx,rz,psi,grade,slope,curv,half,sh,limit,at,boxes,env,sky,weather,neonTex,boxMat:bm,mini:{c:mc,s:ms,ox:mox,oz:moz},
    /* locate a world point relative to the spline: fills o={i,f,lat,y,grade,slope} */
    locate(x,z,idx,o,wide){let best=idx,bd=1e18;const a=wide?-N/2|0:-6,b=wide?N/2|0:12;
      for(let k=a;k<=b;k++){const j=((idx+k)%N+N)%N,dx=x-px[j],dz=z-pz[j],d=dx*dx+dz*dz;if(d<bd){bd=d;best=j;}}
      const j=best,dx=x-px[j],dz=z-pz[j];let al=clamp((dx*tx[j]+dz*tz[j])/seg,-1,1);const j2=al>=0?(j+1)%N:(j+N-1)%N,w=Math.abs(al);
      o.i=j;o.f=al;o.lat=dx*rx[j]+dz*rz[j];o.slope=lerp(slope[j],slope[j2],w);o.grade=lerp(grade[j],grade[j2],w);
      o.y=lerp(py[j],py[j2],w)+clamp(o.lat,-half-sh-1,half+sh+1)*o.slope;o.tx=tx[j];o.tz=tz[j];o.rx=rx[j];o.rz=rz[j];return o;}};
  return T;
}
let T_stars=null;
function pTexW(){return ctex(32,32,c=>{const g=c.createRadialGradient(16,16,0,16,16,16);g.addColorStop(0,'#fff');g.addColorStop(.5,'rgba(255,255,255,.8)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,32,32);});}


/* ==== 30-geo.js ==== */
/* ---------------- geometry helpers ---------------- */
function rbox(w,h,d,r){const b=Math.min(r*.6,d/2-.004),W=w-2*b,H=h-2*b,rr=Math.max(.002,Math.min(r,W/2-.001,H/2-.001)),s=new THREE.Shape();
  s.moveTo(-W/2+rr,-H/2);s.lineTo(W/2-rr,-H/2);s.quadraticCurveTo(W/2,-H/2,W/2,-H/2+rr);s.lineTo(W/2,H/2-rr);s.quadraticCurveTo(W/2,H/2,W/2-rr,H/2);
  s.lineTo(-W/2+rr,H/2);s.quadraticCurveTo(-W/2,H/2,-W/2,H/2-rr);s.lineTo(-W/2,-H/2+rr);s.quadraticCurveTo(-W/2,-H/2,-W/2+rr,-H/2);
  const g=new THREE.ExtrudeGeometry(s,{depth:d-2*b,bevelEnabled:true,bevelSize:b,bevelThickness:b,bevelSegments:3,curveSegments:5});g.translate(0,0,-(d-2*b)/2);return g;}
/* smooth lofted shell from super-ellipse cross sections [z,w,h,y,x] (z ascending) */
function loft(secs,n,M){M=M||20;n=n||2.6;const pos=[],uv=[],idx=[],S=secs.length,W=M+1,z0=secs[0][0],z1=secs[S-1][0];
  for(const s of secs)for(let j=0;j<=M;j++){const a=j/M*TAU,c=Math.cos(a),si=Math.sin(a);
    pos.push((s[4]||0)+s[1]/2*Math.sign(c)*Math.pow(Math.abs(c),2/n),s[3]+s[2]/2*Math.sign(si)*Math.pow(Math.abs(si),2/n),s[0]);uv.push(j/M,(s[0]-z0)/(z1-z0));}
  for(let i=0;i<S-1;i++)for(let j=0;j<M;j++){const a=i*W+j,b=a+1,c=a+W,d=c+1;idx.push(a,b,c,b,d,c);}
  const c0=pos.length/3;pos.push(secs[0][4]||0,secs[0][3],z0,secs[S-1][4]||0,secs[S-1][3],z1);uv.push(.5,0,.5,1);
  for(let j=0;j<M;j++){idx.push(c0,j+1,j,c0+1,(S-1)*W+j,(S-1)*W+j+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  const nr=g.attributes.normal;for(let i=0;i<S;i++){const a=i*W,b=a+M,x=nr.getX(a)+nr.getX(b),y=nr.getY(a)+nr.getY(b),z=nr.getZ(a)+nr.getZ(b),l=Math.hypot(x,y,z)||1;nr.setXYZ(a,x/l,y/l,z/l);nr.setXYZ(b,x/l,y/l,z/l);}
  return g;}
/* merge several geometries into one with baked vertex colours (cf(color,x,y,z)) */
function mergeGeo(parts){const P=[],Nn=[],C=[],c=new THREE.Color();
  for(const[g0,m,cf]of parts){if(m)g0.applyMatrix4(m);const g=g0.index?g0.toNonIndexed():g0,p=g.attributes.position,n=g.attributes.normal;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);P.push(x,y,z);Nn.push(n.getX(i),n.getY(i),n.getZ(i));cf(c,x,y,z);c.convertSRGBToLinear();C.push(c.r,c.g,c.b);}
    g0.dispose();if(g!==g0)g.dispose();}
  const o=new THREE.BufferGeometry();o.setAttribute('position',new THREE.Float32BufferAttribute(P,3));o.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));o.setAttribute('color',new THREE.Float32BufferAttribute(C,3));return o;}
/* smooth organic boulder */
function rockGeo(seed,detail,cf){const g=new THREE.IcosahedronGeometry(1,detail),p=g.attributes.position,n=g.attributes.normal,C=new Float32Array(p.count*3),c=new THREE.Color();
  for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const l=Math.hypot(x,y,z);x/=l;y/=l;z/=l;
    const d=.72+.5*vnoise(x*1.6+seed,y*1.6+z*1.3+seed*.7)+.16*vnoise(x*4.3+seed*2,z*4.3+y*3.1);p.setXYZ(i,x*d,y*d*.8,z*d);n.setXYZ(i,x,y*1.25,z);
    cf(c,x,y,z,d);c.convertSRGBToLinear();C[i*3]=c.r;C[i*3+1]=c.g;C[i*3+2]=c.b;}
  n.needsUpdate=true;g.normalizeNormals();g.setAttribute('color',new THREE.BufferAttribute(C,3));return g;}
/* tileable procedural detail textures */
function noiseField(n,seed,oct){const R=rng(seed),h=new Float32Array(n*n);
  for(const[cells,amp]of oct){const gr=new Float32Array(cells*cells);for(let i=0;i<gr.length;i++)gr[i]=R();
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){const fx=x/n*cells,fy=y/n*cells,x0=fx|0,y0=fy|0,u=smooth(fx-x0),v=smooth(fy-y0),x1=(x0+1)%cells,y1=(y0+1)%cells;
      h[y*n+x]+=amp*lerp(lerp(gr[y0*cells+x0],gr[y0*cells+x1],u),lerp(gr[y1*cells+x0],gr[y1*cells+x1],u),v);}}return h;}
function dataTex(d,w,h){const t=new THREE.DataTexture(d,w,h,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;
  t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());t.needsUpdate=true;return t;}
function normalFromHeight(h,w,ht,str){const d=new Uint8Array(w*ht*4);for(let y=0;y<ht;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,dx=(h[y*w+(x+1)%w]-h[y*w+(x+w-1)%w])*str,dy=(h[((y+1)%ht)*w+x]-h[((y+ht-1)%ht)*w+x])*str,l=1/Math.hypot(dx,dy,1);
    d[i]=(-dx*l*.5+.5)*255;d[i+1]=(-dy*l*.5+.5)*255;d[i+2]=(l*.5+.5)*255;d[i+3]=255;}return dataTex(d,w,ht);}
function grainTex(h,n,lo){const d=new Uint8Array(n*n*4);for(let i=0;i<n*n;i++){const v=(lo+(1-lo)*clamp(h[i],0,1))*255;d[i*4]=d[i*4+1]=d[i*4+2]=v;d[i*4+3]=255;}return dataTex(d,n,n);}
function canvasNormal(tex,str){const c=tex.image,w=c.width,ht=c.height,im=c.getContext('2d').getImageData(0,0,w,ht).data,h=new Float32Array(w*ht);for(let i=0;i<w*ht;i++)h[i]=(im[i*4]*.3+im[i*4+1]*.6+im[i*4+2]*.1)/255;return normalFromHeight(h,w,ht,str);}


/* ==== 40-kart-model.js ==== */
/* ---------------- kart model (smooth lofted body + animated driver) ---------------- */
const KG={};
function kartGeo(){if(KG.ok)return;KG.ok=1;const V2=(x,y)=>new THREE.Vector2(x,y);
  KG.body=loft([[-1.47,.26,.14,.6],[-1.34,.64,.38,.62],[-1.0,.84,.52,.6],[-.5,.84,.44,.54],[0,.74,.36,.5],[.6,.6,.3,.45],[1.2,.44,.2,.4],[1.5,.26,.12,.37],[1.62,.1,.05,.36]],2.7,22);
  KG.podL=loft([[-1.08,.08,.08,.46,-.6],[-.92,.34,.3,.48,-.6],[-.2,.37,.32,.47,-.6],[.38,.3,.26,.45,-.6],[.64,.07,.07,.42,-.6]],2.6,14);
  KG.podR=loft([[-1.08,.08,.08,.46,.6],[-.92,.34,.3,.48,.6],[-.2,.37,.32,.47,.6],[.38,.3,.26,.45,.6],[.64,.07,.07,.42,.6]],2.6,14);
  KG.floor=rbox(1.2,.06,2.7,.03);KG.fwing=rbox(1.72,.05,.34,.02);KG.fplate=rbox(.05,.2,.42,.02);KG.rwing=rbox(1.42,.05,.42,.02);KG.rplate=rbox(.05,.36,.5,.02);
  KG.seat=rbox(.5,.46,.12,.07);KG.tail=rbox(.5,.07,.05,.02);
  KG.sph=new THREE.SphereGeometry(1,20,14);KG.cyl=new THREE.CylinderGeometry(1,1,1,12);KG.cone=new THREE.ConeGeometry(.5,1,12);
  KG.hoop=new THREE.TorusGeometry(.3,.035,8,20,Math.PI);KG.swheel=new THREE.TorusGeometry(.17,.028,8,20);
  KG.tire=new THREE.LatheGeometry([V2(.2,-.17),V2(.33,-.17),V2(.375,-.14),V2(.39,-.06),V2(.39,.06),V2(.375,.14),V2(.33,.17),V2(.2,.17)],24);KG.tire.rotateZ(Math.PI/2);
  KG.rim=new THREE.CylinderGeometry(.22,.22,.3,20);KG.rim.rotateZ(Math.PI/2);KG.spoke=rbox(.03,.4,.06,.012);
  KG.torso=new THREE.LatheGeometry([V2(0,0),V2(.19,0),V2(.23,.12),V2(.245,.3),V2(.21,.44),V2(.12,.52),V2(.075,.56),V2(.075,.62),V2(0,.62)],18);KG.torso.scale(1,1,.78);
  KG.visor=new THREE.SphereGeometry(.2085,24,10,Math.PI/2-1.3,2.6,1.02,.62);KG.stripe=new THREE.TorusGeometry(.2,.012,6,28,Math.PI*1.25);
  const S=(o)=>linMat(new THREE.MeshStandardMaterial(o));
  {const tt2=tireTex();KG.rubber=S({color:0xffffff,map:tt2,bumpMap:tt2,bumpScale:.012,roughness:.86});}KG.dark=S({color:0x16181d,roughness:.5,metalness:.5});KG.carbon=S({color:0x0e0f12,roughness:.35,metalness:.6});
  KG.chrome=S({color:0xe6ebf2,roughness:.12,metalness:1});KG.alloy=S({color:0x9aa3ad,roughness:.3,metalness:1});
  KG.visorM=S({color:0x05070c,roughness:.05,metalness:1,envMapIntensity:1.6});KG.glove=S({color:0x17181c,roughness:.7});
  KG.glow=linMat(new THREE.MeshBasicMaterial({color:0xff2a2a}));KG.lamp=new THREE.MeshBasicMaterial({color:0xfff6dd});
  for(const n of['rubber','dark','carbon','chrome','alloy','visorM','glove','glow','lamp'])alphaFlag(KG[n],'0.');
  KG.trapG=new THREE.CylinderGeometry(.75,.9,.5,14);KG.trapM=S({color:0x18181c,roughness:.4,metalness:.7,emissive:0xff2200,emissiveIntensity:.9});
  KG.rockG=new THREE.ConeGeometry(.38,1.7,12);KG.rockG.rotateX(Math.PI/2);KG.rockM=S({color:0xff3d81,emissive:0xff3d81,emissiveIntensity:1.6,metalness:.6,roughness:.3});
}
const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_c=new THREE.Vector3(),_up=new THREE.Vector3(0,1,0);
function setLimb(m,a,b,r){_c.subVectors(b,a);const l=_c.length()||1e-3;m.position.addVectors(a,b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(_up,_c.multiplyScalar(1/l));m.scale.set(r,l,r);}
function makeKartMesh(color){kartGeo();
  const g=new THREE.Group(),body=new THREE.Group();g.add(body);
  const paint=new THREE.MeshPhysicalMaterial({color,metalness:.45,roughness:.38,clearcoat:1,clearcoatRoughness:.07});paint.color.convertSRGBToLinear();
  const suit=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.82});
  const lc=document.createElement('canvas');lc.width=512;lc.height=256;const lt=new THREE.CanvasTexture(lc);lt.encoding=THREE.sRGBEncoding;lt.wrapS=THREE.RepeatWrapping;lt.anisotropy=8;
  const bodyM=new THREE.MeshPhysicalMaterial({color:0xffffff,map:lt,metalness:.45,roughness:.38,clearcoat:1,clearcoatRoughness:.07});
  for(const mm of[paint,bodyM,suit])alphaFlag(mm,'0.');
  const P=(geo,mat,x,y,z,sx,sy,sz,par)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);if(sx!=null)m.scale.set(sx,sy==null?sx:sy,sz==null?sx:sz);m.castShadow=true;(par||body).add(m);return m;};
  const L=(mat,ax,ay,az,bx,by,bz,r,par)=>{const m=new THREE.Mesh(KG.cyl,mat);setLimb(m,_a.set(ax,ay,az),_b.set(bx,by,bz),r);m.castShadow=true;(par||body).add(m);return m;};
  P(KG.floor,KG.carbon,0,.24,0);P(KG.body,bodyM,0,0,0);P(KG.podL,paint,0,0,0);P(KG.podR,paint,0,0,0);
  P(KG.sph,KG.carbon,0,.735,-.34,.3,.07,.52);                                   // cockpit opening
  P(KG.fwing,paint,0,.2,1.52);P(KG.fplate,KG.carbon,-.87,.28,1.5);P(KG.fplate,KG.carbon,.87,.28,1.5);
  L(KG.carbon,-.16,.24,1.4,-.16,.36,1.3,.025);L(KG.carbon,.16,.24,1.4,.16,.36,1.3,.025);
  P(KG.rwing,paint,0,1.14,-1.34);P(KG.rplate,KG.carbon,-.72,1.03,-1.34);P(KG.rplate,KG.carbon,.72,1.03,-1.34);
  L(KG.carbon,-.28,.74,-1.26,-.28,1.12,-1.32,.03);L(KG.carbon,.28,.74,-1.26,.28,1.12,-1.32,.03);
  P(KG.hoop,KG.chrome,0,.92,-.84);const seat=P(KG.seat,KG.carbon,0,1.0,-.72);seat.rotation.x=-.12;
  for(const s of[-1,1]){L(KG.chrome,s*.2,.5,-1.36,s*.2,.5,-1.62,.07);P(KG.sph,KG.lamp,s*.17,.4,1.5,.055);
    L(KG.carbon,s*.3,.42,.8,s*.8,.4,.86,.022);L(KG.carbon,s*.3,.36,1.02,s*.8,.36,.94,.022);                       // wishbones
    L(KG.carbon,s*.34,.6,.36,s*.5,.84,.3,.016);P(KG.sph,paint,s*.52,.87,.29,.09,.06,.035);}                        // mirrors
  L(KG.carbon,-.8,.42,-.9,.8,.42,-.9,.04);                                                                        // rear axle
  P(KG.tail,KG.glow,0,.74,-1.45);
  // wheels
  const wheels=[],piv=[];
  for(const[x,z,f]of[[-.86,.9,1],[.86,.9,1],[-.9,-.9,0],[.9,-.9,0]]){const pv=new THREE.Group();pv.position.set(x,.39,z);g.add(pv);const w=new THREE.Group();pv.add(w);if(!f)w.scale.set(1.2,1.06,1.06);
    P(KG.tire,KG.rubber,0,0,0,null,null,null,w);P(KG.rim,KG.alloy,0,0,0,null,null,null,w);const sx=Math.sign(x)*.155;
    for(let i=0;i<3;i++){const sp=P(KG.spoke,KG.chrome,sx,0,0,null,null,null,w);sp.rotation.x=i*Math.PI/3;}P(KG.sph,KG.chrome,sx,0,0,.03,.07,.07,w);
    wheels.push(w);if(f)piv.push(pv);}
  // driver avatar
  const drv=new THREE.Group();body.add(drv);
  const torso=P(KG.torso,suit,0,.68,-.42,null,null,null,drv);torso.rotation.x=-.1;
  P(KG.sph,suit,-.225,1.2,-.46,.078,.078,.078,drv);P(KG.sph,suit,.225,1.2,-.46,.078,.078,.078,drv);
  const head=new THREE.Group();head.position.set(0,1.42,-.5);drv.add(head);
  P(KG.sph,paint,0,0,0,.185,.19,.205,head);P(KG.visor,KG.visorM,0,0,.004,.925,.925,1.02,head);{const st=P(KG.stripe,KG.chrome,0,0,0,1,1.03,1,head);st.rotation.set(0,Math.PI/2,-.35);st.scale.set(1.1,1.03,1);}
  L(KG.carbon,0,-.16,0,0,-.26,.02,.07,head);
  const swp=new THREE.Group();swp.position.set(0,1.0,.1);swp.rotation.x=.55;body.add(swp);const sw=new THREE.Group();swp.add(sw);
  P(KG.swheel,KG.carbon,0,0,0,null,null,null,sw);const bar=P(KG.cyl,KG.carbon,0,0,0,.02,.33,.02,sw);bar.rotation.z=Math.PI/2;
  L(KG.carbon,0,.78,.42,0,1.0,.1,.022);
  const limbs=[],hands=[],elbows=[];for(let i=0;i<4;i++){const m=new THREE.Mesh(KG.cyl,suit);m.castShadow=true;drv.add(m);limbs.push(m);}
  for(let i=0;i<2;i++){hands.push(P(KG.sph,KG.glove,0,0,0,.065,.065,.065,drv));elbows.push(P(KG.sph,suit,0,0,0,.062,.062,.062,drv));}
  // name tag
  const tc=document.createElement('canvas');tc.width=256;tc.height=64;const tt=new THREE.CanvasTexture(tc);
  const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:tt,transparent:true,depthWrite:false,fog:false}));tag.scale.set(3.6,.9,1);tag.position.y=2.75;tag.layers.set(1);g.add(tag);
  const beam=new THREE.Mesh(new THREE.PlaneGeometry(4.4,11),new THREE.MeshBasicMaterial({map:beamTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));beam.material.color.setRGB(.55,.5,.4);beam.rotation.x=-Math.PI/2;beam.position.set(0,.06,7);beam.layers.set(1);beam.visible=false;g.add(beam);
  const ug=new THREE.Mesh(new THREE.PlaneGeometry(3.0,4.6),new THREE.MeshBasicMaterial({map:beamTexG,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));ug.rotation.x=-Math.PI/2;ug.position.y=.05;ug.layers.set(1);ug.visible=false;g.add(ug);
  // boost flame
  const fl=new THREE.Mesh(KG.cone,flameMat);
  fl.rotation.x=-Math.PI/2;fl.position.set(0,.5,-2.05);fl.scale.set(.5,1.4,.5);fl.visible=false;fl.layers.set(1);body.add(fl);
  return {g,body,paint,paints:[paint,bodyM],lc,lt,beam,ug,suit,wheels,piv,tag,tc,tt,flame:fl,head,sw,limbs,hands,elbows,cel:0,hy:0};
}
/* driver animation: hands follow the wheel, head looks into corners, fist-pump on finish */
const _h=new THREE.Vector3(),_s=new THREE.Vector3(),_e=new THREE.Vector3();
function animDriver(k,dt,time){const m=k.m,phi=k.steer*.75,ct=Math.cos(.55),st=Math.sin(.55);m.sw.rotation.z=phi;
  m.cel+=((k.finished?1:0)-m.cel)*Math.min(1,dt*4);
  m.hy+=((-k.steer*.42-(k.drift?k.driftDir*.2:0))-m.hy)*Math.min(1,dt*7);
  m.head.rotation.set(Math.sin(time*9+k.i)*.012*Math.min(1,Math.abs(k.spd)/20),m.hy,-k.bRoll*1.6+(k.spinT>0?Math.sin(time*30)*.2:0));
  for(let i=0;i<2;i++){const s=i?1:-1,lx=s*.17*Math.cos(phi),ly=s*.17*Math.sin(phi);
    _h.set(lx,1.0+ly*ct,.1+ly*st-.03);if(i===0&&m.cel>.01){_e.set(-.34,1.78+Math.sin(time*11)*.07,-.42);_h.lerp(_e,m.cel);}
    _s.set(s*.235,1.2,-.46);_e.addVectors(_s,_h).multiplyScalar(.5);_e.x+=s*.1;_e.y-=.1*(1-(i===0?m.cel:0));
    setLimb(m.limbs[i*2],_s,_e,.058);setLimb(m.limbs[i*2+1],_e,_h,.05);m.hands[i].position.copy(_h);m.elbows[i].position.copy(_e);}
}
function setTag(k){const c=k.m.tc.getContext('2d');c.clearRect(0,0,256,64);c.font='800 34px system-ui,sans-serif';c.textAlign='center';c.textBaseline='middle';
  c.lineWidth=7;c.strokeStyle='rgba(0,0,0,.8)';c.strokeText(k.name,128,34);c.fillStyle=k.human?'#ffd24a':'#ffffff';c.fillText(k.name,128,34);k.m.tt.needsUpdate=true;drawLivery(k);
  k.m.suit.color.setHex(PAINTS[k.color%PAINTS.length]).convertSRGBToLinear().multiplyScalar(.5).lerp(_white,.06);}
const _white=new THREE.Color(0xffffff);

/* per-kart extras: race number roundels, soft contact shadow, own brake light */
const aoTex=ctex(64,64,c=>{const g=c.createRadialGradient(32,32,4,32,32,32);g.addColorStop(0,'rgba(0,0,0,.8)');g.addColorStop(.55,'rgba(0,0,0,.42)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,64,64);});
aoTex.shared=true;
function kartExtras(k){const m=k.m,nt=ctex(96,96,c=>{c.fillStyle='#f6f7fa';c.beginPath();c.arc(48,48,46,0,TAU);c.fill();c.fillStyle='#0d0f14';c.font='900 italic 62px "Barlow Condensed","Arial Narrow",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(String(k.i+1),46,52);});
  const nm=new THREE.MeshStandardMaterial({map:nt,transparent:true,roughness:.45,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),cg=new THREE.CircleGeometry(.16,24);
  const a=new THREE.Mesh(cg,nm);a.position.set(0,.612,.78);a.rotation.x=-Math.PI/2+.085;m.body.add(a);
  for(const s of[-1,1]){const d=new THREE.Mesh(cg,nm);d.position.set(s*.792,.49,-.25);d.rotation.y=s*Math.PI/2;d.scale.set(.85,.85,1);m.body.add(d);}
  m.ao=new THREE.Mesh(new THREE.PlaneGeometry(2.7,4.0),new THREE.MeshBasicMaterial({map:aoTex,transparent:true,depthWrite:false,fog:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));m.ao.rotation.x=-Math.PI/2;m.ao.position.y=.035;m.ao.renderOrder=2;m.ao.layers.set(1);m.g.add(m.ao);
  m.tail=alphaFlag(new THREE.MeshBasicMaterial({color:0x550606}),'0.');m.body.traverse(o=>{if(o.material===KG.glow)o.material=m.tail;});k.ps=0;k.brk=0;}


/* ==== 50-sim.js ==== */
/* ---------------- game state ---------------- */
const G={mode:'menu',role:'player',my:0,track:store.get('track',0),color:store.get('color',0),name:store.get('name','')||'Player',
  steer:CFG.steer,tab:'race',paused:false,camMode:0,hostTV:false,code:''};
const race={state:'idle',t:0,count:0,intro:0,diff:1,items:true,endT:0,firstFin:-1,results:null};
const authority=()=>G.mode!=='client';
const karts=[];
const LO={},GRAV=16;  // scratch for locate; arcade gravity
class Kart{
  constructor(i){this.i=i;this.m=makeKartMesh(PAINTS[i%PAINTS.length]);scene.add(this.m.g);kartExtras(this);this.name=AI_NAMES[i];this.color=i;this.human=false;this.ai=true;
    this.in={st:0,th:0,br:0,dr:0,it:0,rs:0};this.itPrev=0;this.aiS={lat:0,latT:0,itemT:0,base:1,stuck:0};this.cam={hd:0};this.reset(0,0);}
  setLook(name,color,human){this.name=name;this.color=color;this.human=human;this.ai=!human;this.m.paint.color.setHex(PAINTS[color%PAINTS.length]).convertSRGBToLinear();setTag(this);}
  reset(idx,lat){this.x=0;this.y=0;this.z=0;this.hd=0;this.vx=0;this.vz=0;this.vy=0;this.spd=0;this.steer=0;this.drift=false;this.driftDir=0;this.driftT=0;
    this.boostT=0;this.spinT=0;this.spinA=0;this.inv=0;this.draft=0;this.item=0;this.idx=idx;this.frac=0;this.lat=lat;this.lap=0;this.prog=0;this.lapStart=0;
    this.bestLap=0;this.lastLap=0;this.finished=false;this.finT=0;this.place=this.i+1;this.air=false;this.off=false;this.pitch=0;this.roll=0;this.bRoll=0;this.bPitch=0;
    this.wrong=false;this.skill=1;this.itPrev=0;this.aiS.stuck=0;this.aiS.itemT=0;this.vlat=0;this.gA=0;
    if(T){T.at(idx,lat,0);this.x=tmpV.x;this.y=tmpV.y;this.z=tmpV.z;this.hd=T.psi[idx];}this.cam.hd=this.hd;}
}
for(let i=0;i<NK;i++)karts.push(new Kart(i));

/* events: produced by the authority, replayed locally and on replicas */
let evOut=[];
function ev(name,i,a){evOut.push([name,i,a||0]);onEvent(name,i,a||0);}

/* ---------------- kart physics ---------------- */
function stepKart(k,dt,live){
  const inp=k.in;let th=live?inp.th:0,br=live?inp.br:0,st=live?inp.st:0,dr=live&&inp.dr;
  let fx=Math.sin(k.hd),fz=Math.cos(k.hd),rx=-fz,rz=fx;
  let vf=k.vx*fx+k.vz*fz,vl=k.vx*rx+k.vz*rz;
  const def=T.def,off=Math.abs(k.lat)>T.half+.4;k.off=off&&!k.air;
  const grip=def.grip*(off?def.offGrip:1),boosting=k.boostT>0;
  let vmax=VMAX*k.skill*(1+.07*k.draft);
  if(boosting)vmax=VMAX*1.38;
  if(off)vmax*=boosting?.85:def.offMax;
  if(k.inv>0)k.inv-=dt;
  if(k.spinT>0){k.spinT-=dt;k.spinA+=dt*13;th=0;br=0;st=0;dr=false;vf*=Math.exp(-1.6*dt);if(k.spinT<=0)k.spinA=0;}
  if(k.boostT>0)k.boostT-=dt;
  // steering
  k.steer+=(st-k.steer)*Math.min(1,dt*(Math.abs(st)>Math.abs(k.steer)?7:11));
  const av=Math.abs(vf);
  // drift state machine
  if(!k.drift&&dr&&Math.abs(st)>.3&&vf>13&&!k.air&&k.spinT<=0){k.drift=true;k.driftDir=Math.sign(st);k.driftT=0;}
  if(k.drift&&(!dr||vf<8||k.spinT>0)){if(k.driftT>.8&&k.spinT<=0){k.boostT=Math.max(k.boostT,Math.min(1.5,.45+k.driftT*.3));ev('mini',k.i);}k.drift=false;}
  let turn;
  if(k.drift){k.driftT+=dt;turn=k.driftDir*(1.2+.75*k.steer*k.driftDir)/(1+av/95);}
  else turn=2.35*k.steer*clamp(av/9,0,1)/(1+av/55);
  if(k.air)turn*=.25;
  k.hd-=turn*dt*(vf>=-.5?1:-1);
  // re-project velocity on the new heading
  fx=Math.sin(k.hd);fz=Math.cos(k.hd);rx=-fz;rz=fx;vf=k.vx*fx+k.vz*fz;vl=k.vx*rx+k.vz*rz;
  if(!k.air){
    if(boosting)vf+=34*dt*Math.max(0,1-vf/vmax);
    else if(th>0&&vf<vmax)vf+=23*th*(.55+.45*grip)*(1-Math.pow(clamp(vf/vmax,0,1),2))*dt;
    if(br>0){if(vf>1)vf-=36*br*(.45+.55*grip)*dt;else vf=Math.max(-11,vf-13*br*dt);}
    if(dr&&!k.drift&&vf>0)vf-=9*dt;
    if(vf>vmax)vf-=(vf-vmax)*(off?3.2:1.4)*dt;
    if(th<=0&&br<=0)vf*=Math.exp(-.3*dt);
    vf-=9.8*.55*(LO_gradeF(k))*dt;
    const gl=(k.drift?3.6:9.5)*grip,loss=gl*vl*vl/Math.max(Math.hypot(vf,vl),2);
    vl*=Math.exp(-gl*dt);vf+=loss*(k.drift?.88:.4)*dt*Math.sign(vf||1);
  }
  k.vlat=vl;k.vx=fx*vf+rx*vl;k.vz=fz*vf+rz*vl;k.spd=vf;
  k.x+=k.vx*dt;k.z+=k.vz*dt;
  // track-relative
  const old=k.idx,o=T.locate(k.x,k.z,k.idx,LO);
  if(Math.abs(o.lat)>T.limit){const s=Math.sign(o.lat),pen=Math.abs(o.lat)-T.limit;k.x-=o.rx*s*pen;k.z-=o.rz*s*pen;
    const vt=(k.vx*o.rx+k.vz*o.rz)*s;if(vt>0){k.vx-=o.rx*s*vt*1.45;k.vz-=o.rz*s*vt*1.45;const sc=vt>5?.8:.97;k.vx*=sc;k.vz*=sc;if(vt>6)ev('hit',k.i,Math.min(1,vt/20));}
    if((Math.sin(k.hd)*o.rx+Math.cos(k.hd)*o.rz)*s>0&&k.spinT<=0){const fw=(Math.sin(k.hd)*o.tx+Math.cos(k.hd)*o.tz)>=0?0:Math.PI;k.hd+=angDiff(Math.atan2(o.tx,o.tz)+fw,k.hd)*Math.min(1,dt*3.5);}
    o.lat=s*T.limit;}
  k.idx=o.i;k.frac=o.f;k.lat=o.lat;k.gGrade=o.grade;k.gSlope=o.slope;k.gtx=o.tx;k.gtz=o.tz;
  const di=k.idx-old;if(di<-T.N/2){k.lap++;onLap(k);}else if(di>T.N/2)k.lap--;
  k.prog=k.lap*T.N+k.idx+k.frac;
  k.wrong=(fx*o.tx+fz*o.tz)<-.35&&vf>4;
  // vertical
  const gy=o.y;
  if(k.air){k.vy-=GRAV*dt;k.y+=k.vy*dt;if(k.y<=gy){if(k.vy<-9)ev('land',k.i,Math.min(1,-k.vy/25));k.y=gy;k.air=false;k.vy=0;}}
  else{const want=clamp((gy-k.y)/Math.max(dt,1e-4),-40,40);k.gA+=((want-k.vy)/Math.max(dt,1e-4)-k.gA)*Math.min(1,dt*10);
    if(k.gA<-GRAV-2&&av>14){k.air=true;k.gA=0;k.y+=k.vy*dt;if(k.y<gy){k.y=gy;k.air=false;}}else{k.y=gy;k.vy=want;}}
  groundPose(k,dt);
}
function LO_gradeF(k){return (k.gGrade||0)*(Math.sin(k.hd)*(k.gtx||0)+Math.cos(k.hd)*(k.gtz||1));}
/* orientation from ground plane + cosmetic body motion (shared by authority and replicas) */
function groundPose(k,dt){
  const fx=Math.sin(k.hd),fz=Math.cos(k.hd),tx=k.gtx||0,tz=k.gtz||1,ft=fx*tx+fz*tz,fr=fx*-tz+fz*tx;
  const gF=(k.gGrade||0)*ft+(k.gSlope||0)*fr,gR=(k.gGrade||0)*-fr+(k.gSlope||0)*ft;
  const a=Math.min(1,dt*(k.air?1.5:10));
  k.pitch+=((k.air?clamp(k.vy*.012,-.3,.3)*-1:-Math.atan(gF))-k.pitch)*a;k.roll+=(-Math.atan(gR)-k.roll)*a;
  const sp=clamp(Math.abs(k.spd)/VMAX,0,1.3);
  k.bRoll+=((k.steer*sp*.09+(k.drift?k.driftDir*.07:0))-k.bRoll)*Math.min(1,dt*8);
}
function onLap(k){
  if(k.lap>=2){const lt=race.t-k.lapStart;k.lastLap=lt;if(!k.bestLap||lt<k.bestLap)k.bestLap=lt;}
  k.lapStart=race.t;
  if(k.lap>LAPS&&!k.finished){k.finished=true;k.finT=race.t;k.ai=true;ev('fin',k.i);if(race.firstFin<0)race.firstFin=race.t;}
  else if(k.lap>=2)ev('lap',k.i,k.lap);
}

/* ---------------- AI ---------------- */
function aiDrive(k,dt){
  const N=T.N,s=k.aiS,inp=k.in,sp=Math.max(0,k.spd);
  // rubber-banding against the best-placed human
  let hp=null;for(const h of karts)if(h.human&&!h.finished&&(hp==null||h.prog>hp))hp=h.prog;
  if(k.finished)k.skill=.7;
  else if(hp!=null){const gap=(hp-k.prog)*T.seg;k.skill=clamp(s.base+clamp(gap/170,-.13,.11),.74,1.1);}else k.skill=s.base;
  // lane choice + avoidance
  s.latT-=dt;if(s.latT<=0){s.latT=2+Math.random()*4;s.goal=(Math.random()-.5)*T.half*1.1;}
  let goal=s.goal||0;
  for(const o of karts){if(o===k)continue;const d=o.prog-k.prog;if(d>-.4&&d<6&&Math.abs(o.lat-k.lat)<2.9){goal=clamp(o.lat+(k.lat>=o.lat?3.6:-3.6),-T.half+1.6,T.half-1.6);break;}}
  s.lat+=(goal-s.lat)*Math.min(1,dt*1.6);
  // pure pursuit toward look-ahead point
  const look=3+Math.floor(sp*.17),j=(k.idx+look)%N;
  // cut toward the inside of upcoming corners a little
  const lane=clamp(s.lat-T.curv[j]*150,-T.half+1.5,T.half-1.5);
  T.at(j,lane,0);const des=Math.atan2(tmpV.x-k.x,tmpV.z-k.z),err=angDiff(des,k.hd);
  inp.st=clamp(-err*2.4,-1,1);
  // speed planning from curvature ahead
  const gf=.5+.5*T.def.grip;let vT=VMAX*1.5;const scan=6+Math.floor(sp*sp/(2*20)/T.seg);
  for(let a=2;a<=scan;a+=2){const c=Math.abs(T.curv[(k.idx+a)%N]);if(c<.004)continue;const cc=2.35*.8*gf*k.skill/c,v=(-1+Math.sqrt(1+4*cc/55))*27.5;
    const va=Math.sqrt(v*v+2*20*gf*a*T.seg);if(va<vT)vT=va;}
  inp.th=sp<vT?1:0;inp.br=sp>vT+2.5?1:0;inp.dr=0;
  if(Math.abs(err)>1.2&&sp>10){inp.th=.3;}
  // items
  inp.it=0;
  if(k.item&&race.state==='race'){s.itemT+=dt;
    if(k.item===1){if(s.itemT>1.2&&Math.abs(T.curv[(k.idx+8)%N])<.006&&Math.abs(T.curv[(k.idx+16)%N])<.008&&!k.off)inp.it=1;}
    else if(k.item===2){for(const o of karts){const d=(o.prog-k.prog)*T.seg;if(o!==k&&d>6&&d<55&&Math.abs(o.lat-k.lat)<3.5&&s.itemT>1){inp.it=1;break;}}if(s.itemT>9)inp.it=1;}
    else{for(const o of karts){const d=(k.prog-o.prog)*T.seg;if(o!==k&&d>3&&d<22&&s.itemT>1){inp.it=1;break;}}if(s.itemT>7)inp.it=1;}
  }else s.itemT=0;
  // stuck recovery
  if(race.state==='race'&&Math.abs(k.spd)<3)s.stuck+=dt;else s.stuck=0;
  if(s.stuck>2.2){respawn(k);s.stuck=0;}
}
function respawn(k){const i=k.idx;T.at(i,0,0);k.x=tmpV.x;k.z=tmpV.z;k.y=tmpV.y+.3;k.hd=T.psi[i];k.vx=k.vz=k.vy=0;k.spd=0;k.spinT=0;k.spinA=0;k.drift=false;k.air=false;k.inv=1.5;}

/* ---------------- items ---------------- */
const rockets=[],traps=[];
const rocketMeshes=[],trapMeshes=[];
function poolMesh(arr,i,geo,mat){while(arr.length<=i){const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.visible=false;scene.add(m);arr.push(m);}return arr[i];}
function spin(k,by){if(k.spinT>0||k.inv>0)return;k.spinT=1.25;k.inv=3;k.drift=false;k.boostT=0;ev('spin',k.i);}
function useItem(k){const it=k.item;if(!it||k.spinT>0)return;k.item=0;
  const fx=Math.sin(k.hd),fz=Math.cos(k.hd);
  if(it===1){k.boostT=2.3;ev('boost',k.i);}
  else if(it===2){rockets.push({x:k.x+fx*2.4,z:k.z+fz*2.4,y:k.y+.8,hd:k.hd,idx:k.idx,own:k.i,life:4.5});ev('fire',k.i);}
  else{if(traps.length>=14)traps.shift();traps.push({x:k.x-fx*2.8,z:k.z-fz*2.8,y:k.y+.25,own:k.i,arm:.7,life:40});ev('drop',k.i);}
}
function stepItems(dt){
  if(race.items)for(const b of T.boxes){if(b.t>0){b.t-=dt;continue;}
    for(const k of karts){if(k.item||k.finished)continue;const dx=k.x-b.x,dz=k.z-b.z;if(dx*dx+dz*dz<5.3&&Math.abs(k.y+1-b.y)<2.5){
      const r=Math.random(),p=k.place;k.item=p<=1?(r<.3?1:r<.5?2:3):p>=5?(r<.5?1:r<.9?2:3):(r<.4?1:r<.75?2:3);if(p===1&&k.item===2&&Math.random()<.5)k.item=3;
      b.t=4;ev('pick',k.i);break;}}}
  for(let n=rockets.length-1;n>=0;n--){const r=rockets[n];r.life-=dt;const o=T.locate(r.x,r.z,r.idx,LO);r.idx=o.i;
    let des=Math.atan2(o.tx,o.tz)+clamp(o.lat*.06,-.5,.5); // hug the road
    let best=null,bd=50;for(const k of karts){if(k.i===r.own||k.finished)continue;const dx=k.x-r.x,dz=k.z-r.z,d=Math.hypot(dx,dz);if(d<bd&&(dx*Math.sin(r.hd)+dz*Math.cos(r.hd))>0){bd=d;best=k;}}
    if(best)des=Math.atan2(best.x-r.x,best.z-r.z);
    r.hd+=clamp(angDiff(des,r.hd),-3.2*dt,3.2*dt);r.x+=Math.sin(r.hd)*72*dt;r.z+=Math.cos(r.hd)*72*dt;r.y=o.y+.9;
    let dead=r.life<=0||Math.abs(o.lat)>T.limit+.5;
    for(const k of karts){if(k.i===r.own&&r.life>4)continue;const dx=k.x-r.x,dz=k.z-r.z;if(dx*dx+dz*dz<6.5){spin(k);dead=true;ev('boom',k.i);break;}}
    if(dead)rockets.splice(n,1);}
  for(let n=traps.length-1;n>=0;n--){const t=traps[n];t.arm-=dt;t.life-=dt;let dead=t.life<=0;
    for(const k of karts){if(t.arm>0&&k.i===t.own)continue;const dx=k.x-t.x,dz=k.z-t.z;if(dx*dx+dz*dz<3.6&&!k.air){if(k.inv<=0){spin(k);ev('boom',k.i);}dead=true;break;}}
    if(dead)traps.splice(n,1);}
}

/* ---------------- race flow (authority) ---------------- */
function gridUp(){rockets.length=0;traps.length=0;for(const b of T.boxes){b.t=0;}
  for(const k of karts){const slot=NK-1-k.i,row=slot>>1,side=slot&1;k.reset((T.N-3-row*3+T.N)%T.N,(side?1:-1)*T.half*.42);
    k.ai=!k.human;k.aiS.base=.93+((k.i*37)%7)*.011+[-.075,0,.045][race.diff];k.aiS.lat=k.lat;k.aiS.goal=k.lat;T.locate(k.x,k.z,k.idx,LO);k.gGrade=LO.grade;k.gSlope=LO.slope;k.gtx=LO.tx;k.gtz=LO.tz;k.lat=LO.lat;k.y=LO.y;k.prog=k.idx;}
  race.state='intro';race.intro=0;race.count=3.999;race.t=0;race.endT=0;race.firstFin=-1;race.results=null;evOut=[];skidClear();
}
function rank(){const a=karts.slice().sort((p,q)=>{if(p.finished!==q.finished)return p.finished?-1:1;if(p.finished)return p.finT-q.finT;return q.prog-p.prog;});a.forEach((k,i)=>k.place=i+1);return a;}
function simulate(dt){
  if(race.state==='idle')return;
  if(race.state==='intro'){race.intro+=dt;let skip=race.intro>1.2&&(INP.th>.5||INP.it);for(const k of karts)if(k.human&&race.intro>1.2&&(k.in.th>.5||k.in.it))skip=true;if(race.intro>=INTRO_T||skip)race.state='count';}
  if(race.state==='count'){const p=Math.ceil(race.count);race.count-=dt;const q=Math.ceil(race.count);
    if(q!==p&&q>0)ev('beep',-1,q);if(race.count<=0){race.state='race';race.t=0;ev('go',-1);}}
  if(race.state==='race')race.t+=dt;
  const live=race.state==='race'||race.state==='done';
  for(const k of karts){
    if(k.ai||k.finished)aiDrive(k,dt);
    if(live&&k.in.rs&&!k.ai){respawn(k);k.in.rs=0;}
    stepKart(k,dt,live);
    if(live){const it=k.in.it?1:0;if(it&&!k.itPrev)useItem(k);k.itPrev=it;}
  }
  // kart–kart collisions
  for(let a=0;a<NK;a++)for(let b=a+1;b<NK;b++){const p=karts[a],q=karts[b],dx=q.x-p.x,dz=q.z-p.z,d2=dx*dx+dz*dz;
    if(d2<6.76&&d2>1e-4&&Math.abs(p.y-q.y)<2){const d=Math.sqrt(d2),nx=dx/d,nz=dz/d,pen=(2.6-d)/2;p.x-=nx*pen;p.z-=nz*pen;q.x+=nx*pen;q.z+=nz*pen;
      const rv=(q.vx-p.vx)*nx+(q.vz-p.vz)*nz;if(rv<0){const j=-rv*.75;p.vx-=nx*j;p.vz-=nz*j;q.vx+=nx*j;q.vz+=nz*j;if(rv<-5){ev('bump',p.i,Math.min(1,-rv/18));ev('bump',q.i,Math.min(1,-rv/18));}}}}
  // slipstream
  for(const k of karts){let dr=false;if(k.spd>16&&!k.air){const fx=Math.sin(k.hd),fz=Math.cos(k.hd);
      for(const o of karts){if(o===k)continue;const dx=o.x-k.x,dz=o.z-k.z,d=Math.hypot(dx,dz);if(d<10&&d>1.5&&(dx*fx+dz*fz)/d>.92&&o.spd>12){dr=true;break;}}}
    if(dr){k.draft=Math.min(1,k.draft+dt/2.2);if(k.draft>=1&&k.boostT<=0){k.boostT=1.4;k.draft=0;ev('boost',k.i);}}else k.draft=Math.max(0,k.draft-dt*.5);}
  if(live)stepItems(dt);
  rank();
  if(race.state==='race'){const humans=karts.filter(k=>k.human),pending=(humans.length?humans:karts).filter(k=>!k.finished).length;
    if(pending===0||(race.firstFin>=0&&race.t-race.firstFin>45)){race.endT+=dt;if(race.endT>(pending===0?1.6:0)){finishRace();}}}
}
function finishRace(){race.state='done';const order=rank();
  race.results=order.map(k=>({n:k.name,c:k.color,h:k.human?1:0,t:k.finished?k.finT:0,b:k.bestLap||0,i:k.i,
    e:k.finished?0:race.t+Math.max(0,(LAPS+1)*T.N-(k.prog))*T.seg/(VMAX*.82)}));
  onRaceEnd();
}


/* ==== 60-audio.js ==== */
/* ---------------- Web Audio engine (fully synthesized) ---------------- */
const Snd=(()=>{
  let ac=null,master,musicG,sfxG,dly,nbuf,eng=null,mode='none',nextT=0,step=0,bar=0,tempo=112,muted=store.get('mute',false),spdN=0;
  const mtof=m=>440*Math.pow(2,(m-69)/12);
  function init(){if(ac){if(ac.state==='suspended')ac.resume();return;}
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ac=new AC();
    master=ac.createGain();master.gain.value=muted?0:CFG.vMaster;const comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=5;master.connect(comp);comp.connect(ac.destination);
    musicG=ac.createGain();musicG.gain.value=.7*CFG.vMusic;musicG.connect(master);sfxG=ac.createGain();sfxG.gain.value=CFG.vSfx;sfxG.connect(master);
    dly=ac.createDelay(1);dly.delayTime.value=.27;const fb=ac.createGain();fb.gain.value=.36;dly.connect(fb);fb.connect(dly);const dw=ac.createGain();dw.gain.value=.4;dly.connect(dw);dw.connect(musicG);
    nbuf=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);const d=nbuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    // persistent engine / tyre / rumble voices
    const o1=ac.createOscillator(),o2=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();o1.type='sawtooth';o2.type='square';f.type='lowpass';f.Q.value=2;g.gain.value=0;
    const g2=ac.createGain();g2.gain.value=.5;o1.connect(f);o2.connect(g2);g2.connect(f);f.connect(g);g.connect(sfxG);o1.start();o2.start();
    const loop=(type,freq,q)=>{const s=ac.createBufferSource();s.buffer=nbuf;s.loop=true;const bf=ac.createBiquadFilter();bf.type=type;bf.frequency.value=freq;bf.Q.value=q;const gg=ac.createGain();gg.gain.value=0;s.connect(bf);bf.connect(gg);gg.connect(sfxG);s.start();return {g:gg,f:bf};};
    eng={o1,o2,f,g,scr:loop('bandpass',1900,4),rum:loop('lowpass',160,1),wind:loop('bandpass',700,.6)};
    setInterval(sched,35);nextT=ac.currentTime+.1;}
  function tone(type,freq,t,dur,vol,dest,o){o=o||{};const os=ac.createOscillator(),g=ac.createGain();os.type=type;os.frequency.setValueAtTime(freq,t);
    if(o.to)os.frequency.exponentialRampToValueAtTime(o.to,t+dur);if(o.det)os.detune.value=o.det;
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+(o.a||.005));g.gain.setValueAtTime(vol,t+Math.max(o.a||.005,dur*(o.hold||.3)));g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    let n=os;if(o.lp){const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(o.lp,t);if(o.lpTo)f.frequency.exponentialRampToValueAtTime(o.lpTo,t+dur);f.Q.value=o.q||1;os.connect(f);n=f;}
    n.connect(g);g.connect(dest||sfxG);os.start(t);os.stop(t+dur+.02);}
  function noise(t,dur,vol,type,freq,dest,o){o=o||{};const s=ac.createBufferSource();s.buffer=nbuf;s.loop=true;const f=ac.createBiquadFilter();f.type=type;f.frequency.setValueAtTime(freq,t);if(o.to)f.frequency.exponentialRampToValueAtTime(o.to,t+dur);f.Q.value=o.q||.8;
    const g=ac.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+(o.a||.002));g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(g);g.connect(dest||sfxG);s.start(t,Math.random());s.stop(t+dur+.02);}
  const kick=(t,v)=>{tone('sine',150,t,.22,v,musicG,{to:42,hold:.1});noise(t,.02,v*.3,'highpass',2000,musicG);};
  const snare=(t,v)=>{noise(t,.17,v,'bandpass',1900,musicG,{q:.6});tone('triangle',210,t,.09,v*.6,musicG,{to:150});};
  const hat=(t,v,open)=>noise(t,open?.16:.045,v,'highpass',7500,musicG);
  /* --- menu: original synthwave, A minor: Am F C G --- */
  const CH=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]];
  const LEAD=[[[0,76,4],[4,81,2],[6,79,2],[8,76,4],[12,72,4]],[[0,77,6],[6,76,2],[8,72,4],[12,69,4]],[[0,79,4],[4,76,4],[8,79,2],[10,84,6]],[[0,83,6],[6,81,2],[8,79,8]]];
  function menuStep(s,t,d){const b=bar%4,c=CH[b],cyc=Math.floor(bar/4);
    if(s%4===0)kick(t,.75);if(s===4||s===12){snare(t,.42);noise(t,.3,.1,'bandpass',900,dly);}
    if(s%4===2)hat(t,.14,true);else if(s%2===1)hat(t,.05);
    if(s%2===0){const n=c[0]-24+((s%8===4)?12:0);tone('sawtooth',mtof(n),t,d*1.9,.26,musicG,{lp:520,lpTo:160,q:5});}
    const ar=[c[0],c[1],c[2],c[0]+12,c[2],c[1]],an=ar[s%6]+12;tone('square',mtof(an),t,d*.9,.055,dly,{lp:2600});
    if(s===0){for(const n of c){tone('sawtooth',mtof(n),t,d*16,.045,musicG,{a:.25,hold:.8,lp:900,det:-9});tone('sawtooth',mtof(n),t,d*16,.045,musicG,{a:.25,hold:.8,lp:900,det:9});}}
    if(cyc%2===1||cyc>=2){for(const[st,n,l]of LEAD[b])if(st===s){tone('sawtooth',mtof(n),t,d*l,.085,dly,{lp:2400,lpTo:900,hold:.6,a:.02});tone('square',mtof(n),t,d*l,.03,musicG,{det:7,hold:.6});}}}
  /* --- race: procedural drum & bass, tempo follows speed --- */
  const BASS=[40,40,43,38];
  function dnbStep(s,t,d){const b=bar%4,root=BASS[b];
    if(s===0||s===10)kick(t,.9);if(s===4||s===12)snare(t,.6);if((s===7||s===15)&&bar%2)snare(t,.2);
    hat(t,s%4===2?.12:(s%2?.035:.08),s===14);
    for(const[st,off,l]of[[0,0,5],[6,0,2],[8,12,1.5],[10,-2,3.5],[14,3,2]])if(st===s){const f=mtof(root+off-12);
      tone('sawtooth',f,t,d*l,.22,musicG,{lp:300+spdN*900,lpTo:140,q:7,det:-14,hold:.7});tone('sawtooth',f,t,d*l,.22,musicG,{lp:300+spdN*900,lpTo:140,q:7,det:14,hold:.7});tone('sine',f/2,t,d*l,.3,musicG,{hold:.8});}
    if(bar%8>=4&&(s===3||s===11))tone('square',mtof(root+24+(s===3?7:3)),t,d*2,.035,dly,{lp:3200});
    if(bar%4===3&&s>=12)noise(t,d,.09,'highpass',4000+s*400,musicG);}
  function sched(){if(!ac||ac.state!=='running')return;if(mode==='none'){nextT=ac.currentTime+.05;return;}
    if(nextT<ac.currentTime)nextT=ac.currentTime+.02;
    while(nextT<ac.currentTime+.14){const d=60/tempo/4;(mode==='menu'?menuStep:dnbStep)(step,nextT,d);nextT+=d;if(++step>=16){step=0;bar++;}}}
  const S={
    init,get ok(){return !!ac;},
    music(m){if(mode===m)return;mode=m;step=0;bar=0;tempo=m==='menu'?112:156;if(ac)nextT=ac.currentTime+.08;},
    toggle(){muted=!muted;store.set('mute',muted);if(ac)master.gain.setTargetAtTime(muted?0:CFG.vMaster,ac.currentTime,.05);return muted;},
    vol(){if(!ac)return;master.gain.value=muted?0:CFG.vMaster;musicG.gain.value=.7*CFG.vMusic;sfxG.gain.value=CFG.vSfx;},
    get muted(){return muted;},
    /* continuous voices driven by the focused kart */
    drive(on,spd,th,slide,off,boost){if(!ac)return;const t=ac.currentTime;if(!on){eng.g.gain.setTargetAtTime(0,t,.08);eng.scr.g.gain.setTargetAtTime(0,t,.05);eng.rum.g.gain.setTargetAtTime(0,t,.05);eng.wind.g.gain.setTargetAtTime(0,t,.1);return;}
      spdN=clamp(Math.abs(spd)/VMAX,0,1.4);const gs=spdN*4.2,gear=Math.min(4,Math.floor(gs)),rpm=clamp(.3+.7*(gs-gear)*(gear>=4?.6:1)+gear*.045+(boost?.2:0),.2,1.4);
      const f=48+rpm*118;eng.o1.frequency.setTargetAtTime(f,t,.04);eng.o2.frequency.setTargetAtTime(f*.5,t,.04);eng.f.frequency.setTargetAtTime(260+rpm*1500+th*900,t,.05);eng.g.gain.setTargetAtTime(.055+th*.075+(boost?.04:0),t,.06);
      eng.scr.g.gain.setTargetAtTime(clamp(slide,0,1)*.2,t,.05);eng.scr.f.frequency.setTargetAtTime(1500+spdN*900,t,.1);eng.rum.g.gain.setTargetAtTime(off?.5*clamp(spdN*2,0,1):0,t,.06);
      eng.wind.g.gain.setTargetAtTime(spdN*spdN*.07,t,.2);
      if(mode==='race')tempo+=((150+spdN*30)-tempo)*.03;},
    fx(n,v){if(!ac||ac.state!=='running')return;const t=ac.currentTime;v=v==null?1:v;
      if(n==='beep')tone('square',440,t,.16,.22*v,sfxG,{lp:2000});
      else if(n==='go'){tone('square',880,t,.5,.25*v,sfxG,{lp:3000,hold:.6});tone('sawtooth',1320,t,.5,.1*v,sfxG,{lp:3000});}
      else if(n==='pick'){[784,988,1175,1568].forEach((f,i)=>tone('sine',f,t+i*.06,.2,.2*v));}
      else if(n==='boost'||n==='mini'){const k=n==='mini'?.6:1;noise(t,.9*k,.4*v*k,'bandpass',500,sfxG,{to:4500,q:1.2,a:.03});tone('sawtooth',110,t,.8*k,.2*v*k,sfxG,{to:520,lp:1800,hold:.5});}
      else if(n==='fire'){noise(t,.5,.45*v,'bandpass',2600,sfxG,{to:500,q:1.5});tone('square',900,t,.3,.12*v,sfxG,{to:180});}
      else if(n==='drop'){tone('sine',320,t,.18,.25*v,sfxG,{to:110});}
      else if(n==='boom'){noise(t,.6,.7*v,'lowpass',1400,sfxG,{to:90});tone('sine',120,t,.45,.5*v,sfxG,{to:36});}
      else if(n==='spin'){tone('sawtooth',700,t,.9,.14*v,sfxG,{to:140,lp:2200});noise(t,.8,.2*v,'bandpass',2100,sfxG,{q:3});}
      else if(n==='hit'||n==='bump'||n==='land'){noise(t,.2,.55*v,'lowpass',n==='land'?500:900,sfxG,{to:120});tone('sine',n==='bump'?140:95,t,.2,.45*v,sfxG,{to:45});}
      else if(n==='lap'){[660,880].forEach((f,i)=>tone('triangle',f,t+i*.1,.22,.22*v));}
      else if(n==='fin'){[523,659,784,1047,1319].forEach((f,i)=>tone('square',f,t+i*.11,.3,.16*v,sfxG,{lp:2600}));}
      else if(n==='ui'){tone('sine',880,t,.06,.1);tone('sine',1320,t+.03,.08,.07);}
      else if(n==='hover')tone('sine',1500,t,.025,.03);
      else if(n==='intro'){noise(t,3.2,.3,'bandpass',200,sfxG,{to:3200,q:.8,a:1.6});tone('sawtooth',55,t,3.2,.16,sfxG,{to:220,lp:900,a:1.2,hold:.7});}}
  };return S;})();
const vib=p=>{try{if(CFG.vib&&navigator.vibrate)navigator.vibrate(p);}catch(e){}};


/* ==== 65-input.js ==== */
/* ---------------- input: keyboard · touch · gyro · gamepad ---------------- */
const keys={},tin={st:0,th:0,br:0,dr:0,it:0};let gyroVal=0,gyroOn=false,padPause=false;
addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='INPUT')return;keys[e.code]=true;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)&&document.body.classList.contains('racing'))e.preventDefault();
  if(e.repeat)return;if(e.code==='Escape'||e.code==='KeyP')togglePause();if(e.code==='KeyC')cycleCam();if(e.code==='KeyM')doMute();if(e.code==='KeyF')toggleFS();});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
function bindBtn(id,f){const el=$(id),set=v=>{tin[f]=v;el.classList.toggle('dn',!!v);};
  el.addEventListener('pointerdown',e=>{e.preventDefault();try{el.setPointerCapture(e.pointerId);}catch(_){}set(1);if(f==='it')vib(15);});
  for(const n of['pointerup','pointercancel','lostpointercapture'])el.addEventListener(n,()=>set(0));}
bindBtn('bGas','th');bindBtn('bBrk','br');bindBtn('bDrift','dr');bindBtn('bItem','it');
{let l=0,r=0;const upd=()=>{tin.st=r-l;};const b=(id,fn)=>{const el=$(id);el.addEventListener('pointerdown',e=>{e.preventDefault();try{el.setPointerCapture(e.pointerId);}catch(_){}fn(1);el.classList.add('dn');upd();});
  for(const n of['pointerup','pointercancel','lostpointercapture'])el.addEventListener(n,()=>{fn(0);el.classList.remove('dn');upd();});};b('bL',v=>l=v);b('bR',v=>r=v);}
{const joy=$('joy'),knob=$('knob');let pid=null;
  const mv=e=>{const r=joy.getBoundingClientRect(),R=r.width/2,dx=clamp((e.clientX-(r.left+R))/(R*.72),-1,1);tin.st=Math.sign(dx)*Math.pow(Math.abs(dx),1.25);knob.style.transform='translateX('+(dx*R*.6)+'px)';};
  joy.addEventListener('pointerdown',e=>{e.preventDefault();pid=e.pointerId;try{joy.setPointerCapture(pid);}catch(_){}mv(e);});
  joy.addEventListener('pointermove',e=>{if(e.pointerId===pid)mv(e);});
  for(const n of['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(n,e=>{if(e.pointerId===pid){pid=null;tin.st=0;knob.style.transform='';}});}
addEventListener('deviceorientation',e=>{if(e.beta==null)return;const a=(screen.orientation&&screen.orientation.angle)||window.orientation||0;
  let v=a===90?e.beta:a===270||a===-90?-e.beta:e.gamma;gyroVal=clamp(v/28,-1,1);});
function setSteerMode(m){G.steer=CFG.steer=m;gyroOn=m==='gyro';
  $('joy').classList.toggle('hide',m!=='joy');$('bL').classList.toggle('hide',m!=='btn');$('bR').classList.toggle('hide',m!=='btn');
  if(gyroOn&&window.DeviceOrientationEvent&&DeviceOrientationEvent.requestPermission)DeviceOrientationEvent.requestPermission().catch(()=>{});}

const INP={st:0,th:0,br:0,dr:0,it:0,rs:0};
function readInput(){let st=0,th=0,br=0,dr=0,it=0,rs=0;
  if(keys.ArrowLeft||keys.KeyA)st-=1;if(keys.ArrowRight||keys.KeyD)st+=1;if(keys.ArrowUp||keys.KeyW)th=1;if(keys.ArrowDown||keys.KeyS)br=1;
  if(keys.Space)dr=1;if(keys.KeyE||keys.ShiftLeft||keys.ShiftRight||keys.Enter)it=1;if(keys.KeyR)rs=1;
  st+=tin.st;th=Math.max(th,tin.th);br=Math.max(br,tin.br);dr=dr||tin.dr;it=it||tin.it;
  if(gyroOn&&isTouch)st+=gyroVal;
  const pads=navigator.getGamepads?navigator.getGamepads():[];for(const p of pads){if(!p||!p.connected)continue;const b=i=>p.buttons[i]?p.buttons[i].value||(p.buttons[i].pressed?1:0):0;
    const ax=p.axes[0]||0;if(Math.abs(ax)>.12)st+=ax;if(b(14))st-=1;if(b(15))st+=1;th=Math.max(th,b(7),b(0));br=Math.max(br,b(6),b(1));if(b(2)||b(5)||b(4))dr=1;if(b(3))it=1;
    const ps=b(9)>0;if(ps&&!padPause)togglePause();padPause=ps;break;}
  if(CFG.autoGas&&isTouch&&!br)th=1;
  INP.st=clamp(st*CFG.sens,-1,1);INP.th=th;INP.br=br;INP.dr=dr?1:0;INP.it=it?1:0;INP.rs=rs;return INP;}


/* ==== 70-camera-fx.js ==== */
/* ---------------- cameras & views ---------------- */
const views=[];for(let i=0;i<4;i++){const c=new THREE.PerspectiveCamera(64,1,.3,2600);c.layers.enable(1);views.push({cam:c,ki:0,r:[0,0,1,1],hd:0,init:false,fov:64});}
let nViews=1;const lookV=new THREE.Vector3();
function layoutViews(){const W=innerWidth,H=innerHeight,L=nViews===1?[[0,0,1,1]]:nViews===2?(W>=H?[[0,0,.5,1],[.5,0,.5,1]]:[[0,.5,1,.5],[0,0,1,.5]]):[[0,.5,.5,.5],[.5,.5,.5,.5],[0,0,.5,.5],[.5,0,.5,.5]];
  const sp=$('split');while(sp.children.length<4)sp.appendChild(document.createElement('div'));
  for(let i=0;i<4;i++){const v=views[i],el=sp.children[i];if(i<nViews){v.r=L[i];v.cam.aspect=(L[i][2]*W)/(L[i][3]*H);v.cam.updateProjectionMatrix();
      el.style.display=nViews>1?'block':'none';el.style.left=(L[i][0]*100)+'%';el.style.bottom=(L[i][1]*100)+'%';}else el.style.display='none';}}
const _sz=new THREE.Vector2();
function resize(){renderer.setPixelRatio(maxDPR()*resScale);renderer.setSize(innerWidth,innerHeight,false);renderer.getDrawingBufferSize(_sz);const was=Post.ready();Post.size(_sz.x,_sz.y);if(was!==Post.ready())applyHDR();layoutViews();}
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,250));
function chase(v,k,dt){const cam=v.cam,sp=clamp(Math.abs(k.spd)/VMAX,0,1.4),boost=k.boostT>0;
  if(!v.init)v.hd=k.hd;v.hd+=angDiff(k.hd,v.hd)*Math.min(1,dt*(k.drift?3:5.5));
  const dist=(5.5+sp*.8)*CFG.camDist,tx=k.x-Math.sin(v.hd)*dist,tz=k.z-Math.cos(v.hd)*dist,ty=k.y+2.1;
  if(!v.init){cam.position.set(tx,ty,tz);v.init=true;v.fov=58;}
  const a=1-Math.exp(-dt*9),ay=1-Math.exp(-dt*6);cam.position.x+=(tx-cam.position.x)*a;cam.position.z+=(tz-cam.position.z)*a;cam.position.y+=(ty-cam.position.y)*ay;
  if(boost||k.off&&sp>.2){const s=boost?.05:.035;cam.position.x+=(Math.random()-.5)*s;cam.position.y+=(Math.random()-.5)*s;}
  lookV.set(k.x+Math.sin(k.hd)*6.5,k.y+.7,k.z+Math.cos(k.hd)*6.5);cam.lookAt(lookV);
  cam.rotateZ(k.roll*.45-k.steer*sp*.04);
  const ft=58+sp*11+(boost?12:0);v.fov+=(ft-v.fov)*Math.min(1,dt*4.5);if(Math.abs(cam.fov-v.fov)>.05){cam.fov=v.fov;cam.updateProjectionMatrix();}}
let orbA=0;
function orbit(v,dt){const gar=G.tab==='garage';orbA+=dt*(gar?.32:.14);const c=v.cam,k=karts[0],r=gar?6.2:8.2,h=gar?1.5:2+Math.sin(orbA*.6)*.5;
  c.position.set(k.x+Math.cos(orbA)*r,k.y+h,k.z+Math.sin(orbA)*r);lookV.set(k.x,k.y+.65,k.z);c.lookAt(lookV);const f=gar?33:38;if(c.fov!==f){c.fov=f;c.updateProjectionMatrix();}
  const W=innerWidth,H=innerHeight;if(W>H*1.15)c.setViewOffset(W,H,-W*.31,H*.03,W,H);else c.clearViewOffset();v.init=false;}
function overhead(v,k,dt){const c=v.cam,tx=k.x-Math.sin(k.hd)*22,tz=k.z-Math.cos(k.hd)*22,ty=k.y+62,a=v.init?1-Math.exp(-dt*2.5):1;v.init=true;
  c.position.x+=(tx-c.position.x)*a;c.position.y+=(ty-c.position.y)*a;c.position.z+=(tz-c.position.z)*a;lookV.set(k.x,k.y,k.z);c.lookAt(lookV);if(c.fov!==50){c.fov=50;v.fov=50;c.updateProjectionMatrix();}}
const spectating=()=>G.my<0;
function cycleCam(){if(!spectating()||race.state==='idle')return;G.camMode=(G.camMode+1)%3;views.forEach(v=>v.init=false);toast(['Split-screen','Lead chase cam','Overhead broadcast'][G.camMode]);}
function leadKart(){let b=karts[0];for(const k of karts)if(k.place<b.place)b=k;return b;}
function setupViews(){let n=1;
  if(race.state==='idle'||!T){n=1;}
  else if(race.state==='intro'){n=1;views[0].ki=spectating()?5:G.my;}
  else if(!spectating()){views[0].ki=G.my;}
  else if(G.camMode===0){const hs=karts.filter(k=>k.human).sort((a,b)=>a.i-b.i).slice(0,4);if(hs.length){n=hs.length===3?4:hs.length;hs.forEach((k,i)=>views[i].ki=k.i);if(hs.length===3)views[3].ki=-2;}else views[0].ki=leadKart().i;}
  else views[0].ki=leadKart().i;
  if(n!==nViews){nViews=n;views.forEach(v=>v.init=false);layoutViews();}}
function focusKart(){return spectating()?karts[Math.max(0,views[0].ki)]||karts[0]:karts[G.my];}

/* ---------------- particles ---------------- */
const PN=isTouch?350:700,pPos=new Float32Array(PN*3).fill(-9999),pCol=new Float32Array(PN*3),pVel=new Float32Array(PN*3),pLife=new Float32Array(PN),pMax=new Float32Array(PN),pBase=new Float32Array(PN*3);let pNext=0;
const pGeo=new THREE.BufferGeometry();pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));pGeo.setAttribute('color',new THREE.BufferAttribute(pCol,3));
const pTex=ctex(32,32,(c)=>{const g=c.createRadialGradient(16,16,0,16,16,16);g.addColorStop(0,'#fff');g.addColorStop(.4,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,32,32);});
const pMesh=new THREE.Points(pGeo,new THREE.PointsMaterial({size:.75,map:pTex,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));pMesh.frustumCulled=false;pMesh.layers.set(1);scene.add(pMesh);
function emit(x,y,z,vx,vy,vz,r,g,b,life){const i=pNext;pNext=(pNext+1)%PN;pPos[i*3]=x;pPos[i*3+1]=y;pPos[i*3+2]=z;pVel[i*3]=vx;pVel[i*3+1]=vy;pVel[i*3+2]=vz;pBase[i*3]=r;pBase[i*3+1]=g;pBase[i*3+2]=b;pLife[i]=pMax[i]=life;}
function stepParticles(dt){for(let i=0;i<PN;i++){if(pLife[i]<=0)continue;pLife[i]-=dt;const j=i*3;if(pLife[i]<=0){pPos[j+1]=-9999;continue;}
    pPos[j]+=pVel[j]*dt;pPos[j+1]+=pVel[j+1]*dt;pPos[j+2]+=pVel[j+2]*dt;const f=pLife[i]/pMax[i];pCol[j]=pBase[j]*f;pCol[j+1]=pBase[j+1]*f;pCol[j+2]=pBase[j+2]*f;}
  pGeo.attributes.position.needsUpdate=true;pGeo.attributes.color.needsUpdate=true;}
/* ---------------- soft smoke / spray particles (alpha blended, per-particle size) ---------------- */
const SN=isTouch?280:560,sPos=new Float32Array(SN*3).fill(-9999),sCol=new Float32Array(SN*4),sSz=new Float32Array(SN),sVel=new Float32Array(SN*3),sLife=new Float32Array(SN),sMax=new Float32Array(SN),sA=new Float32Array(SN),sGrow=new Float32Array(SN);let sNext=0;
const sGeo=new THREE.BufferGeometry();sGeo.setAttribute('position',new THREE.BufferAttribute(sPos,3));sGeo.setAttribute('col',new THREE.BufferAttribute(sCol,4));sGeo.setAttribute('sz',new THREE.BufferAttribute(sSz,1));
const sMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{sc:{value:400},hdr:{value:0},lum:{value:1},tZ:{value:null},res:{value:new THREE.Vector2(1,1)},soft:{value:0}},
  vertexShader:'attribute vec4 col;attribute float sz;varying vec4 vC;uniform float sc;void main(){vC=col;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=min(sz*sc/max(.2,-mv.z),320.);}',
  fragmentShader:'varying vec4 vC;uniform float hdr,lum,soft;uniform sampler2D tZ;uniform vec2 res;void main(){float d=length(gl_PointCoord-.5)*2.;float a=smoothstep(1.,.1,d)*vC.a;if(a<.004)discard;vec3 c=vC.rgb;if(hdr>.5)c=pow(c,vec3(2.2))*lum;gl_FragColor=vec4(c,a);}'});
const sMesh=new THREE.Points(sGeo,sMat);sMesh.frustumCulled=false;sMesh.renderOrder=3;sMesh.layers.set(1);scene.add(sMesh);
function smoke(x,y,z,vx,vy,vz,c,a,size,grow,life){const i=sNext;sNext=(sNext+1)%SN;sPos[i*3]=x;sPos[i*3+1]=y;sPos[i*3+2]=z;sVel[i*3]=vx;sVel[i*3+1]=vy;sVel[i*3+2]=vz;sCol[i*4]=c[0];sCol[i*4+1]=c[1];sCol[i*4+2]=c[2];sA[i]=a;sSz[i]=size;sGrow[i]=grow;sLife[i]=sMax[i]=life;}
function stepSmoke(dt){const dr=Math.exp(-1.6*dt);for(let i=0;i<SN;i++){if(sLife[i]<=0)continue;sLife[i]-=dt;const j=i*3;if(sLife[i]<=0){sPos[j+1]=-9999;sCol[i*4+3]=0;continue;}
    sVel[j]*=dr;sVel[j+2]*=dr;sPos[j]+=sVel[j]*dt;sPos[j+1]+=sVel[j+1]*dt;sPos[j+2]+=sVel[j+2]*dt;sSz[i]+=sGrow[i]*dt;const f=sLife[i]/sMax[i];sCol[i*4+3]=sA[i]*f*Math.min(1,(1-f)*8);}
  sGeo.attributes.position.needsUpdate=sGeo.attributes.col.needsUpdate=sGeo.attributes.sz.needsUpdate=true;}
const SMK={alpine:[.97,.98,1],desert:[.82,.66,.46],neon:[.72,.73,.78]};
function kartFX(k,dt){const fx=Math.sin(k.hd),fz=Math.cos(k.hd),rx=-fz,rz=fx,bx=k.x-fx*1.1,bz=k.z-fz*1.1,rnd=Math.random,id=T.def.id,c=SMK[id],sp=Math.abs(k.spd);
  if(k.boostT>0){for(let n=0;n<2;n++)emit(bx-fx*.6+(rnd()-.5)*.3,k.y+.5,bz-fz*.6+(rnd()-.5)*.3,-fx*9+(rnd()-.5)*2,rnd()*1.2,-fz*9+(rnd()-.5)*2,.12,.34,.6,.25+rnd()*.2);
    if(rnd()<.5)emit(k.x+rx*(rnd()-.5)*2.6,k.y+.3+rnd()*1.2,k.z+rz*(rnd()-.5)*2.6,-fx*34,0,-fz*34,.28,.32,.38,.22);}
  if(k.i===G.my&&sp>VMAX*.86&&rnd()<.5){const l=(rnd()<.5?-1:1)*(2.5+rnd()*5);emit(k.x+fx*(18+rnd()*14)+rx*l,k.y+.3+rnd()*2.6,k.z+fz*(18+rnd()*14)+rz*l,-fx*46,0,-fz*46,.2,.22,.26,.3);}
  if(k.air)return;
  if(k.drift){if(rnd()<.9){const s=rnd()<.5?-.86:.86;smoke(bx+rx*s,k.y+.25,bz+rz*s,k.vx*.25+(rnd()-.5)*2,.8+rnd()*1.2,k.vz*.25+(rnd()-.5)*2,c,id==='alpine'?.5:.34,.7,3.2,.7+rnd()*.5);}
    if(k.driftT>.8&&rnd()<.7){const s=k.driftDir*.86;emit(bx+rx*s,k.y+.12,bz+rz*s,-fx*4+(rnd()-.5)*5,1+rnd()*3,-fz*4+(rnd()-.5)*5,1,.5,.1,.2+rnd()*.25);}}
  else if(sp>10&&rnd()<(k.off?.9:id==='neon'?.35:.6)){const s=rnd()<.5?-.86:.86,wetm=id==='neon'&&!k.off;smoke(bx+rx*s,k.y+.15,bz+rz*s,k.vx*.3+(rnd()-.5)*1.5,.25+rnd()*.6,k.vz*.3+(rnd()-.5)*1.5,wetm?[.55,.6,.7]:c,k.off?.3:wetm?.1:.17,.4,k.off?3.6:2.8,.8+rnd()*.5);}
  if(k.spinT>0&&rnd()<.7)smoke(k.x+(rnd()-.5)*1.6,k.y+.3,k.z+(rnd()-.5)*1.6,(rnd()-.5)*4,1.5+rnd()*2,(rnd()-.5)*4,[.25,.25,.27],.5,.9,3,.9);}
function burst(k,r,g,b,n){for(let i=0;i<n;i++){const a=Math.random()*TAU,s=3+Math.random()*9;emit(k.x,k.y+.8,k.z,Math.cos(a)*s,2+Math.random()*7,Math.sin(a)*s,r,g,b,.5+Math.random()*.5);}
  for(let i=0;i<10;i++){const a=Math.random()*TAU;smoke(k.x,k.y+.6,k.z,Math.cos(a)*5,2+Math.random()*3,Math.sin(a)*5,[.2,.2,.22],.6,1.2,4,1+Math.random()*.6);}}

/* ---------------- tyre marks (ring buffer of quads on the road) ---------------- */
const SKN=isTouch?320:700,skPos=new Float32Array(SKN*12),skA=new Float32Array(SKN*4);let skNext=0;
const skGeo=new THREE.BufferGeometry();skGeo.setAttribute('position',new THREE.BufferAttribute(skPos,3));skGeo.setAttribute('al',new THREE.BufferAttribute(skA,1));
{const ix=[];for(let i=0;i<SKN;i++){const o=i*4;ix.push(o,o+1,o+2,o+1,o+3,o+2);}skGeo.setIndex(ix);}
const skMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,uniforms:{c:{value:new THREE.Vector3()},hdr:{value:0}},
  vertexShader:'attribute float al;varying float vA;void main(){vA=al;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 c;uniform float hdr;varying float vA;void main(){gl_FragColor=vec4(hdr>.5?pow(c,vec3(2.2)):c,vA);}'});
const skMesh=new THREE.Mesh(skGeo,skMat);skMesh.frustumCulled=false;skMesh.renderOrder=1;skMesh.layers.set(1);scene.add(skMesh);
const SKC={alpine:[.5,.6,.72,.5],desert:[.36,.24,.14,.5],neon:[.02,.02,.03,.62]};
function skidClear(){skA.fill(0);skGeo.attributes.al.needsUpdate=true;for(const k of karts)k.sk=null;}
function skidStep(k){const on=!k.air&&race.state!=='idle'&&(k.drift||k.spinT>0||Math.abs(k.vlat||0)>9);if(!on){k.sk=null;return;}
  const fx=Math.sin(k.hd),fz=Math.cos(k.hd),rx=-fz,rz=fx,cx=k.x-fx*.9,cz=k.z-fz*.9,y=k.y+.05,a=SKC[T.def.id][3];
  if(k.sk&&Math.hypot(cx-k.sk[0],cz-k.sk[1])<.45)return;const p=k.sk;k.sk=[cx,cz,y,rx,rz];if(!p)return;
  for(const s of[-.9,.9]){const i=skNext;skNext=(skNext+1)%SKN;const o=i*12,w=.15;
    skPos[o]=p[0]+p[3]*(s-w);skPos[o+1]=p[2];skPos[o+2]=p[1]+p[4]*(s-w);skPos[o+3]=p[0]+p[3]*(s+w);skPos[o+4]=p[2];skPos[o+5]=p[1]+p[4]*(s+w);
    skPos[o+6]=cx+rx*(s-w);skPos[o+7]=y;skPos[o+8]=cz+rz*(s-w);skPos[o+9]=cx+rx*(s+w);skPos[o+10]=y;skPos[o+11]=cz+rz*(s+w);skA[i*4]=skA[i*4+1]=skA[i*4+2]=skA[i*4+3]=a;}
  skGeo.attributes.position.needsUpdate=skGeo.attributes.al.needsUpdate=true;}


/* ==== 75-probe-post.js ==== */
/* ---------------- real-time reflection probe (ping-pong cube targets, one face per frame) ---------------- */
const Probe=(()=>{let A=null,B=null,cc=null,face=0,size=0,cur=null;
  function setEnv(tex){cur=tex;for(const k of karts)for(const pm of k.m.paints){pm.envMap=tex;}for(const n of['chrome','alloy','visorM','carbon']){KG[n].envMap=tex;KG[n].needsUpdate=true;}
    if(T&&T.roadMat){T.roadMat.envMap=tex&&T.def.wet>0?tex:null;T.roadMat.needsUpdate=true;}}
  const mk=sz=>new THREE.WebGLCubeRenderTarget(sz,{format:THREE.RGBAFormat,type:Post.hdrOK?THREE.HalfFloatType:THREE.UnsignedByteType,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter});
  return {set(sz){if(sz===size)return;size=sz;if(A){setEnv(null);A.dispose();B.dispose();A=B=null;}if(!sz)return;A=mk(sz);B=mk(sz);cc=new THREE.CubeCamera(.6,1600,B);cc.children.forEach(c=>c.layers.enable(1));face=0;},
    reset(){if(A){setEnv(null);face=0;}},
    update(k){if(!A||!k)return;const cams=cc.children;if(face===0){cc.position.set(k.x,k.y+1.15,k.z);cc.updateMatrixWorld(true);}
      const au=renderer.shadowMap.autoUpdate;renderer.shadowMap.autoUpdate=false;k.m.g.visible=false;sMesh.visible=pMesh.visible=false;
      const tmo=renderer.toneMapping;renderer.toneMapping=THREE.NoToneMapping;B.texture.generateMipmaps=face===5;renderer.setRenderTarget(B,face);renderer.render(scene,cams[face]);renderer.toneMapping=tmo;
      k.m.g.visible=true;sMesh.visible=pMesh.visible=true;renderer.shadowMap.autoUpdate=au;
      if(++face===6){face=0;const t=A;A=B;B=t;setEnv(A.texture);}}};})();


/* per-frame visual sync of every kart / item / world effect */
function syncVisuals(dt,time){
  for(const k of karts){const m=k.m;m.g.position.set(k.x,k.y,k.z);m.g.visible=race.state!=='idle'||k.i===0;
    const dec=(k.ps-k.spd)/Math.max(dt,.001);k.ps=k.spd;k.brk+=(((dec>9&&k.spd>2)||k.spinT>0?1:0)-k.brk)*Math.min(1,dt*12);m.tail.color.setRGB(.25+k.brk*5,.01+k.brk*.12,.01+k.brk*.12);m.beam.visible=m.ug.visible=T.def.id==='neon';if(m.ug.visible)m.ug.material.color.copy(m.paint.color).multiplyScalar(.45);m.ao.visible=!k.air;skidStep(k);
    m.g.rotation.set(k.pitch,k.hd+k.spinA-(k.drift?k.driftDir*.32:0),k.roll,'YXZ');
    m.body.rotation.z=-k.bRoll;m.body.position.y=k.off&&Math.abs(k.spd)>5?Math.sin(time*40+k.i)*.025:0;
    const wr=k.spd*dt/.38;for(const w of m.wheels)w.rotation.x+=wr;for(const p of m.piv)p.rotation.y=-k.steer*.42;
    m.flame.visible=k.boostT>0;if(m.flame.visible){const s=.8+Math.random()*.5;m.flame.scale.set(.3,.95*s,.3);}
    m.tag.visible=false;animDriver(k,dt,time);
    if(race.state!=='idle')kartFX(k,dt);}
  for(const b of T.boxes){b.mesh.visible=b.t<=0&&race.items;if(b.gd)b.gd.visible=b.mesh.visible;if(b.mesh.visible){b.mesh.rotation.y=time*1.6+b.ph;b.mesh.rotation.x=time*.9+b.ph;b.mesh.position.y=b.y+Math.sin(time*2.2+b.ph)*.18;}}
  T.boxMat.emissiveIntensity=1.6+Math.sin(time*5)*.6;T.flagU.value=time;FT.value=time;if(T.beacon)T.beacon.material.opacity=(time%1.6)<.25?1:.08;
  for(let i=0;i<Math.max(rockets.length,rocketMeshes.length);i++){const m=poolMesh(rocketMeshes,i,KG.rockG,KG.rockM),r=rockets[i];m.visible=!!r;if(r){m.position.set(r.x,r.y,r.z);m.rotation.y=r.hd;emit(r.x,r.y,r.z,(Math.random()-.5)*2,Math.random()*2,(Math.random()-.5)*2,1,.4,.6,.3);}}
  for(let i=0;i<Math.max(traps.length,trapMeshes.length);i++){const m=poolMesh(trapMeshes,i,KG.trapG,KG.trapM),t=traps[i];m.visible=!!t;if(t){m.position.set(t.x,t.y,t.z);m.rotation.y=time*2;}}
  KG.trapM.emissiveIntensity=.6+Math.sin(time*9)*.5;
  if(T.neonTex){T.neonTex.offset.x=-time*.9;}
  stepParticles(dt);stepSmoke(dt);sMat.uniforms.sc.value=renderer.domElement.height/(nViews>2?2:1)*.5/Math.tan(views[0].cam.fov*Math.PI/360);
  {const n=race.state==='count'?4-Math.ceil(race.count):race.state==='race'&&race.t<1.5?9:0,c=SKC[T.def.id];skMat.uniforms.c.value.set(c[0],c[1],c[2]);for(let i=0;i<3;i++){const m=T.lamps[i];if(n===9)m.color.setRGB(.2,4.5,.9);else if(i<n)m.color.setRGB(4.5,.1,.12);else m.color.setRGB(.05,.01,.012);}}
}
function weatherStep(dt,cam,time){const w=T.weather;if(!w)return;const p=w.geometry.attributes.position,a=p.array,n=w.userData.n,snow=w.userData.snow,cx=cam.position.x,cy=cam.position.y,cz=cam.position.z;
  const wx=snow?Math.sin(time*.3)*3:-26,wy=snow?-5.5:-1.2,wz=snow?2:9;
  for(let i=0;i<n;i++){const j=i*3;let x=a[j]+wx*dt+(snow?Math.sin(time*2+i)*.01:0),y=a[j+1]+wy*dt,z=a[j+2]+wz*dt;
    if(x-cx>45)x-=90;else if(x-cx<-45)x+=90;if(y-cy>22)y-=44;else if(y-cy<-22)y+=44;if(z-cz>45)z-=90;else if(z-cz<-45)z+=90;a[j]=x;a[j+1]=y;a[j+2]=z;}
  p.needsUpdate=true;}

/* ---------------- post-processing: MSAA scene target → bloom → grade / vignette / speed blur ---------------- */
const Post=(()=>{
  /* HDR pipeline: linear half-float MSAA scene → depth pre-pass → SSAO → SSR → resolve (AO, reflections, sun in-scatter, ground mist)
     → bloom → composite (per-pixel motion blur, light shafts, lens flare, ACES tone map, grade, vignette, grain) */
  let rt=null,rtZ=null,rtR=null,aoA=null,aoB=null,sA=null,sB=null,bA=null,bB=null,bC=null,bC2=null,bD=null,bD2=null,w=0,h=0,cut=true;
  let hdrOK=renderer.capabilities.isWebGL2&&!!(renderer.extensions.get('EXT_color_buffer_float')||renderer.extensions.get('EXT_color_buffer_half_float')),noMS=isTouch;
  const cam=new THREE.OrthographicCamera(-1,1,1,-1,0,1),qs=new THREE.Scene(),quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),null);quad.frustumCulled=false;qs.add(quad);
  const depthMat=new THREE.MeshBasicMaterial({colorWrite:false});
  const VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
  const mk=(fs,u)=>new THREE.ShaderMaterial({vertexShader:VS,fragmentShader:fs,uniforms:u,depthTest:false,depthWrite:false,extensions:{derivatives:true}});
  const TX=new THREE.Vector2(1,1),VP='uniform sampler2D tZ;uniform mat4 ip;uniform vec2 tx;varying vec2 vUv;vec3 vp(vec2 uv){float d=texture2D(tZ,uv).x;vec4 c=ip*vec4(uv*2.-1.,d*2.-1.,1.);return c.xyz/c.w;}\nvec3 nrm(vec2 uv,vec3 p){vec3 l=vp(uv-vec2(tx.x,0.)),r=vp(uv+vec2(tx.x,0.)),u=vp(uv+vec2(0.,tx.y)),dn=vp(uv-vec2(0.,tx.y));vec3 dx=abs(l.z-p.z)<abs(r.z-p.z)?p-l:r-p,dy=abs(dn.z-p.z)<abs(u.z-p.z)?p-dn:u-p;return normalize(cross(dx,dy));}\n';
  const IP=new THREE.Matrix4(),PM=new THREE.Matrix4(),IV=new THREE.Matrix4(),VPm=new THREE.Matrix4(),prevVP=new THREE.Matrix4(),RP=new THREE.Matrix4(),tmpM=new THREE.Matrix4();
  const ssao=mk(VP+`uniform vec2 ps;
float ign(vec2 p){return fract(52.9829189*fract(dot(p,vec2(.06711056,.00583715))));}
void main(){float d0=texture2D(tZ,vUv).x;if(d0>.99995){gl_FragColor=vec4(1.);return;}
vec3 p=vp(vUv),n=nrm(vUv,p);float a0=ign(gl_FragCoord.xy)*6.2832,ao=0.;
for(int i=0;i<12;i++){float fi=(float(i)+.5)/12.,an=a0+fi*15.08;vec2 o=vec2(cos(an),sin(an))*sqrt(fi)*ps/max(-p.z,.6);
vec3 v=vp(vUv+o)-p;float dd=dot(v,v);ao+=max(dot(v,n)-.04-.004*(-p.z),0.)/(dd+.06)*smoothstep(9.,2.,dd);}
float A=clamp(1.-ao*.27,0.,1.);A=mix(A*A,1.,smoothstep(70.,170.,-p.z));gl_FragColor=vec4(A,A,A,1.);}`,{tZ:{value:null},ip:{value:IP},tx:{value:TX},ps:{value:new THREE.Vector2()}});
  const aoBlur=mk(`uniform sampler2D t,tZ;uniform vec2 d;varying vec2 vUv;
void main(){float z0=1.-texture2D(tZ,vUv).x,s=0.,ws=0.;for(int i=-3;i<=3;i++){vec2 u=vUv+d*float(i);float z=1.-texture2D(tZ,u).x,wt=exp(-float(i*i)/5.)*step(abs(z-z0),z0*.12+1e-7);s+=texture2D(t,u).r*wt;ws+=wt;}
float a=s/max(ws,1e-4);gl_FragColor=vec4(a,a,a,1.);}`,{t:{value:null},tZ:{value:null},d:{value:new THREE.Vector2()}});
  const ssr=mk(VP+`uniform sampler2D tC;uniform mat4 pm;uniform float rough;uniform vec3 sky;
float h1(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec4 c0=texture2D(tC,vUv);float wet=1.-c0.a;if(wet<.04||wet>.78){gl_FragColor=vec4(0.);return;}
vec3 p=vp(vUv),n=nrm(vUv,p);if(n.y<.2){gl_FragColor=vec4(0.);return;}
vec3 v=normalize(p);n=normalize(n+(vec3(h1(vUv*91.),h1(vUv*37.+3.),h1(vUv*53.+7.))-.5)*rough);vec3 r=reflect(v,n);
float st=.12+.02*(-p.z),hit=0.;vec3 q=p+n*.06+r*st*fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));vec2 hu=vec2(0.);
if(r.z>.05){gl_FragColor=vec4(0.);return;}
for(int i=0;i<44;i++){q+=r*st;st*=1.085;vec4 s=pm*vec4(q,1.);if(s.w<=0.)break;vec2 u=s.xy/s.w*.5+.5;if(u.x<0.||u.x>1.||u.y<0.||u.y>1.)break;
float dz=vp(u).z-q.z;if(dz>0.){if(dz<st*1.6+.5){vec3 a=q-r*st,b=q;for(int j=0;j<5;j++){vec3 m=(a+b)*.5;vec4 t=pm*vec4(m,1.);vec2 tu=t.xy/t.w*.5+.5;if(vp(tu).z-m.z>0.)b=m;else a=m;}
vec4 t=pm*vec4(b,1.);hu=t.xy/t.w*.5+.5;hit=exp(-length(b-p)*.022);}break;}}
float F0=.05+.95*pow(1.-max(dot(-v,n),0.),4.),w0=clamp(F0*1.4+.12,0.,1.)*smoothstep(.04,.3,wet)*(.35+wet);
if(hit<.01){float a0=w0*.55;gl_FragColor=vec4(sky*a0,a0);return;}
vec2 e=smoothstep(vec2(0.),vec2(.12),hu)*smoothstep(vec2(0.),vec2(.12),1.-hu);float F=.05+.95*pow(1.-max(dot(-v,n),0.),4.);
float a=hit*e.x*e.y*clamp(F*1.4+.12,0.,1.)*smoothstep(.04,.3,wet)*(.35+wet);vec3 col=texture2D(tC,hu).rgb;float lm=max(col.r,max(col.g,col.b));col*=min(1.,6./max(lm,1e-3));col=mix(vec3(dot(col,vec3(.3,.6,.1))),col,.7);float af=mix(w0*.55,a,e.x*e.y);gl_FragColor=vec4(mix(sky,col,e.x*e.y*hit)*af,af);}`,{tZ:{value:null},ip:{value:IP},tx:{value:TX},tC:{value:null},pm:{value:PM},rough:{value:.02},sky:{value:new THREE.Color()}});
  const blur=mk('uniform sampler2D t;uniform vec2 d;varying vec2 vUv;void main(){vec4 c=texture2D(t,vUv)*.227;c+=(texture2D(t,vUv+d*1.385)+texture2D(t,vUv-d*1.385))*.316;c+=(texture2D(t,vUv+d*3.231)+texture2D(t,vUv-d*3.231))*.0703;gl_FragColor=c;}',{t:{value:null},d:{value:new THREE.Vector2()}});
  const resolve=mk(VP+`uniform sampler2D tC,tA,tS;uniform mat4 iv;uniform vec3 sunV,sunC,fogC;uniform float aoK,ssrK,mist,mistY;
void main(){vec4 c=texture2D(tC,vUv);vec3 col=c.rgb;float d=texture2D(tZ,vUv).x;
if(d<.99995){if(aoK>0.)col*=mix(1.,texture2D(tA,vUv).r,aoK);
if(ssrK>0.){float wr=1.-c.a,gt=step(.04,wr)*step(wr,.78);vec4 s=texture2D(tS,vUv)*gt;float a=clamp(s.a*ssrK,0.,1.);col=col*(1.-a*.85)+s.rgb*ssrK;}
vec3 p=vp(vUv);float dist=length(p);vec3 vd=p/dist;col+=sunC*pow(max(dot(vd,sunV),0.),7.)*(1.-exp(-dist*.0035))*.22;
if(mist>0.){float wy=(iv*vec4(p,1.)).y,m=exp(-max(wy-mistY,0.)*.075)*(1.-exp(-dist*.0055))*mist;col=mix(col,fogC,clamp(m,0.,.9));}}
gl_FragColor=vec4(col,c.a);}`,{tZ:{value:null},ip:{value:IP},tC:{value:null},tA:{value:null},tS:{value:null},iv:{value:IV},sunV:{value:new THREE.Vector3()},sunC:{value:new THREE.Color()},fogC:{value:new THREE.Color()},aoK:{value:0},ssrK:{value:0},mist:{value:0},mistY:{value:0}});
  const bright=mk('uniform sampler2D t;uniform vec2 px;uniform float thr;varying vec2 vUv;void main(){vec3 c=(texture2D(t,vUv+px*vec2(-1,-1)).rgb+texture2D(t,vUv+px*vec2(1,-1)).rgb+texture2D(t,vUv+px*vec2(-1,1)).rgb+texture2D(t,vUv+px*vec2(1,1)).rgb)*.25;c=min(c,vec3(12.));float l=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c*smoothstep(thr,thr*1.7,l),1.);}',{t:{value:null},px:{value:new THREE.Vector2()},thr:{value:1}});
  const comp=mk(`uniform sampler2D tD,tB,tB2,tB3,tZ;uniform vec3 lift;uniform mat4 rp;uniform float str,warp,mb,time,vig,rays,asp,expo;uniform vec2 sun;varying vec2 vUv;
vec3 fit(vec3 v){vec3 a=v*(v+.0245786)-.000090537,b=v*(.983729*v+.4329510)+.238081;return a/b;}
vec3 aces(vec3 c){c*=expo/.6;c=mat3(.59719,.07600,.02840,.35458,.90834,.13383,.04823,.01566,.83777)*c;c=fit(c);c=mat3(1.60475,-.10208,-.00327,-.53108,1.10813,-.07276,-.07367,-.00605,1.07602)*c;return clamp(c,0.,1.);}
void main(){vec2 d=vUv-.5;vec4 c0=texture2D(tD,vUv);vec3 c=c0.rgb;
if(mb>.001&&c0.a>.1){float z=texture2D(tZ,vUv).x;vec4 pc=rp*vec4(vUv*2.-1.,z*2.-1.,1.);if(pc.w>0.&&z<.99995){vec2 v=(vUv-(pc.xy/pc.w*.5+.5))*mb*smoothstep(.1,.55,length(d));float l=length(v);if(l>.011){v*=.011/l;l=.011;}
if(l>.0006){float ws=2.,jt=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));c*=2.;for(int i=0;i<12;i++){float t=(float(i)+jt)/12.-.5;vec4 s=texture2D(tD,vUv+v*t);float wt=step(.1,s.a)*(1.-abs(t)*1.5);c+=s.rgb*wt;ws+=wt;}c/=ws;}}}
if(warp>.004&&c0.a>.1){float r2=dot(d,d)*smoothstep(.3,.6,length(d));vec3 a=c;for(int i=1;i<5;i++){vec2 o=d*warp*r2*float(i)*.1;a+=vec3(texture2D(tD,vUv-o*1.2).r,texture2D(tD,vUv-o).g,texture2D(tD,vUv-o*.82).b);}c=a/5.;}
c+=(texture2D(tB,vUv).rgb+texture2D(tB2,vUv).rgb*.5+texture2D(tB3,vUv).rgb*.25)*str*.6;
if(rays>.002){vec2 dl=sun-vUv;vec3 g=vec3(0.);float wt=1.;for(int i=1;i<=14;i++){g+=texture2D(tB,vUv+dl*(float(i)/15.)).rgb*wt;wt*=.9;}c+=g*rays*.05;
float vis=clamp(dot(texture2D(tB,clamp(sun,0.,1.)).rgb,vec3(.15)),0.,1.)*rays;vec2 q=.5-sun,sc=vec2(asp,1.);
c+=vis*(vec3(.25,.5,.9)*smoothstep(.07,0.,length((vUv-.5-q*.45)*sc))*.5+vec3(.9,.5,.2)*smoothstep(.035,0.,length((vUv-.5-q*.9)*sc))*.7+vec3(.4,.9,.5)*smoothstep(.13,.02,length((vUv-.5-q*1.7)*sc))*.2);}
c=aces(c);c=pow(c,vec3(1./2.2));
float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),c,1.06);c=mix(c,c*c*(3.-2.*c),.22);c+=lift*(1.-l);
c*=1.-vig*dot(d,d);
c+=(fract(sin(dot(vUv*vec2(913.,517.)+time,vec2(12.9898,78.233)))*43758.5453)-.5)*.012;
gl_FragColor=vec4(c,1.);}`,{tD:{value:null},tB:{value:null},tB2:{value:null},tB3:{value:null},lift:{value:new THREE.Vector3()},tZ:{value:null},rp:{value:RP},str:{value:.5},warp:{value:0},mb:{value:0},time:{value:0},vig:{value:.85},rays:{value:0},asp:{value:1.7},expo:{value:1},sun:{value:new THREE.Vector2(.5,.5)}});
  const _pv=new THREE.Vector3(),_pd=new THREE.Vector3(),_lp=new THREE.Vector3();
  function pass(m,target){quad.material=m;renderer.setRenderTarget(target);renderer.render(qs,cam);}
  const P={on:true,warp:0,hdrOK,
    ready(){return P.on&&hdrOK&&rt!==null;},
    size(W,H){if(!P.on||!hdrOK){P.dispose();w=0;return;}if(W===w&&H===h&&rt)return;w=W;h=H;P.dispose();if(W<16||H<16)return;
      const o={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,type:THREE.HalfFloatType,depthBuffer:true},nd=Object.assign({},o,{depthBuffer:false}),ld={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,depthBuffer:false};
      const mkRT=()=>{const t=noMS?new THREE.WebGLRenderTarget(W,H,o):new THREE.WebGLMultisampleRenderTarget(W,H,o);t.texture.generateMipmaps=false;t.depthTexture=new THREE.DepthTexture(W,H,THREE.UnsignedIntType);if(!noMS&&maxDPR()>=1.5)t.samples=2;return t;};rt=mkRT();
      {const gl=renderer.getContext(),chk=()=>{renderer.setRenderTarget(rt);const ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;renderer.setRenderTarget(null);return ok;};
       if(!chk()){rt.depthTexture.dispose();rt.dispose();if(!noMS){noMS=true;rt=mkRT();}if(noMS&&!chk()){rt.depthTexture.dispose();rt.dispose();rt=null;hdrOK=false;P.hdrOK=false;w=0;return;}}}
      rtR=new THREE.WebGLRenderTarget(W,H,nd);const hw=Math.max(2,W>>1),hh=Math.max(2,H>>1),qw=Math.max(2,W>>2),qh=Math.max(2,H>>2);
      aoA=new THREE.WebGLRenderTarget(hw,hh,ld);aoB=new THREE.WebGLRenderTarget(hw,hh,ld);sA=new THREE.WebGLRenderTarget(hw,hh,nd);sB=new THREE.WebGLRenderTarget(hw,hh,nd);
      bA=new THREE.WebGLRenderTarget(qw,qh,nd);bB=new THREE.WebGLRenderTarget(qw,qh,nd);bC=new THREE.WebGLRenderTarget(Math.max(2,W>>3),Math.max(2,H>>3),nd);bC2=bC.clone();bD=new THREE.WebGLRenderTarget(Math.max(2,W>>4),Math.max(2,H>>4),nd);bD2=bD.clone();for(const t of[rtR,aoA,aoB,sA,sB,bA,bB,bC,bC2,bD,bD2])t.texture.generateMipmaps=false;cut=true;},
    dispose(){for(const t of[rt,rtZ,rtR,aoA,aoB,sA,sB,bA,bB,bC,bC2,bD,bD2])if(t){if(t.depthTexture)t.depthTexture.dispose();t.dispose();}rt=rtZ=rtR=aoA=aoB=sA=sB=bA=bB=bC=bC2=bD=bD2=null;},
    off(){P.on=false;P.dispose();},
    cut(){cut=true;},
    begin(){rt.scissorTest=false;rt.viewport.set(0,0,w,h);renderer.setRenderTarget(rt);renderer.clear();},
    view(r,multi){rt.viewport.set(Math.round(r[0]*w),Math.round(r[1]*h),Math.round(r[2]*w),Math.round(r[3]*h));rt.scissor.copy(rt.viewport);rt.scissorTest=multi;renderer.setRenderTarget(rt);},
    end(time,bl,c,dt){rt.scissorTest=false;rt.viewport.set(0,0,w,h);const def=T.def,Z=rt.depthTexture;let src=rt.texture;
      if(c){IP.copy(c.projectionMatrixInverse);PM.copy(c.projectionMatrix);IV.copy(c.matrixWorld);
        const ao=eff('ao'),sr=eff('ssr')&&def.wet>0;TX.set(1/w,1/h);
        if(ao){ssao.uniforms.tZ.value=Z;TX.set(1/w,1/h);ssao.uniforms.ps.value.set(PM.elements[0]*.5*1.0,PM.elements[5]*.5*1.0);pass(ssao,aoA);
          aoBlur.uniforms.tZ.value=Z;aoBlur.uniforms.t.value=aoA.texture;aoBlur.uniforms.d.value.set(1/aoA.width,0);pass(aoBlur,aoB);aoBlur.uniforms.t.value=aoB.texture;aoBlur.uniforms.d.value.set(0,1/aoA.height);pass(aoBlur,aoA);}
        if(sr){ssr.uniforms.tZ.value=Z;ssr.uniforms.tC.value=rt.texture;ssr.uniforms.rough.value=def.id==='neon'?.003:.04;ssr.uniforms.sky.value.copy(scene.fog.color).multiplyScalar(def.id==='neon'?1.6:.8);pass(ssr,sA);
          const bs=def.id==='neon'?1:2.2;blur.uniforms.t.value=sA.texture;blur.uniforms.d.value.set(bs/sA.width,0);pass(blur,sB);blur.uniforms.t.value=sB.texture;blur.uniforms.d.value.set(0,bs*3/sA.height);pass(blur,sA);
          blur.uniforms.t.value=sA.texture;blur.uniforms.d.value.set(bs*1.6/sA.width,0);pass(blur,sB);blur.uniforms.t.value=sB.texture;blur.uniforms.d.value.set(0,bs*6/sA.height);pass(blur,sA);
          blur.uniforms.t.value=sA.texture;blur.uniforms.d.value.set(bs/sA.width,0);pass(blur,sB);blur.uniforms.t.value=sB.texture;blur.uniforms.d.value.set(0,bs*9/sA.height);pass(blur,sA);}
        const u=resolve.uniforms;u.tZ.value=Z;u.tC.value=rt.texture;u.tA.value=aoA.texture;u.tS.value=sA.texture;u.aoK.value=ao?.85:0;u.ssrK.value=sr?def.wet:0;
        u.sunV.value.copy(sunDir).transformDirection(c.matrixWorldInverse);u.sunC.value.copy(sun.color).multiplyScalar(def.scatter);u.fogC.value.copy(scene.fog.color);u.mist.value=def.mist;u.mistY.value=def.mistY;
        pass(resolve,rtR);src=rtR.texture;}
      bright.uniforms.t.value=src;bright.uniforms.px.value.set(1/w,1/h);bright.uniforms.thr.value=bl[0];pass(bright,bA);
      for(const s of[1,2.4]){blur.uniforms.t.value=bA.texture;blur.uniforms.d.value.set(s/bA.width,0);pass(blur,bB);blur.uniforms.t.value=bB.texture;blur.uniforms.d.value.set(0,s/bA.height);pass(blur,bA);}
      blur.uniforms.t.value=bA.texture;blur.uniforms.d.value.set(1.5/bC.width,0);pass(blur,bC);blur.uniforms.t.value=bC.texture;blur.uniforms.d.value.set(0,1.5/bC.height);pass(blur,bC2);
      blur.uniforms.t.value=bC2.texture;blur.uniforms.d.value.set(1.5/bD.width,0);pass(blur,bD);blur.uniforms.t.value=bD.texture;blur.uniforms.d.value.set(0,1.5/bD.height);pass(blur,bD2);
      const u=comp.uniforms;u.tD.value=src;u.tB.value=bA.texture;u.tB2.value=bC2.texture;u.tB3.value=bD2.texture;u.tZ.value=Z;u.lift.value.set(def.lift[0],def.lift[1],def.lift[2]);u.str.value=bl[1]*CFG.bloom;u.warp.value=CFG.mblur?P.warp:0;u.time.value=time%10;u.asp.value=w/h;u.expo.value=def.expo;
      let ry=0,mb=0;
      if(c){if(CFG.rays&&def.rays>0){_pv.copy(sunDir).multiplyScalar(1000).add(c.position).project(c);c.getWorldDirection(_pd);const f=_pd.dot(sunDir);if(f>.05&&_pv.z<1){u.sun.value.set(_pv.x*.5+.5,_pv.y*.5+.5);ry=def.rays*smooth((f-.05)/.5);}}
        VPm.multiplyMatrices(c.projectionMatrix,c.matrixWorldInverse);if(cut||c.position.distanceTo(_lp)>25)prevVP.copy(VPm);else if(CFG.mblur&&dt>0)mb=clamp(.55*(1/60)/dt,0,.9);
        RP.multiplyMatrices(prevVP,tmpM.copy(VPm).invert());prevVP.copy(VPm);_lp.copy(c.position);cut=false;}else cut=true;
      u.rays.value=ry;u.mb.value=mb;pass(comp,null);}
  };return P;})();
/* switch every non-standard shader between the HDR pipeline and the plain LDR path */
const _tg=new THREE.Vector3();
function updateTags(cam,show){const box=$('tags');while(box.children.length<NK)box.appendChild(document.createElement('div'));const W=innerWidth,H=innerHeight,vis=[];
  for(const k of karts){const el=box.children[k.i];let op=0;if(show&&k.i!==G.my){_tg.set(k.x,k.y+2.25,k.z);const d=_tg.distanceTo(cam.position);_tg.project(cam);
      if(_tg.z<1&&Math.abs(_tg.x)<1.05&&Math.abs(_tg.y)<1.05){op=smooth((d-9)/5)*smooth((55-d)/14);if(op>.35)vis.push([d,el,(_tg.x*.5+.5)*W,(-_tg.y*.5+.5)*H,op,k]);}}
    if(op<=.02&&el._o){el._o=false;el.style.display='none';}}
  vis.sort((a,b)=>a[0]-b[0]);const pl=[];
  for(const v of vis){let y=v[3];for(let it=0;it<6;it++){let hit=false;for(const p of pl)if(Math.abs(p[0]-v[2])<92&&Math.abs(p[1]-y)<21){y=p[1]-22;hit=true;}if(!hit)break;}pl.push([v[2],y]);const el=v[1],k=v[5];
    el.style.transform='translate(-50%,-100%) translate('+v[2].toFixed(1)+'px,'+y.toFixed(1)+'px)';const s=k.place+' '+k.name;if(el._s!==s){el._s=s;el.innerHTML='<b>'+k.place+'</b>'+esc(k.name);el.style.borderColor=hex(k.color);}
    if(!el._o){el._o=true;el.style.display='block';}}}
function applyHDR(){const on=Post.ready();renderer.toneMapping=on?THREE.NoToneMapping:THREE.ACESFilmicToneMapping;if(!T)return;const def=T.def,lum=on?def.lum:1;
  T.skyMat.uniforms.hdr.value=on?1:0;sMat.uniforms.hdr.value=on?1:0;sMat.uniforms.lum.value=lum;skMat.uniforms.hdr.value=on?1:0;
  scene.fog.color.setHex(def.fog[0]);if(on)scene.fog.color.convertSRGBToLinear();renderer.setClearColor(scene.fog.color);
  if(T.weather)T.weather.material.color.setHex(T.weather.userData.snow?0xffffff:0xe7c08a).multiplyScalar(lum);for(const k of karts)k.m.tag.material.color.setScalar(Math.min(lum,2));
  if(hdrWas!==on){hdrWas=on;scene.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{m.needsUpdate=true;});});}}
let hdrWas=null;


/* ==== 80-flow-hud.js ==== */
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

/* ==== 85-net.js ==== */
const PEER_PREFIX='apexcarts-v1-',STN={idle:0,count:1,race:2,done:3,intro:4},STR=['idle','count','race','done','intro'];
const Net={peer:null,clients:new Map(),conn:null,slots:[],snapPrev:null,snapNext:null,retry:0,lastRx:0,joinRole:'player',closing:false};
function loadPeerLib(cb){if(window.Peer)return cb(true);const s=document.createElement('script');s.src='lib/peerjs.min.js';s.onload=()=>cb(!!window.Peer);s.onerror=()=>cb(false);document.head.appendChild(s);}
function normCode(s){s=(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(s.startsWith('CART'))s=s.slice(4);return s.length===4?'CART-'+s:'';}
function netClose(){Net.closing=true;try{if(Net.conn)Net.conn.close();}catch(e){}for(const c of Net.clients.values()){try{c.conn.close();}catch(e){}}
  try{if(Net.peer)Net.peer.destroy();}catch(e){}Net.peer=null;Net.conn=null;Net.clients.clear();Net.snapPrev=Net.snapNext=null;setTimeout(()=>Net.closing=false,300);}
const aiSlot=i=>({type:'ai',name:AI_NAMES[i],color:(i+1)%8});
function roster(){return Net.slots.map(s=>({n:s.name,c:s.color,h:s.type==='ai'?0:1,k:s.type==='net'?s.role:s.type}));}
function applyRoster(r){r.forEach((e,i)=>{const k=karts[i];if(k.name!==e.n||k.color!==e.c||k.human!==!!e.h){k.setLook(e.n,e.c,!!e.h);}if(k.finished)k.ai=true;});}
function broadcast(m){for(const c of Net.clients.values())if(c.conn.open){try{c.conn.send(m);}catch(e){}}}
function pushRoster(){const r=roster();broadcast({t:'roster',r,track:G.track,st:STN[race.state]});if(race.state!=='idle')applyRoster(r);drawHostList();}
function setHostSeat(racing){const cur=Net.slots.findIndex(s=>s.type==='host');
  if(racing&&cur<0){const f=Net.slots.findIndex(s=>s.type==='ai');if(f<0){toast('Grid is full');return false;}Net.slots[f]={type:'host',name:G.name,color:G.color};G.my=f;}
  else if(!racing&&cur>=0){Net.slots[cur]=aiSlot(cur);G.my=-1;}
  else if(cur>=0){Net.slots[cur].name=G.name;Net.slots[cur].color=G.color;G.my=cur;}
  G.hostTV=!racing;document.querySelectorAll('#hostSeg button').forEach(b=>b.classList.toggle('on',(b.dataset.m==='tv')===G.hostTV));return true;}
function hostOpen(){Snd.init();showScreen('sHost');$('hStat').textContent='Opening room…';$('hCode').textContent='…';
  Net.slots=[];for(let i=0;i<NK;i++)Net.slots.push(aiSlot(i));G.mode='host';setHostSeat(!G.hostTV);drawHostList();
  loadPeerLib(ok=>{if(!ok){$('hStat').textContent='Multiplayer needs an internet connection (PeerJS could not load).';return;}
    const open=()=>{G.code='CART-'+String(Math.floor(1000+Math.random()*9000));const p=Net.peer=new Peer(PEER_PREFIX+G.code,{debug:0});
      p.on('open',()=>{$('hCode').textContent=G.code;const u=location.href.split(/[?#]/)[0]+'?room='+G.code;$('hLink').value=u;$('hStat').textContent='Room open. Share the code or link — viewers: add &role=viewer';});
      p.on('error',e=>{if(e.type==='unavailable-id'){p.destroy();open();}else if(e.type==='network'||e.type==='server-error'||e.type==='socket-error')$('hStat').textContent='Signalling server unreachable — retrying…';});
      p.on('disconnected',()=>{if(!Net.closing&&Net.peer===p)setTimeout(()=>{try{p.reconnect();}catch(e){}},1500);});
      p.on('connection',conn=>{const c={conn,role:'viewer',slot:-1,last:performance.now()};
        conn.on('data',d=>hostMsg(c,d));conn.on('close',()=>dropClient(c));conn.on('error',()=>dropClient(c));});};
    open();});}
function dropClient(c){if(!Net.clients.has(c.conn.peer)&&c.slot<0)return;Net.clients.delete(c.conn.peer);
  if(c.slot>=0&&Net.slots[c.slot]&&Net.slots[c.slot].conn===c.conn){Net.slots[c.slot]=aiSlot(c.slot);c.slot=-1;}pushRoster();}
function hostMsg(c,d){c.last=performance.now();if(!d||!d.t)return;
  if(d.t==='hello'){Net.clients.set(c.conn.peer,c);c.role=d.role==='viewer'?'viewer':d.role==='ctl'?'ctl':'player';
    if(c.role!=='viewer'){const f=Net.slots.findIndex(s=>s.type==='ai');if(f>=0){Net.slots[f]={type:'net',conn:c.conn,role:c.role,name:String(d.name||'Player').slice(0,10),color:(d.color|0)%8};c.slot=f;karts[f].in.st=karts[f].in.th=karts[f].in.br=0;}else c.role='viewer';}
    c.conn.send({t:'welcome',slot:c.slot,role:c.role,code:G.code,track:G.track});pushRoster();
    if(race.state!=='idle')c.conn.send({t:'start',track:G.track,r:roster(),mid:1,laps:LAPS,items:race.items?1:0});
    toast((d.name||'Viewer')+' joined'+(c.role==='viewer'?' as viewer':''));}
  else if(d.t==='in'&&c.slot>=0){const k=karts[c.slot];if(!k.ai){const i=k.in;i.st=clamp(+d.s||0,-1,1);i.th=clamp(+d.h||0,0,1);i.br=clamp(+d.b||0,0,1);i.dr=d.d?1:0;i.it=d.i?1:0;if(d.r)i.rs=1;}}
}
const r2=v=>Math.round(v*100)/100;
function makeSnap(){return {t:'s',st:STN[race.state],tm:r2(race.t),c:r2(race.count),in:r2(race.intro),
  k:karts.map(k=>[r2(k.x),r2(k.y),r2(k.z),Math.round(k.hd*1000)/1000,r2(k.spd),r2(k.steer),(k.drift?1:0)|(k.air?2:0)|(k.off?4:0)|(k.finished?8:0)|(k.driftDir>0?16:0)|(k.wrong?32:0),
    k.lap,k.idx,k.item,r2(Math.max(0,k.boostT)),r2(k.draft),k.place,r2(k.lapStart),r2(k.bestLap),r2(k.lastLap),r2(k.finT),r2(k.spinT>0?k.spinA:0),r2(k.driftT)]),
  rk:rockets.map(o=>[r2(o.x),r2(o.y),r2(o.z),r2(o.hd)]),tp:traps.map(o=>[r2(o.x),r2(o.y),r2(o.z)]),bx:T.boxes.map(b=>b.t>0?0:1).join(''),ev:evOut};}

/* --- client side --- */
function joinRoom(code,role){Snd.init();Net.joinRole=role;G.code=code;$('jStat').textContent='Connecting to '+code+'…';
  loadPeerLib(ok=>{if(!ok){$('jStat').textContent='Multiplayer needs an internet connection (PeerJS could not load).';return;}
    netClose();Net.closing=false;const p=Net.peer=new Peer({debug:0});
    p.on('open',()=>connectHost());
    p.on('error',e=>{if(e.type==='peer-unavailable'){if(G.mode==='client'&&Net.retry<5)retryJoin();else{$('jStat').textContent='Room '+code+' not found. Check the code and that the host screen is open.';}}
      else $('jStat').textContent='Connection error: '+e.type;});
    p.on('disconnected',()=>{if(!Net.closing&&Net.peer===p)setTimeout(()=>{try{p.reconnect();}catch(e){}},1500);});});}
function connectHost(){const conn=Net.conn=Net.peer.connect(PEER_PREFIX+G.code,{reliable:true,serialization:'json'});
  conn.on('open',()=>{Net.retry=0;Net.lastRx=performance.now();conn.send({t:'hello',role:Net.joinRole,name:G.name,color:G.color});});
  conn.on('data',clientMsg);conn.on('close',()=>{if(Net.conn===conn)lostHost();});conn.on('error',()=>{if(Net.conn===conn)lostHost();});}
function retryJoin(){Net.retry++;toast('Reconnecting… ('+Net.retry+')');setTimeout(()=>{if(G.mode==='client'&&Net.peer&&!Net.peer.destroyed)connectHost();},1800);}
function lostHost(){if(Net.closing||G.mode!=='client')return;Net.conn=null;if(Net.retry<5)retryJoin();else{toast('Lost connection to host',4000);exitToMenu();}}
function clientMsg(d){Net.lastRx=performance.now();if(!d||!d.t)return;
  if(d.t==='welcome'){G.mode='client';G.my=d.slot;G.role=d.role;G.track=d.track;
    $('jStat').textContent=d.role==='viewer'?(Net.joinRole==='viewer'?'Connected as TV viewer. Waiting for the host to start…':'Grid full — connected as viewer.'):'Connected! You are in seat '+(d.slot+1)+'. Waiting for the host to start…';$('jGo').classList.add('hide');}
  else if(d.t==='roster'){G.track=d.track;drawList($('jList'),d.r);if(race.state!=='idle')applyRoster(d.r);}
  else if(d.t==='start'){if(!T||T.ti!==d.track)loadTrack(d.track);G.track=d.track;applyRoster(d.r);LAPS=d.laps||3;race.items=d.items!==0;gridUp();Net.snapPrev=Net.snapNext=null;enterRace();if(d.mid){race.state='race';Snd.music('race');}}
  else if(d.t==='s'){if(race.state==='idle'||!T)return;d.rt=performance.now();Net.snapPrev=Net.snapNext;Net.snapNext=d;
    const st=STR[d.st];if(st!=='done'||race.state!=='done'){if(st!=='done')race.state=st;}race.count=d.c;race.intro=d.in||0;
    rockets.length=0;for(const o of d.rk)rockets.push({x:o[0],y:o[1],z:o[2],hd:o[3]});traps.length=0;for(const o of d.tp)traps.push({x:o[0],y:o[1],z:o[2]});
    for(let i=0;i<T.boxes.length;i++)T.boxes[i].t=d.bx[i]==='1'?0:1;
    for(const e of d.ev)onEvent(e[0],e[1],e[2]);}
  else if(d.t==='end'){race.results=d.res;race.state='done';onRaceEnd();}
}
function replicate(now,dt){const B=Net.snapNext;if(!B)return;const A=Net.snapPrev||B,a=clamp((now-B.rt)/clamp(B.rt-A.rt,30,200),0,1.3);
  if(race.state==='race')race.t=B.tm+Math.min(.3,(now-B.rt)/1000);else race.t=B.tm;
  if(race.state==='intro')race.intro=(B.in||0)+Math.min(.3,(now-B.rt)/1000);
  for(let i=0;i<NK;i++){const k=karts[i],p=A.k[i],q=B.k[i],far=Math.abs(q[0]-p[0])+Math.abs(q[2]-p[2])>40,t=far?1:a;
    k.x=lerp(p[0],q[0],t);k.y=lerp(p[1],q[1],Math.min(t,1));k.z=lerp(p[2],q[2],t);k.hd=p[3]+angDiff(q[3],p[3])*t;k.spd=q[4];k.steer=lerp(p[5],q[5],Math.min(t,1));
    const f=q[6];k.drift=!!(f&1);k.air=!!(f&2);k.off=!!(f&4);k.finished=!!(f&8);k.driftDir=f&16?1:-1;k.wrong=!!(f&32);
    k.lap=q[7];k.idx=q[8];k.item=q[9];k.boostT=q[10];k.draft=q[11];k.place=q[12];k.lapStart=q[13];k.bestLap=q[14];k.lastLap=q[15];k.finT=q[16];k.spinA=q[17];k.spinT=q[17]?1:0;k.driftT=q[18];
    const o=T.locate(k.x,k.z,k.idx,LO);k.gGrade=o.grade;k.gSlope=o.slope;k.gtx=o.tx;k.gtz=o.tz;k.lat=o.lat;k.vy=(q[1]-p[1])*20;groundPose(k,dt);}
}


/* ==== 90-menus.js ==== */
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


/* ==== 95-main.js ==== */
/* ---------------- main loop ---------------- */
let drawN=0,probeN=0,perfSkip=3,fpsN=0,fpsT=0,booted=false,last=performance.now(),netT=0,inT=0,perfAcc=0,perfN=0,lastDown=0,chkT=0;
function renderViews(dt,time){
  drawN=renderer.info.render.calls;renderer.info.reset();setupViews();const W=innerWidth,H=innerHeight,usePost=Post.ready(),intro=race.state==='intro',idle=race.state==='idle';
  if(eff('refl')&&(++probeN&1))Probe.update(idle?karts[0]:focusKart());if(!idle&&views[0].cam.view)views[0].cam.clearViewOffset();
  renderer.setRenderTarget(null);renderer.setViewport(0,0,W,H);renderer.setScissorTest(!usePost&&nViews>1);if(usePost)Post.begin();
  T.skyMat.uniforms.time.value=time;if(!intro&&scene.fog.density!==T.def.fog[1])scene.fog.density=T.def.fog[1];
  for(let i=0;i<nViews;i++){const v=views[i],cam=v.cam;let k=karts[v.ki]||karts[0],wide=false;
    if(idle){orbit(v,dt);k=karts[0];}
    else if(intro){k=focusKart();wide=introCam(v,k,dt)<.45;}
    else if(spectating()&&(G.camMode===2||v.ki<0)){k=leadKart();overhead(v,k,dt);}
    else chase(v,k,dt);
    T.terrain.castShadow=!wide&&T.def.id!=='neon';
    if(wide){shadowRange(430);sun.target.position.set(0,T.py[0],0);sun.position.set(sunDir.x*600,T.py[0]+sunDir.y*600,sunDir.z*600);}
    else{shadowRange(idle?16:30);sun.target.position.set(k.x,k.y,k.z);sun.position.set(k.x+sunDir.x*130,k.y+sunDir.y*130,k.z+sunDir.z*130);}
    sun.target.updateMatrixWorld();T.sky.position.copy(cam.position);if(i===0)weatherStep(dt,cam,time);
    if(T.def.id==='neon'){const fx=Math.sin(k.hd),fz=Math.cos(k.hd);headL.intensity=idle?2.2:3.2;headL.position.set(k.x+fx*1.3,k.y+.75,k.z+fz*1.3);headL.target.position.set(k.x+fx*22,k.y-.6,k.z+fz*22);headL.target.updateMatrixWorld();}
    const r=v.r;if(usePost)Post.view(r,nViews>1);else{renderer.setViewport(r[0]*W,r[1]*H,r[2]*W,r[3]*H);if(nViews>1)renderer.setScissor(r[0]*W,r[1]*H,r[2]*W,r[3]*H);}
    if(nViews===1&&!idle&&!intro)for(const o of karts)if(o!==k&&Math.hypot(o.x-cam.position.x,o.z-cam.position.z)<3.6)o.m.g.visible=false;
    renderer.render(scene,cam);}
  updateTags(views[0].cam,nViews===1&&!intro&&!idle);
  if(usePost){const fk=focusKart(),tw=(nViews===1&&!intro&&!idle)?(fk.boostT>0?.16:0):0;
    Post.warp+=(tw-Post.warp)*Math.min(1,dt*6+.02);Post.end(time,T.def.bloom,nViews===1?views[0].cam:null,(intro||idle||G.paused)?0:dt);}
}
function frame(now){requestAnimationFrame(frame);const raw=(now-last)/1000;last=now;const dt=Math.min(raw,.1),time=now/1000;if(!T)return;
  const inp=readInput();
  if(G.mode==='client'){replicate(now,dt);inT+=dt;if(inT>=.033&&Net.conn&&Net.conn.open){inT=0;try{Net.conn.send(G.my>=0?{t:'in',s:r2(inp.st),h:r2(inp.th),b:r2(inp.br),d:inp.dr,i:inp.it,r:inp.rs}:{t:'ping'});}catch(e){}}
    chkT+=dt;if(chkT>2){chkT=0;if(Net.conn&&now-Net.lastRx>7000&&race.state!=='idle'){try{Net.conn.close();}catch(e){}lostHost();}}}
  else if(!G.paused){
    if(G.my>=0){const k=karts[G.my];if(!k.ai){const i=k.in;i.st=inp.st;i.th=inp.th;i.br=inp.br;i.dr=inp.dr;i.it=inp.it;if(inp.rs)i.rs=1;}}
    const n=Math.max(1,Math.ceil(dt*60-.25));for(let s=0;s<n;s++)simulate(dt/n);
    if(G.mode==='host'){netT+=dt;if(netT>=.05){netT=0;if(Net.clients.size&&race.state!=='idle')broadcast(makeSnap());evOut=[];}
      chkT+=dt;if(chkT>3){chkT=0;for(const c of Array.from(Net.clients.values()))if(now-c.last>9000){try{c.conn.close();}catch(e){}dropClient(c);}}}
    else evOut.length=0;}
  const racing=race.state!=='idle',k=focusKart();
  Snd.drive(racing&&!G.paused&&race.state!=='done',k.spd,(G.my>=0&&!karts[G.my].finished)?inp.th:(k.in.th||.6),k.drift?1:clamp(Math.abs(k.vlat||0)/14-.25,0,1)*(k.air?0:1),k.off,k.boostT>0);
  if(racing)updateHUD(dt);
  if(document.body.classList.contains('ctl'))return;       // phone-controller mode: no 3D work at all
  if(!G.paused)syncVisuals(dt,time);
  renderViews(G.paused?0:dt,time);if(!booted){booted=true;loading(false);}
  if(CFG.fps){fpsN++;fpsT+=raw;if(fpsT>=.5){$('fps').textContent=Math.round(fpsN/fpsT)+' FPS · '+Math.round(resScale*maxDPR()*100)+'% · '+drawN+' draws';fpsN=0;fpsT=0;}}
  // dynamic resolution / shadow scaling toward a steady 60+ fps
  if(raw<.06&&CFG.quality==='auto'&&!G.paused){perfAcc+=raw;perfN++;if(perfAcc>=1.5){const ms=perfAcc/perfN*1000;perfAcc=0;perfN=0;
    if(perfSkip>0)perfSkip--;
    else if(ms>20.5){perfSkip=1;if(resScale>.62){resScale=Math.max(.6,resScale-.12);lastDown=now;resize();}else if(RTQ.ssr&&CFG.ssr){RTQ.ssr=false;}else if(RTQ.ao&&CFG.ao){RTQ.ao=false;}else if(RTQ.refl&&CFG.refl){RTQ.refl=false;Probe.set(0);}
      else if(RTQ.post&&CFG.post){RTQ.post=false;Post.off();resize();applyHDR();}else if(shadowsOn&&ms>24){RTQ.shadows=false;shadowsOn=false;sun.castShadow=false;}}
    else if(ms<17.6&&resScale<1&&now-lastDown>9000){perfSkip=1;resScale=Math.min(1,resScale+.06);lastDown=now-4000;resize();}}}
}

/* ---------------- startup ---------------- */
buildMenu();Snd.music('menu');
const unlock=()=>{Snd.init();};addEventListener('pointerdown',unlock);addEventListener('keydown',unlock);
{const q=new URLSearchParams(location.search),room=normCode(q.get('room')||'');if(room){const role=q.get('role')==='viewer'?'viewer':q.get('role')==='controller'||q.get('role')==='ctl'?'ctl':'player';
  openJoin(role==='viewer'?'viewer':'player');$('code').value=room;$('jCtl').checked=role==='ctl';if(role==='viewer')joinRoom(room,'viewer');else $('jStat').textContent='Room '+room+' — tap Connect to join.';}}
window.__apex={G,race,karts,get T(){return T;},Net,startSolo,TRACKS,selTrack,views,simulate,get resScale(){return resScale;}};
requestAnimationFrame(frame);
}

/* ==== 99-loader.js ==== */
/* loader: start once Three.js is present (with a fallback CDN) */
(function(){const fail=()=>{const d=document.createElement('div');d.id='fatal';d.innerHTML='<div><h2>Could not load the 3D engine</h2><p class="note">Connect to the internet once (or use the offline copy) and reload.</p></div>';document.body.appendChild(d);};
  const go=()=>{try{boot();}catch(e){console.error(e);const d=document.createElement('div');d.id='fatal';d.textContent='Startup error: '+e.message;document.body.appendChild(d);}};
  if(window.THREE)go();else{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';s.onload=go;s.onerror=fail;document.head.appendChild(s);}})();
