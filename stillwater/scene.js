import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { createMysticTree, createDistantMountains } from './nature.js';
import { mountVstopiaTreeBridge } from './vstopia-bridge.js';

// Reproducible, entirely local landscape. All positions are in metres.
const $ = id => document.getElementById(id);
const V = (x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
let seed=73021;
function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
const range=(a,b)=>a+(b-a)*rand();
const fract=x=>x-Math.floor(x), mix=(a,b,t)=>a+(b-a)*t;
function hash(x,z){return fract(Math.sin(x*127.1+z*311.7)*43758.5453123);}
function noise(x,z){let a=Math.floor(x),b=Math.floor(z),u=fract(x),v=fract(z);u=u*u*(3-2*u);v=v*v*(3-2*v);return mix(mix(hash(a,b),hash(a+1,b),u),mix(hash(a,b+1),hash(a+1,b+1),u),v);}
function fbm(x,z){let a=.5,r=0;for(let i=0;i<5;i++){r+=a*noise(x,z);x=x*2.03+13.7;z=z*2.03+9.2;a*=.5;}return r;}
function height(x,z){
 const r=Math.sqrt((x/36)**2+((z-4)/29)**2);
 const edge=r+.055*Math.sin(x*.32)+.035*Math.cos(z*.47)+.07*noise(x*.15,z*.15);
 return Math.tanh((edge-1)*5.0)*2.1 + (fbm(x*.15,z*.15)-.4)*1.5 + Math.max(0,edge-1.5)*1.4;
}
const scene=new THREE.Scene();scene.background=new THREE.Color('#c6d8db');scene.fog=new THREE.FogExp2('#a6b8b7',.0045);
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(e){throw new Error('WebGL 2 is required. Enable hardware acceleration in your browser. '+e.message);}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;renderer.outputColorSpace=THREE.SRGBColorSpace;
$('scene').appendChild(renderer.domElement);
const camera=new THREE.PerspectiveCamera(46,innerWidth/innerHeight,.2,6500);
const heroPos=V(-5,height(-5,-26),-26), focus=heroPos.clone().add(V(0,9.0,0));
const home=V(31,12.5,39);
camera.position.copy(home);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(focus);controls.enableDamping=true;controls.dampingFactor=.055;controls.minDistance=7;controls.maxDistance=135;controls.maxPolarAngle=Math.PI*.487;controls.minPolarAngle=.16;controls.panSpeed=.65;controls.rotateSpeed=.45;controls.zoomSpeed=.75;controls.autoRotateSpeed=.35;controls.update();
const sun=new THREE.DirectionalLight('#fff0cf',3.0);sun.position.set(-45,65,30);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-55,right:55,top:55,bottom:-55,near:1,far:180});sun.shadow.bias=-.00018;sun.shadow.normalBias=.04;sun.shadow.radius=2;sun.target.position.set(-4,0,-18);scene.add(sun,sun.target);
scene.add(new THREE.HemisphereLight('#c4dbe5','#45513a',1.8));
const sky=new Sky();sky.scale.setScalar(10000);scene.add(sky);
const su=sky.material.uniforms;su.turbidity.value=5;su.rayleigh.value=1.3;su.mieCoefficient.value=.006;su.mieDirectionalG.value=.83;
const sunDir=V(-.5,.65,.35).normalize();su.sunPosition.value.copy(sunDir);
// The prefiltered sky supplies physical reflections and indirect light to PBR surfaces.
const envScene=new THREE.Scene();const envSky=sky.clone();envSky.scale.setScalar(1000);envScene.add(envSky);const pmrem=new THREE.PMREMGenerator(renderer);let envTarget=pmrem.fromScene(envScene,.04,.1,2000);scene.environment=envTarget.texture;
const wind={value:.65},time={value:0};
function sway(material,kind='leaf'){
 material.onBeforeCompile=shader=>{
  shader.uniforms.uTime=time;shader.uniforms.uWind=wind;
  shader.vertexShader=`uniform float uTime; uniform float uWind;
  vec3 treeSway(vec3 p){float h=max(0.,p.y);float w=pow(h*.09,1.8);p.x+=sin(uTime*.58+h*.09)*.12*uWind*w;p.z+=cos(uTime*.43+h*.065)*.07*uWind*w;return p;}
  `+shader.vertexShader;
  const leaf=kind==='leaf',grass=kind==='grass';
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vec3 anchor=vec3(0.0);
   #ifdef USE_INSTANCING
    anchor=instanceMatrix[3].xyz;
   #endif
   float t=uTime;float phase=anchor.x*.58+anchor.z*.37;
   ${leaf?`transformed.z+=(sin(t*3.3+phase)*.028+sin(t*5.1+phase*1.7)*.012)*uWind*position.y;
    #ifdef USE_INSTANCING
     vec3 leafInTree=(instanceMatrix*vec4(transformed,1.)).xyz;
     transformed+=inverse(mat3(instanceMatrix))*(treeSway(leafInTree)-leafInTree);
    #endif`:
    grass?`float h=max(0.,position.y);float gust=sin(t*1.4+phase)*.32+sin(t*2.6+phase*.6)*.14;
    transformed.x+=gust*uWind*h*h;transformed.z+=cos(t+phase)*.12*uWind*h*h;`:
    `transformed=treeSway(transformed);`}
  `);
  if(leaf && !material.isMeshDepthMaterial){
   shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`float backGlow=pow(max(0.,dot(normal,normalize(vec3(-.5,.65,.35)))),2.0);
    outgoingLight+=diffuseColor.rgb*.20*backGlow;
    #include <opaque_fragment>`);
  }
 };
 material.customProgramCacheKey=()=>`wind-${kind}-${material.type}`;return material;
}
function canvasTexture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;}
const bark=canvasTexture(512,1024,(ctx,w,h)=>{const im=ctx.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const n=fbm(x*.10,y*.008),fine=noise(x*.7,y*.10),groove=Math.pow(Math.abs(Math.sin(x*.15+noise(x*.015,y*.006)*9)),14);const c=68+n*58+fine*19-groove*38;const i=(y*w+x)*4;im.data[i]=c*1.03;im.data[i+1]=c*.89;im.data[i+2]=c*.72;im.data[i+3]=255;}ctx.putImageData(im,0,0);});bark.repeat.set(2,2);
const rockTex=canvasTexture(1024,1024,(ctx,w,h)=>{const im=ctx.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){let n=fbm(x*.018,y*.018),fine=noise(x*.6,y*.6),ridge=Math.abs(noise(x*.07,y*.07)-.5);const c=66+n*102+fine*24-ridge*25,i=(y*w+x)*4;const moss=noise(x*.025+60,y*.025)> .69;im.data[i]=moss?c*.70:c;im.data[i+1]=moss?c*.79:c*.99;im.data[i+2]=moss?c*.43:c*.91;im.data[i+3]=255;}ctx.putImageData(im,0,0);});
const groundTex=new THREE.TextureLoader().load('./assets/ground.jpg');groundTex.wrapS=groundTex.wrapT=THREE.RepeatWrapping;groundTex.repeat.set(55,55);groundTex.colorSpace=THREE.SRGBColorSpace;groundTex.anisotropy=8;
const terrainGeo=new THREE.PlaneGeometry(340,340,300,300);terrainGeo.rotateX(-Math.PI/2);
const tp=terrainGeo.attributes.position,colors=[];const tc=new THREE.Color();
for(let i=0;i<tp.count;i++){const x=tp.getX(i),z=tp.getZ(i),h=height(x,z);tp.setY(i,h);const n=fbm(x*.22,z*.22);tc.set(h<.25?'#5b5946':h<.8?'#80836b':'#78816a');tc.multiplyScalar(.8+n*.5);colors.push(tc.r,tc.g,tc.b);}terrainGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));terrainGeo.computeVertexNormals();
const terrain=new THREE.Mesh(terrainGeo,new THREE.MeshStandardMaterial({map:groundTex,bumpMap:groundTex,bumpScale:.23,vertexColors:true,roughness:1}));terrain.receiveShadow=true;scene.add(terrain);
// Three photographed rock maps are CC0 Poly Haven Aerial Rocks 02, retained
// from our earlier local alpine prototype (never fetched from a runtime CDN).
const rockLoader=new THREE.TextureLoader();
const rockColor=rockLoader.load('./assets/rock-pbr/aerial-rocks-color.jpg');
const rockNormal=rockLoader.load('./assets/rock-pbr/aerial-rocks-normal.jpg');
const rockRoughness=rockLoader.load('./assets/rock-pbr/aerial-rocks-roughness.jpg');
rockColor.colorSpace=THREE.SRGBColorSpace;
for(const t of [rockColor,rockNormal,rockRoughness]){
 t.wrapS=t.wrapT=THREE.RepeatWrapping;
 t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
}
scene.add(createDistantMountains({rockColor,rockNormal,rockRoughness}));

// Shared surface elevation for the distant meadow and every grass root.
function distantMeadowHeight(x,z){
 const r=Math.hypot(x,z),nearH=height(x,z)-.38;
 const farH=6.4+(fbm(x*.012,z*.012)-.43)*13+
   (Math.sin(x*.004+z*.003)*3.2+Math.cos(z*.006)*2.8);
 return THREE.MathUtils.lerp(nearH,farH,THREE.MathUtils.smoothstep(r,250,800));
}
// Seamless terrain continuation: the old RingGeometry began at Y=1 while
// the meadow edge was higher. It also lacked ground texture/vertex colors,
// creating a pale band behind the grass and a visible discontinuity.
// Use exactly the same world-space color/UV basis as the near ground.
const farGroundGeo=new THREE.RingGeometry(144,2400,256,150);
const fgp=farGroundGeo.attributes.position, fgu=farGroundGeo.attributes.uv;
const farColors=[];
for(let i=0;i<fgp.count;i++){
 const oldX=fgp.getX(i),oldZ=fgp.getZ(i),oldR=Math.hypot(oldX,oldZ);
 const t=THREE.MathUtils.clamp((oldR-144)/(2400-144),0,1);
 const r=144+2256*Math.pow(t,1.8);
 const x=oldX*(r/Math.max(.001,oldR)),z=oldZ*(r/Math.max(.001,oldR));
 fgp.setXYZ(i,x,distantMeadowHeight(x,z),z);
 // Near ground's PlaneGeometry(340m) has UV=(x+170)/340 and repeat=55.
 fgu.setXY(i,(x+170)*(55/340),(170-z)*(55/340));
 const n=fbm(x*.22,z*.22),h=height(x,z);
 tc.set(h<.25?'#5b5946':h<.8?'#80836b':'#78816a');
 tc.multiplyScalar(.8+n*.5);
 farColors.push(tc.r,tc.g,tc.b);
}
farGroundGeo.setAttribute('color',new THREE.Float32BufferAttribute(farColors,3));
farGroundGeo.computeVertexNormals();
const farGround=new THREE.Mesh(farGroundGeo,new THREE.MeshStandardMaterial({
 map:groundTex,bumpMap:groundTex,bumpScale:.23,vertexColors:true,
 color:'#ffffff',roughness:1,metalness:0,envMapIntensity:.15
}));
farGround.name='Textured seamless distant meadow (no pale band)';
farGround.receiveShadow=true;
scene.add(farGround);
// All tree limbs are swept, tapered and ridged; no foliage spheres or billboards.
class MeshBuilder{
 constructor(){this.p=[];this.n=[];this.uv=[];this.idx=[];}
 tube(points,r0,r1,sides=8){const start=this.p.length/3;for(let j=0;j<points.length;j++){let tangent=points[Math.min(j+1,points.length-1)].clone().sub(points[Math.max(j-1,0)]).normalize();let right=V(0,0,1).cross(tangent).normalize();if(right.lengthSq()<.1)right=V(1,0,0);const up=tangent.clone().cross(right);const t=j/(points.length-1),radius=mix(r0,r1,t);for(let k=0;k<=sides;k++){const a=k/sides*Math.PI*2;const normal=right.clone().multiplyScalar(Math.cos(a)).addScaledVector(up,Math.sin(a));const q=points[j].clone().addScaledVector(normal,radius*(1+.08*Math.sin(a*5+t*9)));this.p.push(q.x,q.y,q.z);this.n.push(normal.x,normal.y,normal.z);this.uv.push(k/sides,t*3);if(j<points.length-1 && k<sides){const a0=start+j*(sides+1)+k,b=a0+sides+1;this.idx.push(a0,a0+1,b,b,a0+1,b+1);}}}}
 geometry(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(this.uv,2));g.setIndex(this.idx);g.computeBoundingSphere();return g;}
}
const leafGeo=(()=>{const p=[],uv=[],idx=[];const segments=8;for(let i=0;i<=segments;i++){const t=i/segments,y=t*.95;const width=Math.sin(Math.PI*t)**.85*.25*(1+.035*Math.sin(t*36));for(let j=0;j<3;j++){let x=(j-1)*width;p.push(x,y,Math.sin(t*Math.PI)*.09+(j===1?0:.045));uv.push(j/2,t);}if(i<segments){let k=i*3;idx.push(k,k+3,k+1,k+1,k+3,k+4,k+1,k+4,k+2,k+2,k+4,k+5);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;})();
const leafMap=canvasTexture(128,256,(ctx,w,h)=>{const im=ctx.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const v=noise(x*.24,y*.12)*.15;const vein=Math.abs(x-w/2)<1.8 || Math.abs(fract((y+Math.abs(x-w/2)*1.4)/34)-.5)<.025;const c=vein?.77:.49+v;let i=(y*w+x)*4;im.data[i]=c*170;im.data[i+1]=c*218;im.data[i+2]=c*95;im.data[i+3]=255;}ctx.putImageData(im,0,0);});
const branchMat=sway(new THREE.MeshStandardMaterial({map:bark,bumpMap:bark,bumpScale:.10,roughness:.96}),'branch');
const leafMat=sway(new THREE.MeshStandardMaterial({map:leafMap,color:'#d5e5b2',roughness:.93,metalness:0,envMapIntensity:.32,side:THREE.DoubleSide}),'leaf');
const heroBarkMat=sway(new THREE.MeshStandardMaterial({map:bark,bumpMap:bark,bumpScale:.19,color:'#aaa28c',roughness:.98,envMapIntensity:.40}),'branch');
// Restrained moss on the older wood, concentrated on upward-facing roots
// and crevices. Keep it in tree space so it remains fixed while orbiting.
const compileHeroBark=heroBarkMat.onBeforeCompile;
heroBarkMat.onBeforeCompile=shader=>{
 compileHeroBark(shader);
 shader.vertexShader='varying vec3 vWoodPosition; varying vec3 vWoodNormal;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vWoodPosition=position;vWoodNormal=normal;');
 shader.fragmentShader='varying vec3 vWoodPosition; varying vec3 vWoodNormal;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  float mossPatch=sin(vWoodPosition.x*3.4+sin(vWoodPosition.y*2.5))*sin(vWoodPosition.z*4.1+vWoodPosition.y*.6);
  float mossFine=sin(vWoodPosition.x*59.)*sin(vWoodPosition.z*47.+vWoodPosition.y*31.);
  float mossAmount=smoothstep(.02,.65,mossPatch+mossFine*.13)*(.08+.40*max(0.,vWoodNormal.y))*(1.-smoothstep(3.,11.,vWoodPosition.y));
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.12,.17,.047),mossAmount);
 `);
};
heroBarkMat.customProgramCacheKey=()=> 'ancient-wood-moss-v1.1';
const leafDepth=sway(new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,side:THREE.DoubleSide}),'leaf');
const branchDepth=sway(new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking}),'branch');
const dummy=new THREE.Object3D();
function treeModel(detail=true){
 const b=new MeshBuilder(),leaves=[];
 function branch(start,dir,len,r,depth){
  const pts=[start.clone()],d=dir.clone();let cur=start.clone();
  for(let i=1;i<=5;i++){d.y+=.025+depth*.007;d.x+=range(-.04,.04);d.z+=range(-.04,.04);d.normalize();cur=cur.clone().addScaledVector(d,len/5);pts.push(cur);}
  b.tube(pts,r,r*.24,depth>2?10:6);
  if(depth<=1){for(let n=0;n<(detail?75:52);n++){
   const t=range(.15,1),p=pts[Math.min(4,Math.floor(t*5))].clone().lerp(cur,t*.5);
   const a=range(0,Math.PI*2),rad=Math.sqrt(rand())*len*.57;
   p.add(V(Math.cos(a)*rad,range(-.25,.65)*len,Math.sin(a)*rad));
   leaves.push({p,scale:range(.25,.43)});
  }}
  if(depth===0)return;
  const count=depth>=3?3:3;
  for(let i=0;i<count;i++){
   const a=range(0,Math.PI*2),fork=V(Math.cos(a)*.82,range(.25,.75),Math.sin(a)*.82);
   const nd=dir.clone().multiplyScalar(.5).add(fork).normalize();
   const origin=pts[i===0?5:4];branch(origin,nd,len*range(.54,.73),r*.49,depth-1);
  }
 }
 const trunk=[V(0,0,0),V(-.15,1.5,.12),V(-.3,3,.1),V(-.1,4.5,.12),V(.15,6,0),V(.35,7.6,-.2)];b.tube(trunk,.68,.21,14);
 for(let i=0;i<9;i++){const a=i*2.399+range(-.2,.2),y=3.0+i*.5;branch(V(-.1,y,0),V(Math.cos(a)*.85,range(.45,.8),Math.sin(a)*.85).normalize(),range(3.7,5.3),.23-i*.011,detail?3:2);}
 branch(trunk[5],V(.12,1,.1),3.4,.19,detail?3:2);
 for(let i=0;i<9;i++){const a=i/9*Math.PI*2;const pts=[V(Math.cos(a)*2.2,-.05,Math.sin(a)*2.2),V(Math.cos(a)*1.1,.13,Math.sin(a)*1.1),V(Math.cos(a)*.25,.7,Math.sin(a)*.25)];b.tube(pts,.07,.32,7);}
 return {geometry:b.geometry(),leaves};
}
const heroModel=createMysticTree(),forestModel=treeModel(false);
function plantTree(model,pos,scale,rotation,hero=false){
 const group=new THREE.Group();group.position.copy(pos);group.scale.setScalar(scale);group.rotation.y=rotation;scene.add(group);
 const trunk=new THREE.Mesh(model.geometry,hero?heroBarkMat:branchMat);trunk.castShadow=true;trunk.receiveShadow=true;trunk.customDepthMaterial=branchDepth;group.add(trunk);
 const foliage=new THREE.InstancedMesh(leafGeo,leafMat,model.leaves.length);let i=0;
 for(const leaf of model.leaves){
  dummy.position.copy(leaf.p);
  if(leaf.direction){dummy.quaternion.setFromUnitVectors(V(0,1,0),leaf.direction);dummy.rotateY(leaf.roll);}
  else dummy.rotation.set(range(-1.4,1.4),range(0,6.28),range(-2,2));
  dummy.scale.set(leaf.scale,leaf.scale,leaf.scale);dummy.updateMatrix();foliage.setMatrixAt(i,dummy.matrix);
  tc.setHSL(hero?range(.235,.28):range(.22,.28),range(.32,.48),hero?range(.51,.69):range(.48,.68));foliage.setColorAt(i++,tc);
 }
 foliage.castShadow=hero || scale>.65;foliage.receiveShadow=true;foliage.customDepthMaterial=leafDepth;foliage.computeBoundingSphere();group.add(foliage);return group;
}
const heroTree=plantTree(heroModel,heroPos,1,0,true);
for(let i=0;i<64;i++){
 const a=range(Math.PI*.93,Math.PI*2.06),r=range(48,110);let x=Math.cos(a)*r,z=Math.sin(a)*r-12;
 if(Math.hypot(x-heroPos.x,z-heroPos.z)<25)continue;
 plantTree(forestModel,V(x,height(x,z)-.05,z),range(.36,.83),range(0,6.28));
}
// Foreground understory on both banks keeps a full orbit spatially coherent.
for(const [x,z,s] of [[-40,16,.64],[38,9,.58],[-41,-18,.60],[40,-36,.72],[-26,36,.42],[30,39,.46]])plantTree(forestModel,V(x,height(x,z),z),s,range(0,6));
// Stones: high-tessellation irregular geometry with an actual rough surface.
const rocks=[];
for(let kind=0;kind<5;kind++){
 const g=new THREE.IcosahedronGeometry(1,3);const p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const d=.84+noise(x*3+kind*17,z*3+y)*.30+noise(y*12,x*13)*.055;p.setXYZ(i,x*d,y*d*.70,z*d);}
 g.computeVertexNormals();rocks.push(g);
}
const stoneMat=new THREE.MeshStandardMaterial({map:rockTex,bumpMap:rockTex,bumpScale:.2,roughness:.94,color:'#a8aaa0'});
for(let kind=0;kind<5;kind++){
 const m=new THREE.InstancedMesh(rocks[kind],stoneMat,100);
 for(let i=0;i<100;i++){const a=range(0,6.28),r=range(.88,1.13),x=Math.cos(a)*36*r,z=4+Math.sin(a)*29*r,y=height(x,z);const s=range(.18,1.0)*(i%13===0?1.9:1);dummy.position.set(x,Math.max(y,-.35)+s*.1,z);dummy.rotation.set(range(-.4,.4),range(0,6.28),range(-.25,.25));dummy.scale.set(s*range(.8,1.6),s,s*range(.8,1.5));dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);tc.setHSL(.13,.08,range(.49,.76));m.setColorAt(i,tc);}
 m.castShadow=true;m.receiveShadow=true;scene.add(m);
}
// Tens of thousands of individually curved blades, tinted from root to tip.
const grassGeo=(()=>{const p=[],c=[],idx=[];for(let j=0;j<5;j++){const t=j/4,y=t;const width=.035*(1-t)+.002;for(const side of [-1,1]){p.push(side*width+t*t*.17,y,t*t*.1);c.push(mix(.17,.62,t),mix(.25,.72,t),mix(.075,.31,t));}if(j<4){let k=j*2;idx.push(k,k+2,k+1,k+1,k+2,k+3);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.setIndex(idx);g.computeVertexNormals();return g;})();
const grassMat=sway(new THREE.MeshStandardMaterial({color:'#b6be87',vertexColors:true,side:THREE.DoubleSide,roughness:1}),'grass');
const grassCount=180000,grass=new THREE.InstancedMesh(grassGeo,grassMat,grassCount);let gi=0,tries=0;
while(gi<grassCount && tries++<1200000){let x=range(-60,60),z=range(-54,52),h=height(x,z);if(h<.08 || h>4.5)continue;if(h>2.9 && rand()>.28)continue;const patch=noise(x*.19,z*.19);if(rand()> .56+patch*.5)continue;dummy.position.set(x,h-.03,z);dummy.rotation.set(0,range(0,6.28),range(-.17,.17));const s=range(.22,.67)*(h<1.1?1.3:1);dummy.scale.set(range(.8,1.8),s,1);dummy.updateMatrix();grass.setMatrixAt(gi,dummy.matrix);tc.setHSL(range(.18,.26),.33,range(.46,.75));grass.setColorAt(gi++,tc);}
grass.count=gi;grass.receiveShadow=true;grass.computeBoundingSphere();scene.add(grass);
// Long-range vegetation is represented by the same photographed textured
// meadow surface. Sub-pixel instanced grass at the mountain foot caused
// high-contrast black/white pixel shimmer and is intentionally not created.
// True planar reflection renders the moving trees and mountains from a mirrored camera.
const waterNormals=new THREE.TextureLoader().load('./assets/water-normals.jpg',t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;});
const water=new Water(new THREE.PlaneGeometry(900,900),{textureWidth:1024,textureHeight:1024,waterNormals,sunDirection:sunDir,sunColor:'#fff0da',waterColor:'#163c35',distortionScale:1.6,fog:true});water.rotation.x=-Math.PI/2;water.position.y=.015;water.material.uniforms.size.value=5;scene.add(water);
// Soft drifting cloud layer, evaluated in world space. No sky photograph.
const cloudShader=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uTime:time,uSun:{value:sunDir}},vertexShader:`varying vec3 wp;void main(){wp=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}`,fragmentShader:`varying vec3 wp;uniform float uTime;uniform vec3 uSun;
 float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}float fb(vec2 p){float a=.5,r=0.;for(int i=0;i<5;i++){r+=n(p)*a;p=p*2.03+7.3;a*=.5;}return r;}
 void main(){vec2 p=wp.xz*.003+vec2(uTime*.00055,0.);float f=fb(p);float density=smoothstep(.43,.73,f);float edge=1.-smoothstep(500.,900.,length(wp.xz));vec3 c=mix(vec3(.61,.67,.69),vec3(1.,.98,.93),smoothstep(.45,.75,f));gl_FragColor=vec4(c,density*.80*edge);#include <tonemapping_fragment>\n#include <colorspace_fragment>}`.replace(';#include',';\n#include')});
const clouds=new THREE.Mesh(new THREE.PlaneGeometry(1800,1800),cloudShader);clouds.rotation.x=-Math.PI/2;clouds.position.y=180;scene.add(clouds);
// Slow airborne motes are tiny physical points, not a screen overlay.
const dustGeo=new THREE.BufferGeometry(),dustPositions=[];for(let i=0;i<130;i++)dustPositions.push(range(-30,30),range(1,16),range(-42,15));dustGeo.setAttribute('position',new THREE.Float32BufferAttribute(dustPositions,3));const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:'#f1e9c8',size:.038,transparent:true,opacity:.45,depthWrite:false}));scene.add(dust);
let paused=false,cinematic=false,elapsed=0,last=performance.now(),frameCount=0,fpsTime=0,returning=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(reduced){paused=true;$('pause').setAttribute('aria-pressed','true');$('pause').innerHTML='▶ <span>Resume</span>';}
$('wind').oninput=e=>{wind.value=+e.target.value;$('wind-value').textContent=wind.value<.08?'Still':wind.value<.8?'Gentle':wind.value<1.4?'Breezy':'Strong';};
function lighting(value){
 const elev=mix(.20,.95,value);sunDir.set(-.55,elev,.36).normalize();sun.position.copy(sunDir).multiplyScalar(110);su.sunPosition.value.copy(sunDir);su.turbidity.value=mix(7,3,value);sun.color.setHSL(mix(.075,.12,value),mix(.48,.12,value),.87);sun.intensity=mix(2.0,3.2,value);renderer.toneMappingExposure=mix(.80,1.02,value);water.material.uniforms.sunDirection.value.copy(sunDir);water.material.uniforms.sunColor.value.copy(sun.color);scene.fog.color.set(value<.32?'#b8afa1':'#a6b8b7');$('light-value').textContent=value<.28?'Golden hour':value<.76?'Late afternoon':'Clear daylight';
}
$('light').oninput=e=>lighting(+e.target.value);$('light').onchange=()=>{envTarget.dispose();envTarget=pmrem.fromScene(envScene,.04,.1,2000);scene.environment=envTarget.texture;};lighting(.62);
$('quality').onchange=e=>{const q=e.target.value;renderer.setPixelRatio(Math.min(devicePixelRatio,q==='balanced'?1:q==='high'?1.6:2));sun.shadow.mapSize.setScalar(q==='ultra'?4096:q==='high'?2048:1024);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}grass.count=Math.floor(gi*(q==='balanced'?.48:1));};
$('orbit').onclick=()=>{controls.autoRotate=!controls.autoRotate;$('orbit').setAttribute('aria-pressed',String(controls.autoRotate));};
$('pause').onclick=()=>{paused=!paused;$('pause').setAttribute('aria-pressed',String(paused));$('pause').innerHTML=paused?'▶ <span>Resume</span>':'Ⅱ <span>Pause</span>';};
$('focus').onclick=()=>{returning=true;controls.autoRotate=false;$('orbit').setAttribute('aria-pressed','false');};controls.addEventListener('start',()=>{returning=false;});
$('panel-toggle').onclick=()=>{const expanded=$('panel-toggle').getAttribute('aria-expanded')==='true';$('panel-toggle').setAttribute('aria-expanded',String(!expanded));$('panel-body').hidden=expanded;$('panel-chevron').textContent=expanded?'+':'−';};
function toggleUI(){cinematic=!cinematic;document.body.classList.toggle('hidden-ui',cinematic);$('restore').hidden=!cinematic;}$('hide').onclick=toggleUI;$('restore').onclick=toggleUI;
$('fullscreen').onclick=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch(e){$('fullscreen').title='Fullscreen unavailable in this browser';}};
addEventListener('keydown',e=>{if(/INPUT|SELECT/.test(e.target.tagName))return;if(e.key.toLowerCase()==='h')toggleUI();if(e.key.toLowerCase()==='f')$('focus').click();if(e.code==='Space'){e.preventDefault();$('pause').click();}});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('error').hidden=false;$('error').textContent='The graphics context was interrupted. Reload this page to rebuild the scene.';});
let vstopiaBridge=null;
const isEmbedded=new URLSearchParams(location.search).get('embedded')==='1';
if(isEmbedded){
 // User prefers maximum natural light and maximum wind, slider remains operable.
 $('wind').value='2';$('wind').dispatchEvent(new Event('input',{bubbles:true}));
 $('light').value='1';$('light').dispatchEvent(new Event('input',{bubbles:true}));
 $('light').dispatchEvent(new Event('change',{bubbles:true}));
 // ONLY replace the visible sky: this is the partly cloudy 2K panorama from
 // our last alpine scene. Do not change existing PMREM, sun, wind, water,
 // clouds animation state, terrain, materials or camera controls.
 new RGBELoader().setDataType(THREE.HalfFloatType)
  .load('./assets/sky/partly-cloudy-2k.hdr',texture=>{
   texture.mapping=THREE.EquirectangularReflectionMapping;
   sky.visible=false;clouds.visible=false;scene.background=texture;
   document.body.dataset.skyPreset='alpine-partly-cloudy-2k';
   document.body.dataset.skyReady='ready';
  },undefined,error=>{
   console.error('[Stillwater optional cloud sky]',error);
   document.body.dataset.skyReady='fallback';
  });
 // Keep native Atmosphere sliders available; start collapsed to preserve the scene.
 if($('panel-toggle')?.getAttribute('aria-expanded')==='true')$('panel-toggle').click();
 vstopiaBridge=mountVstopiaTreeBridge({THREE,scene,camera,controls,renderer,
  heroModel,heroTree,heroPos,time,wind,height,plantTree,forestModel,grassGeo,grassMat,
  getPaused:()=>paused,lighting});
}
let ready=false;
function animate(now){
 requestAnimationFrame(animate);const realDt=Math.max(.001,(now-last)/1000),dt=Math.min(realDt,.05);last=now;
 if(!paused){elapsed+=dt;time.value=elapsed;water.material.uniforms.time.value+=dt*(.25+wind.value*.33);water.material.uniforms.distortionScale.value=.45+wind.value*1.5;dust.position.x=Math.sin(elapsed*.035)*1.5;dust.position.y=Math.sin(elapsed*.12)*.25;}
 if(returning){camera.position.lerp(home,1-Math.exp(-dt*4));controls.target.lerp(focus,1-Math.exp(-dt*4));if(camera.position.distanceTo(home)<.02)returning=false;}
 const wasOrbiting=controls.autoRotate;if(paused)controls.autoRotate=false;controls.update(dt);controls.autoRotate=wasOrbiting;
 // Keep the camera above the lake and terrain, including after panning.
 camera.position.y=Math.max(camera.position.y,Math.max(.8,height(camera.position.x,camera.position.z)+.65));
 const off=controls.target.clone().sub(focus);if(off.length()>55)controls.target.copy(focus).add(off.setLength(55));
 renderer.render(scene,camera);vstopiaBridge?.tick(now,dt);frameCount++;fpsTime+=realDt;
 if(fpsTime>=1){$('fps').textContent=`${Math.round(frameCount/fpsTime)} FPS`;frameCount=0;fpsTime=0;}
 if(!ready){ready=true;$('loading').style.opacity=0;setTimeout(()=>$('loading').remove(),900);}
}
// Precompile catches shader failures before dismissing the loading surface.
renderer.debug.onShaderError=(gl,program,vs,fs)=>{console.error(gl.getProgramInfoLog(program),gl.getShaderInfoLog(vs),gl.getShaderInfoLog(fs));$('error').hidden=false;$('error').textContent='This GPU could not compile a scene shader. Please try an up-to-date Chrome or Firefox with hardware acceleration enabled.';};
renderer.compile(scene,camera);requestAnimationFrame(animate);
