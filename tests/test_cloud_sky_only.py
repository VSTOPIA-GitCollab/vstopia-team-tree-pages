"""Prevent another accidental rebuild: one backdrop replacement, no lighting or UI changes."""
from pathlib import Path
import subprocess,unittest
R=Path(__file__).resolve().parents[1]
SOURCE=(R/'stillwater/scene.js').read_text()
ORIGINAL=subprocess.check_output(['git','show','b933059:stillwater/scene.js'],cwd=R,text=True)
HTML=(R/'stillwater/index.html').read_text()
class OnlyCloudSkyTests(unittest.TestCase):
 def test_physical_sky_and_embedded_cloud_override_unchanged(self):
  reference=subprocess.check_output(['git','show','d0e6da0:stillwater/scene.js'],cwd=R,text=True)
  def sky_core(src):
   return src[src.index('const scene=new THREE.Scene();'):src.index('const terrainGeo=')]
  # Preserve the physical sky and its IBL. Mobile may change only GPU resource
  # sizes/pixel ratio/camera distance; exact byte equality is no longer valid.
  for invariant in ('new Sky()','scene.environment=envTarget.texture',
                    'const su=sky.material.uniforms','const envScene=new THREE.Scene()',
                    'const sunDir=V('):
   self.assertIn(invariant,sky_core(SOURCE))
   self.assertIn(invariant,sky_core(reference))
  self.assertIn("lowPower?500:2000",sky_core(SOURCE))
  self.assertIn("lowPower?512:2048",sky_core(SOURCE))
  def cloud_override(src):
   return src[src.index(' // ONLY replace the visible sky:'):src.index(' // Keep native Atmosphere sliders available;')]
  # Desktop keeps the exact cloud HDR treatment; phones use animated native sky.
  self.assertIn("new RGBELoader().setDataType(THREE.HalfFloatType)",cloud_override(SOURCE))
  self.assertIn("new RGBELoader().setDataType(THREE.HalfFloatType)",cloud_override(reference))
  self.assertIn("if(!lowPower)",cloud_override(SOURCE))
  self.assertIn("document.body.dataset.skyPreset='animated-three-atmosphere-mobile'",cloud_override(SOURCE))
  self.assertIn("sky.visible=false;clouds.visible=false;scene.background=texture",cloud_override(SOURCE))
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
