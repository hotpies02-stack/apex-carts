/* loader: fetch assets (with progress), then start */
(function(){const fail=()=>{const d=document.createElement('div');d.id='fatal';d.innerHTML='<div><h2>Could not load the 3D engine</h2><p class="note">Connect to the internet once and reload.</p></div>';document.body.appendChild(d);};
  const go=()=>{const bar=document.querySelector('#loadBar i'),tip=document.getElementById('loadTip');if(tip&&PRELOAD.length)tip.textContent='Loading assets…';
    const start=()=>{try{boot();}catch(e){console.error(e);const d=document.createElement('div');d.id='fatal';d.textContent='Startup error: '+e.message;document.body.appendChild(d);}};
    Assets.preload(PRELOAD,f=>{if(bar&&bar.dataset)bar.style.setProperty('--p',f);}).then(start,start);};
  if(window.THREE)go();else fail();})();
