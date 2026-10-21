/* EZ-Tree branch clones plus a single draw call for thousands of irregular foliage lobes. */
export function addEzTreeShrubs({THREE,scene,tree,terrain,center,stage}){
 terrain.updateMatrixWorld(true);
 const bbox=new THREE.Box3().setFromObject(tree),bushMinY=bbox.min.y-tree.position.y;
 const ray=new THREE.Raycaster(new THREE.Vector3(),new THREE.Vector3(0,-1,0),0,1000);
 const samples=[[-42,-46,.165,.082],[48,-44,.185,.091],[-65,28,.149,.078],
 [67,29,.172,.085],[-29,66,.155,.076],[35,76,.149,.080],
 [-92,-74,.153,.078],[105,-78,.167,.087],[-88,108,.119,.065],
 [85,111,.126,.066],[-40,-99,.146,.072],[44,-110,.138,.071],
 [-136,20,.11,.058],[-147,74,.13,.072],[-169,-48,.14,.074],[-185,132,.105,.057],
 [-16,154,.108,.060],[14,173,.11,.061],[-130,-142,.13,.075],[-175,-98,.12,.06],
 [163,-130,.13,.069],[201,-85,.10,.06],[185,0,.14,.08],[167,124,.11,.07],
 [-81,183,.10,.06],[-207,62,.12,.073],[229,83,.11,.068],[-221,-118,.13,.07]];
 const garden=new THREE.Group();garden.name='EZ-Tree botanically clustered garden';
 const leafGeometry=new THREE.IcosahedronGeometry(1,0);
 const leafMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.94,metalness:0,flatShading:true,side:THREE.DoubleSide});
 const leaves=new THREE.InstancedMesh(leafGeometry,leafMat,samples.length*260);
 leaves.name='leaf-lobe-canopies';
 const colorA=new THREE.Color('#49673d'),colorB=new THREE.Color('#688850'),colorC=new THREE.Color('#8aa56d');
 const dummy=new THREE.Object3D();let count=0;
 function rnd(n){const x=Math.sin(n*127.1+49.2)*43758.5453;return x-Math.floor(x);}
 samples.forEach(([x,z,spread,height],i)=>{
  ray.ray.origin.set(x,500,z);const hit=ray.intersectObject(terrain,false)[0];if(!hit)return;
  const child=tree.clone(true);child.scale.set(spread,height,spread);
  child.position.set(-center.x*spread,-bushMinY*height,-center.z*spread);
  const holder=new THREE.Group();holder.position.set(x,hit.point.y-.018,z);
  holder.rotation.y=(i*2.3999632297)%(Math.PI*2);holder.add(child);garden.add(holder);
  // Seven overlapping irregular crowns; individual leaves remain visible rather
  // than seven smooth sphere meshes. No per-frame random values or allocations.
  for(let j=0;j<260;j++){
   const cluster=j%7;
   const a=cluster*2.399963+i*.7,r=cluster===0?0:2.3+(cluster%3)*1.25;
   const cx=Math.cos(a)*r,cz=Math.sin(a)*r;
   const n=i*421+j*17.41;
   const theta=rnd(n+17)*Math.PI*2, v=rnd(n+29)*2-1;
   const shell=Math.pow(rnd(n+7),.55);
   const rad=2.15+cluster*.16;
   const horiz=Math.sqrt(Math.max(0,1-v*v))*shell*rad;
   const px=x+cx+Math.cos(theta)*horiz;
   const pz=z+cz+Math.sin(theta)*horiz;
   const py=hit.point.y+3.1+cluster*.20+v*2.0*shell;
   const scale=.43+rnd(n+51)*.64;
   dummy.position.set(px,Math.max(hit.point.y+.45,py),pz);
   dummy.rotation.set(rnd(n+5)*6.28,rnd(n+9)*6.28,rnd(n+14)*6.28);
   dummy.scale.set(scale*.60,scale*(.87+rnd(n+33)*.55),scale*.43);
   dummy.updateMatrix();leaves.setMatrixAt(count,dummy.matrix);
   leaves.setColorAt(count,j%9===0?colorA:(j%3===0?colorC:colorB));count++;
  }
 });
 leaves.count=count;leaves.instanceMatrix.needsUpdate=true;
 if(leaves.instanceColor)leaves.instanceColor.needsUpdate=true;
 leaves.castShadow=true;leaves.receiveShadow=true;
 garden.add(leaves);scene.add(garden);
 stage.dataset.shrubs=String(garden.children.length-1);
 stage.dataset.shrubGeometry='ez-tree-shared-branches-instanced-leaf-lobes';
 stage.dataset.shrubCanopyInstances=String(count);
 return garden;
}
