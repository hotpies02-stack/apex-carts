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

