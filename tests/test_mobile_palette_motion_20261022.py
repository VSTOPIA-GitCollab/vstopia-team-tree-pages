"""Mobile retains the former glass coloring while native Three.js is animated."""
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
CSS=(ROOT/'site-design.css').read_text()
JS=(ROOT/'stillwater/scene.js').read_text()
ECO=(ROOT/'stillwater/vstopia-ecology.js').read_text()
BRIDGE=(ROOT/'stillwater/vstopia-bridge.js').read_text()

class OriginalMobileGlassAndMotion(unittest.TestCase):
    def test_previous_mobile_palette_and_glass(self):
        self.assertNotIn('blur(8px)', CSS)
        self.assertIn('background-image:linear-gradient(180deg', CSS)
        self.assertIn('#4d648d', CSS)
        self.assertIn('#648760', CSS)
        self.assertIn('background:var(--ui-glass)!important', CSS)
        self.assertIn('blur(20px) saturate(122%)', CSS)

    def test_original_hdre_cloud_treatment_is_kept_on_mobile(self):
        self.assertIn("new RGBELoader().setDataType(THREE.HalfFloatType)", JS)
        self.assertIn("'./assets/sky/partly-cloudy-2k.hdr'", JS)
        self.assertIn("document.body.dataset.skyPreset='alpine-partly-cloudy-2k'", JS)
        self.assertNotIn("animated-three-atmosphere-mobile", JS)

    def test_live_wind_water_birds_and_mobile_layout_survive(self):
        self.assertIn('renderer.render(scene,camera);vstopiaBridge?.tick(now,dt)', JS)
        self.assertIn('water.material.uniforms.time.value+=dt', JS)
        self.assertIn('return {bushCount,shortGrassCount,birdCount:30,update:birdFlocks.update}', ECO)
        self.assertIn('mesh.instanceMatrix.needsUpdate=true', ECO)
        self.assertIn('ecology.update(time.value)',BRIDGE)
        self.assertIn('height:440px',CSS)
        self.assertIn('height:min(74svh,620px)',CSS)

if __name__=='__main__':
    unittest.main()
