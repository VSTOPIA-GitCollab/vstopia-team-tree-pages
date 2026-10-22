import * as THREE from './vendor/three.module.js';
// Deterministic, seamless height fields. Albedo is sRGB; normals, AO and
// roughness are linear data. Generated once, shared by the entire grove.
const fract=x=>x-Math.floor(x),mix=(a,b,t)=>a+(b-a)*t;
const hash=(x,y)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453);
function noise(u,v,nx,ny){
 const x=fract(u)*nx,y=fract(v)*ny,ix=Math.floor(x),iy=Math.floor(y);
 let a=fract(x),b=fract(y);a=a*a*(3-2*a);b=b*b*(3-2*b);
 const h=(i,j)=>hash((i+nx)%nx,(j+ny)%ny);
 return mix(mix(h(ix,iy),h(ix+1,iy),a),mix(h(ix,iy+1),h(ix+1,iy+1),a),b);
}
export function barkHeight(u,v){
 const warp=(noise(u,v,8,4)-.5)*.075;
 const grain=noise(u+warp,v,48,8),plates=noise(u+warp,v,22,14);
 const fissure=Math.pow(1-Math.abs(grain*2-1),14);
 return THREE.MathUtils.clamp(.28+plates*.36+grain*.18-fissure*.31+noise(u,v,128,64)*.07,0,1);
}
function leafHeight(u,v){
 const mid=Math.exp(-Math.pow((u-.5)*55,2));
 const vein=Math.exp(-Math.pow(Math.sin((v-Math.abs(u-.5)*.62)*Math.PI*11)*14,2));
 return .30+mid*.30+vein*.10+noise(u,v,48,96)*.035;
}
export function createSurfaceMaps(kind,small=false){
 const bark=kind==='bark',w=bark?(small?256:512):128,h=bark?w*2:256;
 const height=bark?barkHeight:leafHeight,field=new Float32Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)field[y*w+x]=height(x/w,y/h);
 const color=new Uint8Array(w*h*4),normal=new Uint8Array(w*h*4),orm=new Uint8Array(w*h*4);
 const at=(x,y)=>field[((y+h)%h)*w+(x+w)%w];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,q=at(x,y),u=x/w,v=y/h;
  const dx=(at(x+1,y)-at(x-1,y))*(bark?6:3),dy=(at(x,y+1)-at(x,y-1))*(bark?6:3);
  const len=Math.hypot(dx,dy,1);
  normal.set([Math.round((-dx/len*.5+.5)*255),Math.round((-dy/len*.5+.5)*255),Math.round((1/len*.5+.5)*255),255],i);
  const pocket=bark?THREE.MathUtils.smoothstep(q,.12,.53):.80+.20*THREE.MathUtils.smoothstep(q,.3,.6);
  // Cavity AO affects indirect illumination, never paints a fake cast shadow.
  orm.set([Math.round((bark?.48+.52*pocket:pocket)*255),Math.round((bark?.86+.12*(1-pocket):.52+.22*noise(u,v,12,20))*255),0,255],i);
  if(bark){const tone=72+q*88+noise(u,v,9,7)*10;color.set([tone*1.03,tone*.91,tone*.76,255],i);}
  else {const vein=THREE.MathUtils.smoothstep(q,.37,.61),fleck=noise(u,v,24,48);color.set([52+vein*25+fleck*15,94+vein*34+fleck*23,27+vein*12+fleck*8,255],i);}
 }
 function texture(data,srgb=false){const t=new THREE.DataTexture(data,w,h,THREE.RGBAFormat);t.colorSpace=srgb?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=bark?THREE.RepeatWrapping:THREE.ClampToEdgeWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=4;t.needsUpdate=true;return t;}
 return {map:texture(color,true),normalMap:texture(normal),aoMap:texture(orm),roughnessMap:null};
}
// Real vertex relief is baked BEFORE bark anchors are chosen. The depth pass
// and reflection therefore see exactly the same displaced geometry and wind.
export function displaceBarkGeometry(g){
 const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,r=g.attributes.woodRadius;
 if(!r)return g;
 for(let i=0;i<p.count;i++){
  const amount=(barkHeight(uv.getX(i),uv.getY(i))-.44)*Math.min(.09,r.getX(i)*.14);
  p.setXYZ(i,p.getX(i)+n.getX(i)*amount,p.getY(i)+n.getY(i)*amount,p.getZ(i)+n.getZ(i)*amount);
 }
 p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;
}
// Approximate canopy ambient visibility from local crown height. Only indirect
// light is occluded; the sun still uses genuine animated shadow maps.
export function canopyOcclusion(leaves){
 const tops=new Map(),key=p=>`${Math.floor(p.x/1.5)},${Math.floor(p.z/1.5)}`;
 for(const {p} of leaves)tops.set(key(p),Math.max(tops.get(key(p))??-Infinity,p.y));
 return new Float32Array(leaves.map(({p})=>.46+.54*Math.exp(-Math.max(0,tops.get(key(p))-p.y)*.72)));
}
