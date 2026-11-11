/* ---------------- Web Audio engine (fully synthesized) ---------------- */
const Snd=(()=>{
  let ac=null,master,musicG,sfxG,dly,nbuf,eng=null,mode='none',nextT=0,step=0,bar=0,tempo=112,muted=store.get('mute',false),spdN=0;
  const mtof=m=>440*Math.pow(2,(m-69)/12);
  function init(){if(ac){if(ac.state==='suspended')ac.resume();return;}
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ac=new AC();
    master=ac.createGain();master.gain.value=muted?0:CFG.vMaster;const comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=5;master.connect(comp);comp.connect(ac.destination);
    musicG=ac.createGain();musicG.gain.value=.7*CFG.vMusic;musicG.connect(master);sfxG=ac.createGain();sfxG.gain.value=CFG.vSfx;sfxG.connect(master);
    dly=ac.createDelay(1);dly.delayTime.value=.27;const fb=ac.createGain();fb.gain.value=.36;dly.connect(fb);fb.connect(dly);const dw=ac.createGain();dw.gain.value=.4;dly.connect(dw);dw.connect(musicG);
    nbuf=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);const d=nbuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    // persistent engine / tyre / rumble voices
    const o1=ac.createOscillator(),o2=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();o1.type='sawtooth';o2.type='square';f.type='lowpass';f.Q.value=2;g.gain.value=0;
    const g2=ac.createGain();g2.gain.value=.5;o1.connect(f);o2.connect(g2);g2.connect(f);f.connect(g);g.connect(sfxG);o1.start();o2.start();
    const loop=(type,freq,q)=>{const s=ac.createBufferSource();s.buffer=nbuf;s.loop=true;const bf=ac.createBiquadFilter();bf.type=type;bf.frequency.value=freq;bf.Q.value=q;const gg=ac.createGain();gg.gain.value=0;s.connect(bf);bf.connect(gg);gg.connect(sfxG);s.start();return {g:gg,f:bf};};
    eng={o1,o2,f,g,scr:loop('bandpass',1900,4),rum:loop('lowpass',160,1),wind:loop('bandpass',700,.6)};
    setInterval(sched,35);nextT=ac.currentTime+.1;}
  function tone(type,freq,t,dur,vol,dest,o){o=o||{};const os=ac.createOscillator(),g=ac.createGain();os.type=type;os.frequency.setValueAtTime(freq,t);
    if(o.to)os.frequency.exponentialRampToValueAtTime(o.to,t+dur);if(o.det)os.detune.value=o.det;
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+(o.a||.005));g.gain.setValueAtTime(vol,t+Math.max(o.a||.005,dur*(o.hold||.3)));g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    let n=os;if(o.lp){const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(o.lp,t);if(o.lpTo)f.frequency.exponentialRampToValueAtTime(o.lpTo,t+dur);f.Q.value=o.q||1;os.connect(f);n=f;}
    n.connect(g);g.connect(dest||sfxG);os.start(t);os.stop(t+dur+.02);}
  function noise(t,dur,vol,type,freq,dest,o){o=o||{};const s=ac.createBufferSource();s.buffer=nbuf;s.loop=true;const f=ac.createBiquadFilter();f.type=type;f.frequency.setValueAtTime(freq,t);if(o.to)f.frequency.exponentialRampToValueAtTime(o.to,t+dur);f.Q.value=o.q||.8;
    const g=ac.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+(o.a||.002));g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(g);g.connect(dest||sfxG);s.start(t,Math.random());s.stop(t+dur+.02);}
  const kick=(t,v)=>{tone('sine',150,t,.22,v,musicG,{to:42,hold:.1});noise(t,.02,v*.3,'highpass',2000,musicG);};
  const snare=(t,v)=>{noise(t,.17,v,'bandpass',1900,musicG,{q:.6});tone('triangle',210,t,.09,v*.6,musicG,{to:150});};
  const hat=(t,v,open)=>noise(t,open?.16:.045,v,'highpass',7500,musicG);
  /* --- menu: original synthwave, A minor: Am F C G --- */
  const CH=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]];
  const LEAD=[[[0,76,4],[4,81,2],[6,79,2],[8,76,4],[12,72,4]],[[0,77,6],[6,76,2],[8,72,4],[12,69,4]],[[0,79,4],[4,76,4],[8,79,2],[10,84,6]],[[0,83,6],[6,81,2],[8,79,8]]];
  function menuStep(s,t,d){const b=bar%4,c=CH[b],cyc=Math.floor(bar/4);
    if(s%4===0)kick(t,.75);if(s===4||s===12){snare(t,.42);noise(t,.3,.1,'bandpass',900,dly);}
    if(s%4===2)hat(t,.14,true);else if(s%2===1)hat(t,.05);
    if(s%2===0){const n=c[0]-24+((s%8===4)?12:0);tone('sawtooth',mtof(n),t,d*1.9,.26,musicG,{lp:520,lpTo:160,q:5});}
    const ar=[c[0],c[1],c[2],c[0]+12,c[2],c[1]],an=ar[s%6]+12;tone('square',mtof(an),t,d*.9,.055,dly,{lp:2600});
    if(s===0){for(const n of c){tone('sawtooth',mtof(n),t,d*16,.045,musicG,{a:.25,hold:.8,lp:900,det:-9});tone('sawtooth',mtof(n),t,d*16,.045,musicG,{a:.25,hold:.8,lp:900,det:9});}}
    if(cyc%2===1||cyc>=2){for(const[st,n,l]of LEAD[b])if(st===s){tone('sawtooth',mtof(n),t,d*l,.085,dly,{lp:2400,lpTo:900,hold:.6,a:.02});tone('square',mtof(n),t,d*l,.03,musicG,{det:7,hold:.6});}}}
  /* --- race: procedural drum & bass, tempo follows speed --- */
  const BASS=[40,40,43,38];
  function dnbStep(s,t,d){const b=bar%4,root=BASS[b];
    if(s===0||s===10)kick(t,.9);if(s===4||s===12)snare(t,.6);if((s===7||s===15)&&bar%2)snare(t,.2);
    hat(t,s%4===2?.12:(s%2?.035:.08),s===14);
    for(const[st,off,l]of[[0,0,5],[6,0,2],[8,12,1.5],[10,-2,3.5],[14,3,2]])if(st===s){const f=mtof(root+off-12);
      tone('sawtooth',f,t,d*l,.22,musicG,{lp:300+spdN*900,lpTo:140,q:7,det:-14,hold:.7});tone('sawtooth',f,t,d*l,.22,musicG,{lp:300+spdN*900,lpTo:140,q:7,det:14,hold:.7});tone('sine',f/2,t,d*l,.3,musicG,{hold:.8});}
    if(bar%8>=4&&(s===3||s===11))tone('square',mtof(root+24+(s===3?7:3)),t,d*2,.035,dly,{lp:3200});
    if(bar%4===3&&s>=12)noise(t,d,.09,'highpass',4000+s*400,musicG);}
  function sched(){if(!ac||ac.state!=='running')return;if(mode==='none'){nextT=ac.currentTime+.05;return;}
    if(nextT<ac.currentTime)nextT=ac.currentTime+.02;
    while(nextT<ac.currentTime+.14){const d=60/tempo/4;(mode==='menu'?menuStep:dnbStep)(step,nextT,d);nextT+=d;if(++step>=16){step=0;bar++;}}}
  const S={
    init,get ok(){return !!ac;},
    music(m){if(mode===m)return;mode=m;step=0;bar=0;tempo=m==='menu'?112:156;if(ac)nextT=ac.currentTime+.08;},
    toggle(){muted=!muted;store.set('mute',muted);if(ac)master.gain.setTargetAtTime(muted?0:CFG.vMaster,ac.currentTime,.05);return muted;},
    vol(){if(!ac)return;master.gain.value=muted?0:CFG.vMaster;musicG.gain.value=.7*CFG.vMusic;sfxG.gain.value=CFG.vSfx;},
    get muted(){return muted;},
    /* continuous voices driven by the focused kart */
    drive(on,spd,th,slide,off,boost){if(!ac)return;const t=ac.currentTime;if(!on){eng.g.gain.setTargetAtTime(0,t,.08);eng.scr.g.gain.setTargetAtTime(0,t,.05);eng.rum.g.gain.setTargetAtTime(0,t,.05);eng.wind.g.gain.setTargetAtTime(0,t,.1);return;}
      spdN=clamp(Math.abs(spd)/VMAX,0,1.4);const gs=spdN*4.2,gear=Math.min(4,Math.floor(gs)),rpm=clamp(.3+.7*(gs-gear)*(gear>=4?.6:1)+gear*.045+(boost?.2:0),.2,1.4);
      const f=48+rpm*118;eng.o1.frequency.setTargetAtTime(f,t,.04);eng.o2.frequency.setTargetAtTime(f*.5,t,.04);eng.f.frequency.setTargetAtTime(260+rpm*1500+th*900,t,.05);eng.g.gain.setTargetAtTime(.055+th*.075+(boost?.04:0),t,.06);
      eng.scr.g.gain.setTargetAtTime(clamp(slide,0,1)*.2,t,.05);eng.scr.f.frequency.setTargetAtTime(1500+spdN*900,t,.1);eng.rum.g.gain.setTargetAtTime(off?.5*clamp(spdN*2,0,1):0,t,.06);
      eng.wind.g.gain.setTargetAtTime(spdN*spdN*.07,t,.2);
      if(mode==='race')tempo+=((150+spdN*30)-tempo)*.03;},
    fx(n,v){if(!ac||ac.state!=='running')return;const t=ac.currentTime;v=v==null?1:v;
      if(n==='beep')tone('square',440,t,.16,.22*v,sfxG,{lp:2000});
      else if(n==='go'){tone('square',880,t,.5,.25*v,sfxG,{lp:3000,hold:.6});tone('sawtooth',1320,t,.5,.1*v,sfxG,{lp:3000});}
      else if(n==='pick'){[784,988,1175,1568].forEach((f,i)=>tone('sine',f,t+i*.06,.2,.2*v));}
      else if(n==='boost'||n==='mini'){const k=n==='mini'?.6:1;noise(t,.9*k,.4*v*k,'bandpass',500,sfxG,{to:4500,q:1.2,a:.03});tone('sawtooth',110,t,.8*k,.2*v*k,sfxG,{to:520,lp:1800,hold:.5});}
      else if(n==='fire'){noise(t,.5,.45*v,'bandpass',2600,sfxG,{to:500,q:1.5});tone('square',900,t,.3,.12*v,sfxG,{to:180});}
      else if(n==='drop'){tone('sine',320,t,.18,.25*v,sfxG,{to:110});}
      else if(n==='boom'){noise(t,.6,.7*v,'lowpass',1400,sfxG,{to:90});tone('sine',120,t,.45,.5*v,sfxG,{to:36});}
      else if(n==='spin'){tone('sawtooth',700,t,.9,.14*v,sfxG,{to:140,lp:2200});noise(t,.8,.2*v,'bandpass',2100,sfxG,{q:3});}
      else if(n==='hit'||n==='bump'||n==='land'){noise(t,.2,.55*v,'lowpass',n==='land'?500:900,sfxG,{to:120});tone('sine',n==='bump'?140:95,t,.2,.45*v,sfxG,{to:45});}
      else if(n==='lap'){[660,880].forEach((f,i)=>tone('triangle',f,t+i*.1,.22,.22*v));}
      else if(n==='fin'){[523,659,784,1047,1319].forEach((f,i)=>tone('square',f,t+i*.11,.3,.16*v,sfxG,{lp:2600}));}
      else if(n==='ui'){tone('sine',880,t,.06,.1);tone('sine',1320,t+.03,.08,.07);}
      else if(n==='hover')tone('sine',1500,t,.025,.03);
      else if(n==='intro'){noise(t,3.2,.3,'bandpass',200,sfxG,{to:3200,q:.8,a:1.6});tone('sawtooth',55,t,3.2,.16,sfxG,{to:220,lp:900,a:1.2,hold:.7});}}
  };return S;})();
const vib=p=>{try{if(CFG.vib&&navigator.vibrate)navigator.vibrate(p);}catch(e){}};

