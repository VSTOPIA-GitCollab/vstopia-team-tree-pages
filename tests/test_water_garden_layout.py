"""Regression checks for public-safe lake, flowing stream, stones, foliage and layout."""
import pathlib
import unittest

R=pathlib.Path(__file__).resolve().parents[1]
HTML=(R/'index.html').read_text()
ENV=(R/'water-environment.js').read_text()
TREE=(R/'ez-tree-scene.js').read_text()
SHRUB=(R/'shrub-garden.js').read_text()
CSS=(R/'water-garden.css').read_text()

class GardenTests(unittest.TestCase):
    def test_right_panel_and_bottom_metrics_are_distinct(self):
        self.assertIn('class="bottom-metrics"',HTML)
        self.assertIn('class="inspector"',HTML)
        self.assertEqual(HTML.count('class="metrics-grid"'),1)
        self.assertIn('grid-column:2/4;grid-row:2',CSS)
        self.assertIn('grid-column:3!important;grid-row:1!important',CSS)
        self.assertIn('selectedDetail',HTML)
        self.assertIn('memberCards',HTML)
    def test_refractive_lake_uses_official_three_addon_and_scene(self):
        self.assertIn("import {Water} from './vendor/addons/Water.js'",ENV)
        self.assertIn('const lake=new Water(waterGeometry,waterOptions)',ENV)
        self.assertIn('lake.isWater===true',ENV)
        self.assertIn('waterNormals:normals',ENV)
        self.assertIn('lake.renderOrder=14',ENV)
        self.assertTrue((R/'vendor/addons/Water.js').is_file())
        self.assertIn('waterGarden.setEnvironment(texture)',TREE)
    def test_one_material_for_lake_and_creek_no_seams(self):
        self.assertIn('creekGeo=makeRiverGeometry()',ENV)
        self.assertIn('const lake=new Water(waterGeometry,waterOptions)',ENV)
        self.assertIn('const river=lake;',ENV)
        self.assertIn('lake.material.uniforms.time.value+=dt',ENV)
        self.assertNotIn('riverMaterial',ENV)
        self.assertIn("stage.dataset.waterDrawCalls='one-connected-surface'",ENV)
        self.assertIn("stage.dataset.waterReflectionPasses='1'",ENV)
    def test_terrain_carved_below_real_water_level(self):
        self.assertIn('return relief*(1-cut*.98)-cut*4.9;',ENV)
        self.assertIn('terrainElevation(x,z)',TREE)
        self.assertIn('vertices.setXYZ(i,x,-z,terrainElevation(x,z));',TREE)
        self.assertIn('const LAKE={x:-135,z:-325,rx:215,rz:168,water:-.46}',ENV)
    def test_scattered_grass_stones_bushes_batched(self):
        self.assertIn('InstancedMesh(rockGeo,rockMat,280)',ENV)
        self.assertIn('InstancedMesh(grassGeo,grassMat,33000)',ENV)
        self.assertIn('for(let blade=0;blade<5;blade++)',ENV)
        self.assertIn('stage.dataset.waterRocks',ENV)
        self.assertIn('stage.dataset.waterGrass',ENV)
        self.assertIn('addEzTreeShrubs',TREE)
        self.assertIn('tree.clone(true)',SHRUB)
    def test_glass_unified_across_right_cards_and_bottom(self):
        self.assertIn('backdrop-filter:blur(22px)',CSS)
        self.assertIn('background:rgba(253,248,232,.52)',CSS)
        self.assertIn('rgba(255,255,255,.37)',CSS)
    def test_no_private_data_or_external_api_in_new_sources(self):
        for p in ('water-environment.js','water-garden.css','index.html'):
            text=(R/p).read_text()
            for sensitive in ('github_pat_','gho_','VSTOPIA-Council','AUDIOENCE-World','OstinDesktopCommander'):
                self.assertNotIn(sensitive,text)

if __name__=='__main__':unittest.main()
