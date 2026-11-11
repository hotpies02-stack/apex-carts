function mk(p,peer){return {peer,open:false,h:{},on(n,f){(this.h[n]=this.h[n]||[]).push(f)},emit(n,a){(this.h[n]||[]).forEach(f=>f(a))},send(d){p.bc.postMessage({to:peer,from:p.id,k:'data',d:JSON.parse(JSON.stringify(d))})},close(){if(this.open){this.open=false;p.bc.postMessage({to:peer,from:p.id,k:'close'});this.emit('close');}}}}
window.Peer=class{constructor(id){if(typeof id!=='string')id='c'+Math.random().toString(36).slice(2);this.id=id;this.h={};this.bc=new BroadcastChannel('fakepeer');this.conns={};
 this.bc.onmessage=e=>{const m=e.data;if(m.to!==this.id)return;
  if(m.k==='connect'){const c=mk(this,m.from);this.conns[m.from]=c;c.open=true;this.emit('connection',c);this.bc.postMessage({to:m.from,from:this.id,k:'accept'});setTimeout(()=>c.emit('open'),0);}
  else if(m.k==='accept'){const c=this.conns[m.from];c.open=true;c.emit('open');}
  else if(m.k==='data'){const c=this.conns[m.from];c&&c.emit('data',m.d);}
  else if(m.k==='close'){const c=this.conns[m.from];if(c&&c.open){c.open=false;c.emit('close');}}};
 setTimeout(()=>this.emit('open',id),50);}
 on(n,f){(this.h[n]=this.h[n]||[]).push(f)} emit(n,a){(this.h[n]||[]).forEach(f=>f(a))}
 connect(to){const c=mk(this,to);this.conns[to]=c;this.bc.postMessage({to,from:this.id,k:'connect'});return c;}
 destroy(){for(const k in this.conns)this.conns[k].close();this.destroyed=true;} reconnect(){}};
