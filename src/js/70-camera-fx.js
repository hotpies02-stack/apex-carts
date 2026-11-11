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

