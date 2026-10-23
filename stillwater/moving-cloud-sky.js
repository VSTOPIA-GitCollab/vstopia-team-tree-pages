// Animate the existing CC0 HDR panorama's CLOUD REGION; never scroll the
// terrestrial horizon or change the IBL/sun source. One HDRI fetch/pixel,
// no new textures, ray-marching, clouds billboards or per-frame PMREM.
// Sky is camera-centered and is rendered behind opaque world geometry.
export function makeMovingCloudSky(THREE,panorama,clock,atmosphereUniforms={}){
 const blank=new THREE.DataTexture(new Uint8Array([0,0,0,0]),1,1,THREE.RGBAFormat);
 blank.needsUpdate=true;
 const uniforms={
  uSky:{value:panorama},
  uCloudTime:clock,
  uCloudSpeed:{value:.00026},
  // A single transparent photographic ridge layer *behind* all 3D mountains.
  uMountains:{value:blank},
  uMidground:{value:blank},
  uMidgroundEnabled:{value:0},
  uMountainsEnabled:{value:0},
  uMountainsYaw:{value:.25}, // source central Alps massif points towards scene -Z
  uMountainsVerticalScale:{value:2.85}, // restored preferred lower mountain skyline
  uMountainsVerticalOffset:{value:0.0}, // restored original skyline placement
  uMountainExposure:{value:.78}, // darken ONLY photographic mountains, not 3D world/sky
  uDaylight:atmosphereUniforms.uDaylight||{value:1},
  uRain:atmosphereUniforms.uRain||{value:0},
  uSceneLight:atmosphereUniforms.uSceneLight||{value:1}, // actual independent Light slider
  uBackdropFog:atmosphereUniforms.uAtmosphereFog||{value:new THREE.Color('#a6b8b7')}
 };
 const shader=new THREE.ShaderMaterial({
  uniforms,side:THREE.BackSide,depthWrite:false,depthTest:false,
  fog:false,toneMapped:true,
  vertexShader:`
   varying vec3 vCloudDirection;
   void main(){
    vCloudDirection=position;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
   }`,
  fragmentShader:`
   uniform sampler2D uSky,uMountains,uMidground;
   uniform float uCloudTime,uCloudSpeed,uMountainsEnabled,uMidgroundEnabled,uMountainsYaw,uMountainsVerticalScale,uMountainsVerticalOffset;
   uniform float uDaylight,uRain,uMountainExposure,uSceneLight;
   uniform vec3 uBackdropFog;
   varying vec3 vCloudDirection;
   void main(){
    vec3 d=normalize(vCloudDirection);
    vec2 uv=vec2(atan(d.z,d.x)*.15915494309+.5,
                 asin(clamp(d.y,-1.0,1.0))*.31830988618+.5);
    // Below the horizon the mountains/landscape remain completely anchored.
    // Smoothly enable wind translation in the upper sky: this slides the
    // photographic clouds themselves instead of overpainting new clouds.
    float driftArea=smoothstep(-.015,.18,d.y);
    vec2 shifted=vec2(fract(uv.x+uCloudTime*uCloudSpeed*driftArea),uv.y);
    vec4 skySample=texture2D(uSky,shifted);
    // Use only the ORIGINAL front-facing 180 degrees of the 360 photo.
    // Both image and dome use 180 physical degrees; there is NO stretching,
    // texture repetition, 0/360 longitude join, or cylindrical hard edge.
    // Original 8K source columns [2048..6144], source rows [1170..2190].
    float arcU=(uv.x+uMountainsYaw-.25)*2.;
    float sourceV=.5+(uv.y-.5)*uMountainsVerticalScale+uMountainsVerticalOffset;
    float cropV=(sourceV-(1.-2190./4096.))*(4096./1020.);
    float arcFade=smoothstep(.0,.10,arcU)*(1.-smoothstep(.90,1.,arcU));
    float arcVisible=step(0.,arcU)*step(arcU,1.);
    float verticalVisible=step(0.,cropV)*step(cropV,1.);
    vec2 ridgeUV=vec2(clamp(arcU,.0005,.9995),clamp(cropV,.0005,.9995));
    vec4 ridge=texture2D(uMountains,ridgeUV);
    ridge.a*=arcFade*arcVisible*verticalVisible;
    // Approved photo: slightly wider 1.28 UV stretch and a small movement
    // opposite the preceding +.13 texture offset, now +.03. Height unchanged.
    // Keep the same source RGBA, with no duplicated panorama sections.
    // This EXACT UV transformation is shared with the weather dome mask.
    vec2 midUV=vec2(clamp(.5+(ridgeUV.x-.5)*1.28+.03,.0005,.9995),
      clamp(.5+(ridgeUV.y-.5)*.52+.065,.0005,.9995));
    vec4 nearRidge=texture2D(uMidground,midUV);
    nearRidge.a*=arcFade*arcVisible*verticalVisible;
    float daylight=clamp(uDaylight,0.,1.),rain=clamp(uRain,0.,1.);
    // Fixed distant atmospheric perspective: terrain light dims at night,
    // rainy weather loses contrast and tends toward the scene fog color.
    float haze=.30+.24*rain;
    vec3 photoRock=mix(ridge.rgb,uBackdropFog,haze);
    photoRock*=mix(.075,1.,pow(daylight,.85))*(1.-.27*rain);
    // Independent color-grade of this photo layer after atmospheric blending:
    // keep Weather/Day-Night, 3D mountain lighting, and moving HDR sky intact.
    photoRock*=uMountainExposure;
    // The owner-edited midground photo is an unlit cutout; borrow light
    // from the *actual* moving HDR sky above this azimuth so it reads as
    // an atmospheric mountain instead of a pasted-on black foreground.
    // This is COLOR grading only: preserve true silhouette and alpha.
    vec2 skyLightUV=vec2(shifted.x,clamp(uv.y+.14,.59,.86));
    vec3 sampledSky=clamp(texture2D(uSky,skyLightUV).rgb,vec3(0.),vec3(1.1));
    float sceneLight=clamp(uSceneLight,0.,1.);

    // A soft per-pixel luminance mask for BAKED photographic sunlight on
    // the snowy upper ridges. Values are LINEAR sRGB (Texture.colorSpace is
    // SRGBColorSpace). Mask only bright pixels near the upper mountain,
    // never the green lower field, sky, or the RGBA crest silhouette.
    // Narrowed after owner review: focus on truly bright snow/rock only.
    float sourceLuma=dot(nearRidge.rgb,vec3(.2126,.7152,.0722));
    float snowyHighlight=smoothstep(.22,.42,sourceLuma);
    float summitRegion=smoothstep(.49,.70,midUV.y);
    float highlightMask=snowyHighlight*summitRegion;

    // Day/Night and Rain are separate sliders, and Light is a third one.
    // Suppress the static source-photo highlights when ANY of these make
    // natural direct sunlight inappropriate. Bright clear day is unchanged.
    float cloudyShadow=clamp(max(1.-daylight,rain*.95)+(1.-sceneLight)*.58,0.,1.);
    float matteCeiling=mix(.50,.20,cloudyShadow);
    float matteRatio=min(1.,matteCeiling/max(sourceLuma,.0001));
    vec3 photoDiffuse=nearRidge.rgb*
      mix(1.,matteRatio,highlightMask*cloudyShadow*.64);

    // Ambient contribution from the actual HDR sky is ALSO weather-gated:
    // don't reintroduce midday brightness at night or in a rainstorm.
    float skyIllumination=daylight*(1.-.83*rain)*mix(.72,1.,sceneLight);
    vec3 airLight=mix(uBackdropFog,sampledSky*skyIllumination,.43);
    float upperHaze=smoothstep(.43,.91,midUV.y);
    float photoAirMix=clamp(.10+.14*upperHaze+.20*rain,0.,.45);
    vec3 midRock=mix(photoDiffuse,airLight,photoAirMix);

    // The light from rain/fog must not turn masked snowy faces pale again.
    // Apply a second matte cap after atmospheric mixing at the exact same
    // masked pixels. Blend gently to preserve rock texture at twilight.
    float relitLuma=dot(midRock,vec3(.2126,.7152,.0722));
    float relitCeiling=mix(.61,.22,cloudyShadow);
    float relitRatio=min(1.,relitCeiling/max(relitLuma,.0001));
    midRock*=mix(1.,relitRatio,highlightMask*cloudyShadow*.56);
    float midLuma=dot(midRock,vec3(.2126,.7152,.0722));
    midRock=mix(vec3(midLuma),midRock,.91);
    midRock=mix(vec3(.50),midRock,.965);
    midRock*=mix(.075,1.,pow(daylight,.85))*(1.-.25*rain);
    float farAlpha=ridge.a*uMountainsEnabled;
    float midAlpha=nearRidge.a*uMidgroundEnabled;
    float mountainAlpha=farAlpha*(1.-midAlpha)+midAlpha;
    vec3 photoComposite=(photoRock*farAlpha*(1.-midAlpha)+midRock*midAlpha)
      /max(.0001,mountainAlpha);
    float weatherOpacity=max(1.-smoothstep(.0,.88,daylight),rain*.94);
    // The inner weather sphere draws AFTER the photographic sky with
    // alpha=(1-mountainAlpha)*weatherOpacity. Compensate that second blend:
    // otherwise the original bright HDR day sky shows through as a thin
    // white halo in partially transparent crest pixels at night or in rain.
    // When weatherOpacity=0 (clear day), photoBlend == mountainAlpha.
    float photoBlend=mountainAlpha/max(.0001,1.-weatherOpacity*(1.-mountainAlpha));
    skySample.rgb=mix(skySample.rgb,photoComposite,clamp(photoBlend,0.,1.));
    gl_FragColor=skySample;
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`
 });
 shader.name='Moving HDR cloud panorama / horizon locked';
 const dome=new THREE.Mesh(new THREE.SphereGeometry(7200,48,24),shader);
 dome.name='Moving photograph clouds / horizon locked';
 dome.renderOrder=-10000;dome.frustumCulled=false;dome.visible=false;
 dome.userData.isMovingCloudSky=true;
 return {dome,uniforms,
   setMountains(texture){
     texture.colorSpace=THREE.SRGBColorSpace;
     texture.wrapS=THREE.ClampToEdgeWrapping;
     texture.wrapT=THREE.ClampToEdgeWrapping;
     texture.needsUpdate=true;
     uniforms.uMountains.value=texture;
     uniforms.uMountainsEnabled.value=1;
   },
   setMidground(texture){
     texture.colorSpace=THREE.SRGBColorSpace;
     texture.wrapS=THREE.ClampToEdgeWrapping;
     texture.wrapT=THREE.ClampToEdgeWrapping;
     texture.needsUpdate=true;
     uniforms.uMidground.value=texture;
     uniforms.uMidgroundEnabled.value=1;
   },
   update(camera){dome.position.copy(camera.position);}
 };
}
