/* The 3D bark-vertex anchor map receives ONLY public aliases from the parent.
 * Vertex positions track original shader wind, orbit camera, and responsive UI.
 */
import {createVstopiaEcology} from './vstopia-ecology.js';
const NAMES=['Audio Playground','Creative Engine','Motion Lab','Plugin Workshop',
 'Research Garden','Release Pipeline','Community Space','Design Studio',
 'Sample Library','Collaboration Hub','Prototype Station','Knowledge Base'];
const ORIGIN=location.origin;
const signal=(type,detail={})=>{
 if(window.parent!==window)window.parent.postMessage({source:'stillwater-vstopia',type,...detail},ORIGIN);
};
export function mountVstopiaTreeBridge({THREE,scene,camera,controls,heroModel,heroTree,
 time,wind,height,plantTree,forestModel,grassGeo,grassMat}){
 document.body.classList.add('embedded');
 const lowPower=window.matchMedia('(max-width:760px), (pointer:coarse)').matches;
 const ecology=createVstopiaEcology({scene,height,plantTree,forestModel,grassGeo,grassMat,lowPower});
 const attr=heroModel.geometry.getAttribute('position');
 const width=()=>window.innerWidth,heightPx=()=>window.innerHeight;
 const temp=new THREE.Vector3(),world=new THREE.Vector3();
 const bounds=new THREE.Box3().setFromBufferAttribute(attr);
 const size=new THREE.Vector3();bounds.getSize(size);
 let names=[...NAMES],selected=names[0],visible=new Set(names);
 let anchorVertices=[],initialized=false,lastDispatch=-1000,candidateCount=0,configureCount=0;
 function screenOf(pos){
  const y=pos.y,h=Math.max(0,y),sway=Math.pow(h*.09,1.8);
  temp.copy(pos);
  temp.x+=Math.sin(time.value*.58+h*.09)*.12*wind.value*sway;
  temp.z+=Math.cos(time.value*.43+h*.065)*.07*wind.value*sway;
  heroTree.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  world.copy(temp).applyMatrix4(heroTree.matrixWorld).project(camera);
  return {x:(world.x*.5+.5)*width(),y:(-.5*world.y+.5)*heightPx(),depth:world.z};
 }
 function chooseAnchors(){
  const candidates=[],step=Math.max(1,Math.floor(attr.count/18000));
  for(let i=0;i<attr.count;i+=step){
   const x=attr.getX(i),y=attr.getY(i),z=attr.getZ(i);
   if(y<bounds.min.y+size.y*.25||y>bounds.min.y+size.y*.96)continue;
   const s=screenOf(new THREE.Vector3(x,y,z));
   if(s.depth<-1||s.depth>1||s.x<width()*.035||s.x>width()*.965||
      s.y<heightPx()*.07||s.y>heightPx()*.93)continue;
   candidates.push({i,x,y,z,sx:s.x,sy:s.y});
  }
  candidateCount=candidates.length;
  if(candidates.length<names.length)return [];
  const xmin=Math.min(...candidates.map(x=>x.sx)),xmax=Math.max(...candidates.map(x=>x.sx));
  const ymin=Math.min(...candidates.map(x=>x.sy)),ymax=Math.max(...candidates.map(x=>x.sy));
  const used=[],golden=Math.PI*(3-Math.sqrt(5));
  for(let i=0;i<names.length;i++){
   const radius=Math.sqrt((i+.6)/names.length);
   const nx=.5+Math.cos(i*golden)*radius*.47;
   const ny=.5+Math.sin(i*golden)*radius*.45;
   const tx=xmin+(xmax-xmin)*nx,ty=ymin+(ymax-ymin)*ny;
   let best=null,cost=Infinity;
   for(const v of candidates){
    if(used.some(old=>old.i===v.i))continue;
    let sep=0;
    for(const old of used)if(Math.abs(old.sx-v.sx)<(lowPower?48:80) &&
      Math.abs(old.sy-v.sy)<(lowPower?19:27))sep+=150000;
    const dx=(v.sx-tx)/width(),dy=(v.sy-ty)/heightPx();
    const score=(dx*dx+dy*dy)*40000+sep;
    if(score<cost){cost=score;best=v;}
   }
   if(best)used.push(best);
  }
  return used;
 }
 function reconfigure(next){
  if(!Array.isArray(next)||!next.length||next.length>100 ||
    !next.every(x=>typeof x==='string'&&/^[A-Za-zÀ-ÖØ-öø-ÿ ]{4,40}$/.test(x))||
    new Set(next).size!==next.length)return;
  if(names.length===next.length&&names.every((n,i)=>n===next[i]))return;
  names=[...next];configureCount++;visible=new Set(names);
  if(!names.includes(selected))selected=names[0];
  initialized=false;anchorVertices=[];lastDispatch=-1000;
 }
 window.addEventListener('message',event=>{
  if(event.origin!==ORIGIN||event.source!==window.parent||event.data?.source!=='vstopia-parent')return;
  const d=event.data;
  if(d.type==='ping' && initialized){
   signal('ready',{counts:{birds:ecology.birdCount,bushes:ecology.bushCount,
    grass:ecology.shortGrassCount,anchors:names.length},wind:wind.value});
  }
  if(d.type==='configure'){
   reconfigure(d.names);
   signal('configured',{names:[...names]});
   if(names.includes(d.selected))selected=d.selected;
   if(Array.isArray(d.visible))visible=new Set(d.visible.filter(x=>names.includes(x)));
  }
  if(d.type==='select'&&names.includes(d.name))selected=d.name;
  if(d.type==='filter'&&Array.isArray(d.visible))visible=new Set(d.visible.filter(x=>names.includes(x)));
  if(d.type==='reset')document.getElementById('focus')?.click();
 });
 addEventListener('resize',()=>{initialized=false;anchorVertices=[];});
 function tick(now){
  ecology.update(time.value);
  if(!initialized){
   anchorVertices=chooseAnchors();
   if(anchorVertices.length===names.length){
    initialized=true;
    signal('ready',{counts:{birds:ecology.birdCount,bushes:ecology.bushCount,
      grass:ecology.shortGrassCount,anchors:names.length},wind:wind.value});
   }
  }
  if(!initialized||now-lastDispatch<(lowPower?120:70))return;
  lastDispatch=now;
  signal('anchors',{positions:anchorVertices.map((v,i)=>{
   const s=screenOf(new THREE.Vector3(v.x,v.y,v.z));
   return {name:names[i],vertex:v.i,x:s.x,y:s.y,depth:s.depth,
     hidden:!visible.has(names[i])||s.depth<-1||s.depth>1||
       s.x<width()*.035||s.x>width()*.965||s.y<heightPx()*.07||s.y>heightPx()*.93};
  }),selected,time:time.value});
 }
 window.VstopiaStillwaterDebug=()=>({ready:initialized,vertices:anchorVertices.length,
  bushes:ecology.bushCount,shortGrass:ecology.shortGrassCount,birds:ecology.birdCount,
  wind:wind.value,sky:'original-Sky-PMREM-r180',labelsAttached:'analytic-wind-bark-vertices',
  namesCount:names.length,selected,configureCount,candidateCount,lowPower,
  camera:[camera.position.x,camera.position.y,camera.position.z]});
 return {tick};
}
