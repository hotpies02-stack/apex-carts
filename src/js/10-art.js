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
