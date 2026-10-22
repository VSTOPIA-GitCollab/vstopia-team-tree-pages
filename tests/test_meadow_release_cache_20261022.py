"""Browsers must load the changed meadow shader rather than stale 3D modules."""
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class MeadowReleaseVersion(unittest.TestCase):
 def test_all_three_module_layers_have_new_cache_id(self):
  self.assertIn('stillwater-integration.js?v=antitile-seam-20261022',(ROOT/'index.html').read_text())
  self.assertIn('embedded=1&v=antitile-seam-20261022',(ROOT/'stillwater-integration.js').read_text())
  self.assertIn('scene.js?v=antitile-seam-20261022',(ROOT/'stillwater/index.html').read_text())
 def test_frame_shader_is_new_bright_meadow(self):
  script=(ROOT/'stillwater/scene.js').read_text()
  self.assertIn('vec4 sampleB=texture2D(map,uvB);',script)
  self.assertIn('mesh.rotateX(-Math.PI/2)',script)
if __name__=='__main__':unittest.main()
