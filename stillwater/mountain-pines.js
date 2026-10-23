// Additive, seeded alpine conifer groves and deep-green groundcover islands.
// Existing mountain broadleaf trees/meshes, photographic alpine backplates,
// sky shaders and waterfall remain unchanged. Only two instanced draw groups.
import * as THREE from './vendor/three.module.js';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,t)=>a+(b-a)*t;
export const MOUNTAIN_PINE_BUDGET={desktop:{pines:310,shrubs:470},mobile:{pines:110,shrubs:160}};
export function makeRidgeSampler(ridge){
 // THREE.PlaneGeometry(2800,570,400,100) in nature.js; the source mesh
 // already owns every final displaced height, avoiding fake floating plants.
 const g=ridge.geometry,p=g.attributes.position,cols=401,rows=101;
 if(p.count!==cols*rows)return null;
 const x0=p.getX(0),x1=p.getX(cols-1),z0=p.getZ(0),z1=p.getZ((rows-1)*cols);
 const dx=(x1-x0)/(cols-1),dz=(z1-z0)/(rows-1);
 const sample=(x,z)=>{
  const u=(x-x0)/dx,v=(z-z0)/dz;
  if(u<1||u>cols-2||v<1||v>rows-2)return null;
  const i=Math.floor(u),j=Math.floor(v),fu=u-i,fv=v-j;
  const height=(ii,jj)=>p.getY(jj*cols+ii);
  const a=lerp(height(i,j),height(i+1,j),fu),b=lerp(height(i,j+1),height(i+1,j+1),fu);
  const y=lerp(a,b,fv);
  // Evaluate actual local grade from displaced vertices, not a sphere.
  const sy=(lerp(height(i+1,j),height(i+1,j+1),fv)-
            lerp(height(i-1,j),height(i-1,j+1),fv))/(2*dx);
  const sz=(lerp(height(i,j+1),height(i+1,j+1),fu)-
            lerp(height(i,j-1),height(i+1,j-1),fu))/(2*dz);
  return {x,y,z,normalY:1/Math.sqrt(1+sy*sy+sz*sz)};
 };
 return {sample,bounds:{x0,x1,z0,z1}};
}

function pineGeometry(){
 // Branch shelf rings are irregular, not a primitive single perfect cone.
 const y=[.24,.28,.36,.43,.45,.53,.60,.63,.70,.76,.79,.86,.92,.96,1.0];
 const r=[.11,.15,.31,.19,.33,.23,.27,.15,.24,.13,.17,.09,.105,.034,0];
 const pos=[],color=[],idx=[],N=7;
 for(let j=0;j<y.length;j++){
  for(let k=0;k<N;k++){
   const a=k/N*Math.PI*2,wave=1+.075*Math.sin(j*3.1+k*2.2);
   pos.push(Math.cos(a)*r[j]*wave,y[j],Math.sin(a)*r[j]*wave);
   const m=(k%3)*.055,shadow=j%3===1?.73:.90;
   color.push((.51+m)*shadow,(.75+m*.55)*shadow,(.48+m*.4)*shadow);
   if(j<y.length-1){
    const q=j*N+k,next=j*N+(k+1)%N;
    idx.push(q,next,q+N,q+N,next,next+N);
   }
  }
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(color,3));
 g.setIndex(idx);g.computeVertexNormals();return g;
}
const shadeSeed=(x,z)=>Math.sin(x*.019+Math.sin(z*.013)*2.1)*Math.sin(z*.012+x*.008);

export function addMountainPines({scene,lowPower,groundHeight}){
 const ridges=[1,2].map(i=>scene.getObjectByName('Horizon ridge '+i));
 const samplers=ridges.map(makeRidgeSampler).filter(Boolean);
 if(samplers.length!==2)return {pines:null,shrubs:null,centers:[],pineCount:0,shrubCount:0};
 let seed=0x3f791b;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const pick=(lo,hi)=>lo+(hi-lo)*rnd();
 const safe=(s,x,z,minH=7,maxH=79)=>{
  const point=s.sample(x,z);
  if(!point||point.normalY<.64||point.y<minH||point.y>maxH)return null;
  if(point.y<groundHeight(x,z)+1.5)return null;
  // Never place vegetation in the carved cascade / lake-water channel.
  if(Math.abs(x+570)<26&&z>-763&&z<-646)return null;
  return point;
 };
 const budget=lowPower?MOUNTAIN_PINE_BUDGET.mobile:MOUNTAIN_PINE_BUDGET.desktop;
 const centers=[];
 for(let tries=0;tries<600&&centers.length<(lowPower?9:17);tries++){
  const s=samplers[rnd()<.86?0:1];
  const x=pick(-1050,1050),z=pick(s.bounds.z0+25,s.bounds.z1-25);
  const point=safe(s,x,z,9,72);
  if(!point||shadeSeed(x,z)<-.09||centers.some(q=>Math.hypot(q.x-x,q.z-z)<65))continue;
  centers.push({...point,sampler:s,radius:pick(25,61)});
 }
 const pineMaterial=new THREE.MeshStandardMaterial({
  vertexColors:true,roughness:1,metalness:0,side:THREE.DoubleSide,fog:false
 });
 const pine=new THREE.InstancedMesh(pineGeometry(),pineMaterial,budget.pines);
 pine.name='Added alpine pine groups';pine.castShadow=false;pine.receiveShadow=true;
 const shrub=new THREE.InstancedMesh(
  new THREE.IcosahedronGeometry(1,1),
  new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1,fog:false,flatShading:true}),
  budget.shrubs
 );
 shrub.name='Added dark green alpine vegetation patches';shrub.castShadow=false;shrub.receiveShadow=true;
 const shades=['#173922','#1d4529','#285137','#355e37','#2a4c31'];
 const shrubTones=['#142f20','#193925','#20482b','#254e2d'];
 const pineColors=shades.map(t=>new THREE.Color(t)),shrubColors=shrubTones.map(t=>new THREE.Color(t));
 const dummy=new THREE.Object3D(),tint=new THREE.Color();
 let pi=0,si=0;
 // Every patch is planted ON a real mountain mesh height field.
 for(const c of centers){
  const count=lowPower?18:40;
  for(let k=0;k<count;k++){
   const a=pick(0,Math.PI*2),rad=Math.sqrt(rnd())*c.radius;
   const x=c.x+Math.cos(a)*rad,z=c.z+Math.sin(a)*rad;
   const p=safe(c.sampler,x,z,6,84);
   if(!p)continue;
   if(si<budget.shrubs&&rnd()<.89){
    // Low clustered shrubs create the large dark-green landscape patches,
    // without painting over any existing photographic mountain pixel.
    const w=pick(3.4,8.0)*(p.normalY<.78?.78:1);
    dummy.position.set(x,p.y+.45,z);dummy.rotation.set(0,pick(0,6.28),0);
    dummy.scale.set(w,pick(.75,1.8),w*pick(.66,1.22));
    dummy.updateMatrix();shrub.setMatrixAt(si,dummy.matrix);
    tint.copy(shrubColors[Math.floor(rnd()*shrubColors.length)]).multiplyScalar(pick(.85,1.11));
    shrub.setColorAt(si++,tint);
   }
   if(pi<budget.pines&&rnd()<.49){
    const h=pick(7,15.5)*(1-.13*THREE.MathUtils.smoothstep(p.y,45,82));
    dummy.position.set(x,p.y-.12,z);dummy.rotation.set(0,pick(0,6.28),0);
    dummy.scale.set(h*pick(.72,1.22),h,h*pick(.72,1.22));
    dummy.updateMatrix();pine.setMatrixAt(pi,dummy.matrix);
    tint.copy(pineColors[Math.floor(rnd()*pineColors.length)]).multiplyScalar(pick(.87,1.09));
    pine.setColorAt(pi++,tint);
   }
  }
 }
 pine.count=pi;shrub.count=si;
 if(pi){pine.instanceMatrix.needsUpdate=true;pine.instanceColor.needsUpdate=true;pine.computeBoundingSphere();scene.add(pine);}
 if(si){shrub.instanceMatrix.needsUpdate=true;shrub.instanceColor.needsUpdate=true;shrub.computeBoundingSphere();scene.add(shrub);}
 document.body.dataset.pineCount=String(pi);document.body.dataset.mountainDarkPatchCount=String(si);
 return {pines:pine,shrubs:shrub,centers,pineCount:pi,shrubCount:si};
}
