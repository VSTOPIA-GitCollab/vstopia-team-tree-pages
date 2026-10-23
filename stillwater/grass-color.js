// Stable, spatially coherent green, deep-shade and blade-height distribution.
// Mirrors Unreal's per-instance tint and Blender point-ID randomness without
// allocating extra geometry, textures or new runtime animation loops.
const clamp01=v=>Math.max(0,Math.min(1,v));
const smooth=(a,b,x)=>{const t=clamp01((x-a)/(b-a));return t*t*(3-2*t);};

export function grassPaletteWeights(x,z,variation,noise){
 // Large growing areas and smaller mottles. Coordinates are world-space,
 // so each neighboring blade belongs to the same soft vegetation patch.
 const patch=.72*noise(x*.014+37,z*.014-19)+
             .28*noise(x*.054-71,z*.054+13);
 const green=clamp01(.10+patch*.79+(variation-.5)*.46);
 const dry=clamp01((variation-.86)/.14)*(.10+.21*patch);
 // Some lush, sheltered patches are visibly VERY dark. Do not draw
 // random black pixels: darken whole organically grouped areas.
 const shadeNoise=.76*noise(x*.026-53,z*.026+91)+
                  .24*noise(x*.074+13,z*.074-27);
 const deepShade=smooth(.49,.68,shadeNoise);
 const shade=1-.59*deepShade-.13*(1-variation)*deepShade;
 // Tall weeds tend to group loosely; small individual differences remain.
 const heightPatch=.7*noise(x*.081+59,z*.081-12)+
                   .3*noise(x*.21-22,z*.21+5);
 const height= .54+heightPatch*.91+(variation-.5)*.34;
 return {green,dry,patch,shade,deepShade,height};
}
