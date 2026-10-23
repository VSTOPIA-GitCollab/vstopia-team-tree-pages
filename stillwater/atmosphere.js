import * as THREE from './vendor/three.module.js';
export const atmosphereUniforms={
 uDaylight:{value:1},uRain:{value:0},uAtmosphereLight:{value:1},
 uAtmosphereFog:{value:new THREE.Color('#a6b8b7')}
};
const clamp=THREE.MathUtils.clamp,mix=THREE.MathUtils.lerp;
export function atmosphereState(day,rain){
 day=clamp(day,0,1);rain=clamp(rain,0,1);
 return {sun:Math.pow(day,1.6)*(1-rain*.77),
 ambient:mix(.16,1,day)*(1-rain*.28),
 moon:(1-THREE.MathUtils.smoothstep(day,.08,.45))*(1-rain*.65),
 exposure:mix(.78,1,day),wetness:rain};
}
export function createAtmosphere({scene,camera,renderer,sun,water,terrainMat,dust,clock,lowPower,height}){
 const $=id=>document.getElementById(id);
 const hemi=scene.children.find(x=>x.isHemisphereLight);
 const hemiBase=hemi?.intensity??.72;
 let daylight=1,rainfall=0,cycle=false,phase=0;
 let targetDay=1,targetRain=0;
 const base={sun:sun.intensity,color:sun.color.clone(),exposure:renderer.toneMappingExposure,fog:scene.fog.color.clone(),water:water.material.uniforms.sunColor.value.clone()};
 const lakeColor=water.material.uniforms.waterColor.value.clone();
 water.material.uniforms.uAtmosphereLight=atmosphereUniforms.uAtmosphereLight;
 water.material.fragmentShader='uniform float uAtmosphereLight;\n'+water.material.fragmentShader.replace('vec3( 0.1 ) + reflectionSample','vec3( 0.1 * uAtmosphereLight ) + reflectionSample');
 const moon=new THREE.DirectionalLight('#91b5ec',0);
 moon.position.set(-35,70,-90);scene.add(moon);
 const uniforms={...atmosphereUniforms,uTime:clock,
  uBackdropMountains:{value:null},uBackdropMountainsVisible:{value:0},
   uBackdropMidground:{value:null},uBackdropMidgroundVisible:{value:0},
  uBackdropYaw:{value:0},uBackdropVerticalScale:{value:1},
  uBackdropVerticalOffset:{value:0}
 };
 const skyMaterial=new THREE.ShaderMaterial({
  uniforms,transparent:true,side:THREE.BackSide,depthTest:true,depthWrite:false,
  vertexShader:`varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`
   uniform float uDaylight,uRain,uTime,uBackdropMountainsVisible,uBackdropMidgroundVisible,uBackdropYaw,uBackdropVerticalScale,uBackdropVerticalOffset;
    uniform sampler2D uBackdropMountains,uBackdropMidground;
    varying vec3 vDirection;
   float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
   void main(){
    vec3 d=normalize(vDirection);
    vec2 uv=vec2(atan(d.z,d.x)/6.2831853+.5,asin(clamp(d.y,-1.,1.))/3.14159265+.5);
    float cloud=noise(uv*vec2(14.,9.)+vec2(uTime*.008,0.));
    cloud=.65*cloud+.35*noise(uv*vec2(35.,23.)-vec2(uTime*.012,0.));
    float dusk=smoothstep(.03,.20,uDaylight)*(1.-smoothstep(.38,.65,uDaylight));
    float horizon=pow(1.-max(0.,d.y),5.);
    vec3 night=mix(vec3(.004,.009,.023),vec3(.025,.038,.065),horizon);
    vec3 twilight=mix(vec3(.045,.06,.13),vec3(.58,.19,.055),horizon);
    vec3 clear=mix(night,twilight,dusk);
    vec3 storm=mix(vec3(.07,.085,.10),vec3(.27,.30,.33),cloud)*mix(.07,1.,uDaylight);
    vec3 c=mix(clear,storm,uRain);
    vec2 starUV=uv*vec2(720.,360.),cell=floor(starUV);
    float star=step(.996,hash(cell))*pow(max(0.,1.-length(fract(starUV)-.5)*2.),8.);
    c+=vec3(.7,.8,1.)*star*(1.-smoothstep(.08,.32,uDaylight))*(1.-uRain)*smoothstep(.02,.18,d.y);
    float moon=1.-smoothstep(.012,.016,length(d-normalize(vec3(-.35,.70,-.90))));
    float halo=exp(-length(d-normalize(vec3(-.35,.70,-.90)))*32.);
    c+=vec3(.58,.69,.86)*(moon+halo*.09)*(1.-smoothstep(.04,.35,uDaylight))*(1.-uRain*.93);
    float opacity=max(1.-smoothstep(.0,.88,uDaylight),uRain*.94);
    // Weather lives on a 7100m sphere IN FRONT of the 7200m mountain photo
    // dome. Only its transparent sky, not its opaque photographic ridges,
    // should receive the weather/night sky overlay.
    // WebGL texture2D uses implicit UV derivatives to select mipmaps.
    // Never sample this mountain mask inside an if conditioned on per-pixel
    // cropV/arcU: derivatives are undefined across that dynamic boundary,
    // producing the observed dotted latitude arc in the nighttime sky.
    // Sample unconditionally for each fragment of the uniform-enabled dome,
    // then gate alpha with the SAME smooth spatial mask as the photo shader.
    if(uBackdropMountainsVisible>.5){
      float arcU=(uv.x+uBackdropYaw-.25)*2.;
      float sourceV=.5+(uv.y-.5)*uBackdropVerticalScale+uBackdropVerticalOffset;
      float cropV=(sourceV-(1.-2190./4096.))*(4096./1020.);
      float arcVisible=step(0.,arcU)*step(arcU,1.);
      float verticalVisible=step(0.,cropV)*step(cropV,1.);
      vec2 ridgeUV=vec2(clamp(arcU,.0005,.9995),clamp(cropV,.0005,.9995));
      float arcFade=smoothstep(.0,.10,arcU)*(1.-smoothstep(.90,1.,arcU));
      float farAlpha=texture2D(uBackdropMountains,ridgeUV).a;
      vec2 midUV=vec2(clamp(.5+(ridgeUV.x-.5)*1.28+.03,.0005,.9995),
        clamp(.5+(ridgeUV.y-.5)*.52+.065,.0005,.9995));
      float midAlpha=texture2D(uBackdropMidground,midUV).a*uBackdropMidgroundVisible;
      float maskArea=arcFade*arcVisible*verticalVisible;
      float mountainAlpha=(farAlpha+midAlpha*(1.-farAlpha))*maskArea;
      opacity*=1.-mountainAlpha;
    }
    gl_FragColor=vec4(c,opacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`
 });
 // Preserve the existing 48x24 weather-sphere tessellation. The earlier
 // v11 hypothesis that different sphere tessellations caused the dotted sky
 // line was disproved by isolating each material. The verified v12 fix is
 // branchless TEXTURE SAMPLING above, not any color/mesh/geometry change.
const overlay=new THREE.Mesh(new THREE.SphereGeometry(7100,48,24),skyMaterial);
 overlay.name='Day night and storm sky';overlay.renderOrder=-9999;overlay.frustumCulled=false;scene.add(overlay);
 let seed=96321;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const count=lowPower?1000:3800,positions=[],ends=[];
 for(let i=0;i<count;i++){const x=rnd(),y=rnd(),z=rnd();for(const end of [0,1]){positions.push(x,y,z);ends.push(end);}}
 const rainGeo=new THREE.BufferGeometry();
 rainGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 rainGeo.setAttribute('aEnd',new THREE.Float32BufferAttribute(ends,1));
 const rainMaterial=new THREE.ShaderMaterial({
  uniforms:{...uniforms,uCamera:{value:camera.position}},transparent:true,depthWrite:false,
  vertexShader:`uniform float uTime;uniform vec3 uCamera;attribute float aEnd;varying float vHeight;varying float vDistance;
   void main(){vec3 p=vec3((position.x-.5)*100.,fract(position.y-uTime*(.55+position.z*.22))*60.-15.,(position.z-.5)*100.);
    p.x+=aEnd*.32;p.y+=aEnd*1.2;p+=uCamera;vHeight=p.y;vDistance=length(p-uCamera);
    gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`,
  fragmentShader:`uniform float uRain,uDaylight;varying float vHeight,vDistance;
   void main(){if(vHeight<.18)discard;float fade=smoothstep(1.5,6.,vDistance)*(1.-smoothstep(35.,65.,vDistance));
    gl_FragColor=vec4(mix(vec3(.22,.30,.43),vec3(.66,.77,.82),uDaylight),uRain*.44*fade);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`
 });
 const drops=new THREE.LineSegments(rainGeo,rainMaterial);drops.name='Wind driven rain';drops.frustumCulled=false;scene.add(drops);
 // Ripples only inside the existing lake; no second reflective water renderer.
 const rippleGeometry=new THREE.RingGeometry(.83,1,20),rippleCount=lowPower?48:160;
 const ripples=new THREE.InstancedMesh(rippleGeometry,new THREE.ShaderMaterial({
  uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,
  vertexShader:`uniform float uTime;attribute float aPhase;varying float vLife;
   void main(){vLife=fract(uTime*.65+aPhase);vec3 p=position*(.12+vLife*.95);
    gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(p,1.);}`,
  fragmentShader:`uniform float uRain,uDaylight;varying float vLife;
   void main(){gl_FragColor=vec4(vec3(.45,.60,.65)*mix(.18,1.,uDaylight),uRain*(1.-vLife)*.38);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`
 }),rippleCount);
 const phases=new Float32Array(rippleCount),dummy=new THREE.Object3D();
 for(let i=0;i<rippleCount;i++){
  let x,z;do{x=(rnd()-.5)*65;z=(rnd()-.5)*51+4;}while(height(x,z)>.0);
  dummy.position.set(x,.055,z);dummy.rotation.x=-Math.PI/2;dummy.scale.setScalar(.35+rnd()*.8);dummy.updateMatrix();ripples.setMatrixAt(i,dummy.matrix);phases[i]=rnd();
 }
 rippleGeometry.setAttribute('aPhase',new THREE.InstancedBufferAttribute(phases,1));
 ripples.name='Rain impact rings on lake';ripples.frustumCulled=false;scene.add(ripples);
 const nightFog=new THREE.Color('#17243a'),rainFog=new THREE.Color('#727d82'),duskSun=new THREE.Color('#ff9560');
 function refreshBase(){
  base.sun=sun.intensity;base.color.copy(sun.color);base.exposure=renderer.toneMappingExposure;base.fog.copy(scene.fog.color);base.water.copy(water.material.uniforms.sunColor.value);
 }
 function labels(){
  $('daylight-value').textContent=targetDay>.8?'Day':targetDay>.48?'Late afternoon':targetDay>.12?'Twilight':'Night';
  $('rain-value').textContent=targetRain<.03?'Current sky':targetRain<.5?'Light rain':'Rainy';
  $('daylight').setAttribute('aria-valuetext',$('daylight-value').textContent);
  $('rain').setAttribute('aria-valuetext',$('rain-value').textContent);
 }
 $('daylight').oninput=e=>{targetDay=+e.target.value;cycle=false;$('day-cycle').setAttribute('aria-pressed','false');labels();};
 $('rain').oninput=e=>{targetRain=+e.target.value;labels();};
 $('day-cycle').onclick=()=>{cycle=!cycle;phase=Math.acos(clamp(2*daylight-1,-1,1));$('day-cycle').setAttribute('aria-pressed',String(cycle));};
 labels();
 return {refreshBase,
  bindBackdropMountains(mountains){
    // Share the exact image + UV transform of the existing photographed
    // ridges. No duplicate TextureLoader, asset, or animation loop.
    uniforms.uBackdropMountains.value=mountains.uMountains.value;
    uniforms.uBackdropMountainsVisible.value=mountains.uMountainsEnabled.value;
     uniforms.uBackdropMidground.value=mountains.uMidground.value;
     uniforms.uBackdropMidgroundVisible.value=mountains.uMidgroundEnabled.value;
    uniforms.uBackdropYaw.value=mountains.uMountainsYaw.value;
    uniforms.uBackdropVerticalScale.value=mountains.uMountainsVerticalScale.value;
    uniforms.uBackdropVerticalOffset.value=mountains.uMountainsVerticalOffset.value;
  },
  update(dt,paused){
  if(cycle&&!paused){phase+=dt*Math.PI*2/240;targetDay=(Math.cos(phase)+1)*.5;$('daylight').value=targetDay;labels();}
  const blend=1-Math.exp(-dt*3);
  daylight=mix(daylight,targetDay,blend);rainfall=mix(rainfall,targetRain,blend);
  if(Math.abs(daylight-targetDay)<.0001)daylight=targetDay;
  if(Math.abs(rainfall-targetRain)<.0001)rainfall=targetRain;
  const state=atmosphereState(daylight,rainfall);
  atmosphereUniforms.uDaylight.value=daylight;atmosphereUniforms.uRain.value=rainfall;
  atmosphereUniforms.uAtmosphereLight.value=mix(.13,1,daylight)*(1-rainfall*.35);
  sun.intensity=base.sun*state.sun;
  sun.color.copy(base.color).lerp(duskSun,Math.sin(daylight*Math.PI)*.45);
  if(hemi)hemi.intensity=hemiBase*state.ambient;
  moon.intensity=state.moon*.65;scene.environmentIntensity=state.ambient;
  renderer.toneMappingExposure=base.exposure*state.exposure;
  scene.fog.color.copy(nightFog).lerp(base.fog,daylight).lerp(rainFog,rainfall*daylight*.55);
  atmosphereUniforms.uAtmosphereFog.value.copy(scene.fog.color);
  water.material.uniforms.sunColor.value.copy(base.water).multiplyScalar(state.sun);
  water.material.uniforms.waterColor.value.copy(lakeColor).multiplyScalar(mix(.14,1,daylight)*(1-rainfall*.12));
  terrainMat.roughness=mix(1,.70,rainfall);terrainMat.color.setRGB(1-rainfall*.12,1-rainfall*.10,1-rainfall*.08);
  overlay.visible=daylight<.999||rainfall>.001;overlay.position.copy(camera.position);
  drops.visible=ripples.visible=rainfall>.003;
  dust.material.opacity=.45*daylight*(1-rainfall);
  document.body.dataset.daylight=daylight.toFixed(3);document.body.dataset.rain=rainfall.toFixed(3);
  document.body.dataset.dayCycle=String(cycle);document.body.dataset.weatherTime=clock.value.toFixed(2);
 }};
}
