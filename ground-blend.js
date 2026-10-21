/* Stochastic texture bombing + world-distance feathered horizon.
   The same Poly Haven albedo/normal/roughness PBR maps remain attached to MeshStandardMaterial.
   Texel offsets with crossfade prevent repeating grid shapes, not merely color overlays. */
export function applyTerrainBlending(material, gradeUniform, spatial) {
  material.transparent=true;
  material.depthWrite=false;
  material.roughness=1;
  material.metalness=0;
  material.onBeforeCompile=(shader)=>{
    shader.uniforms.uGroundGrade = {value:gradeUniform};
    shader.uniforms.uGroundLeft = {value:spatial.left};
    shader.uniforms.uGroundRight = {value:spatial.right};
    shader.uniforms.uGroundWidth = spatial.width;
    shader.vertexShader=shader.vertexShader.replace('#include <common>',
      '#include <common>\nvarying vec3 vTerrainWorldPosition;');
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',
      '#include <project_vertex>\nvTerrainWorldPosition=(modelMatrix*vec4(transformed,1.0)).xyz;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      varying vec3 vTerrainWorldPosition;
      uniform vec3 uGroundGrade;
      uniform vec3 uGroundLeft;
      uniform vec3 uGroundRight;
      uniform float uGroundWidth;
      vec2 tbHash22(vec2 p) {
        return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
      }
      float tbNoise(vec2 p) {
        vec2 i=floor(p),f=smoothstep(vec2(0.0),vec2(1.0),fract(p));
        float a=tbHash22(i).x, b=tbHash22(i+vec2(1.,0.)).x;
        float c=tbHash22(i+vec2(0.,1.)).x, d=tbHash22(i+vec2(1.,1.)).x;
        return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
      }
      vec4 tbBomb(sampler2D tex,vec2 uv) {
        // Four smoothly blended decorrelated samples. Domain cells are much bigger
        // than one individual PBR tile, so tile boundaries disappear over distance.
        vec2 tile=uv*0.047;
        vec2 cell=floor(tile);
        vec2 blend=smoothstep(vec2(.15),vec2(.85),fract(tile));
        vec2 o00=tbHash22(cell)*73.317;
        vec2 o10=tbHash22(cell+vec2(1.,0.))*73.317;
        vec2 o01=tbHash22(cell+vec2(0.,1.))*73.317;
        vec2 o11=tbHash22(cell+vec2(1.,1.))*73.317;
        return mix(mix(texture2D(tex,uv+o00),texture2D(tex,uv+o10),blend.x),
          mix(texture2D(tex,uv+o01),texture2D(tex,uv+o11),blend.x),blend.y);
      }
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
      vec4 sampledDiffuseColor=tbBomb(map,vMapUv);
      diffuseColor*=sampledDiffuseColor;
      #endif`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      // Large-scale macro variation breaks continuous uniform ground color.
      float macro=tbNoise(vTerrainWorldPosition.xz*.019)*.6 +
                  tbNoise(vTerrainWorldPosition.xz*.047)*.4;
      diffuseColor.rgb *= mix(.88,1.12,macro);
      // Multi-point calibrated HDRI meadow ↔ PBR CG ground white balance/exposure.
      // Ratios are in linear sRGB, not display RGB, so the ACES pass remains correct.
      diffuseColor.rgb *= uGroundGrade;
      // Two independent HDRI/CG swatch groups determine a subtle left-right
      // exposure and white-balance match; feathered in screen space for orbiting.
      float screenU=clamp(gl_FragCoord.x/max(1.0,uGroundWidth),0.0,1.0);
      diffuseColor.rgb *= mix(uGroundLeft,uGroundRight,smoothstep(.18,.82,screenU));
      // World-space feather blend into the very same HDRI panorama and horizon.
      // Fade begins well outside the working tree; leave the foreground solid.
      float distanceToTree=length(vTerrainWorldPosition.xz);
      float feather=1.0-smoothstep(520.0,3900.0,distanceToTree+(macro-.5)*280.0);
      diffuseColor.a *= feather;
    `);
  };
  material.customProgramCacheKey=()=> 'vstopia-ground-hdri-sampled-linear-grade-v5';
  material.needsUpdate=true;
}
