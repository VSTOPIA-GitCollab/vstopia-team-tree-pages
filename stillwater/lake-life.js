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

  // A fish displaces much more water than a raindrop: two staggered,
  // irregular wavefronts, discontinuous white foam and fine ballistic spray.
  // Keep rain's smooth, inexpensive rings in atmosphere.js unchanged.
  function makeImpactWaveGeometry(seed){
    const geo=new THREE.RingGeometry(.87,1.12,96,3);
    geo.rotateX(-Math.PI/2);
    const position=geo.attributes.position;
    for(let i=0;i<position.count;i++){
      const x=position.getX(i),z=position.getZ(i),a=Math.atan2(z,x);
      const r=Math.hypot(x,z);
      const noise=.080*Math.sin(a*5+seed)+.045*Math.sin(a*11-seed*.77)
        +.022*Math.sin(a*23+seed*1.4);
      const uneven=1+noise;
      position.setXYZ(i,x*uneven,.002*Math.sin(a*13),z*uneven);
    }
    position.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();
    return geo;
  }
  const waveGeometries=[makeImpactWaveGeometry(.63),makeImpactWaveGeometry(2.41)];
  const waveVertex=`
   varying vec2 vRippleXZ;
   void main(){vRippleXZ=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
  const waveFragment=`
   uniform float uOpacity,uAtmosphereLight;
   varying vec2 vRippleXZ;
   void main(){
     float angle=atan(vRippleXZ.y,vRippleXZ.x);
     float broken=sin(angle*13.0+sin(angle*5.0)*1.8)*.60+
       sin(angle*29.0-1.9)*.27+sin(angle*43.0+1.2)*.13;
     float whiter= smoothstep(-.35,.43,broken);
     float radial=length(vRippleXZ);
     float edge=1.0-smoothstep(.88,1.11,radial);
     float flecks=smoothstep(.58,.90,broken)*.38;
     float alpha=uOpacity*(.30+.70*whiter+flecks)*edge;
     if(alpha<.012)discard;
     vec3 foam=mix(vec3(.52,.68,.67),vec3(.91,.97,.95),whiter);
     gl_FragColor=vec4(foam*(.13+.87*uAtmosphereLight),alpha);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
   }`;
  function waveMaterial(){
    return new THREE.ShaderMaterial({
      uniforms:{uOpacity:{value:0},uAtmosphereLight:atmosphereUniforms.uAtmosphereLight},
      vertexShader:waveVertex,fragmentShader:waveFragment,
      transparent:true,depthWrite:false,side:THREE.DoubleSide,
      polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1
    });
  }
  // Procedural round alpha sprite: the original point sprites were square,
  // tiny and almost invisible. This shared texture is NOT a network asset.
  const diameter=32,rgba=new Uint8Array(diameter*diameter*4);
  for(let y=0;y<diameter;y++)for(let x=0;x<diameter;x++){
    const i=(y*diameter+x)*4;
    const r=Math.hypot((x+.5-diameter/2)/(diameter/2),(y+.5-diameter/2)/(diameter/2));
    rgba[i]=241;rgba[i+1]=250;rgba[i+2]=248;
    rgba[i+3]=Math.round(255*(1-THREE.MathUtils.smoothstep(r,.48,.96)));
  }
  const dropletMap=new THREE.DataTexture(rgba,diameter,diameter,THREE.RGBAFormat);
  dropletMap.colorSpace=THREE.SRGBColorSpace;
  dropletMap.minFilter=THREE.LinearFilter;dropletMap.magFilter=THREE.LinearFilter;
  dropletMap.needsUpdate=true;
  const axis=new THREE.Vector3(1,0,0),direction=new THREE.Vector3();
  const actors=[];let jumps=0;
  function impactEffect(seed){
    const group=new THREE.Group();group.name='Fish impact foam and turbulent ripples';
    const waves=waveGeometries.map(geo=>{
      const mesh=new THREE.Mesh(geo,waveMaterial());
      mesh.position.y=.09;mesh.visible=false;mesh.renderOrder=2;
      group.add(mesh);return mesh;
    });
    // Surface foam flecks around the turbulent wavefront (broken white dashes).
    const foamCount=lowPower?12:22;
    const foamGeometry=new THREE.BufferGeometry();
    foamGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(foamCount*3),3));
    const foamMaterial=new THREE.PointsMaterial({
      map:dropletMap,color:'#e9f6f0',size:lowPower?.20:.24,transparent:true,
      opacity:0,depthWrite:false,alphaTest:.04,sizeAttenuation:true
    });
    const foam=new THREE.Points(foamGeometry,foamMaterial);
    foam.visible=false;foam.frustumCulled=false;foam.renderOrder=3;group.add(foam);
    const n=lowPower?16:28;
    const droplets=new Float32Array(n*3),velocities=[],angles=[],radii=[];
    for(let k=0;k<n;k++){
      const a=rnd()*Math.PI*2,r=.22+rnd()*.66;
      velocities.push([Math.cos(a)*r,1.2+rnd()*2.4,Math.sin(a)*r]);
    }
    for(let k=0;k<foamCount;k++){
      angles.push(rnd()*Math.PI*2);
      radii.push(.72+rnd()*.48);
    }
    const sprayGeo=new THREE.BufferGeometry();
    sprayGeo.setAttribute('position',new THREE.BufferAttribute(droplets,3));
    const sprayMat=new THREE.PointsMaterial({
      map:dropletMap,color:'#f0faf5',size:lowPower?.14:.17,
      transparent:true,opacity:0,depthWrite:false,alphaTest:.04,sizeAttenuation:true
    });
    const spray=new THREE.Points(sprayGeo,sprayMat);
    spray.frustumCulled=false;spray.visible=false;spray.renderOrder=3;group.add(spray);
    root.add(group);
    return {group,waves,foam,angles,radii,spray,velocities,seed};
  }
  for(let i=0;i<3;i++){
    const group=new THREE.Group(),body=new THREE.Mesh(bodyGeo,skin),tail=new THREE.Mesh(finGeo,fins);
    body.scale.set(.34,.105,.09);group.add(body,tail);
    for(const side of [-1,1]){
      const eye=new THREE.Mesh(eyeGeo,eyeMat);
      eye.position.set(.225,.035,side*.067);group.add(eye);
    }
    group.visible=false;root.add(group);
    const launch=impactEffect(i*.8+.23),landing=impactEffect(i*.8+1.81);
    actors.push({group,tail,launch,landing,next:4+i*7.3,start:-100,site:null,duration:1.35+i*.11});
  }
  function splash(effect,age,x,z,strength){
    // Launch creates a subdued wake; landing emits a visibly stronger plume.
    // The two impacts evolve independently while sharing the simulation clock.
    const active=age>=0&&age<2.1;
    effect.group.visible=active;
    if(!active)return;
    const waveAge=Math.max(0,age);
    for(let i=0;i<effect.waves.length;i++){
      const wave=effect.waves[i],t=waveAge-(i*.23);
      wave.visible=t>=0&&t<1.8;
      if(!wave.visible)continue;
      const radius=.27+Math.pow(t/1.8,.83)*2.05;
      wave.position.set(x,.075+i*.006,z);
      wave.scale.set(radius,1,radius);
      wave.material.uniforms.uOpacity.value=strength*.75*Math.pow(1-t/1.8,1.2);
    }
    const fade=Math.max(0,1-waveAge/.78);
    const f=effect.foam,attribute=f.geometry.attributes.position;
    f.visible=fade>0;
    f.material.opacity=.80*fade*strength*(.15+.85*atmosphereUniforms.uAtmosphereLight.value);
    for(let k=0;k<effect.angles.length;k++){
      const a=effect.angles[k],r=effect.radii[k]*(.20+waveAge*1.55);
      const wobble=1+.12*Math.sin(a*7+effect.seed)+.07*Math.sin(a*17-effect.seed*3);
      attribute.setXYZ(k,x+Math.cos(a)*r*wobble,.098+Math.sin(a*9)*.009,z+Math.sin(a)*r*wobble);
    }
    attribute.needsUpdate=true;
    effect.spray.visible=waveAge<.65;
    effect.spray.material.opacity=Math.max(0,1-waveAge/.65)*.86*strength
      *(.20+.80*atmosphereUniforms.uAtmosphereLight.value);
    const positions=effect.spray.geometry.attributes.position;
    for(let j=0;j<effect.velocities.length;j++){
      const v=effect.velocities[j];
      positions.setXYZ(j,x+v[0]*waveAge,.10+Math.max(0,v[1]*waveAge-4.9*waveAge*waveAge),z+v[2]*waveAge);
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
    splash(a.launch,age,s.x,s.z,.52);
    splash(a.landing,age-a.duration,s.x+s.dx*s.distance,s.z+s.dz*s.distance,1);
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
