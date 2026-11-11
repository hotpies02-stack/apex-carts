/* loader: start once Three.js is present (with a fallback CDN) */
(function(){const fail=()=>{const d=document.createElement('div');d.id='fatal';d.innerHTML='<div><h2>Could not load the 3D engine</h2><p class="note">Connect to the internet once (or use the offline copy) and reload.</p></div>';document.body.appendChild(d);};
  const go=()=>{try{boot();}catch(e){console.error(e);const d=document.createElement('div');d.id='fatal';d.textContent='Startup error: '+e.message;document.body.appendChild(d);}};
  if(window.THREE)go();else{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';s.onload=go;s.onerror=fail;document.head.appendChild(s);}})();
