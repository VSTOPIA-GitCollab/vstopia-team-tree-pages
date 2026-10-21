/* Realistic tree / Three.js scene. EZ-Tree MIT by Daniel Greenheck.
   If WebGL isn't available, the existing interactive 2D forest remains available. */
import * as THREE from 'three';
import {Tree} from '@dgreenheck/ez-tree';

const stage=document.getElementById('treeStage');
const fallback=document.getElementById('treeCanvas');
const stageMode=()=>document.getElementById('viewList')?.getAttribute('aria-pressed')!=='true';
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const state={ready:false,orbit:.18,elevation:.16,zoom:1.06,selected:'Audio Playground',drag:null,disposed:false};
const api={get ready(){return state.ready;}};
window.VstopiaEzTree=api;

let renderer, camera, scene, tree, ground, holder, markerLayer, target, frameId;
let sceneExtent=0;
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
 const radius=Math.max(size.x,size.z,height*.6);
 target=new THREE.Vector3(0,height*.52,0);
 camera=new THREE.PerspectiveCamera(32,1,.1,Math.max(200,height*12));
 camera.position.set(0,target.y+height*.1,Math.max(24,radius*2.45));
 camera.lookAt(target);
 // Soft photographic contact shadow: alpha-faded at the edge, no flat circular platform.
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
 const cx=canvas.getContext('2d');
 const haze=cx.createRadialGradient(128,128,12,128,128,127);
 haze.addColorStop(0,'rgba(18,70,29,.58)');
 haze.addColorStop(.37,'rgba(45,103,43,.27)');
 haze.addColorStop(.75,'rgba(38,115,51,.08)');
 haze.addColorStop(1,'rgba(38,115,51,0)');
 cx.fillStyle=haze;cx.fillRect(0,0,256,256);
 const contact=new THREE.CanvasTexture(canvas);contact.colorSpace=THREE.SRGBColorSpace;
 const soil=new THREE.Mesh(new THREE.PlaneGeometry(radius*1.5,radius*1.5),
  new THREE.MeshBasicMaterial({map:contact,transparent:true,opacity:.85,depthWrite:false,side:THREE.DoubleSide}));
 soil.rotation.x=-Math.PI/2;soil.position.y=.013;scene.add(soil);ground=soil;
 // Sparse grass at the foot of the trunk improves scale and avoids a floating-tree appearance.
 const grassGeo=new THREE.ConeGeometry(.14,.86,3);grassGeo.translate(0,.43,0);
 const grassMat=new THREE.MeshLambertMaterial({color:0x579c48,side:THREE.DoubleSide});
 const blades=new THREE.InstancedMesh(grassGeo,grassMat,320);
 const dummy=new THREE.Object3D();let seed=312711;
 const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/4294967296;};
 for(let i=0;i<320;i++){
  const a=next()*Math.PI*2,r=Math.sqrt(next())*radius*.46;
  dummy.position.set(Math.cos(a)*r,.014,Math.sin(a)*r);
  dummy.rotation.set((next()-.5)*.3,next()*Math.PI*2,(next()-.5)*.3);
  const stretch=.5+next()*1.5;dummy.scale.set(stretch,stretch,stretch);dummy.updateMatrix();blades.setMatrixAt(i,dummy.matrix);
 }
 blades.instanceMatrix.needsUpdate=true;scene.add(blades);
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
 if(t-lastTick<(reduceMotion?140:48))return;
 lastTick=t;
 if(!stageMode())return;
 if(!reduceMotion)tree.update(t*.001);
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
}
function pointerDown(e){if(e.button!==0||e.target.closest('.living-node'))return;state.drag={x:e.clientX,y:e.clientY,px:e.clientX,py:e.clientY};holder.setPointerCapture(e.pointerId);}
function pointerMove(e){if(!state.drag)return;const s=state.drag;const dx=e.clientX-s.px,dy=e.clientY-s.py;
 state.orbit+=dx*.008;state.elevation=Math.max(-.32,Math.min(.61,state.elevation+dy*.004));s.px=e.clientX;s.py=e.clientY;}
function pointerUp(){state.drag=null;}
function setupInteractions(){
 holder.addEventListener('pointerdown',pointerDown);
 holder.addEventListener('pointermove',pointerMove);
 holder.addEventListener('pointerup',pointerUp);holder.addEventListener('pointercancel',pointerUp);
 holder.addEventListener('wheel',e=>{e.preventDefault();state.zoom=Math.min(2.1,Math.max(.63,state.zoom*(e.deltaY>0?.94:1.06)));},{passive:false});
 holder.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')state.orbit-=.12;else if(e.key==='ArrowRight')state.orbit+=.12;
 else if(e.key==='ArrowUp')state.elevation-=.08;else if(e.key==='ArrowDown')state.elevation+=.08;
 else if(e.key==='+'||e.key==='=')state.zoom=Math.min(2.1,state.zoom*1.1);
 else if(e.key==='-')state.zoom=Math.max(.63,state.zoom/1.1);else return;e.preventDefault();});
 window.addEventListener('vstopia:reset',()=>{state.orbit=.18;state.elevation=.16;state.zoom=1.06;});
 window.addEventListener('vstopia:select-changed',e=>{state.selected=e.detail.name;updateMarkers();});
 window.addEventListener('vstopia:mode',e=>{holder.hidden=e.detail.mode!=='tree';markerLayer.hidden=e.detail.mode!=='tree';});
 window.addEventListener('vstopia:filters',e=>{for(const b of buttons)b.el.style.opacity=e.detail.visible.includes(b.name)?'1':'.22';});
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
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
 scene=new THREE.Scene();
 scene.add(new THREE.HemisphereLight(0xe4faff,0x777b56,3.1));
 const sun=new THREE.DirectionalLight(0xffefc9,3.0);sun.position.set(-14,35,24);scene.add(sun);
 const rim=new THREE.DirectionalLight(0xa0f5d8,1.7);rim.position.set(20,17,-20);scene.add(rim);
 tree=new Tree();tree.loadPreset('Oak Large');
 tree.options.seed=58123;
 tree.options.bark.flatShading=false;
 tree.generate();scene.add(tree);
 buildScene();setupInteractions();resize();emitReady();frameId=requestAnimationFrame(render);
}
try{build();}catch(error){
 console.error('[VSTOPIA Tree] WebGL EZ-Tree failed, retaining fallback:',error);
 document.documentElement.dataset.ezTree='fallback';
 if(holder)holder.remove();if(markerLayer)markerLayer.remove();
 state.disposed=true;
}
