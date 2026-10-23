import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {grassPaletteWeights} from '../stillwater/grass-color.js';

const fract=x=>x-Math.floor(x);
const lerp=(a,b,t)=>a+(b-a)*t;
function hash(x,z){return fract(Math.sin(x*127.1+z*311.7)*43758.5453123);}
function noise(x,z){
 const a=Math.floor(x),b=Math.floor(z);
 let u=fract(x),v=fract(z);
 u=u*u*(3-2*u);v=v*v*(3-2*v);
 return lerp(lerp(hash(a,b),hash(a+1,b),u),
             lerp(hash(a,b+1),hash(a+1,b+1),u),v);
}
const a=grassPaletteWeights(12,17,.5,noise);
assert.deepEqual(a,grassPaletteWeights(12,17,.5,noise),'deterministic tint');
const close=grassPaletteWeights(12.01,17.01,.5,noise);
assert(Math.abs(a.patch-close.patch)<.01,'continuous world-coherent patches');
const l=grassPaletteWeights(12,17,0,noise);
const h=grassPaletteWeights(12,17,1,noise);
assert(h.green>l.green+.3,'blade variation must be noticeable');
assert(h.dry>0 && l.dry===0,'dry tips only on minority');
let sum=0,sumSq=0,min=2,max=-1,dry=0,count=0,dark=0,short=0,tall=0,shadeMin=2,hMin=2,hMax=0;
for(let i=0;i<4500;i++){
 const x=(i%75)*2-75,z=Math.floor(i/75)*2-60;
 const variation=hash(i*7+11,i*13+73);
 const {green,dry:d,shade,height}=grassPaletteWeights(x,z,variation,noise);
 assert(green>=0&&green<=1&&d>=0&&d<=1,'safe RGB interpolant');
 assert(shade>=.27&&shade<=1,'bounded coherent shade');
 assert(height>.25&&height<1.65,'biological blade height range');
 shadeMin=Math.min(shadeMin,shade);hMin=Math.min(hMin,height);hMax=Math.max(hMax,height);
 dark+=shade<.65?1:0;short+=height<.8?1:0;tall+=height>1.15?1:0;
 min=Math.min(min,green);max=Math.max(max,green);
 sum+=green;sumSq+=green*green;dry+=d>.001?1:0;count++;
}
const spread=Math.sqrt(sumSq/count-(sum/count)**2);
assert(spread>.12 && max-min>.55,'avoid uniform green');
assert(dry/count>.05 && dry/count<.22,'natural dry minority');
assert(dark/count>.06 && dark/count<.35,'several very dark patches, not dark everywhere');
assert(hMax-hMin>.65 && short>0 && tall>0,'short and tall grass coexist');
const src=readFileSync(new URL('../stillwater/scene.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../stillwater/index.html',import.meta.url),'utf8');
assert(src.includes("color:'#ffffff',vertexColors:true"),'no extra fixed yellow albedo');
assert(src.includes('grassPaletteWeights(x,z,rand(),noise)'),'per-clump plus macro');
assert(src.includes('*.height')===false || src.includes('tint.height'),'height drives instance scale');
assert(src.includes('*fade*tint.height'),'height patch actually applied');
assert(src.includes('.multiplyScalar(tint.shade)'),'deep noise shade applied');
assert(src.includes('grass.setColorAt(gi++,tc)'),'PBR GPU instance colors');
assert(src.includes('meadowDeep').valueOf() && src.includes('meadowFresh')&&src.includes('meadowDry'));
assert(src.includes('pow(h,1.85)*uWind'),'root-to-tip wind envelope');
assert(src.includes('individual*6.2831853'),'desynchronized motion');
assert(src.includes('const grassCount=lowPower?24000:180000'),'GPU budgets unchanged');
assert(html.includes('-sun-azimuth-v1-grass-color-v2'),'fresh browser cache');
assert(!src.includes('grass.material.color.set'),'no runtime per-frame recolor');
console.log('PASS grass:',{greenSpread:spread.toFixed(3),veryDarkFraction:(dark/count).toFixed(3),dryFraction:(dry/count).toFixed(3),heightRange:[hMin.toFixed(2),hMax.toFixed(2)],shadowMin:shadeMin.toFixed(2)});
