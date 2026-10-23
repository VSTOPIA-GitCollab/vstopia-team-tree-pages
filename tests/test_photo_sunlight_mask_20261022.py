"""Weather-driven sunlit-photo suppression, tiny perimeter feather, no topology changes."""
from pathlib import Path
import unittest
from PIL import Image, ImageFilter
R=Path(__file__).resolve().parents[1]
SKY=(R/'stillwater/moving-cloud-sky.js').read_text()
SCENE=(R/'stillwater/scene.js').read_text()
ATM=(R/'stillwater/atmosphere.js').read_text()
ASSET=(R/'scripts/prepare_approved_mountain_texture.py').read_text()
def smoothstep(a,b,x):
 t=max(0.,min(1.,(x-a)/(b-a)))
 return t*t*(3-2*t)
def matte(day,rain,light,luma,y):
 mask=smoothstep(.22,.42,luma)*smoothstep(.49,.70,y)
 shadow=max(0.,min(1.,max(1-day,rain*.95)+(1-light)*.58))
 ceiling=(1-shadow)*.50+shadow*.20
 return luma*(1-mask*shadow*.64*(1-min(1,ceiling/max(luma,.0001))))
class TestMatteMountain(unittest.TestCase):
 def test_highlights_remain_original_in_day_and_flatten_in_rain_night_and_dim_light(self):
  lum=.6
  self.assertAlmostEqual(matte(1,0,1,lum,.75),lum)
  self.assertLess(matte(1,1,1,lum,.75),.39)
  self.assertLess(matte(0,0,1,lum,.75),.36)
  self.assertLess(matte(1,0,0,lum,.75),lum)
  self.assertAlmostEqual(matte(0,1,0,.6,.20),.6) # lower grass unaffected by mask
  self.assertAlmostEqual(matte(0,1,0,.03,.80),.03) # deep shade unaffected
 def test_mask_is_colored_only_alpha_geometry_kept(self):
  for snippet in [
   'uSceneLight:atmosphereUniforms.uSceneLight||{value:1}',
   'float summitRegion=smoothstep(.49,.70,midUV.y);',
   'float snowyHighlight=smoothstep(.22,.42,sourceLuma);',
   'float matteRatio=min(1.,matteCeiling/max(sourceLuma,.0001));',
   'vec3 photoDiffuse=nearRidge.rgb*',
   'float skyIllumination=daylight*(1.-.83*rain)*mix(.72,1.,sceneLight);',
   'float relitCeiling=mix(.61,.22,cloudyShadow);']:
   self.assertIn(snippet,SKY)
  self.assertIn('nearRidge.a*=arcFade*arcVisible*verticalVisible;',SKY)
  self.assertIn('clamp(.5+(ridgeUV.x-.5)*1.28+.03,.0005,.9995)',ATM)
  self.assertIn('photoSceneLight.value=value;',SCENE)
  self.assertIn('uSceneLight:photoSceneLight',SCENE)
 def test_feather_small_and_shared_by_weather(self):
  self.assertIn("inward=cv2.distanceTransform(inside,cv2.DIST_L2,cv2.DIST_MASK_PRECISE)",ASSET)
  self.assertIn("width=8.0 if name=='8k' else 4.0",ASSET)
  self.assertIn("falloff=falloff*falloff*(3.0-2.0*falloff)",ASSET)
  self.assertIn('rgb-bleed-ridge-v10',SCENE)
  self.assertIn('uBackdropMidground.value=mountains.uMidground.value',ATM)
  for name,size in [('4k',(2048,510)),('8k',(4096,1020))]:
   with Image.open(R/f'stillwater/assets/sky/approved-alpine-midground-{name}.webp') as im:
    a=im.convert('RGBA').getchannel('A')
    self.assertEqual(im.size,size)
    self.assertEqual(a.getpixel((size[0]//2,0)),0)
    self.assertGreater(a.getpixel((size[0]//2,size[1]//2)),200)
 def test_real_alpha_ramps_from_clear_to_opaque_in_few_pixels(self):
  for tier,width,limit in [('4k',2048,7),('8k',4096,13)]:
   with self.subTest(tier=tier):
    a=Image.open(R/f'stillwater/assets/sky/approved-alpine-midground-{tier}.webp').convert('RGBA').getchannel('A')
    # Sample a real mid-mountain skyline, not the deliberately fading
    # horizontal panorama endpoint, and verify a small alpha ramp exists.
    x=width//2
    v=[a.getpixel((x,y)) for y in range(a.height)]
    first=next(i for i,val in enumerate(v) if val>4)
    self.assertTrue(4<v[first]<230)
    self.assertTrue(any(25<val<225 for val in v[first:first+limit]))
    self.assertGreater(v[first+limit],245)
 def test_no_black_rgb_padding_on_transparent_crest(self):
  # Fully transparent texels near the skyline MUST retain neighboring rock
  # color. Otherwise WebGL bilinear/mipmap sampling produces a dark line.
  self.assertIn('distance_transform_edt(~opaque',ASSET)
  for tier in ('4k','8k'):
   with self.subTest(tier=tier):
    tex=Image.open(R/f'stillwater/assets/sky/approved-alpine-midground-{tier}.webp').convert('RGBA')
    x=tex.width//2
    column=[tex.getpixel((x,y)) for y in range(tex.height)]
    first=next(i for i,v in enumerate(column) if v[3]>=250)
    edge=column[first-3]
    opaque=column[first]
    self.assertLess(edge[3],250)
    self.assertGreater(sum(edge[:3]),75,'transparent RGB must not be black')
    self.assertLess(max(abs(int(edge[i])-int(opaque[i])) for i in range(3)),75,
      'invisible edge colors should resemble adjoining rock, not black sky')
if __name__=='__main__': unittest.main()
