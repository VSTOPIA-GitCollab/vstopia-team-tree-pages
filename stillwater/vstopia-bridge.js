/* Bridge the user's untouched Three.js r180 scene to VSTOPIA's GitHub
 * application. REAL bark vertices, with same analytic wind displacement as
 * the branch shader; post only public demo label names/positions to parent.
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
 const ecology=createVstopiaEcology({scene,height,plantTree,forestModel,grassGeo,grassMat});
 const attr=heroModel.geometry.getAttribute('position');
 const width=()=>window.innerWidth,heightPx=()=>window.innerHeight;
 const temp=new THREE.Vector3(),world=new THREE.Vector3();
 const bounds=new THREE.Box3().setFromBufferAttribute(attr);
 const size=new THREE.Vector3();bounds.getSize(size);
 let selected=NAMES[0],visible=new Set(NAMES);
 let anchorVertices=[],initialized=false,lastDispatch=-1000;
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
   if(y<bounds.min.y+size.y*.29||y>bounds.min.y+size.y*.93)continue;
   const s=screenOf(new THREE.Vector3(x,y,z));
   if(s.depth<-1||s.depth>1||s.x<width()*.15||s.x>width()*.75||
      s.y<heightPx()*.16||s.y>heightPx()*.80)continue;
   candidates.push({i,x,y,z,sx:s.x,sy:s.y});
  }
  if(candidates.length<12)return [];
  const xmin=Math.min(...candidates.map(x=>x.sx)),xmax=Math.max(...candidates.map(x=>x.sx));
  const ymin=Math.min(...candidates.map(x=>x.sy)),ymax=Math.max(...candidates.map(x=>x.sy));
  const layout=[[.14,.67],[.40,.18],[.75,.45],[.08,.35],
   [.31,.53],[.70,.23],[.85,.70],[.15,.87],[.55,.78],[.49,.39],[.85,.87],[.87,.13]];
  const used=[];
  for(let i=0;i<NAMES.length;i++){
   const [nx,ny]=layout[i],targetX=xmin+(xmax-xmin)*nx,targetY=ymin+(ymax-ymin)*ny;
   let best=null,cost=Infinity;
   for(const v of candidates){
    let sep=0;
    for(const old of used)if(Math.abs(old.sx-v.sx)<105&&Math.abs(old.sy-v.sy)<26)sep+=2e6;
    const dx=(v.sx-targetX)/width(),dy=(v.sy-targetY)/heightPx();
    const score=(dx*dx+dy*dy)*40000+sep;
    if(score<cost){cost=score;best=v;}
   }
   if(best)used.push(best);
  }
  return used;
 }
 window.addEventListener('message',event=>{
  if(event.origin!==ORIGIN||event.source!==window.parent||event.data?.source!=='vstopia-parent')return;
  const d=event.data;
  if(d.type==='select'&&NAMES.includes(d.name))selected=d.name;
  if(d.type==='filter'&&Array.isArray(d.visible))visible=new Set(d.visible.filter(x=>NAMES.includes(x)));
  if(d.type==='reset'){document.getElementById('focus')?.click();}
 });
 let lastTime=0;
 function tick(now){
  ecology.update(time.value);
  if(!initialized){
   anchorVertices=chooseAnchors();
   if(anchorVertices.length===NAMES.length){
    initialized=true;
    signal('ready',{counts:{birds:ecology.birdCount,bushes:ecology.bushCount,
      grass:ecology.shortGrassCount,anchors:12},wind:wind.value});
   }
  }
  if(!initialized||now-lastDispatch<70)return;
  lastDispatch=now;
  signal('anchors',{positions:anchorVertices.map((v,i)=>{
   const s=screenOf(new THREE.Vector3(v.x,v.y,v.z));
   return {name:NAMES[i],vertex:v.i,x:s.x,y:s.y,depth:s.depth,
    hidden:!visible.has(NAMES[i])||s.depth<-1||s.depth>1||s.x<width()*.15||
      s.x>width()*.75||s.y<heightPx()*.15||s.y>heightPx()*.85};
  }),selected,time:time.value});
 }
 window.VstopiaStillwaterDebug=()=>({ready:initialized,vertices:anchorVertices.length,
  bushes:ecology.bushCount,shortGrass:ecology.shortGrassCount,birds:ecology.birdCount,
  wind:wind.value,sky:'original-Sky-PMREM-r180',labelsAttached:'analytic-wind-bark-vertices'});
 return {tick};
}
