"""Regression: one imported atmosphereUniforms singleton for all materials.

ES modules treat URL query strings as part of module identity. Importing
atmosphere.js with two different ?v= versions silently constructs two
uniforms objects; only the scene's instance is updated by Weather/Day-Night.
"""
from pathlib import Path
import re
import unittest

ROOT=Path(__file__).resolve().parents[1]
SCRIPT=ROOT/"stillwater"
IMPORTERS=("scene.js","nature.js","lake-life.js","mountain-waterfall.js")
REF=re.compile(r"""from\s*['"](\./atmosphere\.js\?v=[^'"]+)['"]""")

class AtmosphereUniformSingletonTest(unittest.TestCase):
    def test_one_url_identity_for_scene_and_every_effect(self):
        urls={}
        for file in IMPORTERS:
            text=(SCRIPT/file).read_text()
            matches=REF.findall(text)
            self.assertEqual(len(matches),1,(file,matches))
            urls[file]=matches[0]
        self.assertEqual(len(set(urls.values())),1,urls)
        self.assertIn("mountain-occlusion-v1",urls["scene.js"])

    def test_rocks_are_original_pbr_not_extra_hacked(self):
        rock=(SCRIPT/"nature.js").read_text()
        self.assertIn("new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,fog:false,envMapIntensity:.08})",rock)
        self.assertIn("outgoingLight=mix(outgoingLight,vec3(.24,.29,.31)*uAtmosphereLight,haze);",rock)
        self.assertNotIn("distantRockLight",rock)
        self.assertIn("material.customProgramCacheKey=()=> 'rock-scan-woodland-v8-crisp-mountain-shadows';",rock)

    def test_cache_versions_force_reload_of_shared_importers(self):
        scene=(SCRIPT/"scene.js").read_text()
        for text in ("nature.js?v=fish-woodland-v1-atmosphere-shared-v1",
                     "lake-life.js?v=fish-woodland-v1-splash-v2-atmosphere-shared-v1",
                     "mountain-waterfall.js?v=waterfall-weather-v1-atmosphere-shared-v1"):
            self.assertIn(text,scene)
        for file in ("index.html","stillwater-integration.js","stillwater/index.html"):
            self.assertIn("-atmosphere-shared-v1",(ROOT/file).read_text(),file)

if __name__=="__main__":
    unittest.main()
