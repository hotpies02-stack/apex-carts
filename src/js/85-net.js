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

