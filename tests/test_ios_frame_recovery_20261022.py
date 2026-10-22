"""iOS recovery must keep the original scene, rendering and visual motion."""
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
SCENE=(ROOT/'stillwater/scene.js').read_text()
BRIDGE=(ROOT/'stillwater/vstopia-bridge.js').read_text()
ECO=(ROOT/'stillwater/vstopia-ecology.js').read_text()
PARENT=(ROOT/'stillwater-integration.js').read_text()
CHILD=(ROOT/'stillwater/index.html').read_text()
INDEX=(ROOT/'index.html').read_text()

class IOSRecoveryContract(unittest.TestCase):
 def test_mobile_anchor_budget_and_once_per_batch_matrices(self):
  self.assertIn('const mobileBudget=lowPower?2400:18000',BRIDGE)
  projector=BRIDGE.split('function screenOf(pos){',1)[1].split('function chooseAnchors()',1)[0]
  self.assertNotIn('updateMatrixWorld(true)',projector)
  candidate_scan=BRIDGE.split('function chooseAnchors(){',1)[1].split('function reconfigure(',1)[0]
  self.assertIn('heroTree.updateMatrixWorld(true);camera.updateMatrixWorld(true)',candidate_scan)
  self.assertIn('Math.abs(window.innerWidth-lastAnchorWidth)>20',BRIDGE)

 def test_request_animation_loop_wakes_on_visibility_no_double_loop(self):
  self.assertIn('rafHandle=requestAnimationFrame(animate)',SCENE)
  self.assertIn('if(rafHandle)cancelAnimationFrame(rafHandle)',SCENE)
  self.assertIn("addEventListener('pageshow',resumePhoneAnimation)",SCENE)
  self.assertIn("document.addEventListener('visibilitychange',resumePhoneAnimation)",SCENE)
  self.assertIn('if(!isEmbedded||!lowPower||document.hidden)return',SCENE)

 def test_existing_water_and_flock_movement_is_unmodified(self):
  self.assertIn("water.material.uniforms.time.value+=motionDt*(.25+wind.value*.33)",SCENE)
  self.assertIn('ecology.update(time.value)',BRIDGE)
  self.assertIn('const count=30,geometry=new THREE.BufferGeometry()',ECO)
  self.assertIn("mesh.instanceMatrix.needsUpdate=true",ECO)
  self.assertIn('renderer.render(scene,camera)',SCENE)
  self.assertIn("skyPreset='alpine-partly-cloudy-2k'",SCENE)
  self.assertIn('paused:getPaused()',BRIDGE)

 def test_diagnostics_are_hidden_unless_user_opt_in(self):
  self.assertIn("new URLSearchParams(location.search).get('iosdebug')==='1'",PARENT)
  self.assertIn('diag.textContent=',PARENT)
  self.assertIn('frameStats:getFrameStats()',BRIDGE)
  self.assertIn('webglLost:glContextLost',SCENE)

 def test_busted_nested_modules_for_ios_safari_cache(self):
  self.assertIn('stillwater-integration.js?v=organic-grass-variation-20261022',INDEX)
  self.assertIn('scene.js?v=organic-grass-variation-20261022',CHILD)
  self.assertIn('vstopia-bridge.js?v=ios-frame-20261022',SCENE)
  self.assertIn('vstopia-ecology.js?v=ios-frame-20261022',BRIDGE)
  self.assertIn('embedded=1&v=organic-grass-variation-20261022',PARENT)

if __name__=='__main__':unittest.main()
