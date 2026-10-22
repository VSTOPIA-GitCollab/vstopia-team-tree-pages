import assert from 'node:assert/strict';
import * as THREE from '../stillwater/vendor/three.module.js';
import {atmosphereState} from '../stillwater/atmosphere.js';
import {createDistantMountains} from '../stillwater/nature.js';
import {addMountainWaterfall} from '../stillwater/mountain-waterfall.js';

// Endpoints, clamping and monotonic light response, independent of the UI.
assert.equal(atmosphereState(1,0).sun,1);
assert.equal(atmosphereState(0,0).sun,0);
assert.equal(atmosphereState(1,0).ambient,1);
assert.equal(atmosphereState(0,0).moon,1);
assert.deepEqual(atmosphereState(-3,4),atmosphereState(0,1));
for(let i=0;i<100;i++){
 const a=atmosphereState(i/100,.4),b=atmosphereState((i+1)/100,.4);
 assert(b.sun>=a.sun&&b.ambient>=a.ambient);
 assert(atmosphereState(i/100,1).sun<=atmosphereState(i/100,0).sun);
}

// Construct the real mountain mesh without fetching image pixels or WebGL.
THREE.TextureLoader.prototype.load=()=>new THREE.Texture();
globalThis.document={body:{dataset:{}}};
for(const lowPower of [false,true]){
 const scene=new THREE.Scene();scene.add(createDistantMountains());
 const clock={value:0};
 const result=addMountainWaterfall({scene,clock,lowPower,groundHeight:()=>0,
  leafGeometry:new THREE.PlaneGeometry(1,1),leafMaterial:new THREE.MeshStandardMaterial()});
 assert.equal(result.path.length,101);
 assert(result.path[0].y-result.path.at(-1).y>50,'cascade has a real vertical drop');
 for(let i=1;i<result.path.length;i++){
  assert(result.path[i].z>result.path[i-1].z,'flow advances down the ravine');
  assert(result.path[i].y<=result.path[i-1].y+.12,'water must not climb the ridge');
 }
 assert([...result.waterfall.geometry.attributes.position.array].every(Number.isFinite));
 assert.equal(result.waterfall.material.uniforms.uTime,clock,'flow uses the paused scene clock');
 assert.equal(result.plants,lowPower?20:48);
 assert.equal(scene.getObjectByName('Waterfall ravine vegetation').count,lowPower?1200:4800);
 const bounds=scene.getObjectByName('Horizon ridge 1').geometry.boundingBox;
 assert(bounds.containsPoint(new THREE.Vector3(result.base.x,0,result.base.z)),'pool belongs to mountain footprint');
}
console.log('PASS: atmosphere endpoints, monotonic light, actual mountain cascade descent, finite mesh, shared clock and mobile budgets.');
