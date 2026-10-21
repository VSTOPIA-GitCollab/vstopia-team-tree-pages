import pathlib
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
JS=(ROOT/'ez-tree-scene.js').read_text()
GROUND=(ROOT/'ground-blend.js').read_text()
CSS=(ROOT/'scene-polish.css').read_text()
HTML=(ROOT/'index.html').read_text()

class ScenePolishTests(unittest.TestCase):
    def test_bottom_panel_has_horizontal_multi_column_grid(self):
        self.assertIn('grid-template-columns:clamp(195px,15vw,255px) minmax(0,1fr)',CSS)
        self.assertIn('grid-row:2',CSS)
        self.assertIn('.inspector .member-cards{display:grid;grid-template-columns:repeat(2',CSS)
        self.assertIn('grid-template-columns:repeat(5,minmax(0,1fr))',CSS)

    def test_gradient_world_blends_against_hdri(self):
        self.assertIn('vTerrainWorldPosition',GROUND)
        self.assertIn('smoothstep(190.0,1150.0',GROUND)
        self.assertIn('diffuseColor.a *= feather;',GROUND)
        self.assertIn('material.transparent=true;',GROUND)
        self.assertIn('scene.environment=texture',JS)

    def test_antitiling_real_texture_bombing(self):
        self.assertIn('vec4 tbBomb',GROUND)
        self.assertEqual(GROUND.count('texture2D(tex,uv+o'),4)
        self.assertIn('tbNoise',GROUND)
        self.assertIn('applyTerrainBlending(terrainMaterial)',JS)

    def test_lighting_corrects_named_ez_tree_leaves(self):
        self.assertIn('leaf|leaves|foliage|crown',JS)
        self.assertIn('mat.side=THREE.DoubleSide',JS)
        self.assertIn('mat.emissive',JS)
        self.assertIn('sun.castShadow=true',JS)
        self.assertIn('renderer.shadowMap.enabled=true',JS)

    def test_slider_drives_wind_not_environment(self):
        self.assertIn('id="forestAnimationSpeed"',HTML)
        self.assertIn('assets/council-snail.svg',HTML)
        self.assertIn('assets/council-rabbit.svg',HTML)
        self.assertIn('windPhase+=dt*animationSpeed',JS)
        self.assertIn('tree.update(windPhase)',JS)
        self.assertNotIn('scene.rotation',JS)
        self.assertNotIn('terrain.rotation.y=',JS)
        self.assertIn("stage.dataset.windPhase=windPhase.toFixed(3)",JS)

    def test_no_private_data_leaked_into_scene(self):
        for word in ('github_pat_','gho_','AUDIOENCE-World','OstinDesktopCommander','VSTOPIA-Council'):
            self.assertNotIn(word,GROUND+JS+HTML+CSS)

if __name__=='__main__':unittest.main()
