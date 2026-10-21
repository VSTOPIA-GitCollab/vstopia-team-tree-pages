"""Prevent another accidental rebuild: one backdrop replacement, no lighting or UI changes."""
from pathlib import Path
import subprocess,unittest
R=Path(__file__).resolve().parents[1]
SOURCE=(R/'stillwater/scene.js').read_text()
ORIGINAL=subprocess.check_output(['git','show','b933059:stillwater/scene.js'],cwd=R,text=True)
HTML=(R/'stillwater/index.html').read_text()
class OnlyCloudSkyTests(unittest.TestCase):
 def test_source_different_only_for_sky_import_and_embedded_backdrop(self):
  cleaned=SOURCE.replace("import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';\n",'')
  begin=cleaned.index(' // ONLY replace the visible sky:')
  end=cleaned.index(' // Keep native Atmosphere sliders available;',begin)
  cleaned=cleaned[:begin]+cleaned[end:]
  self.assertEqual(cleaned,ORIGINAL)
 def test_sky_has_previous_clouds_with_no_extra_controls(self):
  self.assertIn('partly-cloudy-2k.hdr',SOURCE)
  self.assertIn('sky.visible=false;clouds.visible=false;scene.background=texture',SOURCE)
  self.assertNotIn('<select id="sky"',HTML)
  self.assertGreater((R/'stillwater/assets/sky/partly-cloudy-2k.hdr').stat().st_size,4000000)
 def test_original_source_controls_are_untouched(self):
  self.assertIn("$('wind').value='2'",SOURCE)
  self.assertIn("$('light').value='1'",SOURCE)
  self.assertIn("$('light').dispatchEvent(new Event('change'",SOURCE)
  self.assertIn('scene.environment=envTarget.texture',SOURCE)
  self.assertIn('renderer.render(scene,camera)',SOURCE)
if __name__=='__main__':unittest.main()
