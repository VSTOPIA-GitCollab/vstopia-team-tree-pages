/* Self-hosted React island with the original MIT liquid-glass-react component. */
import React from 'react';
import {createRoot} from 'react-dom/client';
import LiquidGlass from 'liquid-glass-react';
const mounted=new WeakSet();
const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
function mount(target){
 if(mounted.has(target))return;
 if(motion.matches){target.dataset.liquidGlass='reduced-motion-css';return;}
 mounted.add(target);
 target.classList.add('true-liquid-glass');
 const layer=document.createElement('span');
 layer.className='liquid-glass-island';layer.setAttribute('aria-hidden','true');
 target.prepend(layer);
 const root=createRoot(layer);
 const corners=target.matches('.forest-speed-control')?40:target.matches('.metric')?16:14;
 root.render(React.createElement(LiquidGlass,{
  displacementScale:24,blurAmount:.065,saturation:140,aberrationIntensity:1.6,
  elasticity:.12,cornerRadius:corners,padding:'0',mode:'standard',
  overLight:true,mouseContainer:{current:target},
  className:'vstopia-glass-optic',style:{width:'100%',height:'100%',pointerEvents:'none'},
 },React.createElement('span',{'aria-hidden':'true'})));
 target.dataset.liquidGlass='react-original';
}
function mountAll(){
 document.querySelectorAll('.view-switch,.search-field,.forest-speed-control,.metric,.member-card,.stage-buttons,.sidebar-footer').forEach(mount);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountAll,{once:true});
else mountAll();
const cards=document.getElementById('memberCards');
if(cards)new MutationObserver(()=>mountAll()).observe(cards,{childList:true});
