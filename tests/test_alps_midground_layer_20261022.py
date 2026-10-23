"""A new photographic dark forest layer without replacing the approved far ridge."""
from pathlib import Path
import unittest
try:
 from PIL import Image
except ImportError: Image=None
R=Path(__file__).resolve().parents[1]
SKY=(R/"stillwater/moving-cloud-sky.js").read_text()
ATM=(R/"stillwater/atmosphere.js").read_text()
SCENE=(R/"stillwater/scene.js").read_text()

class TestForestPhotoMidground(unittest.TestCase):
 @unittest.skipUnless(Image is not None,"Pillow needed for alpha validation")
 def test_transparent_mountain_photo_only_and_mobile_budget(self):
  for tier,size in (("8k",(4096,1020)),("4k",(2048,510))):
   with self.subTest(tier=tier):
    f=R/f"stillwater/assets/sky/approved-alpine-midground-{tier}.webp"
    with Image.open(f) as im:
     self.assertEqual(im.size,size)
     rgba=im.convert("RGBA")
     for frac in (.20,.30,.50,.70,.80):
      x=int(size[0]*frac)
      self.assertLess(rgba.getpixel((x,0))[3],8)
      self.assertGreater(sum(1 for y in range(size[1]) if rgba.getpixel((x,y))[3]>110),10)
 def test_shared_mask_and_photo_compositing(self):
  self.assertIn("uMidgroundEnabled:{value:0}",SKY)
  self.assertIn("float mountainAlpha=farAlpha*(1.-midAlpha)+midAlpha;",SKY)
  self.assertIn("skySample.rgb=mix(skySample.rgb,photoComposite",SKY)
  self.assertIn("uBackdropMidground.value=mountains.uMidground.value",ATM)
  self.assertIn("float mountainAlpha=(farAlpha+midAlpha*(1.-farAlpha))*maskArea;",ATM)
  self.assertIn("vec3 sampledSky=clamp(texture2D(uSky,skyLightUV).rgb",SKY)
  self.assertIn("vec3 airLight=mix(uBackdropFog,sampledSky*skyIllumination,.43);",SKY)
  self.assertIn("float upperHaze=smoothstep(.43,.91,midUV.y);",SKY)
  self.assertIn("float photoAirMix=clamp(.10+.14*upperHaze+.20*rain,0.,.45);",SKY)
  self.assertIn("vec3 midRock=mix(photoDiffuse,airLight,photoAirMix);",SKY)
  self.assertIn("midRock*=mix(.075,1.,pow(daylight,.85))*(1.-.25*rain);",SKY)
  self.assertIn("nearRidge.a*=arcFade*arcVisible*verticalVisible;",SKY)
  self.assertNotIn("nearRidge.a*=crestSoftening",SKY)
  self.assertNotIn("midRock*=uMountainExposure",SKY)
  self.assertIn("setMidground(texture)",SKY)
  self.assertIn("atmosphere.bindBackdropMountains(movingCloudDome.uniforms)",SCENE)
 def test_original_source_photo_preserved(self):
  self.assertIn("uMountainsVerticalScale:{value:2.85}",SKY)
  self.assertIn("uMountainExposure:{value:.78}",SKY)
  self.assertIn("uMountainsYaw:{value:.25}",SKY)
  self.assertIn("ridge.a*=arcFade*arcVisible*verticalVisible",SKY)
  self.assertNotIn("addMountainCutoutPanels",SCENE)
  self.assertIn("alps-field-mountains-",SCENE)
  self.assertIn("approved-alpine-midground-",SCENE)
  self.assertIn("mountainMidgroundSource='approved-generated-image'",SCENE)
  self.assertIn("-midground-v1",SCENE)
  self.assertIn("createDistantMountains",SCENE)
if __name__=="__main__":unittest.main()
