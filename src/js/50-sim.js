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

