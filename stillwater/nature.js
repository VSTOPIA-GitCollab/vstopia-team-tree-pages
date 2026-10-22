import * as THREE from './vendor/three.module.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const lerp=(a,b,t)=>a+(b-a)*t;
function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}

// Parallel-transport cross sections keep the bark and silhouette continuous
// through twisted limbs. Winding is outward, including branch caps.
class WoodBuilder {
 constructor(){this.positions=[];this.normals=[];this.uvs=[];this.indices=[];}
 tube(points,radii,sides=12,relief=.06){
  const base=this.positions.length/3;
  const tangent=points[1].clone().sub(points[0]).normalize();
  let right=V(0,0,1).cross(tangent).normalize();
  if(right.lengthSq()<.01)right=V(1,0,0);
  let length=0;
  for(let j=0;j<points.length;j++){
   const t=points[Math.min(j+1,points.length-1)].clone().sub(points[Math.max(0,j-1)]).normalize();
   right.addScaledVector(t,-right.dot(t)).normalize();
   const up=t.clone().cross(right).normalize();
   if(j)length+=points[j].distanceTo(points[j-1]);
   for(let k=0;k<=sides;k++){
    const a=k/sides*Math.PI*2;
    const n=right.clone().multiplyScalar(Math.cos(a)).addScaledVector(up,Math.sin(a));
    const r=radii[j]*(1+relief*Math.sin(a*7+length*.55)+relief*.4*Math.sin(a*13-length*.4));
    const p=points[j].clone().addScaledVector(n,r);
    this.positions.push(p.x,p.y,p.z);this.normals.push(n.x,n.y,n.z);this.uvs.push(k/sides*3,length*.42);
    if(j<points.length-1 && k<sides){const a0=base+j*(sides+1)+k,b=a0+sides+1;this.indices.push(a0,a0+1,b,b,a0+1,b+1);}
   }
  }
  // Closed ends remove the hollow-pipe appearance at small exposed tips.
  for(const [j,flip] of [[0,true],[points.length-1,false]]){
   const center=this.positions.length/3,p=points[j],t=points[flip?1:j].clone().sub(points[flip?0:j-1]).normalize().multiplyScalar(flip?-1:1);
   this.positions.push(p.x,p.y,p.z);this.normals.push(t.x,t.y,t.z);this.uvs.push(.5,.5);
   for(let k=0;k<sides;k++){const a=base+j*(sides+1)+k;this.indices.push(center,flip?a+1:a,flip?a:a+1);}
  }
 }
 curve(knots,r0,r1,sides=12,segments=30,relief=.06){
  const points=new THREE.CatmullRomCurve3(knots,false,'centripetal').getPoints(segments);
  const radii=points.map((_,i)=>lerp(r0,r1,Math.pow(i/segments,.8)));
  this.tube(points,radii,sides,relief);return points;
 }
 geometry(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.normals,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(this.uvs,2));g.setIndex(this.indices);g.computeBoundingBox();g.computeBoundingSphere();return g;}
}

export function createMysticTree(seed=49213){
 const rnd=random(seed),r=(a,b)=>lerp(a,b,rnd());
 const wood=new WoodBuilder(),leaves=[];
 const center=new THREE.CatmullRomCurve3([
  V(0,0,0),V(.65,1.5,.15),V(1.1,3.0,.25),V(.15,4.7,-.1),V(-1.25,6.0,.18),V(-.65,7.5,.2),V(.2,9,-.3)
 ],false,'centripetal');
 const core=center.getPoints(65);
 wood.tube(core,core.map((_,i)=>lerp(1.18,.42,i/65)*(1+.09*Math.sin(i*.28))),28,.11);
 // Buttress roots lie along the bank, then wind into the trunk as broad flutes.
 for(let i=0;i<11;i++){
  const a=i*2.399,radius=r(3.2,5.3);
  const root=[V(Math.cos(a)*radius,-.1,Math.sin(a)*radius),V(Math.cos(a+.12)*radius*.7,.13,Math.sin(a+.12)*radius*.7),V(Math.cos(a+.3)*1.6,.43,Math.sin(a+.3)*1.6),V(.45+Math.cos(a+.5)*.77,1.9,Math.sin(a+.5)*.77),V(.8+Math.cos(a+.85)*.55,3.3,.2+Math.sin(a+.85)*.55)];
  wood.curve(root,.055,r(.26,.39),13,35,.10);
  const tip=root[0],split=tip.clone().add(V(Math.cos(a+.75)*1.25,-.07,Math.sin(a+.75)*1.25));
  wood.curve([split,tip.clone().lerp(root[1],.25),root[1]],.016,.11,7,14,.06);
 }
 // Fused spiral grain follows the S-shaped trunk and gives it an ancient form.
 for(let i=0;i<7;i++){
  const pts=[],radii=[];
  for(let j=0;j<=55;j++){
   const t=j/55,c=center.getPoint(t),a=i/7*Math.PI*2+t*4.0,rad=lerp(1.0,.35,t);
   pts.push(c.add(V(Math.cos(a)*rad,0,Math.sin(a)*rad)));radii.push(lerp(.24,.07,t)*(1+.18*Math.sin(t*12+i)));
  }wood.tube(pts,radii,11,.09);
 }
 function shoot(start,direction,length,radius,depth,phase){
  const side=V(-direction.z,0,direction.x).normalize(),knots=[start.clone()];
  for(let j=1;j<=5;j++){
   const t=j/5;
   const p=start.clone().addScaledVector(direction,length*t);
   p.addScaledVector(side,Math.sin(t*Math.PI*1.6+phase)*Math.sin(t*Math.PI)*length*.16);
   p.y+=Math.sin(t*Math.PI)*length*.13+length*.14*t*t;
   knots.push(p);
  }
  const points=wood.curve(knots,radius,Math.max(.008,radius*.40),depth>2?16:depth>0?9:6,depth>1?24:12,.075);
  const end=points.at(-1),endDir=end.clone().sub(points.at(-3)).normalize();
  if(depth===0){
   // Paired leaves emerge from real fine twigs, not free-floating clumps.
   for(let spray=0;spray<7;spray++){
    const t=.16+spray*.125,root=points[Math.floor(t*(points.length-1))];
    const az=phase+spray*2.399,dir=V(Math.cos(az)*.7,r(.12,.5),Math.sin(az)*.7).addScaledVector(endDir,.38).normalize();
    const tip=root.clone().addScaledVector(dir,r(.8,1.35));
    const mid=root.clone().lerp(tip,.5).add(V(0,.10,0));
    const twig=wood.curve([root,mid,tip],.010,.003,4,5,.025);
    const lateral=V(-dir.z,0,dir.x).normalize();
    for(let node=1;node<=9;node++){
     const nt=node/10,stem=twig[Math.min(4,Math.floor(nt*5))].clone().lerp(tip,nt*.25);
     for(const sign of [-1,1]){
      const direction=dir.clone().multiplyScalar(.40).addScaledVector(lateral,sign*.8).add(V(0,r(-.15,.38),0)).normalize();
      const p=stem.clone().addScaledVector(lateral,sign*.035);
      leaves.push({p,scale:r(.22,.34),direction,roll:r(-.6,.6),shade:rnd()});
     }
    }
    leaves.push({p:tip,scale:r(.17,.25),direction:dir.clone(),roll:r(-1,1),shade:rnd()});
   }
   return;
  }
  const count=depth>2?3:3;
  for(let i=0;i<count;i++){
   const angle=phase+i*2.399+r(-.30,.30);
   const lateral=V(Math.cos(angle),r(.12,.60),Math.sin(angle));
   const next=endDir.clone().multiplyScalar(depth>1?.85:.65).addScaledVector(lateral,.62).normalize();
   const origin=points[Math.floor((i===0?1:r(.72,.92))*(points.length-1))];
   shoot(origin,next,length*r(.53,.68),radius*.48,depth-1,angle+.7);
  }
 }
 // Deliberately asymmetric sculptural limbs: low left arm, upright right fork,
 // and a high crown. Open space below the canopy exposes the twisting wood.
 const limbs=[
  {knots:[V(.35,4.25,0),V(-2.1,5.0,.1),V(-4.2,5.8,.5),V(-6.4,7.3,.4),V(-7.8,9.4,.7)],r:.72},
  {knots:[V(-.6,5.4,.1),V(1.9,6.1,.25),V(4.3,7.6,.5),V(4.0,9.5,.2),V(6.0,11.5,.15)],r:.74},
  {knots:[V(-.65,6.8,.2),V(-2.0,8.3,-.6),V(-1.2,10.5,-1.2),V(-2.6,12.2,-1.4)],r:.57},
  {knots:[V(.1,8.7,-.3),V(1.1,10.8,.3),V(.2,12.6,.0),V(1.4,13.7,-.4)],r:.46},
  {knots:[V(.5,4.5,.4),V(1.6,5.7,2.3),V(3.2,7.6,4.5),V(4.1,10.0,5.4)],r:.52},
  {knots:[V(-.8,6.1,.1),V(-1.9,7.2,-2.5),V(-4.3,9,-4.0),V(-5.6,11.2,-4.8)],r:.53},
  {knots:[V(-.6,7.5,.1),V(-2.8,8.2,2.3),V(-4.3,9.4,4.5),V(-5.2,11.4,5.2)],r:.43},
  {knots:[V(.5,8.9,-.3),V(2.4,9.6,-2.2),V(4.2,10.5,-4.1),V(5.2,12.0,-4.8)],r:.41}
 ];
 limbs.forEach((limb,i)=>{
  const p=wood.curve(limb.knots,limb.r,.19,18,45,.10),end=p.at(-1);
  const dir=end.clone().sub(p.at(-6)).normalize();dir.y*=.55;dir.normalize();
  shoot(end,dir,r(2.6,3.5),.19,3,i*2.399);
  // Smaller branches fill the crown shoulders while preserving the large forks.
  for(let j=0;j<4;j++){
   const origin=p[Math.floor((.54+j*.105)*(p.length-1))];
   const a=i*2.399+j*1.9;
   shoot(origin,V(Math.cos(a)*.7,.68,Math.sin(a)*.7).normalize(),r(2.2,3.1),.13,2,a);
  }
 });
 return {geometry:wood.geometry(),leaves};
}

// A low, distant mountain system, with domain-warped ridged fractals and
// overlapping slopes. Distances of 650–1,650 metres keep it behind the grove.
export function createDistantMountains(){
 const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453123;return n-Math.floor(n);};
 const noise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y);let u=x-ix,v=y-iy;u=u*u*(3-2*u);v=v*v*(3-2*v);return lerp(lerp(hash(ix,iy),hash(ix+1,iy),u),lerp(hash(ix,iy+1),hash(ix+1,iy+1),u),v);};
 function ridged(x,y){let a=.55,sum=0,weight=1;for(let i=0;i<6;i++){let s=1-Math.abs(2*noise(x,y)-1);s=s*s*weight;sum+=s*a;weight=Math.min(1,s*1.8);x=x*2.09+17;y=y*2.09+9;a*=.48;}return sum;}
 const group=new THREE.Group();group.name='Distant mountain horizon';
 for(let layer=0;layer<3;layer++){
  const g=new THREE.PlaneGeometry(2800,570,400,100);g.rotateX(-Math.PI/2);
  const p=g.attributes.position,colors=[],c=new THREE.Color();
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),z0=p.getZ(i),z=z0-940-layer*360;
   const warp=noise(x*.003+layer*11,z*.003)*100;
   const n=ridged((x+warp)*.006+layer*27,z*.006);
   const envelope=Math.pow(Math.max(0,Math.sin((z0+285)/570*Math.PI)),1.1);
   const broad=.65+noise(x*.002+layer*8,layer+4)*.50;
   const y=-6+envelope*(47+n*125)*broad;
   p.setXYZ(i,x,y,z);
   c.set('#596c73').lerp(new THREE.Color('#a5b9bd'),layer*.20);
   c.multiplyScalar((.8+n*.30)*.88);colors.push(c.r,c.g,c.b);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();
  // Per-object aerial perspective preserves a faint horizon without covering
  // the nearby tree in the much heavier fog needed at mountain distance.
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,fog:false,envMapIntensity:.25});
  material.onBeforeCompile=shader=>{
   shader.vertexShader='varying float mountainDistance;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n mountainDistance=length(mvPosition.xyz);');
   shader.fragmentShader='varying float mountainDistance;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`float haze=clamp(1.-exp(-mountainDistance*.00036),.0,.27);outgoingLight=mix(outgoingLight,vec3(.22,.295,.33),haze)*.50;\n#include <opaque_fragment>`);
  };
  const mesh=new THREE.Mesh(g,material);mesh.name=`Horizon ridge ${layer+1}`;group.add(mesh);
 }
 return group;
}
