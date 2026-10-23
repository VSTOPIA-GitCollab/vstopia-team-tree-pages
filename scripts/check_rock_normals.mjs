import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../stillwater/vendor/three.module.js';
import {createDistantMountains} from '../stillwater/nature.js';
const src=readFileSync(new URL('../stillwater/nature.js',import.meta.url),'utf8');
const sceneSrc=readFileSync(new URL('../stillwater/scene.js',import.meta.url),'utf8');
THREE.TextureLoader.prototype.load=()=>new THREE.Texture();
const scene=createDistantMountains();
assert.equal(scene.children.length,3,'all ridge layers preserved');
for(const [i,ridge] of scene.children.entries()){
 assert.equal(ridge.name,'Horizon ridge '+(i+1));
 assert(ridge.material.isMeshStandardMaterial,'keep physical rock BRDF');
 assert(ridge.geometry.attributes.position.count===401*101,'terrain tessellation intact');
 const shader={
  uniforms:{},
  vertexShader:'#include <project_vertex>',
  fragmentShader:'#include <color_fragment>\n#include <roughnessmap_fragment>\n#include <normal_fragment_maps>\n#include <lights_fragment_end>\n#include <opaque_fragment>'
 };
 ridge.material.onBeforeCompile(shader);
 assert(shader.uniforms.uRockColor&&shader.uniforms.uRockNormal&&shader.uniforms.uRockRoughness);
 assert.equal(shader.uniforms.uRockSunDirection.value,scene.userData.rockSunDirection,'same live sun vector for every ridge');
 assert(shader.fragmentShader.includes('crispRockLight=smoothstep(-.035,.16,facingSun)'),'narrow directional shadow transition');
 assert(shader.fragmentShader.includes('rockShadowStrength=mix(.56,1.,crispRockLight)'),'shadow-side bounce is darker');
 assert(shader.fragmentShader.includes('reflectedLight.indirectDiffuse*=rockShadowStrength'),'physical PBR indirect light, not rock albedo tint');
 assert.equal(shader.uniforms.uRockNormal.value.colorSpace,THREE.NoColorSpace);
 assert.equal(shader.uniforms.uRockRoughness.value.colorSpace,THREE.NoColorSpace);
 assert.equal(shader.uniforms.uRockColor.value.colorSpace,THREE.SRGBColorSpace);
 assert.equal((shader.fragmentShader.match(/texture2D\(uRockNormal/g)||[]).length,3);
 for(const t of ['nx.xy+=rockN.zy','ny.xy+=rockN.xz','nz.xy+=rockN.xy',
   'normal=normalize(mat3(viewMatrix)*blended)','normalStrength=mix(.35,.78,nearDetail)',
   'nx.zyx*rockW.x+ny.xzy*rockW.y+nz.xyz*rockW.z']){
    assert(shader.fragmentShader.includes(t),'triplanar correction: '+t);
 }
 assert(!shader.fragmentShader.includes('nx.xy*=.48'),'weak old normal map not restored');
 assert.equal(ridge.material.customProgramCacheKey(),'rock-scan-woodland-v8-crisp-mountain-shadows');
 assert.equal(ridge.material.envMapIntensity,.08,'matte test uses lower environment reflection');
 assert(shader.fragmentShader.includes('roughnessFactor=mix(.90,.98,rawRockRoughness)'),
   'dry matte trial keeps scan roughness variation but avoids glossy patches');
 assert(shader.fragmentShader.includes('normalStrength=mix(.35,.78,nearDetail)'),
   'rock relief is softened without deleting the normal map');
}
function norm(n){const l=Math.hypot(...n);return n.map(v=>v/l);}
function swizzleNeutral(n){
 const weights=n.map(c=>Math.pow(Math.abs(c),4));
 const sum=weights.reduce((a,b)=>a+b,0);
 const nX=[n[2],n[1],n[0]];
 const nY=[n[0],n[2],n[1]];
 const nZ=[n[0],n[1],n[2]];
 return norm([0,1,2].map(k=>[nX[2-k],nY[[0,2,1][k]],nZ[k]].reduce((acc,v,i)=>acc+v*weights[i]/sum,0)));
}
for(const direction of [[.7,.5,.4],[-.8,.5,.2],[.2,-.8,-.6],[0,1,0],[-.4,.2,-.7]]){
 const n=norm(direction),actual=swizzleNeutral(n);
 assert(actual.every((v,i)=>Math.abs(v-n[i])<1e-10),'neutral normal map must preserve slope');
}
assert(sceneSrc.includes('nature.js?v=')&&sceneSrc.includes('rock-normal-v8-crisp-shadows'));
assert(sceneSrc.includes("scene.getObjectByName('Distant mountain horizon')?.userData.rockSunDirection?.copy(sunDir)"),'mountain shadow updates with light slider');
assert(!src.includes('rock-normal-qa')&&!sceneSrc.includes('rock-normal-qa'),'temporary QA hooks removed');
console.log('PASS rock normal PBR: 3 ridges, real triplanar 3-axis texture samples, neutral identity, sign consistency, NoColorSpace, cache rev');
