"""Real multi-sample anti-tiling and shared meadow topology regression."""
import unittest
from pathlib import Path
SRC=(Path(__file__).resolve().parents[1]/'stillwater/scene.js').read_text()
class DistantMeadowBlenderTiling(unittest.TestCase):
 def test_one_pbr_material_for_both_meshes(self):
  self.assertIn('const terrainMat=new THREE.MeshStandardMaterial({',SRC)
  self.assertIn('const terrain=new THREE.Mesh(terrainGeo,terrainMat)',SRC)
  self.assertIn('const farGround=new THREE.Mesh(farGroundGeo,terrainMat)',SRC)
  self.assertIn('uv.setXY(i,(x+170)/340,(170-z)/340)',SRC)
 def test_actual_rotated_texture_samples_and_macro_variation(self):
  for piece in ('vec4 sampleA=texture2D(map,uvA)', 'vec4 sampleB=texture2D(map,uvB)',
    'vec4 sampleC=texture2D(map,uvC)', 'float maskA=smoothstep',
    'float maskB=smoothstep', 'float macro=terrainNoise(vTerrainWorldXZ*.0046',
    'diffuseColor.rgb*=mix(.94,1.06,macro)'):
   self.assertIn(piece,SRC)
  self.assertNotIn('outgoingLight=mix(outgoingLight,sunlitGrass',SRC)
  self.assertNotIn('new THREE.MeshLambertMaterial',SRC)
 def test_keep_xz_correction_and_animated_lake_and_sky(self):
  self.assertIn('mesh.rotateX(-Math.PI/2)',SRC)
  self.assertIn('water.material.uniforms.time.value+=motionDt',SRC)
  self.assertIn('new RGBELoader().setDataType(THREE.HalfFloatType)',SRC)
  self.assertIn('vTerrainWorldXZ=(modelMatrix*vec4(transformed,1.0)).xz',SRC)
if __name__=='__main__':unittest.main()
