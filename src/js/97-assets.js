/* ---------------- asset pipeline (outside boot): glTF models, textures, HDRIs, audio ----------------
   Every area registers what it needs in its own src/js/96-preload-<area>.js file:
     PRELOAD.push({type:'glb',name:'kart_a',url:'assets/karts/a.glb'});
     types: glb | tex (sRGB colour texture) | lin (linear data texture: normal/roughness) | hdr (equirect .hdr) | audio (decoded later by Snd) | json
   Everything is fetched before boot() with a progress bar. A failed asset is only a console warning:
   game code MUST fall back (Assets.has(name) / Assets.model(name) returning null) so the game still runs. */
const Assets=(function(){
  const store={glb:{},tex:{},lin:{},hdr:{},audio:{},json:{}};
  function one(e){return new Promise(res=>{const done=v=>{if(v!=null)store[e.type][e.name]=v;res();},bad=err=>{console.warn('asset failed: '+e.url);res();};
    try{
      if(e.type==='glb'){new THREE.GLTFLoader().load(e.url,g=>done(g),undefined,bad);}
      else if(e.type==='tex'||e.type==='lin'){new THREE.TextureLoader().load(e.url,t=>{t.encoding=e.type==='tex'?THREE.sRGBEncoding:THREE.LinearEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;if(e.flipY===false)t.flipY=false;done(t);},undefined,bad);}
      else if(e.type==='hdr'){new THREE.RGBELoader().setDataType(THREE.HalfFloatType).load(e.url,t=>{t.mapping=THREE.EquirectangularReflectionMapping;done(t);},undefined,bad);}
      else if(e.type==='audio'){fetch(e.url).then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(done,bad);}
      else if(e.type==='json'){fetch(e.url).then(r=>r.ok?r.json():Promise.reject()).then(done,bad);}
      else res();
    }catch(err){bad(err);}});}
  return {store,
    preload(list,onProg){let n=0;const tot=list.length||1;return Promise.all(list.map(e=>one(e).then(()=>{n++;if(onProg)onProg(n/tot);})));},
    has(name,type){return !!store[type||'glb'][name];},
    gltf(name){return store.glb[name]||null;},
    /* fresh clone of a model's scene (geometries and materials are shared - clone a material before tinting it) */
    model(name){const g=store.glb[name];if(!g)return null;return (THREE.SkeletonUtils&&g.scene.getObjectByProperty('type','SkinnedMesh'))?THREE.SkeletonUtils.clone(g.scene):g.scene.clone(true);},
    tex(name){return store.tex[name]||store.lin[name]||null;},
    hdr(name){return store.hdr[name]||null;},
    audio(name){return store.audio[name]||null;},
    json(name){return store.json[name]||null;}};
})();
