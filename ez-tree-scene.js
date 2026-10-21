/* Realistic tree / Three.js scene. EZ-Tree MIT by Daniel Greenheck.
   If WebGL isn't available, the existing interactive 2D forest remains available. */
import * as THREE from 'three';
import {Tree} from '@dgreenheck/ez-tree';
import {RGBELoader} from './vendor/RGBELoader.js';
import {applyTerrainBlending} from './ground-blend.js';
import {addEzTreeShrubs} from './shrub-garden.js';

const stage=document.getElementById('treeStage');
const fallback=document.getElementById('treeCanvas');
const stageMode=()=>!stage.hidden;
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const state={ready:false,orbit:.18,elevation:.16,zoom:1.06,selected:'Audio Playground',drag:null,disposed:false};
const api={get ready(){return state.ready;}};
window.VstopiaEzTree=api;

let renderer, camera, scene, tree, ground, holder, markerLayer, target, frameId;
let sceneExtent=0;
const spatialGrade={left:new THREE.Vector3(1.20,1.13,1.07),right:new THREE.Vector3(1.005,.94,.926),width:{value:1}};
let requiresRender=true;
let windPhase=0;
let previousWindTime=0;
let lastWindTelemetry=0;
const speedControl=document.getElementById('forestAnimationSpeed');
let animationSpeed=.75;
const invalidate=()=>{requiresRender=true;};
const buttons=[];
const names=['Audio Playground','Creative Engine','Motion Lab','Plugin Workshop','Research Garden','Release Pipeline','Community Space','Design Studio','Sample Library','Collaboration Hub','Prototype Station','Knowledge Base'];
const colorMap={warm:'#fff5c4',green:'#d2ffdf'};
const canvasRegion={};

function sphereMarker(pos,name,i){
 const el=document.createElement('button');
 el.className='living-node';el.type='button';el.dataset.repo=name;
 const orb=document.createElement('span');orb.className='living-orb';orb.setAttribute('aria-hidden','true');
 const text=document.createElement('span');text.className='living-node-label';text.textContent=name;
 el.append(orb,text);
 el.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('vstopia:select',{detail:{name}})));
 markerLayer.append(el);buttons.push({el,pos,name});
}
function emitReady(){
 state.ready=true;stage.classList.add('has-webgl-tree');
 fallback.style.opacity='0';fallback.style.pointerEvents='none';
 window.dispatchEvent(new Event('vstopia:tree-ready'));
}
function updateMarkers(){
 const bound=stage.getBoundingClientRect();
 if(!bound.width||!bound.height)return;
 const pt=new THREE.Vector3();
 const area=bound.width*bound.height;
 const allowLabels=area>220000;
 const w=bound.width,h=bound.height;
 for(const {el,pos,name} of buttons){
  pt.copy(pos).project(camera);
  const x=(pt.x*.5+.5)*w,y=(-pt.y*.5+.5)*h;
  el.style.left=`${Math.round(Math.max(79,Math.min(w-79,x)))}px`;el.style.top=`${Math.round(y)}px`;
  const within=pt.z>-1&&pt.z<1&&x>-15&&x<w+15&&y>43&&y<h-25;
  el.hidden=!within || !stageMode();
  el.classList.toggle('selected',name===state.selected);
  el.classList.toggle('compact',!allowLabels);
 }
}
function measureTree(){
 const bounds=new THREE.Box3().setFromObject(tree);
 const size=new THREE.Vector3();const center=new THREE.Vector3();
 bounds.getSize(size);bounds.getCenter(center);
 if(!Number.isFinite(size.y)||size.y<=0)throw new Error('EZ-Tree produced invalid geometry');
 return {size,center};
}
function buildScene(){
 const {size,center}=measureTree();
 // Center it visually, retaining the roots on the scene's lawn.
 tree.position.x=-center.x;tree.position.z=-center.z;
 const height=size.y;sceneExtent=size.length();
 const originalTreeBase=new THREE.Box3().setFromObject(tree).min.y;
 const radius=Math.max(size.x,size.z,height*.6);
 target=new THREE.Vector3(0,height*.52,0);
 camera=new THREE.PerspectiveCamera(32,1,.1,16000);
 camera.position.set(0,target.y+height*.1,Math.max(24,radius*2.45));
 camera.lookAt(target);
 // A genuinely opaque, shaded and displaced terrain mesh. Its outer slopes
 // disappear toward the photographed HDRI horizon, never exposing a transparent disc.
 const terrainGeometry=new THREE.PlaneGeometry(16000,16000,320,320);
 const vertices=terrainGeometry.attributes.position;
 for(let i=0;i<vertices.count;i++){
  const x=vertices.getX(i),z=vertices.getY(i),dist=Math.hypot(x,z);
  const ramp=(1-Math.exp(-Math.pow(dist/55,2)))*(1-THREE.MathUtils.smoothstep(dist,750,3200));
  const relief=(Math.sin(x*.013)*6+Math.cos(z*.015)*5+
       Math.sin(x*.027+z*.018)*2.6+Math.cos(z*.038-x*.02)*1.6)*ramp;
  vertices.setZ(i,relief);
 }
 vertices.needsUpdate=true;terrainGeometry.computeVertexNormals();
 const terrainMaterial=new THREE.MeshStandardMaterial({color:0x8c977a,roughness:1,metalness:0,side:THREE.FrontSide});
 const terrainGrade=new THREE.Vector3(.2653,.2223,.2290);
 applyTerrainBlending(terrainMaterial, terrainGrade, spatialGrade);
 // Rehydrate a precomputed robust six-pair calibration; never fetch the private screenshot.
 fetch('./assets/calibration/ground-grade.json',{cache:'force-cache'}).then(r=>{
   if(!r.ok)throw new Error('calibration file unavailable');return r.json();
 }).then(profile=>{
   if(profile.schema_version!==1 || !Array.isArray(profile.linear_rgb_grade) ||
      profile.linear_rgb_grade.length!==3 || !profile.linear_rgb_grade.every(x=>typeof x==='number'&&Number.isFinite(x)&&x>.1&&x<=1.4))
     throw new Error('invalid color calibration');
   terrainGrade.set(...profile.linear_rgb_grade);
   if(Array.isArray(profile.spatial_grade_left)&&Array.isArray(profile.spatial_grade_right)){
     const strength=Math.min(.8,Math.max(0,Number(profile.spatial_grade_strength)||0));
     const adapt=a=>a.map(value=>1+(value-1)*strength);
     spatialGrade.left.set(...adapt(profile.spatial_grade_left));
     spatialGrade.right.set(...adapt(profile.spatial_grade_right));
   }
   stage.dataset.groundCalibration='six-pair-linear-rgb';
   invalidate();
 }).catch(e=>console.warn('[Ground calibration] Using bundled backup values',e));
 const terrain=new THREE.Mesh(terrainGeometry,terrainMaterial);
 terrain.rotation.x=-Math.PI/2;
 terrain.receiveShadow=true;terrain.position.y=-.055;
 scene.add(terrain);ground=terrain;
 // Align the physical trunk base to the terrain surface, not to the model's pivot.
 tree.position.y+=terrain.position.y+.025-originalTreeBase;
 stage.dataset.treeBaseAligned=String(Math.abs((new THREE.Box3().setFromObject(tree)).min.y-(terrain.position.y+.025))<.05);
 const shrubGarden=addEzTreeShrubs({THREE,scene,tree,terrain,center,stage});
 // One uninterrupted mesh extends all the way to the visible world horizon.
 // No overlapping opaque LOD layers: they previously caused z-intersection artifacts.
 stage.dataset.terrain='opaque-pbr-mesh';
 // Local contact occlusion to make the trunk meet the actual solid ground.
 const contactCanvas=document.createElement('canvas');contactCanvas.width=256;contactCanvas.height=256;
 const cx=contactCanvas.getContext('2d');
 const haze=cx.createRadialGradient(128,128,8,128,128,126);
 haze.addColorStop(0,'rgba(18,34,13,.60)');haze.addColorStop(.42,'rgba(14,31,12,.25)');haze.addColorStop(1,'rgba(11,28,16,0)');
 cx.fillStyle=haze;cx.fillRect(0,0,256,256);
 const contact=new THREE.CanvasTexture(contactCanvas);contact.colorSpace=THREE.SRGBColorSpace;
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(radius*.66,radius*.66),
  new THREE.MeshBasicMaterial({map:contact,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
 shadow.rotation.x=-Math.PI/2;shadow.position.y=.01;scene.add(shadow);
 // Self-hosted CC0 grass/soil PBR map, normal and roughness from one Poly Haven material.
 const loader=new THREE.TextureLoader();
 const base='assets/environment/grass_ground_';
 const maps=[['map','diff_1k.jpg'],['normalMap','nor_gl_1k.jpg'],['roughnessMap','rough_1k.jpg']];
 Promise.all(maps.map(([field,file])=>new Promise((resolve,reject)=>{
  loader.load('./'+base+file,texture=>{
   texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
   texture.repeat.set(field==='normalMap'?250:210,field==='normalMap'?250:210);texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
   if(field==='map')texture.colorSpace=THREE.SRGBColorSpace;
   resolve([field,texture]);
  },undefined,reject);
 }))).then(textures=>{
  for(const [field,texture] of textures)terrainMaterial[field]=texture;
  terrainMaterial.color.set(0x899777);
  terrainMaterial.normalScale.set(.32,.32);
  terrainMaterial.needsUpdate=true;
  stage.dataset.pbr='diffuse-normal-roughness-ready';
  stage.dataset.terrainBlend='stochastic-texture-bomb-distance-alpha';invalidate();
 }).catch(error=>console.error('[VSTOPIA Ground] PBR texture load failed',error));
 // Sparse grass at the foot of the trunk improves scale and avoids a floating-tree appearance.
 const grassGeo=new THREE.ConeGeometry(.14,.86,3);grassGeo.translate(0,.43,0);
 const grassMat=new THREE.MeshLambertMaterial({color:0x6a8856,side:THREE.DoubleSide});
 const blades=new THREE.InstancedMesh(grassGeo,grassMat,1500);
 const dummy=new THREE.Object3D();let seed=312711;
 const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/4294967296;};
 const tuftColors=[new THREE.Color(0x597d48),new THREE.Color(0x739052),new THREE.Color(0x78965d)];
 for(let i=0;i<1500;i++){
  const a=next()*Math.PI*2,r=Math.sqrt(next())*radius*.46;
  dummy.position.set(Math.cos(a)*r,.014,Math.sin(a)*r);
  dummy.rotation.set((next()-.5)*.3,next()*Math.PI*2,(next()-.5)*.3);
  const stretch=.5+next()*1.5;dummy.scale.set(stretch,stretch,stretch);dummy.updateMatrix();blades.setMatrixAt(i,dummy.matrix);blades.setColorAt(i,tuftColors[Math.floor(next()*tuftColors.length)]);
 }
 blades.instanceMatrix.needsUpdate=true;blades.instanceColor.needsUpdate=true;scene.add(blades);
 const points=[];
 names.forEach((name,i)=>{
  const theta=i*Math.PI*(3-Math.sqrt(5));
  const hFraction=.57+((i*7)%6)*.055;
  const rad=.29+((i*11)%5)*.075;
  const x=Math.cos(theta)*size.x*rad,z=Math.sin(theta)*size.z*rad;
  const y=height*hFraction;
  points.push(new THREE.Vector3(x,y,z));
 });
 points.forEach((pos,i)=>sphereMarker(pos,names[i],i));
 stage.dataset.treeHeight=Math.round(height).toString();
 stage.dataset.treeKind='real-ez-tree-threejs';
}
function setOrbit(){
 const dist=Math.max(13,sceneExtent*1.18)/state.zoom;
 const v=Math.max(-.32,Math.min(.61,state.elevation));
 camera.position.set(target.x+Math.sin(state.orbit)*Math.cos(v)*dist,
  target.y+Math.sin(v)*dist*.75,
  target.z+Math.cos(state.orbit)*Math.cos(v)*dist);
 camera.lookAt(target);
}
let lastTick=0;
function render(t){
 if(state.disposed)return;
 frameId=requestAnimationFrame(render);
 if(t-lastTick<(reduceMotion?140:50))return;
 lastTick=t;
 if(!stageMode())return;
 // Only the tree sways; terrain and HDRI remain fixed. The slider sets real wind speed.
 if(!reduceMotion && animationSpeed>0){
   const dt=previousWindTime?Math.min(.12,(t-previousWindTime)*.001):0;
   windPhase+=dt*animationSpeed;
   tree.update(windPhase);requiresRender=true;
 }
 previousWindTime=t;
 if(t-lastWindTelemetry>700){stage.dataset.windPhase=windPhase.toFixed(3);lastWindTelemetry=t;}
 if(!requiresRender)return;
 requiresRender=false;
 setOrbit();
 renderer.render(scene,camera);
 updateMarkers();
}
function resize(){
 if(!renderer)return;
 const r=stage.getBoundingClientRect();
 if(r.width<1||r.height<1)return;
 const dpr=Math.min(window.devicePixelRatio||1,1.75);
 renderer.setPixelRatio(dpr);
 renderer.setSize(r.width,r.height,false);
 camera.aspect=r.width/r.height;camera.updateProjectionMatrix();
 if(typeof spatialGrade!=='undefined')spatialGrade.width.value=renderer.domElement.width;
 invalidate();
}
function pointerDown(e){if(e.button!==0||e.target.closest('.living-node'))return;state.drag={x:e.clientX,y:e.clientY,px:e.clientX,py:e.clientY};holder.setPointerCapture(e.pointerId);}
function pointerMove(e){if(!state.drag)return;const s=state.drag;const dx=e.clientX-s.px,dy=e.clientY-s.py;
 state.orbit+=dx*.008;state.elevation=Math.max(-.32,Math.min(.61,state.elevation+dy*.004));s.px=e.clientX;s.py=e.clientY;invalidate();}
function pointerUp(){state.drag=null;}
function setupInteractions(){
 holder.addEventListener('pointerdown',pointerDown);
 holder.addEventListener('pointermove',pointerMove);
 holder.addEventListener('pointerup',pointerUp);holder.addEventListener('pointercancel',pointerUp);
 holder.addEventListener('wheel',e=>{e.preventDefault();state.zoom=Math.min(2.1,Math.max(.63,state.zoom*(e.deltaY>0?.94:1.06)));invalidate();},{passive:false});
 holder.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')state.orbit-=.12;else if(e.key==='ArrowRight')state.orbit+=.12;
 else if(e.key==='ArrowUp')state.elevation-=.08;else if(e.key==='ArrowDown')state.elevation+=.08;
 else if(e.key==='+'||e.key==='=')state.zoom=Math.min(2.1,state.zoom*1.1);
 else if(e.key==='-')state.zoom=Math.max(.63,state.zoom/1.1);else return;e.preventDefault();invalidate();});
 window.addEventListener('vstopia:reset',()=>{state.orbit=.18;state.elevation=.16;state.zoom=1.06;invalidate();});
 window.addEventListener('vstopia:select-changed',e=>{state.selected=e.detail.name;updateMarkers();});
 window.addEventListener('vstopia:mode',e=>{holder.hidden=e.detail.mode!=='tree';markerLayer.hidden=e.detail.mode!=='tree';invalidate();});
 window.addEventListener('vstopia:filters',e=>{for(const b of buttons)b.el.style.opacity=e.detail.visible.includes(b.name)?'1':'.22';});
 if(speedControl){
  const output=document.getElementById('forestSpeedValue');
  const change=()=>{animationSpeed=Number(speedControl.value);output.value=animationSpeed.toFixed(2)+'×';
    stage.dataset.windSpeed=animationSpeed.toFixed(2);invalidate();};
  speedControl.addEventListener('input',change);change();
 }
 new ResizeObserver(resize).observe(stage);
}
function build(){
 holder=document.createElement('canvas');holder.className='ez-webgl-canvas';holder.tabIndex=0;
 holder.setAttribute('aria-label','Albero tridimensionale EZ-Tree: trascina per ruotare, usa la rotella per ingrandire, seleziona i nomi dei rami.');
 markerLayer=document.createElement('div');markerLayer.className='ez-marker-layer';markerLayer.setAttribute('aria-label','Nodi del progetto');
 stage.insertBefore(holder,fallback);
 stage.insertBefore(markerLayer,fallback);
 renderer=new THREE.WebGLRenderer({canvas:holder,alpha:true,antialias:true,powerPreference:'high-performance'});
 renderer.setClearColor(0x000000,0);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.24;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 scene=new THREE.Scene();
 // PBR environment and visible panorama share the *same* static HDRI, so their light/horizon stays aligned.
 scene.background=new THREE.Color(0xb3ccd6);
 scene.fog=null; // The feathered ground fades into the HDRI, not a gray fog band.
 const hdriLoader=new RGBELoader();
 hdriLoader.setDataType(THREE.HalfFloatType);
 hdriLoader.load('./assets/environment/kloppenheim_03_2k.hdr',texture=>{
  texture.mapping=THREE.EquirectangularReflectionMapping;
  scene.background=texture;scene.environment=texture;
  scene.backgroundIntensity=1.0;scene.environmentIntensity=1.20;
  stage.dataset.hdri='kloppenheim_03_2k';invalidate();
 },undefined,error=>console.error('[VSTOPIA HDRI] Could not load environment',error));
 scene.add(new THREE.HemisphereLight(0xedfaff,0x829264,1.42));
 const sun=new THREE.DirectionalLight(0xfff1c4,3.6);sun.position.set(-32,77,42);
 sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
 sun.shadow.camera.left=-75;sun.shadow.camera.right=75;
 sun.shadow.camera.top=95;sun.shadow.camera.bottom=-95;
 sun.shadow.normalBias=.035;sun.shadow.bias=-.00006;
 sun.target.position.set(0,24,0);scene.add(sun.target);scene.add(sun);
 stage.dataset.sun='direct-shadow-light-3.6';
 const rim=new THREE.DirectionalLight(0xdcf5e7,1.2);rim.position.set(20,19,-20);scene.add(rim);
 tree=new Tree();tree.loadPreset('Oak Large');
 tree.options.seed=58123;
 tree.options.bark.flatShading=false;
 tree.generate();tree.update(0);
 let leafCount=0;
 tree.traverse(node=>{
  if(!node.isMesh)return;
  node.castShadow=true;
  const name=(node.name+' '+(node.material?.name||'')).toLowerCase();
  if(/leaf|leaves|foliage|crown/.test(name)){
   leafCount++;
   node.castShadow=false; // Dense self-shadowing was crushing the leaf colors.
   node.receiveShadow=false;
   for(const mat of (Array.isArray(node.material)?node.material:[node.material])){
    if(!mat)continue;
    mat.side=THREE.DoubleSide;
    if(mat.color)mat.color.multiplyScalar(1.35);
    if(mat.emissive){mat.emissive.setRGB(.035,.11,.045);mat.emissiveIntensity=.48;}
    if('shininess' in mat)mat.shininess=8;
    mat.needsUpdate=true;
   }
  }
 });
 stage.dataset.leafMeshes=String(leafCount);

 scene.add(tree);
 buildScene();setupInteractions();resize();emitReady();frameId=requestAnimationFrame(render);
}
try{build();}catch(error){
 console.error('[VSTOPIA Tree] WebGL EZ-Tree failed, retaining fallback:',error);
 document.documentElement.dataset.ezTree='fallback';
 if(holder)holder.remove();if(markerLayer)markerLayer.remove();
 state.disposed=true;
}
