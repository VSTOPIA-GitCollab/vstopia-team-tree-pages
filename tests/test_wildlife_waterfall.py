"""Regression checks for the final 3D scene and wildlife without external assets."""
from pathlib import Path
import unittest
R=Path(__file__).resolve().parents[1]
WATER=(R/'water-environment.js').read_text()
WILDLIFE=(R/'garden-wildlife.js').read_text()
SCENE=(R/'ez-tree-scene.js').read_text()
APP=(R/'app.js').read_text()
class WildlifeWaterfall(unittest.TestCase):
 def test_one_real_water_material_and_single_reflection_pass(self):
  self.assertIn('new Water(waterGeometry,waterOptions)',WATER)
  self.assertIn('const river=lake;',WATER)
  self.assertIn('waterDrawCalls',WATER)
  self.assertIn('waterReflectionPasses',WATER)
 def test_cascade_is_at_rock_cliff_position(self):
  self.assertIn('vertices.push(baseX+(u-.5)*width',WILDLIFE)
  self.assertIn('baseX=-230,baseZ=-315,baseY=-.40,height=40,width=39',WILDLIFE)
  self.assertIn('sheet.renderOrder=16',WILDLIFE)
  self.assertIn('waterfallFoam',WILDLIFE)
 def test_particle_mist_and_birds_move(self):
  self.assertIn('const birdCount=30',WILDLIFE)
  self.assertIn('const count=340',WILDLIFE)
  self.assertIn('const flowerCount=1150',WILDLIFE)
  self.assertIn('wingTime.value=clock',WILDLIFE)
  self.assertIn('particles.attributes.position.needsUpdate=true',WILDLIFE)
  self.assertIn('window.VstopiaWildlifeDebug=now',WILDLIFE)
 def test_live_3d_render_integrated(self):
  self.assertIn("import {addLivingWildlife} from './garden-wildlife.js'",SCENE)
  self.assertIn('livingWildlife.update(dt)',SCENE)
  self.assertNotIn("'supervisor-mascot','♣'",APP)
if __name__=='__main__':unittest.main()
