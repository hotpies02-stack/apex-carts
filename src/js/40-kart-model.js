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

