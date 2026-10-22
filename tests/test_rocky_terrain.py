"""No flat mountains, pale ground band or on-tree visibility toggle."""
from pathlib import Path
import unittest
R=Path(__file__).resolve().parents[1]
SCENE=(R/'stillwater/scene.js').read_text()
NATURE=(R/'stillwater/nature.js').read_text()
BRIDGE=(R/'stillwater-integration.js').read_text()
class RockyMountainTests(unittest.TestCase):
 def test_three_scanned_cc0_rock_maps(self):
  for name in ('aerial-rocks-color.jpg','aerial-rocks-normal.jpg','aerial-rocks-roughness.jpg'):
   self.assertGreater((R/'stillwater/assets/rock-pbr'/name).stat().st_size,150000)
  self.assertIn('rockColor.colorSpace=THREE.SRGBColorSpace',SCENE)
  self.assertIn('rockTriplanar(uRockAlbedo)',NATURE)
  self.assertIn('rockTriplanar(uRockRoughness)',NATURE)
  self.assertIn('rockBump*.31',NATURE)
  self.assertIn('vec3 w=rockWeights(vRockWorldNormal)',NATURE)
 def test_meadow_continuity_instead_of_old_flat_ring(self):
  self.assertIn('function distantMeadowHeight(x,z)',SCENE)
  self.assertIn('fgp.setXYZ(i,x,distantMeadowHeight(x,z),z)',SCENE)
  self.assertIn('fgu.setXY(i,(x+170)*(55/340),(170-z)*(55/340))',SCENE)
  self.assertIn('map:groundTex,bumpMap:groundTex',SCENE)
  self.assertIn("farGroundGeo.setAttribute(\'color\'",SCENE)
  self.assertNotIn("color:'#647263',roughness:1,envMapIntensity:.4",SCENE)
  self.assertNotIn('const deepGrassMax=',SCENE)
 def test_names_all_visible_no_mode_switch(self):
  self.assertNotIn('stillwater-label-toggle',BRIDGE)
  self.assertNotIn('showAll',BRIDGE)
  self.assertIn('b.hidden=p.hidden||!filterVisible.has(p.name)',BRIDGE)
  self.assertIn("b.classList.toggle(\'selected\'",BRIDGE)
 def test_site_and_privacy_preserved(self):
  self.assertIn('site-unified.css',(R/'index.html').read_text())
  self.assertIn('snapshot.json',(R/'app.js').read_text())
if __name__=='__main__':unittest.main()
