// Animate the existing CC0 HDR panorama's CLOUD REGION; never scroll the
// terrestrial horizon or change the IBL/sun source. One HDRI fetch/pixel,
// no new textures, ray-marching, clouds billboards or per-frame PMREM.
// Sky is camera-centered and is rendered behind opaque world geometry.
export function makeMovingCloudSky(THREE,panorama,clock){
 const uniforms={
  uSky:{value:panorama},
  uCloudTime:clock,
  uCloudSpeed:{value:.00026}
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
   uniform sampler2D uSky;
   uniform float uCloudTime,uCloudSpeed;
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
    gl_FragColor=texture2D(uSky,shifted);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`
 });
 shader.name='Moving HDR cloud panorama / horizon locked';
 const dome=new THREE.Mesh(new THREE.SphereGeometry(7200,48,24),shader);
 dome.name='Moving photograph clouds / horizon locked';
 dome.renderOrder=-10000;dome.frustumCulled=false;dome.visible=false;
 dome.userData.isMovingCloudSky=true;
 return {dome,uniforms,update(camera){dome.position.copy(camera.position);}};
}
