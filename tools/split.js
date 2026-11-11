// one-off: split the v6 single file into src/ parts
const fs=require('fs');const L=fs.readFileSync('index.html','utf8').split('\n');
const seg=(a,b)=>L.slice(a-1,b).join('\n')+'\n';
const styleStart=L.findIndex(l=>l.trim()==='<style>')+1,styleEnd=L.findIndex(l=>l.trim()==='</style>')+1;
fs.writeFileSync('src/style.css',seg(styleStart+1,styleEnd-1));
const libLine=L.findIndex(l=>l.includes('three.min.js"></script>'))+1;
const scriptStart=L.findIndex((l,i)=>i>libLine&&l.trim()==='<script>')+1;
fs.writeFileSync('src/head.html',seg(1,styleStart-1));
fs.writeFileSync('src/body.html',seg(styleEnd+1,libLine-1));
const parts=[['00-core',340,407],['10-art',408,462],['20-tracks',463,779],['30-geo',780,818],['40-kart-model',819,918],['50-sim',919,1119],['60-audio',1120,1198],['65-input',1199,1234],['70-camera-fx',1235,1321],['75-probe-post',1322,1478],['80-flow-hud',1479,1546],['85-net',1547,1623],['90-menus',1624,1767],['95-main',1768,1824]];
for(const [n,a,b] of parts)fs.writeFileSync('src/js/'+n+'.js',seg(a,b));
console.log(styleStart,styleEnd,libLine,scriptStart);console.log(L[338],'|',L[339],'|',L[1823].slice(0,60),'|',L[1824].slice(0,60),'|',L[1828]);
