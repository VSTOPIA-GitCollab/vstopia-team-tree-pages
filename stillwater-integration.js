/* VSTOPIA liquid-glass website × original Stillwater renderer.
 * Same-origin iframe intentionally isolates Three r180, its physical sky,
 * PMREM sky IBL, wind shader and OrbitControls from r167 glass app addons.
 * Keep authorized aggregate snapshot and conceptual tree navigation separate.
 */
const stage=document.getElementById('treeStage');
const fallback=document.getElementById('treeCanvas');
const frame=document.createElement('iframe');
frame.id='stillwaterFrame';
frame.title='Stillwater — ancient tree, reflective mountain lake and natural camera controls';
frame.src='./stillwater/index.html?embedded=1';
frame.allow='fullscreen';
frame.setAttribute('loading','eager');
const labelLayer=document.createElement('div');labelLayer.id='stillwaterLabels';
const loading=document.createElement('div');loading.id='stillwaterLoading';loading.textContent='LOADING STILLWATER LANDSCAPE…';
stage.append(frame,labelLayer,loading);
fallback.style.opacity='0';fallback.style.pointerEvents='none';
const names=['Audio Playground','Creative Engine','Motion Lab','Plugin Workshop',
 'Research Garden','Release Pipeline','Community Space','Design Studio',
 'Sample Library','Collaboration Hub','Prototype Station','Knowledge Base'];
let selected=names[0],filterVisible=new Set(names);
let anchorData=[],ready=false;
const controls=new Map();
// All 12 physical bark labels remain visible when their branches face the camera.
// No toggle to hide the other names: the user explicitly wants permanent labels.
const API={
 get ready(){return ready},
 getAnchorDiagnostics(){return anchorData.map(v=>{
  const el=controls.get(v.name);
  return {...v,actualX:parseFloat(el?.style.left||'NaN'),
   actualY:parseFloat(el?.style.top||'NaN'),
   drift:Math.hypot((v.x-parseFloat(el?.style.left||'NaN')),
                    (v.y-parseFloat(el?.style.top||'NaN')))};
 })}
};
window.VstopiaEzTree=API;
window.VstopiaEzTreeAnchors=()=>anchorData.map(p=>({name:p.name,vertex:p.vertex}));
for(const name of names){
 const b=document.createElement('button');b.type='button';b.className='living-node';
 b.dataset.repo=name;b.setAttribute('aria-label','Explore '+name);
 const label=document.createElement('span');label.className='living-node-label';label.textContent=name;
 b.append(label);b.hidden=true;
 b.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('vstopia:select',{detail:{name}})));
 labelLayer.append(b);controls.set(name,b);
}
function send(type,payload={}){frame.contentWindow?.postMessage({source:'vstopia-parent',type,...payload},location.origin);}
function redraw(){
 for(const p of anchorData){
  const b=controls.get(p.name);
  if(!b)continue;
  b.style.left=p.x.toFixed(2)+'px';b.style.top=p.y.toFixed(2)+'px';
  b.hidden=p.hidden||!filterVisible.has(p.name);
  b.classList.toggle('selected',p.name===selected);
 }
}
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==frame.contentWindow||
  event.data?.source!=='stillwater-vstopia')return;
 const d=event.data;
 if(d.type==='ready'){
  ready=true;loading.hidden=true;
  stage.classList.add('has-webgl-tree');
  stage.dataset.integration='stillwater-three-r180-original-scene';
  stage.dataset.branchAnchors=String(d.counts?.anchors||0);
  stage.dataset.wind='maximum';
  stage.dataset.light='maximum';
  stage.dataset.vstopiaBushes=String(d.counts?.bushes||0);
  stage.dataset.vstopiaShortGrass=String(d.counts?.grass||0);
  stage.dataset.vstopiaBirds=String(d.counts?.birds||0);
  send('select',{name:selected});send('filter',{visible:[...filterVisible]});
  window.dispatchEvent(new Event('vstopia:tree-ready'));
 }
 if(d.type==='anchors'){
  anchorData=d.positions||[];
  redraw();
 }
});
window.addEventListener('vstopia:select-changed',e=>{
 if(!names.includes(e.detail?.name))return;
 selected=e.detail.name;send('select',{name:selected});redraw();
});
window.addEventListener('vstopia:filters',e=>{
 filterVisible=new Set((e.detail?.visible||names).filter(n=>names.includes(n)));
 send('filter',{visible:[...filterVisible]});redraw();
});
window.addEventListener('vstopia:reset',()=>send('reset'));
frame.addEventListener('error',()=>{
 loading.textContent='Stillwater did not load. Check the local HTTP server.';
});
