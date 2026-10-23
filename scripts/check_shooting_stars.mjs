import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createShootingStars,meteorVisibility,nextMeteorDelay,meteorGroupSize,METEOR_SECTORS} from '../stillwater/shooting-stars.js';

const close=(x,y)=>Math.abs(x-y)<1e-10;
assert(close(meteorVisibility(1,0),0),'no daytime meteors');
assert(close(meteorVisibility(0,0),1),'full visibility in a dark clear sky');
assert(close(meteorVisibility(0,1),0),'heavy rain hides meteors');
assert(meteorVisibility(.42,0)>0 && meteorVisibility(.42,0)<meteorVisibility(.20,0));
assert(meteorVisibility(.20,.6)<meteorVisibility(.20,0));
assert.equal(nextMeteorDelay(()=>0),70);
assert.equal(nextMeteorDelay(()=>1),180);
assert(nextMeteorDelay(()=>.5,100)<nextMeteorDelay(()=>.5,25));
assert(nextMeteorDelay(()=>.5,5)>nextMeteorDelay(()=>.5,25));
assert(nextMeteorDelay(()=>1,100)<3,'maximum frequency supports quick observations');
assert.equal(meteorGroupSize(25),1);
assert.equal(meteorGroupSize(75),2);
assert.equal(meteorGroupSize(100),3);

class V3{
 constructor(x=0,y=0,z=0){this.set(x,y,z);}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
 copy(v){return this.set(v.x,v.y,v.z);}
 sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}
 multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;}
 addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;}
 dot(v){return this.x*v.x+this.y*v.y+this.z*v.z;}
 normalize(){return this.multiplyScalar(1/(Math.hypot(this.x,this.y,this.z)||1));}
 applyQuaternion(){return this;} // identity test camera
 unproject(){return this;}
}
const meshes=[];
const THREE={
 Vector3:V3,PlaneGeometry:class {},
 ShaderMaterial:class{constructor(x){Object.assign(this,x);}},
 Mesh:class{constructor(geo,mat){this.geometry=geo;this.material=mat;this.position=new V3();this.visible=true;}},
 AdditiveBlending:2
};
const scene={add:x=>meshes.push(x)},camera={position:new V3(),quaternion:{},updateMatrixWorld(){}};
const clock={value:0},uniforms={uDaylight:{value:1},uRain:{value:0}};
globalThis.document={body:{dataset:{}}};
const stars=createShootingStars({THREE,scene,camera,clock,atmosphereUniforms:uniforms});
assert.equal(meshes.length,METEOR_SECTORS,'8 bounded pooled sky sectors');
assert.equal(new Set(meshes.map(x=>x.geometry)).size,1,'all meteors share geometry');
assert.equal(stars.meteors.length,METEOR_SECTORS);
assert(meshes.every(x=>x.renderOrder===-9998&&x.visible===false));
assert.equal(stars.meteor.renderOrder,-9998);
for(let t=0;t<300;t+=1){clock.value=t;stars.update();}
assert.equal(stars.getState().frequency,25);
stars.setFrequency(0);
assert.equal(stars.getState().frequency,0);
clock.value=301;stars.update();assert.equal(stars.getState().active,false);
stars.setFrequency(100);
assert(stars.getState().next>clock.value&&stars.getState().next<clock.value+23);
stars.setFrequency(25);
assert.equal(stars.getState().count,0,'daytime spawns prohibited');
uniforms.uDaylight.value=0;
let activeSeen=false,frozen=false;
for(let tick=3000;tick<6600;tick++){
 clock.value=tick/10;stars.update();
 if(stars.getState().active&&!frozen){
  const progress=stars.meteor.material.uniforms.uProgress.value;
  stars.update();
  assert.equal(stars.meteor.material.uniforms.uProgress.value,progress,'Pause holds streak');
  frozen=true;
 }
 activeSeen ||= stars.getState().active;
}
assert(activeSeen,'rare event eventually visible in clear night');
assert(stars.getState().count>0 && stars.getState().count<8,'sparse activity');
uniforms.uRain.value=1;stars.update();
assert.equal(stars.meteor.visible,false,'rain covers even an active streak');
uniforms.uDaylight.value=1;uniforms.uRain.value=0;stars.update();
assert.equal(stars.meteor.visible,false,'no daytime exposure');
const src=readFileSync(new URL('../stillwater/shooting-stars.js',import.meta.url),'utf8');
assert(!src.includes('requestAnimationFrame')&&!src.includes('setInterval('),'shared clock only');
assert(src.includes('depthTest:true')&&src.includes('depthWrite:false'),'mountain occlusion');
assert(src.includes('a.mesh.position.copy(camera.position)'),'no sky parallax');
assert(src.includes('(sectorCursor*3)%METEOR_SECTORS'),'compass directions cover the full sky');
const highClock={value:0};
const dirStars=createShootingStars({THREE,scene:{add(){}},camera,clock:highClock,atmosphereUniforms:{uDaylight:{value:0},uRain:{value:0}}});
dirStars.setFrequency(100);
let peakActive=0;
for(let tick=0;tick<2400;tick++){
 highClock.value=tick/20;dirStars.update();
 peakActive=Math.max(peakActive,dirStars.getState().activeCount);
}
assert.equal(dirStars.getState().sectorsSeen.length,METEOR_SECTORS,'360 degree coverage across all 8 sectors');
assert(peakActive>=3,'multiple distributed meteors at high frequency');
dirStars.setFrequency(0);dirStars.update();
assert.equal(dirStars.getState().activeCount,0,'off disables all eight actors');
const html=readFileSync(new URL('../stillwater/index.html',import.meta.url),'utf8');
const sceneSrc=readFileSync(new URL('../stillwater/scene.js',import.meta.url),'utf8');
assert(html.includes('id="meteor-frequency"')&&html.includes('value="25"'),'atmosphere slider present');
assert(sceneSrc.includes('shootingStars.setFrequency(value)'),'slider updates real meteor scheduler');
console.log('PASS meteor photometry, weather gating, 70–180s rarity, clock Pause, pooled geometry, no new RAF');
