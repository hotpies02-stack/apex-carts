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
{const ve=$("ver");if(ve)ve.textContent="v"+APEX_VERSION;}
buildMenu();Snd.music('menu');
const unlock=()=>{Snd.init();};addEventListener('pointerdown',unlock);addEventListener('keydown',unlock);
{const q=new URLSearchParams(location.search),room=normCode(q.get('room')||'');if(room){const role=q.get('role')==='viewer'?'viewer':q.get('role')==='controller'||q.get('role')==='ctl'?'ctl':'player';
  openJoin(role==='viewer'?'viewer':'player');$('code').value=room;$('jCtl').checked=role==='ctl';if(role==='viewer')joinRoom(room,'viewer');else $('jStat').textContent='Room '+room+' — tap Connect to join.';}}
window.__apex={G,race,karts,get T(){return T;},Net,startSolo,TRACKS,selTrack,views,simulate,get resScale(){return resScale;}};
requestAnimationFrame(frame);
}
