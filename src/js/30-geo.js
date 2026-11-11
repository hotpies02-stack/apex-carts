/* ---------------- geometry helpers ---------------- */
function rbox(w,h,d,r){const b=Math.min(r*.6,d/2-.004),W=w-2*b,H=h-2*b,rr=Math.max(.002,Math.min(r,W/2-.001,H/2-.001)),s=new THREE.Shape();
  s.moveTo(-W/2+rr,-H/2);s.lineTo(W/2-rr,-H/2);s.quadraticCurveTo(W/2,-H/2,W/2,-H/2+rr);s.lineTo(W/2,H/2-rr);s.quadraticCurveTo(W/2,H/2,W/2-rr,H/2);
  s.lineTo(-W/2+rr,H/2);s.quadraticCurveTo(-W/2,H/2,-W/2,H/2-rr);s.lineTo(-W/2,-H/2+rr);s.quadraticCurveTo(-W/2,-H/2,-W/2+rr,-H/2);
  const g=new THREE.ExtrudeGeometry(s,{depth:d-2*b,bevelEnabled:true,bevelSize:b,bevelThickness:b,bevelSegments:3,curveSegments:5});g.translate(0,0,-(d-2*b)/2);return g;}
/* smooth lofted shell from super-ellipse cross sections [z,w,h,y,x] (z ascending) */
function loft(secs,n,M){M=M||20;n=n||2.6;const pos=[],uv=[],idx=[],S=secs.length,W=M+1,z0=secs[0][0],z1=secs[S-1][0];
  for(const s of secs)for(let j=0;j<=M;j++){const a=j/M*TAU,c=Math.cos(a),si=Math.sin(a);
    pos.push((s[4]||0)+s[1]/2*Math.sign(c)*Math.pow(Math.abs(c),2/n),s[3]+s[2]/2*Math.sign(si)*Math.pow(Math.abs(si),2/n),s[0]);uv.push(j/M,(s[0]-z0)/(z1-z0));}
  for(let i=0;i<S-1;i++)for(let j=0;j<M;j++){const a=i*W+j,b=a+1,c=a+W,d=c+1;idx.push(a,b,c,b,d,c);}
  const c0=pos.length/3;pos.push(secs[0][4]||0,secs[0][3],z0,secs[S-1][4]||0,secs[S-1][3],z1);uv.push(.5,0,.5,1);
  for(let j=0;j<M;j++){idx.push(c0,j+1,j,c0+1,(S-1)*W+j,(S-1)*W+j+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  const nr=g.attributes.normal;for(let i=0;i<S;i++){const a=i*W,b=a+M,x=nr.getX(a)+nr.getX(b),y=nr.getY(a)+nr.getY(b),z=nr.getZ(a)+nr.getZ(b),l=Math.hypot(x,y,z)||1;nr.setXYZ(a,x/l,y/l,z/l);nr.setXYZ(b,x/l,y/l,z/l);}
  return g;}
/* merge several geometries into one with baked vertex colours (cf(color,x,y,z)) */
function mergeGeo(parts){const P=[],Nn=[],C=[],c=new THREE.Color();
  for(const[g0,m,cf]of parts){if(m)g0.applyMatrix4(m);const g=g0.index?g0.toNonIndexed():g0,p=g.attributes.position,n=g.attributes.normal;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);P.push(x,y,z);Nn.push(n.getX(i),n.getY(i),n.getZ(i));cf(c,x,y,z);c.convertSRGBToLinear();C.push(c.r,c.g,c.b);}
    g0.dispose();if(g!==g0)g.dispose();}
  const o=new THREE.BufferGeometry();o.setAttribute('position',new THREE.Float32BufferAttribute(P,3));o.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));o.setAttribute('color',new THREE.Float32BufferAttribute(C,3));return o;}
/* smooth organic boulder */
function rockGeo(seed,detail,cf){const g=new THREE.IcosahedronGeometry(1,detail),p=g.attributes.position,n=g.attributes.normal,C=new Float32Array(p.count*3),c=new THREE.Color();
  for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const l=Math.hypot(x,y,z);x/=l;y/=l;z/=l;
    const d=.72+.5*vnoise(x*1.6+seed,y*1.6+z*1.3+seed*.7)+.16*vnoise(x*4.3+seed*2,z*4.3+y*3.1);p.setXYZ(i,x*d,y*d*.8,z*d);n.setXYZ(i,x,y*1.25,z);
    cf(c,x,y,z,d);c.convertSRGBToLinear();C[i*3]=c.r;C[i*3+1]=c.g;C[i*3+2]=c.b;}
  n.needsUpdate=true;g.normalizeNormals();g.setAttribute('color',new THREE.BufferAttribute(C,3));return g;}
/* tileable procedural detail textures */
function noiseField(n,seed,oct){const R=rng(seed),h=new Float32Array(n*n);
  for(const[cells,amp]of oct){const gr=new Float32Array(cells*cells);for(let i=0;i<gr.length;i++)gr[i]=R();
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){const fx=x/n*cells,fy=y/n*cells,x0=fx|0,y0=fy|0,u=smooth(fx-x0),v=smooth(fy-y0),x1=(x0+1)%cells,y1=(y0+1)%cells;
      h[y*n+x]+=amp*lerp(lerp(gr[y0*cells+x0],gr[y0*cells+x1],u),lerp(gr[y1*cells+x0],gr[y1*cells+x1],u),v);}}return h;}
function dataTex(d,w,h){const t=new THREE.DataTexture(d,w,h,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;
  t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());t.needsUpdate=true;return t;}
function normalFromHeight(h,w,ht,str){const d=new Uint8Array(w*ht*4);for(let y=0;y<ht;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,dx=(h[y*w+(x+1)%w]-h[y*w+(x+w-1)%w])*str,dy=(h[((y+1)%ht)*w+x]-h[((y+ht-1)%ht)*w+x])*str,l=1/Math.hypot(dx,dy,1);
    d[i]=(-dx*l*.5+.5)*255;d[i+1]=(-dy*l*.5+.5)*255;d[i+2]=(l*.5+.5)*255;d[i+3]=255;}return dataTex(d,w,ht);}
function grainTex(h,n,lo){const d=new Uint8Array(n*n*4);for(let i=0;i<n*n;i++){const v=(lo+(1-lo)*clamp(h[i],0,1))*255;d[i*4]=d[i*4+1]=d[i*4+2]=v;d[i*4+3]=255;}return dataTex(d,n,n);}
function canvasNormal(tex,str){const c=tex.image,w=c.width,ht=c.height,im=c.getContext('2d').getImageData(0,0,w,ht).data,h=new Float32Array(w*ht);for(let i=0;i<w*ht;i++)h[i]=(im[i*4]*.3+im[i*4+1]*.6+im[i*4+2]*.1)/255;return normalFromHeight(h,w,ht,str);}

