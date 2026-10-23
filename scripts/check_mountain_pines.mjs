import assert from 'node:assert/strict';
import * as THREE from '../stillwater/vendor/three.module.js';
import {createDistantMountains} from '../stillwater/nature.js';
import {addMountainPines,makeRidgeSampler,MOUNTAIN_PINE_BUDGET} from '../stillwater/mountain-pines.js';
import {readFileSync} from 'node:fs';

globalThis.document={body:{dataset:{}}};
THREE.TextureLoader.prototype.load=()=>new THREE.Texture();
for(const lowPower of [false,true]){
 const scene=new THREE.Scene();
 const mountains=createDistantMountains();
 scene.add(mountains);
 const ridges=[1,2,3].map(i=>scene.getObjectByName('Horizon ridge '+i));
 assert(ridges.every(x=>x?.isMesh),'all original 3 ridge meshes available');
 const before=ridges.map(x=>({
  positions:Array.from(x.geometry.attributes.position.array.slice(0,200)),
  material:x.material
 }));
 const sampler=makeRidgeSampler(ridges[0]);
 assert(sampler,'sample original displaced mesh');
 const test=sampler.sample(0,-940);
 assert(test&&Number.isFinite(test.y)&&test.normalY>0,'sampled ridge height/grade');
 assert.equal(sampler.sample(2000,-940),null,'no external floating plant');
 const out=addMountainPines({scene,lowPower,groundHeight:()=>6});
 const budget=lowPower?MOUNTAIN_PINE_BUDGET.mobile:MOUNTAIN_PINE_BUDGET.desktop;
 assert(out.centers.length>=3,'several terrain-following groves');
 assert(out.pineCount>10 && out.pineCount<=budget.pines,'pine pool is nonempty and bounded');
 assert(out.shrubCount>30 && out.shrubCount<=budget.shrubs,'dark cover nonempty and bounded');
 assert(out.pines.geometry.attributes.position.count>40,'multi-shelf tree silhouette, not one cone');
 assert(out.pines.instanceColor.count>=out.pineCount,'per-instance pine color');
 assert(out.shrubs.instanceColor.count>=out.shrubCount,'dark patch instance color');
 const mat=new THREE.Matrix4(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),size=new THREE.Vector3();
 for(const obj of [out.pines,out.shrubs]){
  for(let i=0;i<obj.count;i++){
   obj.getMatrixAt(i,mat);mat.decompose(position,rotation,size);
   assert([position.x,position.y,position.z,size.x,size.y,size.z].every(Number.isFinite));
   assert(size.x>0&&size.y>0&&size.z>0);
  }
 }
 for(let i=0;i<3;i++){
  assert.strictEqual(ridges[i].material,before[i].material,'original ridge shader unchanged');
  assert.deepEqual(Array.from(ridges[i].geometry.attributes.position.array.slice(0,200)),before[i].positions);
 }
 assert.equal(document.body.dataset.pineCount,String(out.pineCount));
 console.log('PASS alpine slopes',lowPower?'mobile':'desktop',{
  groves:out.centers.length,pines:out.pineCount,darkCover:out.shrubCount
 });
}
const sceneSrc=readFileSync(new URL('../stillwater/scene.js',import.meta.url),'utf8');
const oldWoodland='addMountainVegetation({scene,clock:time,wind,lowPower,groundHeight:distantMeadowHeight});';
assert(sceneSrc.includes(oldWoodland),'existing mountain broadleaf must remain');
assert(sceneSrc.includes('addMountainPines({scene,lowPower,groundHeight:distantMeadowHeight})'));
assert(sceneSrc.includes("range(.36,.83)")===false,'tiny near trees are replaced');
assert(sceneSrc.includes('treeHue+')&&sceneSrc.includes('treeLight+'),'per-tree tint retained');
