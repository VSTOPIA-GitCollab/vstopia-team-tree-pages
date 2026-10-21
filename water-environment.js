/* VSTOPIA environmental garden
 * Three.js official Water addon for HDRI/scene reflection on the lake.
 * Stream: dynamic ripples with matching HDRI IBL + subtle foam.
 * Shared instancing: distant grass clusters, shoreline stones, lake/river beds.
 * All deterministic, standalone, and fully public-safe. */
import * as THREE from 'three';
import {Water} from './vendor/addons/Water.js';

const LAKE={x:69,z:-129,rx:40,rz:27,water:-.46};
const CHANNEL=[[-134,-83],[-104,-91],[-77,-117],[-42,-124],[-5,-137],[28,-143],[62,-130]];
const smooth=(a,b,v)=>{const t=THREE.MathUtils.clamp((v-a)/(b-a),0,1);return t*t*(3-2*t)};
const rand=n=>{const v=Math.sin(n*78.233+13.183)*43758.5453;return v-Math.floor(v)};
const segments=CHANNEL.slice(1).map(([x,z],i)=>[CHANNEL[i],[x,z]]);

function distanceChannel(x,z){
 let best=Infinity;
 for(const [[ax,az],[bx,bz]] of segments){
  const dx=bx-ax,dz=bz-az;
  const t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/Math.max(1,dx*dx+dz*dz)));
  best=Math.min(best,Math.hypot(x-ax-t*dx,z-az-t*dz));
 }
 return best;
}
function basin(x,z){
 const lakeDist=Math.hypot((x-LAKE.x)/LAKE.rx,(z-LAKE.z)/LAKE.rz);
 const lake=1-smooth(.82,1.26,lakeDist);
 const river=1-smooth(5.2,15.5,distanceChannel(x,z));
 return Math.max(lake,river*.78);
}
export function terrainElevation(x,z){
 const dist=Math.hypot(x,z);
 const ramp=(1-Math.exp(-Math.pow(dist/55,2)))*(1-smooth(750,3200,dist));
 const relief=(Math.sin(x*.013)*6+Math.cos(z*.015)*5+
     Math.sin(x*.027+z*.018)*2.6+Math.cos(z*.038-x*.02)*1.6)*ramp;
 // Always lower the actual basin beneath the lake/stream surface;
 // previously positive macro-relief poked through the reflective water.
 const cut=basin(x,z);
 return relief*(1-cut*.98)-cut*4.2;
}
function createWaterNormals(){
 // Derive a continuous, tileable normal map, no runtime texture download.
 const size=128,data=new Uint8Array(size*size*4);
 const height=(x,y)=>{
  const a=x/size*Math.PI*2,b=y/size*Math.PI*2;
  return Math.sin(a*7+b*4)*.40+Math.cos(a*13-b*9)*.22+Math.sin(a*5-b*8)*.38;
 };
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const gx=height((x+1)%size,y)-height((x+size-1)%size,y);
  const gy=height(x,(y+1)%size)-height(x,(y+size-1)%size);
  const v=new THREE.Vector3(-gx*.95,-gy*.95,1).normalize(),i=(y*size+x)*4;
  data[i]=Math.round((v.x*.5+.5)*255);data[i+1]=Math.round((v.y*.5+.5)*255);
  data[i+2]=Math.round((v.z*.5+.5)*255);data[i+3]=255;
 }
 const tex=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
 tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.needsUpdate=true;
 return tex;
}
function makeRiverGeometry(){
 const pts=CHANNEL.map(([x,z])=>new THREE.Vector3(x,0,z));
 const curve=new THREE.CatmullRomCurve3(pts,false,'catmullrom',.45);
 const positions=[],uv=[],indices=[],N=94;
 for(let i=0;i<=N;i++){
  const t=i/N,p=curve.getPoint(t),tan=curve.getTangent(t).normalize();
  const normal=new THREE.Vector3(-tan.z,0,tan.x);
  const width=3.5+Math.sin(t*Math.PI)*1.8+(1-t)*1.4;
  for(const sign of [-1,1]){
   const v=p.clone().addScaledVector(normal,sign*width);
   positions.push(v.x,-v.z,.0);uv.push(t*8,sign*.5+.5);
  }
  if(i<N){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}
 }
 const geom=new THREE.BufferGeometry();
 geom.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geom.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geom.setIndex(indices);geom.computeVertexNormals();
 return geom;
}
function makeStreamMaterial(){
 // A fast original flowmap-style stream shader: animated wave phase and
 // equirectangular sampling from the same HDRI that illuminates the forest.
 // Avoids a second expensive full-scene reflection render every frame.
 return new THREE.ShaderMaterial({
  name:'VSTOPIA HD sky stream flow',transparent:true,depthWrite:false,
  side:THREE.DoubleSide,toneMapped:false,
  uniforms:{uTime:{value:0},uSky:{value:null}},
  vertexShader:`
   varying vec2 vFlowUv;
   void main(){
    vFlowUv=uv;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
   }`,
  fragmentShader:`
   uniform float uTime;
   uniform sampler2D uSky;
   varying vec2 vFlowUv;
   void main(){
    float t=uTime;
    float r1=sin(vFlowUv.x*42.0-t*3.0+sin(vFlowUv.y*9.0+t*.9)*.7);
    float r2=sin(vFlowUv.x*96.0-t*7.0+vFlowUv.y*17.0)*.33;
    float noise=(r1+r2)*.5;
    vec2 skyUV=vec2(.25+vFlowUv.x*.025+noise*.002,.24+noise*.008);
    vec3 hdr=texture2D(uSky,skyUV).rgb;
    vec3 sky=hdr/(hdr+vec3(1.0));
    vec3 base=mix(vec3(.033,.17,.19),sky*.53, .34);
    vec3 foam=vec3(.09,.16,.15)*pow(max(0.0,noise),5.0);
    float edge=smoothstep(.02,.20,vFlowUv.y)*(1.0-smoothstep(.82,.98,vFlowUv.y));
    float ripple=sin(vFlowUv.x*29.0+t*2.1)*.5+.5;
    vec3 color=base*(.91+.16*ripple)+foam;
    gl_FragColor=vec4(color, .95*edge);
    #include <colorspace_fragment>
   }`
 });
}
export function addWaterGarden({scene,renderer,terrain,stage,reduceMotion}){
 const normals=createWaterNormals();
 const lakeGeo=new THREE.CircleGeometry(1,128);
 const lake=new Water(lakeGeo,{
  textureWidth:128,textureHeight:128,waterNormals:normals,
  sunDirection:new THREE.Vector3(-32,77,42).normalize(),
  sunColor:0x8c9b93,waterColor:0x397e83,distortionScale:.65,
  alpha:.93,fog:false
 });
 // Calm lake: preserve true reflected sky but do not clip white HDR highlights.
 lake.material.fragmentShader=lake.material.fragmentShader
  .replace('float rf0 = 0.3;', 'float rf0 = 0.32;')
  .replace('vec3( 0.1 ) + reflectionSample * 0.9 + reflectionSample * specularLight',
           'vec3( 0.025, 0.076, 0.10 ) + clamp(reflectionSample, 0.0, 1.0) * vec3( 0.28, 0.42, 0.52 ) + reflectionSample * specularLight * 0.08');
 lake.material.transparent=true;
 lake.material.depthWrite=true;
 // Ground uses transparency near the HDRI; force water compositing after terrain.
 // Otherwise the clear terrain shader overdraws and hides water completely.
 lake.renderOrder=14;
 lake.material.needsUpdate=true;
 lake.rotation.x=-Math.PI/2;
 lake.scale.set(LAKE.rx,LAKE.rz,1);
 lake.position.set(LAKE.x,LAKE.water,LAKE.z);
 scene.add(lake);lake.name='Reflective HDRI lake';
 const riverMaterial=makeStreamMaterial();
 const river=new THREE.Mesh(makeRiverGeometry(),riverMaterial);
 river.rotation.x=-Math.PI/2;
 river.position.y=-.39;

 river.name='Flowing stream';
 river.renderOrder=15;scene.add(river);
 // One bank layer: pebbles and erratic rocks across the terrain.
 const rockGeo=new THREE.IcosahedronGeometry(1,1);
 const rockMat=new THREE.MeshStandardMaterial({color:0x7b8372,roughness:.98,metalness:0,flatShading:true});
 const rocks=new THREE.InstancedMesh(rockGeo,rockMat,180);
 const rockColors=[new THREE.Color('#72776e'),new THREE.Color('#929583'),new THREE.Color('#606a64'),new THREE.Color('#8b8172')];
 const m=new THREE.Object3D();let rockCount=0;
 const putRock=(x,z,i,scale)=>{
  m.position.set(x,terrainElevation(x,z)-.055+.28*scale,z);
  m.rotation.set(rand(i*31)*2,rand(i*23)*6.283,rand(i*17)*.6);
  m.scale.set(scale*(.75+rand(i+1)),scale*(.33+rand(i+8)*.35),scale*(.67+rand(i+9)));
  m.updateMatrix();rocks.setMatrixAt(rockCount,m.matrix);
  rocks.setColorAt(rockCount,rockColors[i%rockColors.length]);rockCount++;
 };
 for(let i=0;i<120;i++){
  const a=i*2.399963,r=1.05+rand(i+61)*.29;
  const x=LAKE.x+Math.cos(a)*LAKE.rx*r,z=LAKE.z+Math.sin(a)*LAKE.rz*r;
  putRock(x,z,i,.6+rand(i*17)*1.9);
 }
 for(let i=0;i<50;i++){
  const seg=CHANNEL[i%CHANNEL.length],x=seg[0]+(rand(i*29)-.5)*32;
  const z=seg[1]+(rand(i*47)-.5)*24;
  putRock(x,z,i+120,.5+rand(i*19)*1.5);
 }
 rocks.count=rockCount;rocks.instanceMatrix.needsUpdate=true;rocks.instanceColor.needsUpdate=true;
 rocks.castShadow=true;rocks.receiveShadow=true;scene.add(rocks);
 // Thousands of grass blades rendered as one draw call; no grassy spikes in water.
 // Five serrated blades per instance: one lightweight mesh draw call represents
 // 50,000 grass leaves, more meadow coverage than lone distant cones.
 const tuftPositions=[];
 for(let blade=0;blade<5;blade++){
  const angle=blade*Math.PI*2/5;
  const dx=Math.cos(angle),dz=Math.sin(angle),width=.09+(blade%2)*.045;
  const x=dx*.14,z=dz*.14;
  const lx=x-dz*width,lz=z+dx*width;
  const rx=x+dz*width,rz=z-dx*width;
  const tipX=x+dx*.27,tipZ=z+dz*.27,tipY=.7+blade*.13;
  tuftPositions.push(lx,0,lz,rx,0,rz,tipX,tipY,tipZ);
 }
 const grassGeo=new THREE.BufferGeometry();
 grassGeo.setAttribute('position',new THREE.Float32BufferAttribute(tuftPositions,3));
 grassGeo.computeVertexNormals();
 const grassMat=new THREE.MeshLambertMaterial({color:0xffffff,side:THREE.DoubleSide});
 const grass=new THREE.InstancedMesh(grassGeo,grassMat,10000);
 let placed=0;
 const grassColors=[new THREE.Color('#86a767'),new THREE.Color('#7ca561'),
    new THREE.Color('#abb878'),new THREE.Color('#748e60')];
 for(let i=0;i<19000&&placed<10000;i++){
  const x=(rand(i*13+1)-.5)*570,z=(rand(i*19+4)-.5)*500;
  if(basin(x,z)>.10)continue;
  const d=Math.hypot(x,z),s=(.7+rand(i+30)*1.9)*Math.max(.45,1-d/1000);
  m.position.set(x,terrainElevation(x,z)-.04,z);
  m.rotation.set(0,rand(i*7)*6.283,(rand(i+67)-.5)*.27);
  m.scale.set(s*.85,s*(.8+rand(i+90)*.45),s*.85);
  m.updateMatrix();grass.setMatrixAt(placed,m.matrix);
  grass.setColorAt(placed,grassColors[i%grassColors.length]);placed++;
 }
 grass.count=placed;grass.instanceMatrix.needsUpdate=true;grass.instanceColor.needsUpdate=true;
 grass.receiveShadow=true;scene.add(grass);
 stage.dataset.waterLake='hdr-reflective-threejs-water';
 stage.dataset.waterStream='animated-physical-ripple';
 stage.dataset.waterRocks=String(rockCount);
 stage.dataset.waterGrass=String(placed);
 window.VstopiaWaterDebug=()=>({
  lakeTime:lake.material.uniforms.time.value,
  streamTime:riverMaterial.uniforms.uTime.value,
  lakeReflectsScene:lake.isWater===true,
  rockInstances:rocks.count,grassInstances:grass.count,
  lakePosition:lake.position.toArray(),riverPosition:river.position.toArray()
 });
 function update(dt){
  if(reduceMotion)return;
  lake.material.uniforms.time.value+=dt*.72;
  riverMaterial.uniforms.uTime.value+=dt;
 }
 return {update,lake,river,rocks,grass,setEnvironment:t=>{riverMaterial.uniforms.uSky.value=t;}};
}
