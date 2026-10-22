import assert from 'node:assert/strict';
import * as THREE from '../stillwater/vendor/three.module.js';
import {createMysticTree} from '../stillwater/nature.js';
import {barkHeight,createSurfaceMaps,displaceBarkGeometry,canopyOcclusion} from '../stillwater/surface-detail.js';
for(let i=0;i<30;i++){
 const u=i*.137,v=i*.213;
 assert(Math.abs(barkHeight(u,v)-barkHeight(u+1,v))<1e-10,'U seam');
 assert(Math.abs(barkHeight(u,v)-barkHeight(u,v+1))<1e-10,'V seam');
}
for(const small of [false,true])for(const kind of ['bark','leaf']){
 const maps=createSurfaceMaps(kind,small);
 assert.equal(maps.map.colorSpace,THREE.SRGBColorSpace);
 assert.equal(maps.normalMap.colorSpace,THREE.NoColorSpace);
 assert.equal(maps.aoMap.colorSpace,THREE.NoColorSpace);
 const data=maps.normalMap.image.data;
 let variation=0;
 for(let i=0;i<data.length;i+=4){
  const length=Math.hypot(data[i]/255*2-1,data[i+1]/255*2-1,data[i+2]/255*2-1);
  assert(Math.abs(length-1)<.015,'unit normal');variation+=Math.abs(data[i]-128);
 }
 assert(variation>data.length*.02,'non-flat normal map');
 for(const t of new Set(Object.values(maps)))t?.dispose();
}
const model=createMysticTree(),g=model.geometry;
const before=g.attributes.position.array.slice(),indices=g.index.array.slice();
displaceBarkGeometry(g);assert.equal(g.attributes.position.array.length,before.length);assert.deepEqual(g.index.array,indices);
let moved=0,maxMove=0;
for(let i=0;i<before.length;i+=3){
 const d=Math.hypot(...[0,1,2].map(k=>g.attributes.position.array[i+k]-before[i+k]));
 assert(Number.isFinite(d));if(d>1e-5)moved++;maxMove=Math.max(d,maxMove);
}
assert(moved>1000);assert(maxMove<.06);assert([...g.attributes.normal.array].every(Number.isFinite));
const ao=canopyOcclusion(model.leaves);assert.equal(ao.length,model.leaves.length);
assert(ao.some(x=>x<.65));assert(ao.some(x=>x>.95));assert(ao.every(x=>x>=.45&&x<=1));
console.log(JSON.stringify({status:'PASS',barkVertices:g.attributes.position.count,verticesDisplaced:moved,maxDisplacementMetres:maxMove,leafInstances:model.leaves.length,normalMaps:'unit vectors; linear data; non-flat',anchors:'vertex count/index order preserved'}));
