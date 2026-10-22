"""Actual stochastic texture sampling, watertight seam and preserved lake."""
import math
import unittest
from pathlib import Path
R=Path(__file__).resolve().parents[1]
S=(R/'stillwater/scene.js').read_text()

def border(a):
 return 162+8*math.sin(3*a+1.2)+6*math.sin(7*a-.9)+4*math.cos(11*a+2.4)+3*math.sin(17*a+.4)

class MeadowAntiTilingSeam(unittest.TestCase):
 def test_no_square_near_plane_and_full_angular_far_ring(self):
  self.assertNotIn('const terrainGeo=new THREE.PlaneGeometry(340',S)
  self.assertIn('const mesh=new THREE.RingGeometry(0,1,sides,radialBands)',S)
  self.assertIn('const radial=isNear?edge*t:edge+(FAR_MEADOW_RADIUS-edge)*Math.pow(t,1.44)',S)
  self.assertIn('const angle=t<.000001?-2*Math.PI*(i%(sides+1))/sides:',S)
  self.assertIn('mesh.rotateX(-Math.PI/2)',S)

 def test_nonround_matching_border_mobile_and_desktop(self):
  for segments in (180,448):
   radius=[border(-2*math.pi*i/segments) for i in range(segments+1)]
   self.assertGreater(max(radius)-min(radius),22)
   self.assertGreater(min(radius),144)
   self.assertLess(max(radius),185)
   self.assertAlmostEqual(radius[0],radius[-1],places=9)
   # Shared function is called from both near and far mesh.
   self.assertIn('const edge=meadowSeamRadius(angle)',S)
   self.assertIn('const terrainGeo=makeMeadowGeometry(true),farGroundGeo=makeMeadowGeometry(false)',S)

 def test_actual_rotated_multisampling_not_opaque_distance_tint(self):
  self.assertIn('vec4 sampleA=texture2D(map,terrainVariantUV(baseUV,indexA));',S)
  self.assertIn('vec4 sampleB=texture2D(map,terrainVariantUV(baseUV,indexB));',S)
  self.assertIn('vec4 sampleC=texture2D(map,terrainVariantUV(baseUV*.91,indexC));',S)
  self.assertIn('terrainNoise(vTerrainWorldXZ*.0046',S)
  self.assertIn('diffuseColor.rgb*=mix(.88,1.12,macro);',S)
  self.assertNotIn('outgoingLight=mix(outgoingLight,sunlitGrass',S)
  self.assertIn('const farGround=new THREE.Mesh(farGroundGeo,terrainMat)',S)
  self.assertIn('const terrain=new THREE.Mesh(terrainGeo,terrainMat)',S)

 def test_water_sky_birds_unchanged(self):
  self.assertIn('new Water(makeLakeOnlySurface()',S)
  self.assertIn('water.material.uniforms.time.value+=motionDt',S)
  self.assertIn('scene.add(createDistantMountains())',S)
  self.assertIn('function makeLakeOnlySurface()',S)
  self.assertIn('vstopiaBridge?.tick(now,dt)',S)
  self.assertNotIn('window.__meadowDebug',S)

 def test_cache_chain(self):
  self.assertIn('stillwater-integration.js?v=organic-grass-variation-20261022',(R/'index.html').read_text())
  self.assertIn('embedded=1&v=organic-grass-variation-20261022',(R/'stillwater-integration.js').read_text())
  self.assertIn('scene.js?v=organic-grass-variation-20261022',(R/'stillwater/index.html').read_text())
if __name__=='__main__': unittest.main()
