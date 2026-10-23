"""Approved user-generated photo: no duplicated weather/sky UV or scene asset."""
from pathlib import Path
import re
import unittest
from PIL import Image
R=Path(__file__).resolve().parents[1]
SKY=(R/"stillwater/moving-cloud-sky.js").read_text()
WEATHER=(R/"stillwater/atmosphere.js").read_text()
SCENE=(R/"stillwater/scene.js").read_text()
class ApprovedMountainPlacement(unittest.TestCase):
 def test_same_placement_math_for_sky_and_night_weather(self):
  # Shader coordinate systems must match to avoid a silhouette halo in rain.
  for source in (SKY,WEATHER):
   self.assertIn("clamp(.5+(ridgeUV.x-.5)*1.28+.03,.0005,.9995)",source)
   self.assertIn("clamp(.5+(ridgeUV.y-.5)*.52+.065,.0005,.9995)",source)
  self.assertIn("float mountainAlpha=farAlpha*(1.-midAlpha)+midAlpha;",SKY)
  self.assertIn("float mountainAlpha=(farAlpha+midAlpha*(1.-farAlpha))*maskArea;",WEATHER)
  # Fog RGB grading belongs to photo sky; weather shader remains alpha mask.
  self.assertIn("vec3 airLight=mix(uBackdropFog,sampledSky*skyIllumination,.43);",SKY)
  self.assertNotIn("vec3 midRock=",WEATHER)
 def test_active_new_rgba_photo_and_original_distant_background(self):
  for tier,size in (("8k",(4096,1020)),("4k",(2048,510))):
   with Image.open(R/f"stillwater/assets/sky/approved-alpine-midground-{tier}.webp") as im:
    self.assertEqual(im.size,size)
    alpha=im.convert("RGBA").getchannel("A")
    self.assertEqual(alpha.getextrema()[0],0)
    self.assertGreater(alpha.getextrema()[1],200)
  self.assertIn("approved-alpine-midground-",SCENE)
  self.assertIn("rgb-bleed-ridge-v10",SCENE)
  self.assertIn("alps-field-mountains-",SCENE)
  self.assertNotIn("addMountainCutoutPanels",SCENE)
if __name__=="__main__": unittest.main()
