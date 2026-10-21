// One self-hosted @specy/liquid-glass-react WebGL refraction island.
// Do not instantiate on every metric: the garden already has a reflective lake.
import React from 'react';
import {createRoot} from 'react-dom/client';
import {LiquidGlass} from '@specy/liquid-glass-react';

const element=document.getElementById('specyGlassHeader');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(element && !reduced){
 const stage=document.getElementById('treeStage');
 const glassStyle={depth:.42,segments:24,radius:.18,roughness:.14,
   transmission:.94,reflectivity:.21,ior:1.22,dispersion:.035,thickness:.35};
 const app=React.createElement(LiquidGlass,{
   glassStyle, targetElement:stage,
   wrapperStyle:{width:'100%',height:'100%',position:'absolute',inset:0,pointerEvents:'none'},
   style:'width:100%;height:100%;padding:0;pointer-events:none;',
   onReady:()=>{element.dataset.specyGlass='ready';}
 },React.createElement('span',{style:{display:'block',width:'100%',height:'100%'}}));
 try{createRoot(element).render(app);element.dataset.specyGlass='initializing';}
 catch(err){console.warn('[VSTOPIA Glass] safe CSS fallback',err);element.dataset.specyGlass='fallback';}
}else if(element){element.dataset.specyGlass='reduced-motion';}
