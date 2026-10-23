"""Keep the real directional light, its cast shadows and Sky/Water aligned.

Owner observed that the source photographic mountains are sunlit from the
opposite side to the virtual light. Reverse ONLY virtual sun azimuth;
preserve mountain texture pixels, brightness and fixed night-sky mask.
"""
import math
import re
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SCENE=(ROOT/"stillwater/scene.js").read_text()
PHOTO=(ROOT/"stillwater/moving-cloud-sky.js").read_text()
ATM=(ROOT/"stillwater/atmosphere.js").read_text()

class DirectionalSunRegression(unittest.TestCase):
    def test_sun_azimuth_faces_same_side_as_photographic_ridge(self):
        self.assertIn("sunDir=V(.55,.65,-.36).normalize()",SCENE)
        self.assertIn("sunDir.set(.55,elev,-.36).normalize()",SCENE)
        self.assertNotIn("sunDir.set(-.55",SCENE)
        self.assertNotIn("sunDir=V(-.5",SCENE)
        # From the default camera at (31,+39) looking to the tree at (-5,-26),
        # the vector towards screen-right is (+65,-36). Virtual sun must
        # appear there too, rather than illuminating from screen-left.
        screen_right=(65.,-36.)
        new_dot=.55*screen_right[0] + (-.36)*screen_right[1]
        old_dot=(-.55)*screen_right[0]+.36*screen_right[1]
        self.assertGreater(new_dot,0)
        self.assertLess(old_dot,0)

    def test_cast_shadow_direction_is_exactly_the_shared_sky_sun(self):
        self.assertIn("sun.position.copy(sun.target.position).addScaledVector(sunDir,110)",SCENE)
        self.assertIn("sun.target.updateMatrixWorld();sun.updateMatrixWorld();",SCENE)
        self.assertNotIn("sun.position.copy(sunDir).multiplyScalar(110)",SCENE)
        for token in ("su.sunPosition.value.copy(sunDir)",
                      "water.material.uniforms.sunDirection.value.copy(sunDir)",
                      "shader.uniforms.uLeafSun={value:sunDir}"):
            self.assertIn(token,SCENE)
        for elevation in (.20,.35,.62,.95):
            length=math.sqrt(.55**2+elevation**2+.36**2)
            direction=(.55/length,elevation/length,-.36/length)
            target=(-4.,7.,-22.)
            pos=tuple(t+110*d for t,d in zip(target,direction))
            direction_from_target=tuple((p-t)/110 for p,t in zip(pos,target))
            for actual,want in zip(direction_from_target,direction):
                self.assertAlmostEqual(actual,want,places=12)

    def test_cache_revisions_keep_one_source_of_truth(self):
        for file in ("index.html","stillwater-integration.js","stillwater/index.html"):
            self.assertIn("-shooting-stars-v1-sun-azimuth-v1",(ROOT/file).read_text())
        # Keep the atmosphere singleton's ES-module URL exactly the same:
        for module in ("scene.js","nature.js","lake-life.js","mountain-waterfall.js"):
            self.assertIn("-branchless-mask-v12",(ROOT/"stillwater"/module).read_text())

    def test_protected_mountain_artwork_and_sky_mask_remain_unchanged(self):
        self.assertIn("uMountainsYaw:{value:.25}",PHOTO)
        self.assertIn("uMountainsVerticalScale:{value:2.85}",PHOTO)
        self.assertIn("float mountainAlpha=(farAlpha+midAlpha*(1.-farAlpha))*maskArea;",ATM)
        self.assertNotIn("if(cropV>=",ATM)
        self.assertLess(ATM.index("float midAlpha=texture2D(uBackdropMidground,midUV).a"),
                        ATM.index("float maskArea=arcFade*arcVisible*verticalVisible;"))

if __name__=="__main__":unittest.main()
