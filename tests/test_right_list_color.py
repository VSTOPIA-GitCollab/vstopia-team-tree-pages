import json
import pathlib
import sys
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from calibrate_ground import calibration, PHOTO, RENDER
JS=(ROOT/'app.js').read_text()
HTML=(ROOT/'index.html').read_text()
CSS=(ROOT/'apple-glass.css').read_text()
GRADE=(ROOT/'ground-blend.js').read_text()
TREE=(ROOT/'ez-tree-scene.js').read_text()
PROFILE=json.loads((ROOT/'assets/calibration/ground-grade.json').read_text())

class RightListColorTests(unittest.TestCase):
    def test_redundant_list_removed_but_original_sidebar_remains(self):
        self.assertNotIn('id="listDrawer"',HTML)
        self.assertNotIn('id="viewList"',HTML)
        self.assertNotIn('id="viewTree"',HTML)
        self.assertIn('id="repoList"',HTML)
        self.assertNotIn('setMode(',JS)
        self.assertNotIn('renderList(',JS)
        self.assertIn('const stageMode=()=>!stage.hidden;',TREE)

    def test_original_react_liquid_glass_is_bundled(self):
        self.assertIn('src="./vendor/vstopia-liquid-glass-island.mjs"',HTML)
        self.assertIn('liquid-glass-react', (ROOT/'glass-react-source/glass-island.jsx').read_text())
        self.assertIn('vstopia-glass-optic',(ROOT/'glass-react-source/glass-island.jsx').read_text())
        self.assertTrue((ROOT/'vendor/vstopia-liquid-glass-island.mjs').stat().st_size>80000)
        self.assertIn('SF Pro',(ROOT/'apple-glass.css').read_text())

    def test_calibration_uses_multiple_pairs_and_correct_color_space(self):
        self.assertEqual(len(PHOTO),6)
        self.assertEqual(len(RENDER),6)
        self.assertEqual(len(PROFILE['display_roundtrip_samples']['photo_left']),2)
        self.assertEqual(len(PROFILE['display_roundtrip_samples']['photo_right']),2)
        self.assertEqual(len(PROFILE['linear_rgb_grade']),3)
        self.assertTrue(all(.1<x<.8 for x in calibration(PHOTO,RENDER)))
        self.assertIn('uGroundGrade',GRADE)
        self.assertIn('uGroundLeft',GRADE)
        self.assertIn('uGroundRight',GRADE)
        self.assertIn('uGroundWidth',GRADE)
        self.assertIn('diffuseColor.rgb *= mix(uGroundLeft,uGroundRight',GRADE)
        self.assertIn('smoothstep(520.0,3900.0',GRADE)

    def test_calibration_file_has_only_aggregate_color_samples(self):
        self.assertEqual(PROFILE['schema_version'],1)
        self.assertEqual(PROFILE['spatial_grade_strength'],.50)
        self.assertEqual(len(PROFILE['spatial_grade_left']),3)
        self.assertEqual(len(PROFILE['spatial_grade_right']),3)
        text=json.dumps(PROFILE)
        for sensitive in ('private_repo_name','repository_url','http://','github_pat_','gho_'):
            self.assertNotIn(sensitive,text)

    def test_shader_material_and_lighting_still_enabled(self):
        self.assertIn('applyTerrainBlending(terrainMaterial, terrainGrade, spatialGrade)',TREE)
        self.assertIn("stage.dataset.groundCalibration='six-pair-linear-rgb'",TREE)
        self.assertIn('scene.environment=texture',TREE)
        self.assertIn('sun.castShadow=true',TREE)
        self.assertIn('tree.update(windPhase)',TREE)

if __name__=='__main__':unittest.main()
