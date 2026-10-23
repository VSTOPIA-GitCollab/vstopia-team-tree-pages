// Rare meteors cover the entire azimuth, not just the initial camera view.
// Eight pooled one-quad trails; no textures, new RAF, DOM canvases or sky-mask
// edits. Uses the scene's paused simulation clock and live weather uniforms.
const clamp01=x=>Math.max(0,Math.min(1,x));
export const METEOR_SECTORS=8;
export function meteorVisibility(daylight,rain){
 const t=clamp01((.62-clamp01(daylight))/.46);
 const darkness=t*t*(3-2*t); // no daylight, faint dusk, clear-night maximum
 return darkness*Math.pow(1-clamp01(rain),1.6); // storm hides distant meteors
}
// Default 25: 70–180 simulated seconds. Maximum setting: ~1.1–2.8s
// between small distributed meteor groups, for deliberate visual inspection.
export function nextMeteorDelay(random,frequency=25){
 const setting=Math.max(1,Math.min(100,frequency));
 return (70+110*random())*Math.pow(25/setting,3);
}
export const meteorGroupSize=frequency=>frequency>85?3:frequency>55?2:1;

export function createShootingStars({THREE,scene,camera,clock,atmosphereUniforms}){
 let seed=0x5a17c3;
 const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const geometry=new THREE.PlaneGeometry(1,1); // shared by all 8 meshes
 const vertexShader=`
  uniform vec3 uStart,uTangent;
  uniform float uProgress,uArc,uTrail;
  varying vec2 vUv;
  void main(){
   vUv=uv;
   float angle=uProgress*uArc-(1.-uv.x)*uTrail;
   vec3 ray=normalize(uStart*cos(angle)+uTangent*sin(angle));
   vec3 side=normalize(cross(ray,uTangent));
   float width=mix(.0005,.0018,uv.x);
   vec3 p=(ray+side*(uv.y*2.-1.)*width)*6900.;
   gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
  }`;
 const fragmentShader=`
  uniform float uVisibility,uLife;
  varying vec2 vUv;
  void main(){
   float across=pow(max(0.,1.-abs(vUv.y*2.-1.)),1.25);
   float trail=pow(vUv.x,1.7);
   float core=pow(vUv.x,10.);
   float envelope=smoothstep(0.,.13,uLife)*(1.-smoothstep(.72,1.,uLife));
   float alpha=uVisibility*envelope*across*(.38*trail+1.1*core);
   gl_FragColor=vec4(vec3(.76,.85,1.),alpha);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`;
 const actors=Array.from({length:METEOR_SECTORS},(_,sector)=>{
  const uniforms={
   uStart:{value:new THREE.Vector3(0,1,0)},
   uTangent:{value:new THREE.Vector3(1,0,0)},
   uProgress:{value:0},uArc:{value:.08},uTrail:{value:.025},
   uLife:{value:0},uVisibility:{value:0}
  };
  const material=new THREE.ShaderMaterial({
   uniforms,transparent:true,depthTest:true,depthWrite:false,
   side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
   toneMapped:false,fog:false,vertexShader,fragmentShader
  });
  const mesh=new THREE.Mesh(geometry,material);
  mesh.name='Shooting star / sky sector '+sector;
  mesh.renderOrder=-9998; // weather sky -9999; opaque mountains still occlude
  mesh.frustumCulled=false;mesh.visible=false;
  scene.add(mesh);
  return {sector,mesh,uniforms,started:-Infinity,duration:.7};
 });
 const ray=new THREE.Vector3(),tangent=new THREE.Vector3(),screenRay=new THREE.Vector3();
 const up=new THREE.Vector3(0,1,0);
 let frequency=25,next=nextMeteorDelay(rnd),count=0,lastTime=0,sectorCursor=0;
 const sectorsSeen=new Set();

 function spawn(now,sector,visibleCamera=false){
  // At high settings one meteor is deliberately spawned in the upper part
  // of the user's actual view. All other events use full 360° world sectors.
  const az=(sector+.16+rnd()*.68)*Math.PI*2/METEOR_SECTORS;
  const elev=(.36+rnd()*.40); // ~21–44° elevation
  if(visibleCamera)ray.copy(screenRay);
  else ray.set(Math.cos(az)*Math.cos(elev),Math.sin(elev),Math.sin(az)*Math.cos(elev));
  tangent.set(-Math.sin(az),0,Math.cos(az)).multiplyScalar(rnd()<.5?-1:1);
  tangent.addScaledVector(up,-(.30+rnd()*.20));
  tangent.addScaledVector(ray,-tangent.dot(ray)).normalize();
  const a=actors[sector];
  a.uniforms.uStart.value.copy(ray);
  a.uniforms.uTangent.value.copy(tangent);
  a.uniforms.uArc.value=.055+rnd()*.045;
  a.uniforms.uTrail.value=.048+rnd()*.032;
  a.duration=.58+rnd()*.38;a.started=now;
  count++;sectorsSeen.add(sector);
 }
 function update(){
  const now=clock.value;
  if(now<lastTime){
   actors.forEach(a=>{a.started=-Infinity;a.mesh.visible=false;});
   next=now+nextMeteorDelay(rnd,frequency);
  }
  lastTime=now;
  const visibility=meteorVisibility(atmosphereUniforms.uDaylight.value,atmosphereUniforms.uRain.value);
  if(frequency>0&&now>=next){
   // Round-robin with step 3 (coprime to 8): each successive streak uses a
   // different sector, and bursts span much of the 360° sky at high settings.
   const n=meteorGroupSize(frequency),used=new Set();
   if(n>1){
    // Top 30% of the current camera frustum, not a screen-space overlay.
    // Extra meteors still cover the other compass sectors for any orbit.
    camera.updateMatrixWorld();
    screenRay.set((rnd()-.5)*.7,.52+rnd()*.25,.5)
      .unproject(camera).sub(camera.position).normalize();
    const angle=(Math.atan2(screenRay.z,screenRay.x)+Math.PI*2)%(Math.PI*2);
    const mainSector=Math.min(METEOR_SECTORS-1,Math.floor(angle/(Math.PI*2)*METEOR_SECTORS));
    used.add(mainSector);
    if(visibility>.14)spawn(now,mainSector,true);
   }
   for(let i=used.size;i<n;i++){
    let sector=(sectorCursor*3)%METEOR_SECTORS;
    sectorCursor++;
    while(used.has(sector)){sector=(sectorCursor*3)%METEOR_SECTORS;sectorCursor++;}
    used.add(sector);
    if(visibility>.14)spawn(now,sector);
   }
   next=now+nextMeteorDelay(rnd,frequency);
  }
  let activeCount=0;
  for(const a of actors){
   const age=now-a.started;
   const active=frequency>0&&age>=0&&age<a.duration&&visibility>.015;
   a.mesh.visible=active;
   if(active){
    a.uniforms.uProgress.value=age/a.duration;
    a.uniforms.uLife.value=age/a.duration;
    a.uniforms.uVisibility.value=visibility;
    a.mesh.position.copy(camera.position); // camera-centered, no parallax
    activeCount++;
   }
  }
  document.body.dataset.meteorCount=String(count);
  document.body.dataset.meteorVisible=String(activeCount>0);
  document.body.dataset.meteorActiveCount=String(activeCount);
 }
 function setFrequency(value){
  const updated=Math.max(0,Math.min(100,Number(value)||0));
  if(updated===frequency)return;
  frequency=updated;
  next=clock.value+nextMeteorDelay(rnd,Math.max(1,frequency));
  if(frequency===0)actors.forEach(a=>{a.mesh.visible=false;});
 }
 return {
  update,setFrequency,meteor:actors[0].mesh,meteors:actors.map(a=>a.mesh),
  getState:()=>({
   count,next,frequency,active:actors.some(a=>a.mesh.visible),
   activeCount:actors.filter(a=>a.mesh.visible).length,
   sectorsSeen:[...sectorsSeen],activeSectors:actors.filter(a=>a.mesh.visible).map(a=>a.sector)
  })
 };
}
