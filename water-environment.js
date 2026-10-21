/* VSTOPIA environmental garden
 * Three.js official Water addon for HDRI/scene reflection on the lake.
 * Stream: dynamic ripples with matching HDRI IBL + subtle foam.
 * Shared instancing: distant grass clusters, shoreline stones, lake/river beds.
 * All deterministic, standalone, and fully public-safe. */
import * as THREE from 'three';
import {Water} from './vendor/addons/Water.js';

// Irregular, distant lake; creek spans almost all 16 km of real world terrain.
const LAKE={x:-145,z:-210,rx:62,rz:44,water:-.46};
const CHANNEL=[[-7950,-430],[-6100,-408],[-3900,-366],[-2150,-343],[-1320,-315],[-940,-285],[-620,-265],[-480,-255],[-390,-247],[-300,-225],[-262,-205],[-238,-214],[-211,-221],[-187,-210],[-164,-209]];
const smooth=(a,b,v)=>{const t=THREE.MathUtils.clamp((v-a)/(b-a),0,1);return t*t*(3-2*t)};
const rand=n=>{const v=Math.sin(n*78.233+13.183)*43758.5453;return v-Math.floor(v)};
const lakeEdge=a=>1+.16*Math.sin(a*3+.6)+.095*Math.sin(a*5-1.1)+.07*Math.cos(a*9+.25);
const segments=CHANNEL.slice(1).map(([x,z],i)=>[CHANNEL[i],[x,z]]);
const creekCurve=new THREE.CatmullRomCurve3(CHANNEL.map(([x,z])=>new THREE.Vector3(x,0,z)),false,'catmullrom',.4);
const creekWidth=t=>14+4.5*Math.sin(t*Math.PI)+3*Math.pow(Math.sin(t*15),2);
function distanceChannel(x,z){let best=Infinity;for(const [[ax,az],[bx,bz]] of segments){const dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/Math.max(1,dx*dx+dz*dz)));best=Math.min(best,Math.hypot(x-ax-t*dx,z-az-t*dz));}return best;}
function distanceLake(x,z){const dx=(x-LAKE.x)/LAKE.rx,dz=(z-LAKE.z)/LAKE.rz;return Math.hypot(dx,dz)/lakeEdge(Math.atan2(dz,dx));}
function basin(x,z){return Math.max(1-smooth(.82,1.35,distanceLake(x,z)),(1-smooth(11,43,distanceChannel(x,z)))*.92);}
export function terrainElevation(x,z){const dist=Math.hypot(x,z),ramp=(1-Math.exp(-Math.pow(dist/55,2)))*(1-smooth(750,3200,dist)),relief=(Math.sin(x*.013)*6+Math.cos(z*.015)*5+Math.sin(x*.027+z*.018)*2.6+Math.cos(z*.038-x*.02)*1.6)*ramp,cut=basin(x,z);return relief*(1-cut*.98)-cut*4.9;}
export const gardenTopology={lake:{...LAKE},riverStart:[...CHANNEL[0]],riverEnd:[...CHANNEL[CHANNEL.length-1]],terrainEdgeX:-8000,riverSegments:CHANNEL.length};
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
function makeLakeGeometry(){
 const count=160,positions=[0,0,0],uv=[.5,.5],indices=[];
 for(let i=0;i<=count;i++){const a=i/count*Math.PI*2,r=lakeEdge(a);positions.push(Math.cos(a)*LAKE.rx*r,Math.sin(a)*LAKE.rz*r,0);uv.push(.5+Math.cos(a)*.5*r,.5+Math.sin(a)*.5*r);if(i<count)indices.push(0,i+1,i+2);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function makeRiverGeometry(){
 const positions=[],uv=[],indices=[],N=600;
 for(let i=0;i<=N;i++){const t=i/N,p=creekCurve.getPoint(t),tan=creekCurve.getTangent(t).normalize(),normal=new THREE.Vector3(-tan.z,0,tan.x),width=creekWidth(t);
 for(const sign of [-1,1]){const v=p.clone().addScaledVector(normal,sign*width);positions.push(v.x,-v.z,0);uv.push(t*15,sign*.5+.5);}
 if(i<N){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
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
   varying float vStreamDistance;
   void main(){
    vFlowUv=uv;
    vStreamDistance=length((modelMatrix*vec4(position,1.0)).xz);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
   }`,
  fragmentShader:`
   uniform float uTime;
   uniform sampler2D uSky;
   varying vec2 vFlowUv;
   varying float vStreamDistance;
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
    gl_FragColor=vec4(color, .95*edge*(1.0-smoothstep(350.0,1350.0,vStreamDistance)));
    #include <colorspace_fragment>
   }`
 });
}
export function addWaterGarden({scene,renderer,terrain,stage,reduceMotion}){
 const normals=createWaterNormals();
 const lakeGeo=makeLakeGeometry();
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

 lake.position.set(LAKE.x,LAKE.water,LAKE.z);
 scene.add(lake);lake.name='Reflective HDRI lake';
 const riverMaterial=makeStreamMaterial();
 const river=new THREE.Mesh(makeRiverGeometry(),riverMaterial);
 river.rotation.x=-Math.PI/2;
 river.position.y=-.39;

 river.name='Flowing stream';
 river.renderOrder=15;scene.add(river);
 // Distorted angular boulders, scattered across meadow and along creek.
 const rockGeo=new THREE.IcosahedronGeometry(1,1),rp=rockGeo.attributes.position;
 for(let i=0;i<rp.count;i++){const x=rp.getX(i),y=rp.getY(i),z=rp.getZ(i),v=1+.23*Math.sin(x*9.3+y*4.1+z*2.3)+.12*Math.cos(z*13.7-x*6.1);rp.setXYZ(i,x*v,y*v,z*v);}rockGeo.computeVertexNormals();
 const rockMat=new THREE.MeshStandardMaterial({color:0x5f6b62,roughness:.99,metalness:0,flatShading:true});
 const rocks=new THREE.InstancedMesh(rockGeo,rockMat,280);
 const rockColors=[new THREE.Color('#707872'),new THREE.Color('#a19d8e'),new THREE.Color('#646b68'),new THREE.Color('#938979'),new THREE.Color('#818d83')];
 const m=new THREE.Object3D();let rockCount=0;
 const putRock=(x,z,i,scale)=>{if(rockCount>=280||basin(x,z)>.45)return;
 m.position.set(x,terrainElevation(x,z)+scale*.18,z);m.rotation.set(rand(i*31)*1.4,rand(i*23)*6.283,rand(i*17)*.9);
 m.scale.set(scale*(.65+rand(i+1)),scale*(.24+rand(i+8)*.42),scale*(.75+rand(i+9)*.7));m.updateMatrix();rocks.setMatrixAt(rockCount,m.matrix);rocks.setColorAt(rockCount,rockColors[i%rockColors.length]);rockCount++;};
 for(let i=0;i<42;i++){if(i%4===0)continue;const a=i*2.399963,r=lakeEdge(a)*(1.18+rand(i+61)*.6);putRock(LAKE.x+Math.cos(a)*LAKE.rx*r,LAKE.z+Math.sin(a)*LAKE.rz*r,i,1+rand(i*17)*3.6);}
 for(let i=0;i<185;i++){const x=(rand(i*93+1)-.5)*680,z=(rand(i*73+5)-.5)*550;putRock(x,z,i+80,.9+rand(i*19)*4.8);}
 for(let i=0;i<48;i++){const t=.71+rand(i*19)*.285,p=creekCurve.getPoint(t),tan=creekCurve.getTangent(t),perp=new THREE.Vector3(-tan.z,0,tan.x).normalize(),d=creekWidth(t)+4+rand(i*15)*19,sign=i%2===0?1:-1;putRock(p.x+perp.x*d*sign,p.z+perp.z*d*sign,300+i,1.3+rand(i*7)*4.2);}
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
 const grass=new THREE.InstancedMesh(grassGeo,grassMat,33000);
 let placed=0;
 const grassColors=[new THREE.Color('#86a767'),new THREE.Color('#7ca561'),
    new THREE.Color('#abb878'),new THREE.Color('#748e60')];
 for(let i=0;i<56000&&placed<33000;i++){
  let x,z;
  if(i<11500){const group=i%120,t=.72+rand(group*17)*.275,p=creekCurve.getPoint(t),tan=creekCurve.getTangent(t),n=new THREE.Vector3(-tan.z,0,tan.x).normalize(),side=i%2===0?1:-1,d=creekWidth(t)+8+rand(group*11)*19;x=p.x+n.x*d*side+(rand(i*19)-.5)*9;z=p.z+n.z*d*side+(rand(i*23)-.5)*9;}
  else if(i<39500){x=(rand(i*13+1)-.5)*720;z=(rand(i*19+4)-.5)*600;}
  else{x=(rand(i*13+1)-.5)*1400;z=(rand(i*19+4)-.5)*1100;}
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
 stage.dataset.waterTopology='irregular-lake-wide-long-river';
 stage.dataset.waterLongRiver=String(Math.abs(CHANNEL[0][0]-CHANNEL[CHANNEL.length-1][0]));
 stage.dataset.waterLake='hdr-reflective-threejs-water';
 stage.dataset.waterStream='animated-physical-ripple';
 stage.dataset.waterRocks=String(rockCount);
 stage.dataset.waterGrass=String(placed);
 window.VstopiaWaterDebug=()=>({
  lakeTime:lake.material.uniforms.time.value,
  streamTime:riverMaterial.uniforms.uTime.value,
  lakeReflectsScene:lake.isWater===true,
  rockInstances:rocks.count,grassInstances:grass.count,
  lakePosition:lake.position.toArray(),riverPosition:river.position.toArray(),topology:gardenTopology
 });
 function update(dt){
  if(reduceMotion)return;
  lake.material.uniforms.time.value+=dt*.72;
  riverMaterial.uniforms.uTime.value+=dt;
 }
 return {update,lake,river,rocks,grass,setEnvironment:t=>{riverMaterial.uniforms.uSky.value=t;}};
}
