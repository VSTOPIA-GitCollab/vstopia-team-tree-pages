import assert from 'node:assert/strict';
import * as THREE from '../stillwater/vendor/three.module.js';
import {findJumpSite,jumpPose,createLakeFish,addMountainVegetation} from '../stillwater/lake-life.js';
import {createDistantMountains} from '../stillwater/nature.js';
import {addMountainWaterfall} from '../stillwater/mountain-waterfall.js';

// Jump shapes use the same shared clock; at take-off and landing the body
// meets the water plane, and at mid-flight its height is maximal.
assert.equal(jumpPose(0).y,.015);
assert.equal(jumpPose(1).y,.015);
assert(jumpPose(.5).y>jumpPose(.25).y);
assert(jumpPose(.5).y>jumpPose(.75).y);
assert(jumpPose(.01).pitch>0 && jumpPose(.99).pitch<0);

// Dry lakes must produce zero fish events; wet corridors stay wholly wet.
const rnd=(()=>{let x=12345;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};})();
assert.equal(findJumpSite(()=>1,rnd),null);
const wet=findJumpSite(()=>-.8,rnd);
assert(wet&&wet.distance>=2.3&&wet.distance<=3.1);

// Render-independent actual Three.js scene probes for both budgets.
globalThis.document={body:{dataset:{}}};
THREE.TextureLoader.prototype.load=()=>new THREE.Texture();
for (const lowPower of [false,true]){
 const scene=new THREE.Scene();
 const clock={value:0};
 const fish=createLakeFish({scene,clock,height:()=>-.8,lowPower});
 assert.equal(fish.actors.length,3);
 assert.equal(scene.getObjectByName('Occasional jumping lake trout').children.length,9);
 fish.update();
 assert.equal(document.body.dataset.fishVisible,'0');
 clock.value=5;fish.update();
 assert(+document.body.dataset.fishJumps>=1,'wet lake should spawn jump');
 const count=+document.body.dataset.fishJumps;
 fish.update();assert.equal(+document.body.dataset.fishJumps,count,
   'same simulation time must never add a new event');
 clock.value=5.6;fish.update();
 assert(fish.actors.some(a=>a.group.visible),'at least one fish mid-flight');
 const saved=+document.body.dataset.fishJumps;
 fish.update();assert.equal(+document.body.dataset.fishJumps,saved);

 const scenery=new THREE.Scene();scenery.add(createDistantMountains());
 const flow=addMountainWaterfall({scene:scenery,clock,lowPower,
   groundHeight:()=>-1e6,leafGeometry:new THREE.PlaneGeometry(1,1),
   leafMaterial:new THREE.MeshStandardMaterial()});
 assert(flow.path.length>100);
 const mountain=addMountainVegetation({scene:scenery,clock,
   wind:{value:.65},lowPower,groundHeight:()=>-1e6});
 assert(mountain.sites.length<= (lowPower?900:2600));
 assert(mountain.sites.length>0,'mountain vegetation should be present');
 assert.equal(mountain.crowns.count,mountain.sites.length*3);
 assert(mountain.sites.every(({point})=>[point.x,point.y,point.z].every(Number.isFinite)));
 assert(mountain.sites.every(({point})=>point.y<=104));
 assert.equal(mountain.trunks.count,mountain.sites.length);
}
console.log('PASS: fish jump curve and wet-only site, shared paused clock, capped mountain vegetation, finite mesh, both GPU budgets.');
