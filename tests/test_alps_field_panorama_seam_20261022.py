"""Partial-arc photo backdrop must keep native 360 source pixel-to-angle ratio."""
import unittest
from pathlib import Path
try:
 from PIL import Image
except ImportError:
 Image=None
R=Path(__file__).resolve().parents[1]
SCENE=(R/"stillwater/scene.js").read_text()
SHADER=(R/"stillwater/moving-cloud-sky.js").read_text()
ATM=(R/"stillwater/atmosphere.js").read_text()

class AlpsFieldPartialArcContract(unittest.TestCase):
 @unittest.skipUnless(Image is not None,"Pillow unavailable for image test")
 def test_photo_crop_preserves_source_scale_and_has_transparent_top(self):
  for size,expected in [("8k",(4096,1020)),("4k",(2048,510))]:
   with self.subTest(size=size):
    with Image.open(R/f"stillwater/assets/sky/alps-field-mountains-{size}.webp") as im:
     self.assertEqual(im.size,expected)
     a=im.convert("RGBA")
     for u in [.1,.25,.5,.75,.9]:
      x=int(expected[0]*u)
      self.assertLess(a.getpixel((x,0))[3],3)
      opaque=sum(a.getpixel((x,y))[3]>100 for y in range(expected[1]))
      self.assertGreater(opaque,expected[1]//45)
 @unittest.skipUnless(Image is not None,"Pillow unavailable")
 def test_no_source_photo_repeat_or_stitched_end_required(self):
  # The source 360 JPG is intentionally cropped to 180 degrees; the
  # first/last pixels are different terrain and MUST NOT wrap together.
  self.assertIn("texture.wrapS=THREE.ClampToEdgeWrapping",SHADER)
  self.assertNotIn("texture.wrapS=THREE.RepeatWrapping",SHADER)
  self.assertIn("float arcU=(uv.x+uMountainsYaw-.25)*2.;",SHADER)
  self.assertIn("float arcFade=smoothstep(.0,.10,arcU)",SHADER)
  self.assertIn("ridge.a*=arcFade*arcVisible*verticalVisible",SHADER)
  self.assertIn("uMountainsVerticalScale:{value:2.85}",SHADER)
  self.assertIn("uMountainsVerticalOffset:{value:0.0}",SHADER)
  self.assertNotIn("fract(uv.x+uMountainsYaw)",SHADER)
  self.assertIn("uMountainExposure:{value:.78}",SHADER)
  self.assertIn("photoRock*=uMountainExposure;",SHADER)
 def test_weather_mask_matches_photo_and_preserves_3d_world(self):
  self.assertIn("float arcU=(uv.x+uBackdropYaw-.25)*2.;",ATM)
  self.assertIn("float arcFade=smoothstep(.0,.10,arcU)",ATM)
  self.assertIn("uBackdropVerticalOffset.value=mountains.uMountainsVerticalOffset.value;",ATM)
  self.assertIn("createDistantMountains",SCENE)
  self.assertIn("scene.environment=envTarget.texture",SCENE)
  self.assertIn("float haze=.30+.24*rain;",SHADER)
  self.assertNotIn("__mountainSeamQA",SCENE)
  self.assertIn("mountainBackdrop='fallback'",SCENE)
if __name__=="__main__": unittest.main()
