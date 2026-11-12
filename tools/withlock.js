// Runs a command while holding the machine-wide browser lock, so only ONE headless browser
// (tests or screenshots) runs at a time across every worktree. The laptop has 8 GB RAM.
// Usage: node tools/withlock.js node tools/shot.js 2 out.png --t=16
//        node tools/withlock.js node run.js --fast        (from tests/)
const fs=require('fs'),cp=require('child_process');
const LOCK='C:\\Apex-Carts\\.claude\\browser.lock',STALE=25*60*1000;
function tryLock(){
  try{fs.mkdirSync(LOCK);fs.writeFileSync(LOCK+'\\owner.txt',process.pid+' '+process.cwd()+' '+new Date().toISOString());return true;}
  catch(e){
    try{const age=Date.now()-fs.statSync(LOCK).mtimeMs;if(age>STALE){fs.rmSync(LOCK,{recursive:true,force:true});}}catch(_){}
    return false;
  }
}
function release(){try{fs.rmSync(LOCK,{recursive:true,force:true});}catch(_){}}
(async()=>{
  const t0=Date.now();let said=false;
  while(!tryLock()){
    if(!said){console.error('[withlock] waiting for the browser lock...');said=true;}
    await new Promise(r=>setTimeout(r,5000));
  }
  if(said)console.error('[withlock] got the lock after '+((Date.now()-t0)/1000|0)+' s');
  const a=process.argv.slice(2);
  process.on('SIGINT',()=>{release();process.exit(130);});
  process.on('SIGTERM',()=>{release();process.exit(143);});
  const r=cp.spawnSync(a[0],a.slice(1),{stdio:'inherit',shell:false});
  release();
  process.exit(r.status==null?1:r.status);
})();
