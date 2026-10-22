from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class HorizonReleaseCaching(unittest.TestCase):
 def test_bust_all_three_browsing_layers(self):
  self.assertIn('stillwater-integration.js?v=horizon-ring-20261022',(ROOT/'index.html').read_text())
  self.assertIn('embedded=1&v=horizon-ring-20261022',(ROOT/'stillwater-integration.js').read_text())
  self.assertIn('scene.js?v=horizon-ring-20261022',(ROOT/'stillwater/index.html').read_text())
 def test_release_uses_correct_geometry(self):
  src=(ROOT/'stillwater/scene.js').read_text()
  self.assertIn('farGroundGeo.rotateX(-Math.PI/2);',src)
  self.assertLess(src.index('farGroundGeo.rotateX(-Math.PI/2);'),src.index('const fgp=farGroundGeo.attributes.position'))
if __name__=='__main__':unittest.main()
