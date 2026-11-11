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

