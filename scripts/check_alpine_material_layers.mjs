// Owner rejected the v6/v6b alpine colour masks on 2026-10-23.
// Keep the original v5 mountain coloration, corrected triplanar normal,
// and dry roughness; do NOT bring back the v6 palette or vertex attributes.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../stillwater/vendor/three.module.js';

THREE.TextureLoader.prototype.load=()=>new THREE.Texture();
const {createDistantMountains}=await import('../stillwater/nature.js');
const ridges=createDistantMountains();
assert.equal(ridges.children.length,3);
const expected=[
 'float woodlandPatch=.5+.25*sin(vRockWorld.x*.023+sin(vRockWorld.z*.019)*2.)+.25*sin(vRockWorld.z*.037+vRockWorld.x*.011);',
 'float vegetation=smoothstep(.30,.82,rockN.y)*(1.-smoothstep(70.,130.,vRockWorld.y))*(.35+.65*woodlandPatch);',
 'vec3 undergrowth=vec3(.065,.14,.035)*(.82+mineral*.65);',
 'diffuseColor.rgb*=mix(mineral,undergrowth,vegetation*.91);',
 'roughnessFactor=mix(.90,.98,rawRockRoughness)',
 'normalStrength=mix(.35,.78,nearDetail)',
 'vec3 blended=normalize(nx.zyx*rockW.x+ny.xzy*rockW.y+nz.xyz*rockW.z)'
];
for(let i=0;i<3;i++){
 const mesh=ridges.children[i];
 assert.equal(mesh.name,'Horizon ridge '+(i+1));
 assert.equal(mesh.geometry.attributes.position.count,401*101);
 assert.equal(mesh.geometry.getAttribute('aAlpineMask'),undefined,'rejected vertex material masks removed');
 assert.equal(mesh.material.envMapIntensity,.08,'dry matte rock preserved');
 const shader={
  uniforms:{},vertexShader:'#include <project_vertex>',
  fragmentShader:'#include <color_fragment>\n#include <roughnessmap_fragment>\n#include <normal_fragment_maps>\n#include <lights_fragment_end>\n#include <opaque_fragment>'
 };
 mesh.material.onBeforeCompile(shader);
 for(const token of expected)assert(shader.fragmentShader.includes(token),'restored v5: '+token);
 for(const forbidden of ['alpineSurface','alpineBroad','alpineMottle','forestTint','meadowTint','vAlpineMask','aAlpineMask']){
  assert(!shader.fragmentShader.includes(forbidden),'rejected shading fragment: '+forbidden);
  assert(!shader.vertexShader.includes(forbidden),'rejected shading vertex: '+forbidden);
 }
 assert.equal(mesh.material.customProgramCacheKey(),'rock-scan-woodland-v8-crisp-mountain-shadows');
}
const src=readFileSync(new URL('../stillwater/nature.js',import.meta.url),'utf8');
const scene=readFileSync(new URL('../stillwater/scene.js',import.meta.url),'utf8');
assert(!src.includes('alpineMasks.push')&&!src.includes("setAttribute('aAlpineMask'"));
assert(scene.includes('addMountainVegetation({scene,clock:time,wind,lowPower,groundHeight:distantMeadowHeight})'));
assert(scene.includes('rock-normal-v8-crisp-shadows'));
console.log('PASS rejected v6/v6b material rollback: original green/rock v5 palette, original mountain geometry and all woodland preserved');
