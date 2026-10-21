"""Contract tests for restored VSTOPIA HDRI skies in original Three.js r180."""
from pathlib import Path
import unittest
R=Path(__file__).resolve().parents[1]
SCENE=(R/'stillwater/scene.js').read_text()
HTML=(R/'stillwater/index.html').read_text()

class StillwaterSkyPresetsTests(unittest.TestCase):
 def test_original_physical_sky_survives(self):
  self.assertIn('const sky=new Sky()',SCENE)
  self.assertIn("sky.visible=true;clouds.visible=true",SCENE)
  self.assertIn('scene.environment=envTarget.texture',SCENE)
 def test_prior_vstopia_hdri_is_local_embedded_default(self):
  self.assertIn("kloppenheim:'./assets/sky/kloppenheim_03_2k.hdr'",SCENE)
  self.assertIn("$('sky').value='kloppenheim'",SCENE)
  self.assertGreater((R/'stillwater/assets/sky/kloppenheim_03_2k.hdr').stat().st_size,3000000)
 def test_cloudy_mountain_option(self):
  self.assertIn("cloudy:'./assets/sky/partly-cloudy-2k.hdr'",SCENE)
  self.assertIn('<option value="cloudy">Mountain clouds HDRI</option>',HTML)
  self.assertGreater((R/'stillwater/assets/sky/partly-cloudy-2k.hdr').stat().st_size,3000000)
 def test_shared_horizon_pbr_and_reflections(self):
  self.assertIn('scene.background=texture',SCENE)
  self.assertIn('scene.environment=texture',SCENE)
  self.assertIn('texture.mapping=THREE.EquirectangularReflectionMapping',SCENE)
  self.assertIn('new Water(',SCENE)
  self.assertIn('scene.backgroundRotation.set(0,0,0)',SCENE)
  self.assertIn('scene.environmentRotation.set(0,0,0)',SCENE)
 def test_existing_sliders_and_fallback(self):
  self.assertIn("$('wind').value='2'",SCENE)
  self.assertIn("$('light').value='1'",SCENE)
  self.assertIn("$('sky').addEventListener('change'",SCENE)
  self.assertIn("await selectSky('physical')",SCENE)
  self.assertIn('envTarget=pmrem.fromScene(envScene,.04,.1,2000)',SCENE)
  self.assertIn('<select id="sky"',HTML)
 def test_local_loader_is_not_remote_cdn(self):
  self.assertTrue((R/'stillwater/vendor/addons/loaders/RGBELoader.js').exists())
  self.assertIn("from 'three/addons/loaders/RGBELoader.js'",SCENE)
  self.assertNotIn('https://cdn.',SCENE)

if __name__=='__main__':unittest.main()
