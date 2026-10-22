import pathlib
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text()
JS=(ROOT/'ez-tree-scene.js').read_text()
GROUND=(ROOT/'ground-blend.js').read_text()
SHRUBS=(ROOT/'shrub-garden.js').read_text()
CSS=(ROOT/'apple-glass.css').read_text()
SOURCE=(ROOT/'glass-react-source/glass-island.jsx').read_text()

class AppleGardenTests(unittest.TestCase):
    def test_list_removed_but_left_navigation_retained(self):
        self.assertNotIn('id="viewList"',HTML)
        self.assertNotIn('id="listDrawer"',HTML)
        self.assertIn('id="repoList"',HTML)
        self.assertIn('id="repoSearch"',HTML)

    def test_true_react_liquid_glass_is_self_hosted(self):
        self.assertIn("import LiquidGlass from 'liquid-glass-react'",SOURCE)
        self.assertIn('mode:\'standard\'',SOURCE)
        self.assertIn('backdrop-filter',CSS)
        self.assertTrue((ROOT/'vendor/vstopia-liquid-glass-island.mjs').stat().st_size>80000)
        for item in ('liquid-glass-react-MIT.txt','react-MIT.txt','react-dom-MIT.txt'):
            self.assertTrue((ROOT/'vendor/legal'/item).is_file())

    def test_tree_base_grounded_and_surface_extended(self):
        self.assertIn('originalTreeBase',JS)
        self.assertIn('tree.position.y+=terrain.position.y+.025-originalTreeBase;',JS)
        self.assertIn("stage.dataset.treeBaseAligned",JS)
        self.assertIn('PlaneGeometry(16000,16000,320,320)',JS)
        self.assertIn('smoothstep(520.0,3900.0',GROUND)

    def test_shrubs_share_ez_tree_branches_and_instance_canopy(self):
        self.assertIn('tree.clone(true)',SHRUBS)
        self.assertIn('terrain.updateMatrixWorld(true)',SHRUBS)
        self.assertIn('new THREE.InstancedMesh',SHRUBS)
        self.assertIn('samples.length*260',SHRUBS)
        self.assertIn('leaves.setMatrixAt',SHRUBS)
        self.assertIn('stage.dataset.shrubs=',SHRUBS)

    def test_native_sf_font_no_distributed_font_files(self):
        self.assertIn('"SF Pro Text"',CSS)
        self.assertIn('"Helvetica Neue"',CSS)
        # Source CSS remains available, but the browser loads one bundled sheet.
        self.assertIn('apple-glass.css', (ROOT/'scripts/build_site_css.py').read_text())
        self.assertIn('href="./site-unified.css"',HTML)
        self.assertIn('apple-glass.css', (ROOT/'site-unified.css').read_text())
        self.assertFalse(list(ROOT.rglob('*.woff')))
        self.assertFalse(list(ROOT.rglob('*.ttf')))

if __name__=='__main__':unittest.main()
