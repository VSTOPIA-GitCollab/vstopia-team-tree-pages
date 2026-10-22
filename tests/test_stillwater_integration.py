"""Contracts for the local preserved Stillwater 1.1 integration (not public release tests)."""
from pathlib import Path
import unittest
R=Path(__file__).resolve().parents[1]
SRC=R/'stillwater'
SCENE=(SRC/'scene.js').read_text()
NATURE=(SRC/'nature.js').read_text()
BRIDGE=(SRC/'vstopia-bridge.js').read_text()
ECO=(SRC/'vstopia-ecology.js').read_text()
PAGE=(R/'index.html').read_text()
GLASS=(R/'stillwater-integration.css').read_text()
PARENT=(R/'stillwater-integration.js').read_text()
class StillwaterLocalIntegrationTests(unittest.TestCase):
 def test_original_r180_assets_and_controls(self):
  self.assertIn('0.180.0',(SRC/'SOURCE_README.md').read_text() if '0.180.0' in (SRC/'SOURCE_README.md').read_text() else (SRC/'ATTRIBUTION.md').read_text())
  for f in ('vendor/three.module.js','vendor/three.core.js','vendor/addons/controls/OrbitControls.js','vendor/addons/objects/Water.js','vendor/addons/objects/Sky.js','assets/ground.jpg','assets/water-normals.jpg'):
   self.assertGreater((SRC/f).stat().st_size,1000)
 def test_original_physical_sky_reflection_and_nature(self):
  self.assertIn('new THREE.PMREMGenerator(renderer)',SCENE)
  self.assertIn('new Sky()',SCENE)
  self.assertIn('textureWidth:lowPower?256:1024,textureHeight:lowPower?256:1024',SCENE)
  self.assertIn('createMysticTree',NATURE)
  self.assertIn('parallel-transport',NATURE.lower())
 def test_max_wind_and_light_keep_sliders(self):
  self.assertIn("$('wind').value='2'",SCENE)
  self.assertIn("$('light').value='1'",SCENE)
  self.assertIn("$('light').dispatchEvent(new Event('change'",SCENE)
  self.assertIn("$('panel-toggle').click()",SCENE)
  self.assertIn('controls.enableDamping=true',SCENE)
 def test_the_same_moving_tree_is_anchored(self):
  self.assertIn('const heroTree=plantTree(heroModel,heroPos,1,0,true)',SCENE)
  self.assertIn('heroModel.geometry',BRIDGE)
  self.assertIn('vertex:v.i',BRIDGE)
  self.assertIn('const NAMES=',BRIDGE)
  self.assertIn('uWind',SCENE)
  self.assertIn('postMessage',BRIDGE)
  self.assertIn('event.origin!==ORIGIN',BRIDGE)
 def test_ported_bushes_short_grass_birds(self):
  self.assertIn('count<28',ECO)
  self.assertIn('capacity=15500',ECO)
  self.assertIn('const count=30',ECO)
  self.assertIn('const birdFlocks=birds',ECO)
 def test_source_renderer_is_base_not_old_renderer(self):
  self.assertIn('stillwater-integration.js',PAGE)
  self.assertNotIn('src="./ez-tree-scene.js"',PAGE)
  self.assertIn('stillwater/index.html?embedded=1',PARENT)
  self.assertIn('id=\'stillwaterFrame\'',PARENT)
  self.assertNotIn('SHOW 12 BRANCHES',PARENT)
  self.assertNotIn('SHOW SELECTED ONLY',PARENT)
  self.assertIn('b.hidden=hidden;',PARENT)
  self.assertIn('href="./site-unified.css"',PAGE)
  self.assertIn('liquid-glass.css', (R/'site-unified.css').read_text())
  self.assertIn('vstopia-liquid-glass-island.mjs',PAGE)
  self.assertNotIn('src="./vendor/vstopia-specy-header.mjs"',PAGE)
 def test_glass_and_local_evidence(self):
  self.assertIn('backdrop-filter',GLASS)
  self.assertTrue((R/'docs/screenshots/stillwater-integrated-desktop-local-2026-10-22.jpg').exists())
  self.assertTrue((R/'docs/screenshots/stillwater-integrated-mobile-local-2026-10-22.jpg').exists())
if __name__=='__main__':unittest.main()
