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

