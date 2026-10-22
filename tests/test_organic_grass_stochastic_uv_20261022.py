"""Organic distributed vegetation and randomized tile transformations."""
import unittest
from pathlib import Path
R=Path(__file__).resolve().parents[1]
S=(R/'stillwater/scene.js').read_text()
class OrganicTerrainTest(unittest.TestCase):
 def test_no_rectangle_scatter(self):
  self.assertNotIn('range(-60,60),z=range(-54,52)',S)
  self.assertIn('function grassOuterLimit(a)',S)
  self.assertIn('const r=-scale*Math.log(',S)
  self.assertIn('const x=Math.cos(a)*r,z=Math.sin(a)*r,h=grassMeadowHeight(x,z);',S)
  self.assertIn('if(r>grassOuterLimit(a))continue;',S)
  self.assertIn('grassMeadowHeight',S)
  self.assertIn('if(h<.08 || h>16)continue',S)
  self.assertIn('const fade=1-.46*THREE.MathUtils.smoothstep(r,130,440)',S)
 def test_randomized_virtual_texture_desktop_mobile(self):
  self.assertIn('vec2 terrainVariantUV(vec2 uv,float region)',S)
  self.assertIn('float scale=mix(.78,1.33,b)',S)
  self.assertIn('float quadrant=floor(a*4.0);',S)
  self.assertIn('if(b>.5)rotated.x=-rotated.x;',S)
  self.assertIn('terrainNoise(w*.011+vec2(17.,41.))',S)
  self.assertIn('terrainVariantUV(baseUV,indexA)',S)
  self.assertIn('terrainVariantUV(baseUV,indexB)',S)
  self.assertIn('terrainVariantUV(baseUV*.91,indexC)',S)
  self.assertIn('terrainVariantUV(baseUV*.91,indexD)',S)
  self.assertIn('const mobile=lowPower;',S)
  self.assertIn('float indexC=floor(variation2)+13.0',S)
  self.assertIn('diffuseColor.rgb*=mix(.88,1.12,macro)',S)
  self.assertNotIn('outgoingLight=mix(outgoingLight,sunlitGrass',S)
 def test_original_scene_continuity_and_runtime(self):
  self.assertIn('const terrainGeo=makeMeadowGeometry(true),farGroundGeo=makeMeadowGeometry(false)',S)
  self.assertIn('new Water(makeLakeOnlySurface()',S)
  self.assertIn('water.material.uniforms.time.value+=motionDt',S)
  self.assertNotIn('window.__organicDebug',S)
 def test_cache_version(self):
  marker='organic-grass-variation-20261022'
  self.assertIn('stillwater-integration.js?v='+marker,(R/'index.html').read_text())
  self.assertIn('embedded=1&v='+marker,(R/'stillwater-integration.js').read_text())
  self.assertIn('scene.js?v='+marker,(R/'stillwater/index.html').read_text())
if __name__=='__main__':unittest.main()
