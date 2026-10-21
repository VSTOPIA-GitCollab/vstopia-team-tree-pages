"""Safe regression tests for the public HDRI/PBR scene source structure."""
import pathlib
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
SRC=(ROOT/'ez-tree-scene.js').read_text()

class EnvironmentTests(unittest.TestCase):
    def test_solid_geometry_and_pbr_material(self):
        self.assertIn('new THREE.PlaneGeometry(16000,16000,320,320)',SRC)
        self.assertIn('new THREE.MeshStandardMaterial',SRC)
        self.assertIn("stage.dataset.terrain='opaque-pbr-mesh'",SRC)
        self.assertIn('terrainGeometry.computeVertexNormals()',SRC)
        self.assertIn('terrain.receiveShadow=true',SRC)

    def test_three_maps_share_one_ground_source(self):
        for key in ("'diff_1k.jpg'","'nor_gl_1k.jpg'","'rough_1k.jpg'"):
            self.assertIn(key,SRC)
        self.assertIn("stage.dataset.pbr='diffuse-normal-roughness-ready'",SRC)
        for path in ('grass_ground_diff_1k.jpg','grass_ground_nor_gl_1k.jpg','grass_ground_rough_1k.jpg'):
            self.assertTrue((ROOT/'assets/environment'/path).is_file())

    def test_consistent_static_hdri_background_and_lighting(self):
        self.assertIn("hdriLoader.load('./assets/environment/kloppenheim_03_2k.hdr'",SRC)
        self.assertIn('scene.background=texture;scene.environment=texture;',SRC)
        self.assertIn('texture.mapping=THREE.EquirectangularReflectionMapping',SRC)
        self.assertTrue((ROOT/'assets/environment/kloppenheim_03_tonemapped.jpg').is_file())

    def test_hdri_is_static_but_sway_animation_is_user_controlled(self):
        self.assertIn('tree.update(0);',SRC)
        self.assertIn('tree.update(windPhase)',SRC)
        self.assertIn('animationSpeed>0',SRC)
        self.assertNotIn('scene.rotation.y',SRC)
        self.assertIn('if(!requiresRender)return;',SRC)
        self.assertIn('invalidate();',SRC)

    def test_private_repo_data_not_exposed(self):
        for name in ('VSTOPIA-Council','AUDIOENCE-World','OstinDesktopCommander','github_pat_'):
            self.assertNotIn(name,SRC)

if __name__=='__main__':
    unittest.main()
