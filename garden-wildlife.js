/* VSTOPIA animated ecosystem: hand-adapted boid trajectories from the
 * historic three.js / jtrdev bird flocking example (legacy Geometry removed).
 * Lightweight THREE instancing. Waterfall uses Three native GPU wave surface
 * and reusable point-sprite spray emitter, compatible with pinned Three r167.
 * https://codepen.io/jtrdev/pen/yLVJogz
 * https://github.com/NewKrok/three-particles — particle design reference;
 * latest npm version requires Three >= r182 and can't be imported into r167.
 */
import * as THREE from 'three';
import {terrainElevation} from './water-environment.js';

const random=n=>{const f=Math.sin(n*75.127+3.981)*23452.216;return f-Math.floor(f)};
const birdCount=30;
const flowerCount=1150;

function addBirds(scene,stage){
 // Silhouette geometry in horizontal XY: wings are thin and slightly swept.
 // All birds draw in one InstancedMesh; wingbeat deforms in vertex shader.
 const positions=new Float32Array([
  -2.9,.04,.25, -.22,.10,.08, -.22,-.08,-.72,
   .22,.10,.08, 2.9,.04,.25, .22,-.08,-.72,
  -.20,-.10,-.64,0,.06,1.35,.20,-.10,-.64
 ]);
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 geometry.computeVertexNormals();
 geometry.setAttribute('aBirdPhase',new THREE.InstancedBufferAttribute(new Float32Array(Array.from({length:birdCount},(_,i)=>i*.77+random(i*2)*3.2)),1));
 const material=new THREE.MeshBasicMaterial({color:0x233c42,side:THREE.DoubleSide,transparent:true,opacity:.90,depthWrite:false});
 const wingTime={value:0};
 material.onBeforeCompile=shader=>{
  shader.uniforms.uWingTime=wingTime;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float aBirdPhase;\nuniform float uWingTime;');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
   '#include <begin_vertex>\ntransformed.y += abs(position.x)*.16*sin(uWingTime*9.1 + aBirdPhase);');
 };
 material.customProgramCacheKey=()=> 'vstopia-flock-wing-r167';
 const birds=new THREE.InstancedMesh(geometry,material,birdCount);
 birds.name='Thirty birds in three natural flocks';
 birds.frustumCulled=false;
 const birdsData=Array.from({length:birdCount},(_,i)=>({
  flock:Math.floor(i/10),phase:random(i*31)*Math.PI*2,
  radial:random(i*11)*17+4,
  speed:.6+random(i*33)*.35,
  dy:(random(i*17)-.5)*26,
  scale:1.05+random(i*12)*.9
 }));
 const dummy=new THREE.Object3D();
 let clock=0;
 function update(dt){
  clock+=dt;wingTime.value=clock;
  birdsData.forEach(({flock,phase,radial,speed,dy,scale},i)=>{
   const t=clock*.12*speed+flock*2.05;
   // Slowly circulating flock leader with boid-style wingbeat phase and spacing.
   const centerX=Math.cos(t)*42+[-140,-80,-5][flock];
   const centerZ=Math.sin(t*.74)*31-170+flock*10;
   const x=centerX+Math.sin(phase+t*2.3)*radial;
   const z=centerZ+Math.cos(phase*.88+t*1.8)*radial*.68;
   const y=95+flock*5+dy*.55+Math.sin(clock*.6+phase)*3;
   dummy.position.set(x,y,z);
   const vx=-Math.sin(t)*13 + Math.cos(phase+t*2.3)*radial*.3;
   const vz=Math.cos(t*.74)*11 - Math.sin(phase*.88+t*1.8)*radial*.25;
   dummy.rotation.set(.06*Math.sin(phase+t),Math.atan2(vx,vz),.13*Math.sin(t*.6+phase));
   dummy.scale.setScalar(scale);dummy.updateMatrix();birds.setMatrixAt(i,dummy.matrix);
  });
  birds.instanceMatrix.needsUpdate=true;
 }
 update(0);
 scene.add(birds);stage.dataset.birdFlocks='3';stage.dataset.birds=String(birdCount);
 return {update,mesh:birds,now:()=>clock};
}
function flowerGeometry(){
 // Each miniature daisy has five irregular petals, golden center and green stalk.
 const p=[],colors=[];
 const petal=[[.97,.96,1],[.92,.78,.88],[.99,.92,.68],[.83,.87,.99]];
 function addTri(a,b,c,col){p.push(...a,...b,...c);for(let i=0;i<3;i++)colors.push(...col);}
 const green=[.23,.43,.17];
 addTri([-.035,0,0],[.035,0,0],[.005,.8,.005],green);
 for(let j=0;j<5;j++){
  const t=j*Math.PI*2/5,r=.22;
  const off=[Math.cos(t)*r,Math.sin(t)*r];
  const pc=petal[(j*3)%petal.length];
  addTri([0,.83,0],[off[0]-.12,.81+off[1],0],[off[0]+.13,1.02+off[1],.02],pc);
 }
 addTri([-.085,.83,.032],[.095,.83,.032],[0,1.00,.048],[.96,.67,.20]);
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geometry.computeVertexNormals();
 return geometry;
}
function addFlowers(scene,stage){
 const flower=new THREE.InstancedMesh(flowerGeometry(),new THREE.MeshLambertMaterial({
  color:0xffffff,vertexColors:true,side:THREE.DoubleSide,transparent:true,opacity:.91
 }),flowerCount);
 flower.name='Meadow and riverside wildflower patches';
 const m=new THREE.Object3D();
 let count=0;
 // Flow banks/lakeshores are approximate deliberately to avoid basin overlap.
 for(let i=0;i<flowerCount*3&&count<flowerCount;i++){
  const nearWater=i%5!==0;
  const patch=i%83;
  let x,z;
  if(nearWater){
   const gx=-365+(patch%19)*23,gz=-230+(Math.floor(patch/19)-2)*25;
   x=gx+(random(i*17)-.5)*19;
   z=gz+(random(i*31)-.5)*20;
  }else{
   x=(random(i*37)-.5)*620;
   z=(random(i*41)-.5)*600;
  }
  const y=terrainElevation(x,z);
  if(y<-2.5)continue;
  m.position.set(x,y+.03,z);m.rotation.y=random(i+99)*Math.PI*2;
  m.rotation.z=(random(i+39)-.5)*.18;
  const s=.55+random(i*13)*1.3;m.scale.setScalar(s);m.updateMatrix();
  flower.setMatrixAt(count++,m.matrix);
 }
 flower.count=count;flower.instanceMatrix.needsUpdate=true;
 flower.frustumCulled=false;scene.add(flower);
 stage.dataset.flowers=String(count);
 return flower;
}
function addWaterfall(scene,stage){
 const baseX=-230,baseZ=-315,baseY=-.40,height=40,width=39;
 const vertices=[],uv=[],indices=[];
 const nX=34,nY=26;
 for(let j=0;j<=nY;j++){
  const t=j/nY;
  for(let i=0;i<=nX;i++){
   const u=i/nX;
   vertices.push(baseX+(u-.5)*width+Math.sin(u*16+t*13)*.30,
      baseY+height*(1-t),
      baseZ+Math.sin(u*10+t*18)*.65+t*1.2);
   uv.push(u,t);
   if(i<nX&&j<nY){
    const q=j*(nX+1)+i;indices.push(q,q+1,q+nX+1,q+1,q+nX+2,q+nX+1);
   }
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 const time={value:0};
 const sheet=new THREE.Mesh(geometry,new THREE.ShaderMaterial({
  uniforms:{uTime:time},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`uniform float uTime;varying vec2 vUv;
   void main(){
    vec2 flow=vec2(vUv.x*21.0,vUv.y*12.0-uTime*2.8);
    float fold=sin(flow.x*2.3+sin(flow.y*1.9)*.55+sin(flow.x*.7+flow.y)*.45);
    float detail=sin(flow.x*4.9-flow.y*2.9+cos(flow.x*1.3)*.65);
    float turbulence=sin((flow.y+sin(flow.x)*.19)*5.5)*.5+.5;
    float streak=.5+.25*fold+.25*detail;
    float edge=smoothstep(0.,.065,vUv.x)*(1.-smoothstep(.935,1.,vUv.x));
    float froth=smoothstep(.74,1.,vUv.y)*turbulence;
    vec3 water=mix(vec3(.055,.18,.22),vec3(.28,.48,.52),.18+streak*.42+turbulence*.09);
    water+=vec3(.18,.23,.21)*froth*.49;
    gl_FragColor=vec4(water,(.52+.20*streak+.15*froth)*edge);
    #include <colorspace_fragment>
   }`,transparent:true,depthWrite:false,side:THREE.DoubleSide
 }));
 sheet.name='Animated falling waterfall sheet';
 sheet.renderOrder=16;scene.add(sheet);
 stage.dataset.waterfallWorldX=String(baseX);
 // Recycled mist/splash emitter: one native Points draw call, deterministic loop.
 // Design informed by NewKrok THREE Particles (MIT); pinned r167 compatibility.
 const count=340,points=new Float32Array(count*3);
 const particles=new THREE.BufferGeometry();
 particles.setAttribute('position',new THREE.BufferAttribute(points,3));
 const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
 const ctx=canvas.getContext('2d'),grad=ctx.createRadialGradient(32,32,0,32,32,31);
 grad.addColorStop(0,'rgba(255,255,255,.80)');grad.addColorStop(.4,'rgba(206,244,252,.38)');grad.addColorStop(1,'rgba(210,250,255,0)');
 ctx.fillStyle=grad;ctx.fillRect(0,0,64,64);
 const mist=new THREE.Points(particles,new THREE.PointsMaterial({
  map:new THREE.CanvasTexture(canvas),color:0xe2f5f7,size:1.5,
  sizeAttenuation:true,transparent:true,depthWrite:false,opacity:.7,blending:THREE.NormalBlending
 }));
 mist.name='Animated splash and mist particles';
 mist.renderOrder=17;scene.add(mist);
 // Jagged NATURAL cliff BEHIND the falling sheet in world Z, not a tiled
 // wall of bright rocks in front of it (that obscured the water completely).
 const rockGeo=new THREE.IcosahedronGeometry(1,0);
 const cliffCount=78;
 const rocks=new THREE.InstancedMesh(rockGeo,new THREE.MeshLambertMaterial({
  color:0x43524e,side:THREE.FrontSide,flatShading:true
 }),cliffCount);
 const m=new THREE.Object3D();
 for(let i=0;i<cliffCount;i++){
  const y=random(i*5)*height*1.04;
  const taper=1-.22*(y/height);
  const dx=(random(i*13+2)-.5)*(width+20)*taper;
  m.position.set(baseX+dx,baseY+y,
    baseZ-5.5-random(i+8)*9.5);
  m.rotation.set(random(i*3)*2,random(i*11)*3,random(i*7)*2);
  m.scale.set(1.5+random(i*13)*2.9,1.8+random(i*21)*3.1,1.6+random(i*31)*3.4);
  m.updateMatrix();rocks.setMatrixAt(i,m.matrix);
 }
 rocks.instanceMatrix.needsUpdate=true;rocks.castShadow=true;scene.add(rocks);
 // Foam contact patch: diffuse spray, not an opaque pond painted onto the lake.
 const foamCanvas=document.createElement('canvas');foamCanvas.width=128;foamCanvas.height=128;
 const foamCtx=foamCanvas.getContext('2d'),foamGrad=foamCtx.createRadialGradient(64,64,4,64,64,63);
 foamGrad.addColorStop(0,'rgba(226,249,250,.58)');
 foamGrad.addColorStop(.26,'rgba(214,238,242,.45)');
 foamGrad.addColorStop(.7,'rgba(182,231,238,.14)');
 foamGrad.addColorStop(1,'rgba(190,236,242,0)');
 foamCtx.fillStyle=foamGrad;foamCtx.fillRect(0,0,128,128);
 const foam=new THREE.Mesh(new THREE.PlaneGeometry(width*1.75,width*.95),
  new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(foamCanvas),
    transparent:true,depthWrite:false,opacity:.73,side:THREE.DoubleSide}));
 foam.rotation.x=-Math.PI/2;foam.position.set(baseX,baseY+.09,baseZ+2.4);
 foam.renderOrder=18;scene.add(foam);
 stage.dataset.waterfallFoam='surface-spray-gradient';
 let clock=0;
 function update(dt){
  clock+=dt;time.value=clock;
  for(let i=0;i<count;i++){
   const lifetime=(clock*(.26+random(i*17)*.28)+random(i*47))%1;
   const low=random(i*13)>.45;
   const x=baseX+(random(i*29)-.5)*(low?width+14:width);
   const y=baseY+(low?lifetime*3:height*(1-lifetime));
   const z=baseZ+(low?5+random(i*59)*9:1+random(i*11)*2);
   points[i*3]=x+Math.sin(clock+i)*lifetime*1.9;
   points[i*3+1]=y;
   points[i*3+2]=z;
  }
  particles.attributes.position.needsUpdate=true;
 }
 update(0);
 stage.dataset.waterfall='animated-sheet-spray-rocks';
 stage.dataset.waterfallParticles=String(count);
 return {update,sheet,mist,rocks,foam,now:()=>clock};
}
export function addLivingWildlife({scene,stage,reducedMotion=false}){
 const birds=addBirds(scene,stage);
 const flowers=addFlowers(scene,stage);
 const waterfall=addWaterfall(scene,stage);
 const now=()=>({birdTime:birds.now(),waterfallTime:waterfall.now(),
  flockCount:3,birds:birdCount,flowers:flowers.count,spray:340});
 window.VstopiaWildlifeDebug=now;
 return {update(dt){
  if(reducedMotion)return;
  birds.update(dt);waterfall.update(dt);
 },now,birds:birds.mesh,flowers,waterfall};
}
