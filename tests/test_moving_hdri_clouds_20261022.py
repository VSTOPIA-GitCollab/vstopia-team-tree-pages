"""Keep the owner's actual 2K HDR panorama, move only high clouds in the existing scene."""
import unittest
from pathlib import Path
R=Path(__file__).resolve().parents[1]
SCENE=(R/'stillwater/scene.js').read_text()
CLOUD=(R/'stillwater/moving-cloud-sky.js').read_text()

class MovingCloudsContract(unittest.TestCase):
 def test_same_hdri_light_water_and_motion_clock(self):
  self.assertIn("load('./assets/sky/partly-cloudy-2k.hdr'",SCENE)
  self.assertIn("scene.environment=envTarget.texture",SCENE)
  self.assertIn("sky.visible=false;clouds.visible=false;scene.background=texture",SCENE)
  self.assertIn("makeMovingCloudSky(THREE,texture,time)",SCENE)
  self.assertIn("water.material.uniforms.time.value+=motionDt",SCENE)
  self.assertIn("if(!paused){elapsed+=motionDt;time.value=elapsed;",SCENE)
  self.assertIn("movingCloudDome?.update(camera);renderer.render(scene,camera)",SCENE)

 def test_drift_only_cloud_region_no_near_horizon_movement(self):
  self.assertIn("smoothstep(-.015,.18,d.y)",CLOUD)
  self.assertIn("fract(uv.x+uCloudTime*uCloudSpeed*driftArea)",CLOUD)
  self.assertIn("uCloudTime:clock",CLOUD)
  self.assertIn("new THREE.SphereGeometry(7200,48,24)",CLOUD)
  self.assertIn("dome.position.copy(camera.position)",CLOUD)
  self.assertIn("depthWrite:false,depthTest:false",CLOUD)
  self.assertNotIn("setInterval",CLOUD)
  self.assertNotIn("requestAnimationFrame",CLOUD)
  self.assertNotIn("new THREE.TextureLoader",CLOUD)

 def test_mobile_and_embedded_cache(self):
  self.assertIn("document.body.dataset.cloudMotion='hdri-clouds-drifting'",SCENE)
  self.assertIn("movingCloudDome=makeMovingCloudSky",SCENE)
  self.assertIn("if(isEmbedded)",SCENE)
  self.assertIn("document.body.dataset.skyReady='fallback'",SCENE)
  marker="organic-grass-variation-20261022-moving-clouds-v1"
  self.assertIn(marker,(R/'index.html').read_text())
  self.assertIn(marker,(R/'stillwater-integration.js').read_text())
  self.assertIn(marker,(R/'stillwater/index.html').read_text())

if __name__=='__main__':unittest.main()
