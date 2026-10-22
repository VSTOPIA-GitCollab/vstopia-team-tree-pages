"""Water and bird movement must match desktop elapsed time, not phone FPS."""
import re
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SCENE=(ROOT/'stillwater/scene.js').read_text()
BRIDGE=(ROOT/'stillwater/vstopia-bridge.js').read_text()
BIRDS=(ROOT/'stillwater/vstopia-ecology.js').read_text()


class AnimationParity(unittest.TestCase):
    def test_embedded_scene_starts_animated_even_if_os_requests_reduction(self):
        self.assertIn("const isEmbedded=new URLSearchParams(location.search)",SCENE)
        self.assertIn("if(reduced&&!(isEmbedded&&lowPower)){paused=true",SCENE)
        self.assertIn("$('pause').onclick=()=>{paused=!paused",SCENE)

    def test_water_and_birds_advance_in_real_seconds_not_frames(self):
        self.assertIn("const motionDt=Math.min(realDt,.25),dt=Math.min(realDt,.05);",SCENE)
        self.assertIn("elapsed+=motionDt;time.value=elapsed;",SCENE)
        self.assertIn("water.material.uniforms.time.value+=motionDt*(.25+wind.value*.33)",SCENE)
        self.assertIn("ecology.update(time.value)",BRIDGE)
        self.assertIn("return {bushCount,shortGrassCount,birdCount:30,update:birdFlocks.update}",BIRDS)

    def test_motion_is_identical_desktop_and_mobile(self):
        animation=SCENE.split("function animate(now){",1)[1].split("renderer.render(scene,camera)",1)[0]
        self.assertNotIn("lowPower?",animation)
        self.assertNotIn("isEmbedded?",animation)
        birds=BIRDS.split("function update(t){",1)[1].split("update(0)",1)[0]
        self.assertNotIn("lowPower",birds)
        self.assertIn("const progress=t*.10*",birds)
        self.assertIn("time.value=t;",birds)

    def test_privacy_ui_unmodified(self):
        self.assertIn("firstBirdPosition",BRIDGE)
        self.assertIn("waterTime",BRIDGE)
        self.assertIn("getPaused()",BRIDGE)

if __name__=='__main__':
    unittest.main()
