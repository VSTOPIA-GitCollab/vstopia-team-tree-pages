"""No flat mountains, pale ground band or on-tree visibility toggle."""
from pathlib import Path
import unittest
R=Path(__file__).resolve().parents[1]
SCENE=(R/'stillwater/scene.js').read_text()
NATURE=(R/'stillwater/nature.js').read_text()
BRIDGE=(R/'stillwater-integration.js').read_text()
class RockyMountainTests(unittest.TestCase):
 def test_exact_three_original_ridges_restored(self):
  original=Path('/Users/ostino/Downloads/lake-scene 2/public/nature.js')
  source=original.read_text() if original.exists() else NATURE
  # The original Downloads folder is optional on CI and other developer Macs.
  for anchor in ('const g=new THREE.PlaneGeometry(2800,570,400,100)',
                 'z=z0-940-layer*360',
                 'const warp=noise(x*.003+layer*11,z*.003)*100',
                 'const n=ridged((x+warp)*.006+layer*27,z*.006)',
                 'const y=-6+envelope*(47+n*125)*broad',
                 'for(let layer=0;layer<3;layer++)'):
   self.assertIn(anchor,source)
   self.assertIn(anchor,NATURE)
  self.assertIn('scene.add(createDistantMountains());',SCENE)
  self.assertNotIn('rockTriplanar',NATURE)
  self.assertIn('outgoingLight=mix(outgoingLight,vec3(.22,.295,.33),haze)*.50',NATURE)
 def test_original_lake_shoreline_clipping_instead_of_square_water(self):
  self.assertIn('function makeLakeOnlySurface()',SCENE)
  self.assertIn('new Water(makeLakeOnlySurface(),',SCENE)
  self.assertIn('height(x,z)-(waterY-shoreInlandInset)',SCENE)
  self.assertIn('clip([a,c,b]);clip([b,c,d]);',SCENE)
  self.assertIn("document.body.dataset.lakeOnly='exact-wet-terrain-footprint'",SCENE)
  self.assertNotIn('new THREE.PlaneGeometry(900,900)',SCENE)
 def test_real_distant_meadow_extent(self):
  self.assertIn('const FAR_MEADOW_RADIUS=4800',SCENE)
  self.assertIn('new THREE.RingGeometry(144,FAR_MEADOW_RADIUS,384,210)',SCENE)
  self.assertIn('(FAR_MEADOW_RADIUS-144)*Math.pow(t,1.44)',SCENE)
 def test_meadow_continuity_instead_of_old_flat_ring(self):
  self.assertIn('function distantMeadowHeight(x,z)',SCENE)
  self.assertIn('fgp.setXYZ(i,x,distantMeadowHeight(x,z),z)',SCENE)
  self.assertIn('fgu.setXY(i,(x+170)/340,(170-z)/340)',SCENE)
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
