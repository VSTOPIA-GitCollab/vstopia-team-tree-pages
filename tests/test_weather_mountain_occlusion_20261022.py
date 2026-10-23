"""Regression for weather sky covering photographic Alps Field mountains."""
import math
import unittest
from pathlib import Path
R=Path(__file__).resolve().parents[1]
ATM=(R/"stillwater/atmosphere.js").read_text()
CLOUD=(R/"stillwater/moving-cloud-sky.js").read_text()
SCENE=(R/"stillwater/scene.js").read_text()

class WeatherMountainOcclusion(unittest.TestCase):
    def test_same_photo_pixels_and_360_uv_in_both_sky_layers(self):
        for source in [ATM,CLOUD]:
            self.assertIn("atan(d.z,d.x)",source)
            self.assertIn("float arcU=(uv.x+",source)
            self.assertIn("(1.-2190./4096.)",source)
            self.assertIn("(4096./1020.)",source)
        self.assertIn("float farAlpha=texture2D(uBackdropMountains,ridgeUV).a;",ATM)
        self.assertIn("float mountainAlpha=(farAlpha+midAlpha*(1.-farAlpha))*maskArea;",ATM)
        # The earlier spatial if(cropV...) caused undefined sampler mip
        # derivatives on the crop boundary: a dotted arc in the night sky.
        self.assertNotIn("if(cropV>=0.",ATM)
        # OWNER ACCEPTED NIGHT BUG FIX (2026-10-23): no per-pixel UV gate
        # may wrap mipmapped texture fetches. Sample first, mask alpha later.
        for forbidden in ("if(cropV", "if(arcU", "if(verticalVisible", "if(arcVisible"):
            self.assertNotIn(forbidden,ATM)
        self.assertLess(
            ATM.index("float midAlpha=texture2D(uBackdropMidground,midUV).a"),
            ATM.index("float maskArea=arcFade*arcVisible*verticalVisible;")
        )
        self.assertIn("float maskArea=arcFade*arcVisible*verticalVisible;",ATM)
        self.assertIn("float arcVisible=step(0.,arcU)*step(arcU,1.);",ATM)
        self.assertIn("float verticalVisible=step(0.,cropV)*step(cropV,1.);",ATM)

        self.assertIn("uBackdropMidgroundVisible",ATM)
        self.assertIn("opacity*=1.-mountainAlpha;",ATM)
        self.assertIn("if(uBackdropMountainsVisible>.5)",ATM)
        self.assertIn("float farAlpha=ridge.a*uMountainsEnabled;",CLOUD)
        self.assertIn("float mountainAlpha=farAlpha*(1.-midAlpha)+midAlpha;",CLOUD)
        self.assertIn("float photoBlend=mountainAlpha/max(.0001,1.-weatherOpacity*(1.-mountainAlpha));",CLOUD)

    def test_optional_asset_shared_without_duplicate_fetch(self):
        self.assertIn("bindBackdropMountains(mountains)",ATM)
        for slot in ["uMountains","uMountainsEnabled","uMountainsYaw","uMountainsVerticalScale"]:
            self.assertIn("mountains."+slot,ATM)
        self.assertIn("atmosphere.bindBackdropMountains(movingCloudDome.uniforms)",SCENE)
        self.assertIn("document.body.dataset.mountainBackdrop='fallback'",SCENE)
        self.assertNotIn("new THREE.TextureLoader",ATM)
        self.assertNotIn("requestAnimationFrame",ATM)

    def test_photo_and_weather_are_composited_in_correct_order(self):
        # A=photographic mountain coverage; F=weather/night opacity.
        # Correct desired image: A*photo + (1-A)*mix(HDR,weather,F).
        # Since the weather sphere is in front, premultiply photo alpha
        # with the compensation derived from that render order.
        for photo in [0, .1, .34, .5, .9, 1.]:
            for weather in [0., .12, .56, .94, 1.]:
                A,F=photo,weather
                front_alpha=(1-A)*F
                effective_photo=A/max(.0001,1-front_alpha)
                for hdr,rock,storm in [(1.,.13,.02),(.7,.4,.3)]:
                    backdrop=(1-effective_photo)*hdr+effective_photo*rock
                    actual=backdrop*(1-front_alpha)+front_alpha*storm
                    expected=A*rock+(1-A)*((1-F)*hdr+F*storm)
                    self.assertAlmostEqual(actual,expected,delta=.0001,
                                           msg=(A,F,hdr,rock,storm))
        # Clear weather gives the unmodified photographic mountain pixels.
        for A in [.02,.4,.85]:
            self.assertAlmostEqual(A/max(.0001,1-0*(1-A)),A)

if __name__=="__main__":
    unittest.main()
