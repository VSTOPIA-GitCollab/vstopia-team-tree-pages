/* VSTOPIA ecology reused within original Stillwater renderer (Three.js r180).
 * 28 branch-based understory bushes, ~15k short grass tufts and 30 birds.
 * All geometry/materials are native to the user's main 3D scene.
 */
import * as THREE from 'three';
const rnd=n=>{const x=Math.sin(n*81.361+35.739)*38746.381;return x-Math.floor(x);};
function bushes({scene,height,plantTree,forestModel,lowPower=false}){
  let count=0;
  for(let i=0;i<70&&count<28;i++){
    if(lowPower&&count>=10)break;
    const a=i*2.399963,rad=38+rnd(i*17)*52;
    const x=Math.cos(a)*rad,z=4+Math.sin(a)*rad*.88,h=height(x,z);
    if(h<.40||h>6.3)continue;
    const bush=plantTree(forestModel,new THREE.Vector3(x,h-.04,z),.12+rnd(i*7)*.11,a*.52);
    bush.name='VSTOPIA understory bush '+count;count++;
  }
  return count;
}
function shortGrass({scene,height,grassGeo,grassMat,lowPower=false}){
  const capacity=15500,actualCapacity=lowPower?2500:capacity;
  const mesh=new THREE.InstancedMesh(grassGeo,grassMat,actualCapacity),m=new THREE.Object3D();
  mesh.name='VSTOPIA short-grass undergrowth around lake';
  const colors=['#6a8050','#859963','#94a570','#547043','#748c58'].map(c=>new THREE.Color(c));
  let count=0;
  for(let i=0;i<70000&&count<actualCapacity;i++){
    const cluster=i%103,a=cluster*2.39996,rad=36+rnd(cluster*13)*24;
    const x=Math.cos(a)*rad+(rnd(i*13)-.5)*12;
    const z=4+Math.sin(a)*rad*.83+(rnd(i*23)-.5)*11,h=height(x,z);
    if(h<.14||h>4.4)continue;
    m.position.set(x,h-.02,z);
    m.rotation.set(0,rnd(i*29)*Math.PI*2,(rnd(i*19)-.5)*.14);
    const s=.11+rnd(i*7)*.18;
    m.scale.set(.7+rnd(i*31),s,.7+rnd(i*43));m.updateMatrix();
    mesh.setMatrixAt(count,m.matrix);mesh.setColorAt(count,colors[i%colors.length]);count++;
  }
  mesh.count=count;mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.receiveShadow=true;scene.add(mesh);return count;
}
function birds(scene){
  const count=30,geometry=new THREE.BufferGeometry(),phases=new Float32Array(count);
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([
    -1.5,0,.18,-.12,.10,0,-.25,-.05,-.22,
    .12,.10,0,1.5,0,.18,.25,-.05,-.22,
    -.22,-.02,-.10,0,.06,.58,.22,-.02,-.10
  ],3));geometry.computeVertexNormals();
  for(let i=0;i<count;i++)phases[i]=i*.73+rnd(i*7)*2;
  geometry.setAttribute('aBirdPhase',new THREE.InstancedBufferAttribute(phases,1));
  const time={value:0};
  const material=new THREE.MeshBasicMaterial({color:0x233f41,side:THREE.DoubleSide,transparent:true,opacity:.80,depthWrite:false});
  material.onBeforeCompile=s=>{
    s.uniforms.uBirdClock=time;
    s.vertexShader=s.vertexShader.replace('#include <common>',
      '#include <common>\nattribute float aBirdPhase;\nuniform float uBirdClock;');
    s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\ntransformed.y+=abs(position.x)*.18*sin(uBirdClock*9.+aBirdPhase);');
  };
  material.customProgramCacheKey=()=> 'vstopia-flock-wing-r180';
  const mesh=new THREE.InstancedMesh(geometry,material,count);
  mesh.name='VSTOPIA flying birds - three flocks';
  mesh.frustumCulled=false;scene.add(mesh);
  const m=new THREE.Object3D();
  function update(t){
    time.value=t;
    for(let i=0;i<count;i++){
      const flock=Math.floor(i/10),phase=(i%10)*2.39996;
      const progress=t*.10*(.8+rnd(i*37)*.3)+flock*1.82;
      const x=-10+Math.sin(progress)*42+flock*10+Math.cos(phase+t*.15)*(4+rnd(i*7)*9);
      const z=-48+Math.cos(progress*.73)*19+flock*11+Math.sin(phase+t*.19)*(4+rnd(i*11)*8);
      const y=32+flock*8+rnd(i*17)*7+Math.sin(t*.55+i)*2.0;
      m.position.set(x,y,z);
      m.rotation.set(0,Math.atan2(Math.cos(progress),-Math.sin(progress)),.04*Math.sin(t+phase));
      const s=.58+rnd(i*19)*.55;m.scale.setScalar(s);m.updateMatrix();
      mesh.setMatrixAt(i,m.matrix);
    }
    mesh.instanceMatrix.needsUpdate=true;
  }
  update(0);return {mesh,update};
}
export function createVstopiaEcology(params){
  const bushCount=bushes(params),shortGrassCount=shortGrass(params);
  const birdFlocks=birds(params.scene);
  Object.assign(document.body.dataset,{vstopiaBushes:String(bushCount),
    vstopiaShortGrass:String(shortGrassCount),vstopiaBirdFlocks:'3',vstopiaBirds:'30'});
  return {bushCount,shortGrassCount,birdCount:30,update:birdFlocks.update};
}
