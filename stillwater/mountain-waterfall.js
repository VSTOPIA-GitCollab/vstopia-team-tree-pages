import * as THREE from './vendor/three.module.js';
import {atmosphereUniforms} from './atmosphere.js?v=waterfall-weather-v1-mountain-occlusion-v1-partial-arc-v1-midground-v1-real-crest-v2-approved-aspect-v2-raise-v3-right-wide-v4-leftstretch-v6-matched-sphere-v11-branchless-mask-v12';
// Fits the cascade to the actual first mountain heightfield. No screen sprite
// or detached white rectangle; the supporting shelf is part of the ridge mesh.
export function addMountainWaterfall({scene,clock,lowPower,groundHeight,leafGeometry,leafMaterial}){
 const ridge=scene.getObjectByName('Horizon ridge 1');
 if(!ridge)throw new Error('Waterfall requires the original mountain ridge.');
 const g=ridge.geometry,p=g.attributes.position;
 const nx=400,nz=100,stepX=2800/nx,stepZ=570/nz,cx=-570;
 function sample(x,z){
  const fx=THREE.MathUtils.clamp((x+1400)/stepX,0,nx-.0001),fz=THREE.MathUtils.clamp((z+1225)/stepZ,0,nz-.0001);
  const ix=Math.floor(fx),iz=Math.floor(fz),u=fx-ix,v=fz-iz;
  const a=iz*(nx+1)+ix,b=a+nx+1;
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(p.getY(a),p.getY(a+1),u),THREE.MathUtils.lerp(p.getY(b),p.getY(b+1),u),v);
 }
 const top=Math.max(62,sample(cx,-740)+20);
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),z=p.getZ(i),side=1-THREE.MathUtils.smoothstep(Math.abs(x-cx),16,62);
  const along=THREE.MathUtils.smoothstep(z,-790,-744)*(1-THREE.MathUtils.smoothstep(z,-678,-653));
  const shelf=12+top*(1-THREE.MathUtils.smoothstep(z,-706,-683));
  p.setY(i,THREE.MathUtils.lerp(p.getY(i),shelf,side*along));
 }
 p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
 const positions=[],uvs=[],indices=[],path=[],segments=100;
 for(let i=0;i<=segments;i++){
  const t=i/segments,z=THREE.MathUtils.lerp(-735,-681,t),x=cx+Math.sin(t*5)*2.5;
  const y=Math.max(sample(x,z),groundHeight(x,z))+.85;
  path.push(new THREE.Vector3(x,y,z));
  const width=THREE.MathUtils.lerp(3.4,7.8,Math.sin(t*Math.PI)*.8+.2);
  for(let j=0;j<5;j++){
   const u=j/4,xx=x+(u-.5)*width*2;
   positions.push(xx,Math.max(sample(xx,z),groundHeight(xx,z))+.95+Math.sin(u*Math.PI)*.2,z+.45);
   uvs.push(u,t);
  }
  if(i<segments)for(let j=0;j<4;j++){const a=i*5+j,b=a+5;indices.push(a,b,a+1,a+1,b,b+1);}
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();
 const uniforms={...atmosphereUniforms,uTime:clock};
 const material=new THREE.ShaderMaterial({
  uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,
  vertexShader:`varying vec2 vUv;varying float vDistance;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vDistance=length(mv.xyz);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`
   uniform float uTime,uAtmosphereLight;uniform vec3 uAtmosphereFog;varying vec2 vUv;varying float vDistance;
   float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
   void main(){
    float flow=vUv.y*36.-uTime*5.;
    float threads=noise(vec2(vUv.x*32.,flow));
    float foam=noise(vec2(vUv.x*11.+threads,flow*.48));
    float edge=smoothstep(0.,.14,vUv.x)*(1.-smoothstep(.86,1.,vUv.x));
    vec3 c=mix(vec3(.12,.32,.35),vec3(.88,.96,.94),.40+foam*.6);
    c*=uAtmosphereLight;
    c=mix(c,uAtmosphereFog,min(.15,vDistance*.00013));
    gl_FragColor=vec4(c,edge*(.62+threads*.35));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`
 });
 const fall=new THREE.Mesh(geo,material);fall.name='Mountain cascade - flowing surface';scene.add(fall);
 const base=path.at(-1).clone();base.y=Math.max(sample(base.x,base.z+5),groundHeight(base.x,base.z+5))+1.2;base.z+=5;
 const poolGeo=new THREE.CircleGeometry(16,48);poolGeo.rotateX(-Math.PI/2);
 const pool=new THREE.Mesh(poolGeo,new THREE.MeshStandardMaterial({color:'#294d45',roughness:.28,metalness:.08,transparent:true,opacity:.9}));
 pool.scale.set(1,.9,.65);pool.position.copy(base);pool.name='Cascade plunge pool';scene.add(pool);
 // Surface foam is a moving pattern, lit by the same day/night state.
 const foam=new THREE.Mesh(new THREE.RingGeometry(1,15,48),new THREE.ShaderMaterial({
  uniforms,side:THREE.DoubleSide,transparent:true,depthWrite:false,
  vertexShader:`varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform float uTime,uAtmosphereLight;varying vec3 vP;void main(){float r=length(vP.xy);float rings=pow(.5+.5*sin(r*3.-uTime*3.),8.);gl_FragColor=vec4(vec3(.65,.82,.79)*uAtmosphereLight,rings*(1.-smoothstep(2.,15.,r))*.55);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`
 }));foam.rotation.x=-Math.PI/2;foam.position.copy(base).add(new THREE.Vector3(0,.1,0));foam.scale.y=.65;scene.add(foam);
 let seed=7213;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const sprayGeo=new THREE.BufferGeometry(),sprayPos=[];
 for(let i=0;i<(lowPower?70:240);i++)sprayPos.push(rnd(),rnd(),rnd());
 sprayGeo.setAttribute('position',new THREE.Float32BufferAttribute(sprayPos,3));
 const spray=new THREE.Points(sprayGeo,new THREE.ShaderMaterial({
  uniforms:{...uniforms,uBase:{value:base}},transparent:true,depthWrite:false,
  vertexShader:`uniform float uTime;uniform vec3 uBase;varying float vLife;void main(){vLife=fract(position.y+uTime*.23);
   float a=position.x*6.283;vec3 p=uBase+vec3(cos(a)*vLife*17.,sin(vLife*3.14159)*8.,sin(a)*vLife*10.);
   vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(2400./-mv.z,1.,12.);}`,
  fragmentShader:`uniform float uAtmosphereLight;varying float vLife;void main(){float a=max(0.,1.-length(gl_PointCoord-.5)*2.);gl_FragColor=vec4(vec3(.72,.83,.84)*uAtmosphereLight,a*a*(1.-vLife)*.25);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`
 }));spray.frustumCulled=false;spray.name='Cascade rising spray';scene.add(spray);
 // Small, actual leaf meshes around the wet ravine: two instanced draw calls.
 const plants=lowPower?20:48,leavesPerPlant=lowPower?60:100;
 const trunkGeo=new THREE.CylinderGeometry(.22,.55,1,6);
 const trunks=new THREE.InstancedMesh(trunkGeo,new THREE.MeshStandardMaterial({color:'#494735',roughness:1}),plants);
 const foliage=new THREE.InstancedMesh(leafGeometry,new THREE.MeshStandardMaterial({
  map:leafMaterial.map,normalMap:leafMaterial.normalMap,color:'#a1b588',roughness:.9,side:THREE.DoubleSide
 }),plants*leavesPerPlant);
 const dummy=new THREE.Object3D(),color=new THREE.Color();
 let leafIndex=0;
 for(let i=0;i<plants;i++){
  const t=rnd(),z=THREE.MathUtils.lerp(-765,-652,t),side=i%2?1:-1,x=cx+side*(15+rnd()*35);
  const y=Math.max(sample(x,z),groundHeight(x,z)),h=2+rnd()*5;
  dummy.position.set(x,y+h*.5,z);dummy.rotation.set(0,rnd()*6.28,0);dummy.scale.set(.8,h,.8);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
  for(let j=0;j<leavesPerPlant;j++){
   const a=rnd()*6.28,r=Math.sqrt(rnd())*h*.65;
   dummy.position.set(x+Math.cos(a)*r,y+h*.65+rnd()*h*.45,z+Math.sin(a)*r);
   dummy.rotation.set(rnd()*2-1,rnd()*6.28,rnd()*3-1.5);dummy.scale.setScalar(.7+rnd()*.9);dummy.updateMatrix();foliage.setMatrixAt(leafIndex,dummy.matrix);
   color.setHSL(.24+rnd()*.07,.25+rnd()*.2,.32+rnd()*.22);foliage.setColorAt(leafIndex++,color);
  }
 }
 trunks.name='Waterfall ravine trunks';foliage.name='Waterfall ravine vegetation';scene.add(trunks,foliage);
 trunks.computeBoundingSphere();foliage.computeBoundingSphere();
 document.body.dataset.waterfall='mountain-cascade';document.body.dataset.waterfallPlants=String(plants);
 return {path,base,plants,waterfall:fall};
}
