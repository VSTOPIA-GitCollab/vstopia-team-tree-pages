import * as THREE from './vendor/three.module.js';
import {atmosphereUniforms} from './atmosphere.js?v=waterfall-weather-v1';

const clamp=THREE.MathUtils.clamp;
export function jumpPose(u,height=1.05,distance=2.6){
 return {along:distance*u,y:.015+4*height*u*(1-u),pitch:Math.atan2(4*height*(1-2*u),distance)};
}
// Test the entire flight corridor and splash margin against the existing lake bed.
export function findJumpSite(height,rnd){
 for(let attempt=0;attempt<240;attempt++){
  const x=(rnd()-.5)*34,z=(rnd()-.5)*24+7,angle=rnd()*Math.PI*2;
  const dx=Math.cos(angle),dz=Math.sin(angle),distance=2.3+rnd()*.8;
  let wet=true;
  for(let j=0;j<=12&&wet;j++)for(const side of [-1.2,0,1.2]){
   if(height(x+dx*distance*j/12-dz*side,z+dz*distance*j/12+dx*side)>-.30){wet=false;break;}
  }
  if(wet)return {x,z,dx,dz,distance,height:.85+rnd()*.45};
 }
 return null; // A dry/custom landscape must never get fish on land.
}
export function createLakeFish({scene,clock,height,lowPower}){
 let seed=78431;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const root=new THREE.Group();root.name='Occasional jumping lake trout';scene.add(root);
 const bodyGeo=new THREE.SphereGeometry(1,16,10);
 const colors=[],c=new THREE.Color(),p=bodyGeo.attributes.position;
 for(let i=0;i<p.count;i++){
  const belly=THREE.MathUtils.smoothstep(-p.getY(i),-.2,.65);
  c.set('#344c44').lerp(new THREE.Color('#b3b9a0'),belly);
  if(p.getY(i)>-.3&&Math.sin(p.getX(i)*43+p.getZ(i)*31)>.84)c.multiplyScalar(.48);
  colors.push(c.r,c.g,c.b);
 }
 bodyGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 const skin=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.34,metalness:.12});
 const fins=new THREE.MeshStandardMaterial({color:'#747661',roughness:.55,side:THREE.DoubleSide});
 const finGeo=new THREE.BufferGeometry();
 finGeo.setAttribute('position',new THREE.Float32BufferAttribute([
  -.28,0,0,-.51,.16,0,-.46,-.15,0,
  -.13,.08,0,.09,.08,0,-.07,.23,0,
  .04,-.015,0,-.08,-.10,.16,-.15,-.06,0,
  .04,-.015,0,-.08,-.10,-.16,-.15,-.06,0
 ],3));finGeo.computeVertexNormals();
 const eyeGeo=new THREE.SphereGeometry(.018,6,4),eyeMat=new THREE.MeshStandardMaterial({color:'#101713',roughness:.2});
 const ringGeo=new THREE.RingGeometry(.91,1,40);ringGeo.rotateX(-Math.PI/2);
 const axis=new THREE.Vector3(1,0,0),direction=new THREE.Vector3();
 const actors=[];let jumps=0;
 for(let i=0;i<3;i++){
  const group=new THREE.Group(),body=new THREE.Mesh(bodyGeo,skin),tail=new THREE.Mesh(finGeo,fins);
  body.scale.set(.34,.105,.09);group.add(body,tail);
  for(const side of [-1,1]){const eye=new THREE.Mesh(eyeGeo,eyeMat);eye.position.set(.225,.035,side*.067);group.add(eye);}
  group.visible=false;root.add(group);
  const ripple=new THREE.Mesh(ringGeo,new THREE.MeshStandardMaterial({color:'#a7c2bc',roughness:.3,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
  ripple.visible=false;root.add(ripple);
  const n=lowPower?16:28,droplets=new Float32Array(n*3),velocities=[];
  for(let k=0;k<n;k++){const a=rnd()*Math.PI*2,r=.4+rnd()*.8;velocities.push([Math.cos(a)*r,1.1+rnd()*1.8,Math.sin(a)*r]);}
  const sprayGeo=new THREE.BufferGeometry();sprayGeo.setAttribute('position',new THREE.BufferAttribute(droplets,3));
  const sprayMat=new THREE.PointsMaterial({color:'#b8d4d0',size:.045,transparent:true,opacity:0,depthWrite:false});
  const spray=new THREE.Points(sprayGeo,sprayMat);spray.frustumCulled=false;spray.visible=false;root.add(spray);
  actors.push({group,tail,ripple,spray,velocities,next:4+i*7.3,start:-100,site:null,duration:1.35+i*.11});
 }
 function splash(a,age,x,z,strength){
  const visible=age>=0&&age<1.65;
  a.ripple.visible=visible;a.spray.visible=visible&&age<.65;
  if(!visible)return;
  a.ripple.position.set(x,.065,z);a.ripple.scale.setScalar(.16+age*1.1);
  a.ripple.material.opacity=(1-age/1.65)*.48*strength;
  a.spray.material.opacity=Math.max(0,1-age/.65)*.8*strength;
  a.spray.material.color.set('#b8d4d0').multiplyScalar(atmosphereUniforms.uAtmosphereLight.value);
  const positions=a.spray.geometry.attributes.position;
  for(let j=0;j<a.velocities.length;j++){
   const v=a.velocities[j];positions.setXYZ(j,x+v[0]*age,.05+Math.max(0,v[1]*age-4.9*age*age),z+v[2]*age);
  }
  positions.needsUpdate=true;
 }
 return {actors,update(){
  const now=clock.value;let visible=0;
  for(const a of actors){
   if(now>=a.next){
    a.site=findJumpSite(height,rnd);a.start=now;a.next=now+21+rnd()*17;
    if(a.site)jumps++;
   }
   if(!a.site)continue;
   const age=now-a.start,u=age/a.duration,s=a.site,pose=jumpPose(clamp(u,0,1),s.height,s.distance);
   a.group.visible=u>=0&&u<=1;
   if(a.group.visible){
    visible++;a.group.position.set(s.x+s.dx*pose.along,pose.y,s.z+s.dz*pose.along);
    direction.set(s.dx*Math.cos(pose.pitch),Math.sin(pose.pitch),s.dz*Math.cos(pose.pitch));
    a.group.quaternion.setFromUnitVectors(axis,direction);
    a.tail.rotation.x=Math.sin(age*32)*.16;
   }
   const landed=age>=a.duration;
   splash(a,landed?age-a.duration:age,landed?s.x+s.dx*s.distance:s.x,landed?s.z+s.dz*s.distance:s.z,landed?1:.55);
  }
  document.body.dataset.fishJumps=String(jumps);document.body.dataset.fishVisible=String(visible);
 }};
}

// Vegetation follows the actual triangles, including the waterfall's carved shelf.
export function addMountainVegetation({scene,clock,wind,lowPower,groundHeight}){
 let seed=36219;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const sites=[],target=lowPower?900:2600,a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),normal=new THREE.Vector3(),edge=new THREE.Vector3();
 const ridges=[1,2,3].map(i=>scene.getObjectByName('Horizon ridge '+i));
 for(let attempts=0;sites.length<target&&attempts<target*50;attempts++){
  const ridge=ridges[rnd()<.72?0:rnd()<.7?1:2],g=ridge.geometry,p=g.attributes.position;
  const triangle=(Math.floor(50+rnd()*50)*400+Math.floor(rnd()*400))*6+(rnd()<.5?0:3);
  a.fromBufferAttribute(p,g.index.getX(triangle));b.fromBufferAttribute(p,g.index.getX(triangle+1));c.fromBufferAttribute(p,g.index.getX(triangle+2));
  normal.crossVectors(edge.subVectors(b,a),new THREE.Vector3().subVectors(c,a)).normalize();
  if(normal.y<.59)continue; // Leave steep cliffs bare.
  const u=Math.sqrt(rnd()),v=rnd(),point=a.clone().multiplyScalar(1-u).addScaledVector(b,u*(1-v)).addScaledVector(c,u*v);
  if(point.y<groundHeight(point.x,point.z)+.35||point.y>104)continue;
  if(Math.abs(point.x+570)<13&&point.z>-746&&point.z<-670)continue;
  const patch=.5+.25*Math.sin(point.x*.023+Math.sin(point.z*.019)*2)+.25*Math.sin(point.z*.037+point.x*.011);
  if(rnd()>patch*(1-THREE.MathUtils.smoothstep(point.y,65,110)))continue;
  sites.push({point,height:2.5+rnd()*5.5,shade:rnd()});
 }
 const crownGeo=new THREE.IcosahedronGeometry(1,1),cp=crownGeo.attributes.position,shade=[];
 const color=new THREE.Color();
 for(let i=0;i<cp.count;i++){
  const x=cp.getX(i),y=cp.getY(i),z=cp.getZ(i);
  const wobble=1+.12*Math.sin(x*13+z*8)*Math.sin(y*11-x*3);
  cp.setXYZ(i,x*wobble,y*wobble,z*wobble);
  color.setRGB(.72+.18*(y+1)*.5,.78+.20*(y+1)*.5,.66+.18*(y+1)*.5);shade.push(color.r,color.g,color.b);
 }
 crownGeo.setAttribute('color',new THREE.Float32BufferAttribute(shade,3));crownGeo.computeVertexNormals();
 const crownMat=new THREE.MeshStandardMaterial({color:'#b0c995',vertexColors:true,roughness:1,envMapIntensity:.2,fog:false});
 crownMat.onBeforeCompile=shader=>{
  shader.uniforms.uTime=clock;shader.uniforms.uWind=wind;
  shader.uniforms.uAtmosphereLight=atmosphereUniforms.uAtmosphereLight;
  shader.fragmentShader='uniform float uAtmosphereLight;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','outgoingLight=mix(outgoingLight,vec3(.05,.085,.055)*uAtmosphereLight,.12);\n#include <opaque_fragment>');
  shader.vertexShader='uniform float uTime,uWind;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.x+=sin(uTime*.62+instanceMatrix[3].x*.17)*.045*uWind*max(0.,position.y+.5);');
 };
 const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.13,.28,1,5),new THREE.MeshStandardMaterial({color:'#514a35',roughness:1,fog:false}),sites.length);
 const crowns=new THREE.InstancedMesh(crownGeo,crownMat,sites.length*3),dummy=new THREE.Object3D();
 sites.forEach((site,i)=>{
  const {point:p,height:h}=site;
  dummy.position.copy(p).add(new THREE.Vector3(0,h*.35-.12,0));dummy.rotation.set(0,rnd()*6.28,0);dummy.scale.set(1,h*.7,1);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
  for(let j=0;j<3;j++){
   const angle=j*2.094+rnd()*.5,r=j===0?0:h*.22;
   dummy.position.set(p.x+Math.cos(angle)*r,p.y+h*(j===0?.70:.53),p.z+Math.sin(angle)*r);
   dummy.rotation.set(rnd()*.25,rnd()*6.28,rnd()*.25);
   dummy.scale.set(h*(.23+rnd()*.10),h*(.30+rnd()*.12),h*(.24+rnd()*.10));
   dummy.updateMatrix();crowns.setMatrixAt(i*3+j,dummy.matrix);
   color.setHSL(.24+site.shade*.06,.27+site.shade*.16,.065+site.shade*.055);crowns.setColorAt(i*3+j,color);
  }
 });
 trunks.name='Mountain broadleaf trunks';crowns.name='Mountain woodland patches';
 trunks.computeBoundingSphere();crowns.computeBoundingSphere();scene.add(trunks,crowns);
 document.body.dataset.mountainPlants=String(sites.length);
 return {sites,trunks,crowns};
}
