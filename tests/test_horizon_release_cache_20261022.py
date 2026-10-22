from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class HorizonReleaseCaching(unittest.TestCase):
 def test_bust_all_three_browsing_layers(self):
  self.assertIn('stillwater-integration.js?v=organic-grass-variation-20261022',(ROOT/'index.html').read_text())
  self.assertIn('embedded=1&v=organic-grass-variation-20261022',(ROOT/'stillwater-integration.js').read_text())
  self.assertIn('scene.js?v=organic-grass-variation-20261022',(ROOT/'stillwater/index.html').read_text())
 def test_release_uses_correct_geometry(self):
  src=(ROOT/'stillwater/scene.js').read_text()
  self.assertIn('mesh.rotateX(-Math.PI/2);',src)
  self.assertLess(src.index('mesh.rotateX(-Math.PI/2);'),src.index('const pts=mesh.attributes.position'))
if __name__=='__main__':unittest.main()
