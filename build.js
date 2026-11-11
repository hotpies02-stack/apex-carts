// Apex Carts build: concatenates src/ into docs/ (served by Firebase Hosting and GitHub Pages).
// Usage: node build.js            (version comes from package.json "version")
const fs=require('fs'),path=require('path');
const V=require('./package.json').version,OUT='docs';
const rd=f=>fs.readFileSync(f,'utf8');
function cpDir(a,b){if(!fs.existsSync(a))return;fs.mkdirSync(b,{recursive:true});for(const e of fs.readdirSync(a,{withFileTypes:true})){const s=path.join(a,e.name),d=path.join(b,e.name);if(e.isDirectory())cpDir(s,d);else{if(!fs.existsSync(d)||fs.statSync(d).mtimeMs<fs.statSync(s).mtimeMs||fs.statSync(d).size!==fs.statSync(s).size)fs.copyFileSync(s,d);}}}
fs.mkdirSync(OUT,{recursive:true});
const parts=fs.readdirSync('src/js').filter(f=>f.endsWith('.js')).sort();
const js="'use strict';\nconst APEX_VERSION='"+V+"';\nconst PRELOAD=[];\n"+parts.map(f=>'/* ==== '+f+' ==== */\n'+rd('src/js/'+f)).join('\n');
fs.writeFileSync(OUT+'/game.js',js);
fs.writeFileSync(OUT+'/style.css',rd('src/style.css'));
const libs=['three.min.js','GLTFLoader.js','RGBELoader.js','SkeletonUtils.js','BufferGeometryUtils.js'];
const html=rd('src/head.html')+'<link rel="stylesheet" href="style.css?v='+V+'">\n'+rd('src/body.html')
  +libs.map(l=>'<script src="lib/'+l+'"></script>\n').join('')+'<script src="game.js?v='+V+'"></script>\n</body>\n</html>\n';
fs.writeFileSync(OUT+'/index.html',html);
cpDir('src/lib',OUT+'/lib');cpDir('src/static',OUT);cpDir('assets',OUT+'/assets');
// asset manifest for the service worker (precache list)
const list=[];(function walk(d,rel){if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.isDirectory())walk(path.join(d,e.name),rel+e.name+'/');else list.push(rel+e.name);}})(OUT+'/assets','assets/');
fs.writeFileSync(OUT+'/sw.js',rd('src/sw.js').replace('__VERSION__',V).replace('__LIBS__',JSON.stringify(libs.map(l=>'lib/'+l).concat(['lib/peerjs.min.js']))));
fs.writeFileSync(OUT+'/.nojekyll','');
console.log('built v'+V+': game.js '+(js.length/1024|0)+' KB, '+parts.length+' parts, '+list.length+' asset files');
