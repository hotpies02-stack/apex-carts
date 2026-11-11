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

