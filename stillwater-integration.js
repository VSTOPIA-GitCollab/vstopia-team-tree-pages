/* Public GitHub alias navigation over the original Stillwater Three.js r180
 * renderer. Only approved pseudonyms cross into the iframe, never private refs.
 */
const stage=document.getElementById('treeStage');
const fallback=document.getElementById('treeCanvas');
const frame=document.createElement('iframe');
frame.id='stillwaterFrame';
frame.title='Interactive 3D living tree and mountain lake';
frame.src='./stillwater/index.html?embedded=1&v=organic-grass-variation-20261022-moving-clouds-v1';
frame.allow='fullscreen';
frame.setAttribute('loading','eager');
const labelLayer=document.createElement('div');labelLayer.id='stillwaterLabels';
const loading=document.createElement('div');loading.id='stillwaterLoading';
loading.textContent='LOADING STILLWATER LANDSCAPE…';
stage.append(frame,labelLayer,loading);
fallback.style.opacity='0';fallback.style.pointerEvents='none';
const DEFAULT_NAMES=['Audio Playground','Creative Engine','Motion Lab','Plugin Workshop',
 'Research Garden','Release Pipeline','Community Space','Design Studio',
 'Sample Library','Collaboration Hub','Prototype Station','Knowledge Base'];
let names=[...DEFAULT_NAMES],selected=names[0],filterVisible=new Set(names);
let aliasMode=false,anchorData=[],ready=false;
let plannedNames=new Set();
let configuredCatalog='',pendingCatalog='',configureRetries=0;
function requestConfigure(){
 if(!aliasMode)return;
 const fingerprint=names.join('\u0001');
 if(configuredCatalog===fingerprint||pendingCatalog===fingerprint)return;
 pendingCatalog=fingerprint;
 send('configure',{names,selected,visible:[...filterVisible]});
 if(configureRetries++<4)setTimeout(()=>{
  if(configuredCatalog!==fingerprint&&pendingCatalog===fingerprint){
   pendingCatalog='';requestConfigure();
  }
 },850);
}
const controls=new Map();
const API={
 get ready(){return ready;},
 getAliasState(){return {ready,aliasMode,namesCount:names.length,configured:configuredCatalog.length>0,pending:pendingCatalog.length>0,configureRetries,selected};},
 getAnchorDiagnostics(){return anchorData.map(v=>{
  const el=controls.get(v.name);
  return {...v,actualX:parseFloat(el?.style.left||'NaN'),
   actualY:parseFloat(el?.style.top||'NaN'),
   drift:Math.hypot(v.x-parseFloat(el?.style.left||'NaN'),
                    v.y-parseFloat(el?.style.top||'NaN'))};
 })}
};
window.VstopiaEzTree=API;
window.VstopiaEzTreeAnchors=()=>anchorData.map(p=>({name:p.name,vertex:p.vertex}));
function send(type,payload={}){
 frame.contentWindow?.postMessage({source:'vstopia-parent',type,...payload},location.origin);
}
function renderControls(){
 for(const [name,button] of controls)if(!names.includes(name)){button.remove();controls.delete(name);}
 for(const name of names){
  if(controls.has(name))continue;
  const b=document.createElement('button');b.type='button';b.className='living-node';
  b.dataset.repo=name;b.setAttribute('aria-label','Explore '+name);
  const label=document.createElement('span');label.className='living-node-label';label.textContent=name;
  b.append(label);b.hidden=true;
  b.addEventListener('click',()=>{
   if(aliasMode)window.dispatchEvent(new CustomEvent('vstopia:choose-alias',{detail:{name}}));
   else window.dispatchEvent(new CustomEvent('vstopia:select',{detail:{name}}));
  });
  labelLayer.append(b);controls.set(name,b);
 }
 for(const [name,button] of controls)button.classList.toggle('planned',plannedNames.has(name));
}
function redraw(){
 const mobile=matchMedia('(max-width:760px)').matches;
 const placed=[];
 // Prioritize the selected alias. Others remain anchored to their bark
 // vertices, appearing when the viewer orbits and enough screen room opens up.
 const sorted=[...anchorData].sort((a,b)=>
  (a.name===selected?-1:b.name===selected?1:0));
 for(const p of sorted){
  const b=controls.get(p.name);if(!b)continue;
  b.style.left=p.x.toFixed(2)+'px';b.style.top=p.y.toFixed(2)+'px';
  let hidden=p.hidden||!filterVisible.has(p.name);
  if(!hidden){
   const w=mobile?Math.min(128,Math.max(70,p.name.length*5.8+22)):
     Math.min(160,Math.max(82,p.name.length*6.7+24));
   const h=mobile?26:28;
   const rect={l:p.x-w/2,r:p.x+w/2,t:p.y-h/2,b:p.y+h/2};
   if(rect.l<6||rect.r>stage.clientWidth-6||rect.t<8||
     rect.b>stage.clientHeight-8)hidden=true;
   else if(placed.some(x=>rect.l<x.r+5&&rect.r>x.l-5&&
      rect.t<x.b+3&&rect.b>x.t-3))hidden=true;
   else placed.push(rect);
  }
  b.hidden=hidden;
  b.classList.toggle('selected',p.name===selected);
 }
}

renderControls();
window.addEventListener('vstopia:aliases',e=>{
 const entries=e.detail?.aliases;
 if(!Array.isArray(entries)||entries.length===0)return;
 const valid=entries.filter(row=>row&&typeof row.name==='string'&&
  /^[A-Za-zÀ-ÖØ-öø-ÿ ]{4,40}$/.test(row.name)).slice(0,100);
 if(valid.length!==entries.length||new Set(valid.map(x=>x.name)).size!==valid.length)return;
 names=valid.map(x=>x.name);
 plannedNames=new Set(valid.filter(x=>x.planned).map(x=>x.name));
 aliasMode=true;filterVisible=new Set(names);
 if(!names.includes(selected))selected=names[0];
 anchorData=[];renderControls();
 configuredCatalog='';pendingCatalog='';configureRetries=0;
 requestConfigure();
});
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==frame.contentWindow||
    event.data?.source!=='stillwater-vstopia')return;
 const d=event.data;
 if(d.type==='ready'){
  ready=true;loading.hidden=true;
  stage.classList.add('has-webgl-tree');
  stage.dataset.integration='stillwater-three-r180-original-scene';
  stage.dataset.branchAnchors=String(d.counts?.anchors||0);
  stage.dataset.wind='maximum';stage.dataset.light='maximum';
  stage.dataset.vstopiaBushes=String(d.counts?.bushes||0);
  stage.dataset.vstopiaShortGrass=String(d.counts?.grass||0);
  stage.dataset.vstopiaBirds=String(d.counts?.birds||0);
  if(aliasMode)requestConfigure();
  else{send('select',{name:selected});send('filter',{visible:[...filterVisible]});}
  window.dispatchEvent(new Event('vstopia:tree-ready'));
 }
 if(d.type==='configured'){
  if(Array.isArray(d.names)&&d.names.join('\u0001')===names.join('\u0001')){
   configuredCatalog=names.join('\u0001');
   pendingCatalog='';
  }
 }
 if(d.type==='anchors'){
  anchorData=d.positions||[];
  stage.dataset.branchAnchors=String(anchorData.length);
  redraw();
 }
 if(d.type==='error'){
  loading.hidden=false;
  loading.textContent='3D unavailable on this device: '+String(d.message||'WebGL error').slice(0,180);
  stage.dataset.integration='3d-error';
 }
});
window.addEventListener('vstopia:select-changed',e=>{
 if(!names.includes(e.detail?.name))return;
 selected=e.detail.name;send('select',{name:selected});redraw();
});
window.addEventListener('vstopia:alias-selected',e=>{
 if(!names.includes(e.detail?.name))return;
 selected=e.detail.name;send('select',{name:selected});redraw();
});
window.addEventListener('vstopia:filters',e=>{
 if(aliasMode)return; // Area filters apply only to the conceptual fallback.
 filterVisible=new Set((e.detail?.visible||names).filter(n=>names.includes(n)));
 send('filter',{visible:[...filterVisible]});redraw();
});
window.addEventListener('vstopia:reset',()=>send('reset'));
// The iframe may initialize before or after the public catalog. Recover from
// lost initial postMessage without an infinite ready/configure loop.
let handshakeTicks=0;
const handshake=setInterval(()=>{
 if(++handshakeTicks>35){clearInterval(handshake);return;}
 if(!ready)send('ping');
 if(aliasMode && !configuredCatalog){
  pendingCatalog='';requestConfigure();
 }
 if(ready && (!aliasMode||configuredCatalog))clearInterval(handshake);
},900);
frame.addEventListener('load',()=>{
 send('ping');
 if(aliasMode){pendingCatalog='';requestConfigure();}
});
frame.addEventListener('error',()=>{
 loading.hidden=false;loading.textContent='Stillwater 3D did not load.';
});

// Opt-in diagnostics for an ACTUAL iPhone: append ?iosdebug=1 to the public
// page URL. Never display diagnostics in the normal customer experience.
// Read-only; reports whether RAF, water uniform and bird matrices progress.
// No private GitHub repository data, device identifiers or network logging.
if(new URLSearchParams(location.search).get('iosdebug')==='1'){
 const diag=document.createElement('output');
 diag.id='iosAnimationDiagnostics';
 diag.setAttribute('aria-label','Live iOS 3D animation diagnostics');
 Object.assign(diag.style,{
  position:'absolute',top:'10px',left:'10px',zIndex:'40',pointerEvents:'none',
  background:'rgba(8,26,32,.82)',color:'#eef8ff',borderRadius:'8px',
  padding:'8px',font:'11px/1.45 ui-monospace,monospace',
  whiteSpace:'pre-line',maxWidth:'calc(100% - 20px)'
 });
 stage.append(diag);
 let lastFrames=null,lastWater=null,lastBird=null;
 const paint=()=>{
  let x=null;
  try{x=frame.contentWindow?.VstopiaStillwaterDebug?.()||null}catch(_){}
  if(!x){diag.textContent='iOS diagnostic: waiting for WebGL scene';return;}
  const f=x.frameStats||{},bird=x.firstBirdPosition||null;
  const moving=f.frames!=null&&lastFrames!=null?f.frames>lastFrames:false;
  const waterMoving=lastWater!=null?x.waterTime>lastWater:false;
  const birdsMoving=bird&&lastBird?bird.some((v,i)=>Math.abs(v-lastBird[i])>.0001):false;
  diag.textContent='iOS 3D | '+(x.lowPower?'mobile':'desktop')+
   '\nframes '+String(f.frames??'?')+(lastFrames!=null?' (moving '+(moving?'YES':'NO')+')':'')+
   '\nwater '+Number(x.waterTime).toFixed(2)+(lastWater!=null?' (moving '+(waterMoving?'YES':'NO')+')':'')+
   '\nbirds '+String(x.birds??'?')+(lastBird?' (moving '+(birdsMoving?'YES':'NO')+')':'')+
   '\npaused '+String(x.paused)+' | GL lost '+String(!!f.webglLost)+
   '\nvisible '+String(f.documentVisible)+' | frame age '+String(f.frameAgeMs??'?')+'ms';
  lastFrames=f.frames;lastWater=x.waterTime;
  lastBird=bird?[...bird]:null;
 };
 paint();setInterval(paint,2500);
}
