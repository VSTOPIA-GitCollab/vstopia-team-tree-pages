"""20 public aliases, planned-only privacy, mobile WebGL and 3D selection contracts."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('catalog_validator',
                                             ROOT/'scripts/validate_public_snapshot.py')
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class UnifiedAliasMobileTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((ROOT/'snapshot.json').read_text())

    def test_all_twenty_are_public_aliases_without_fake_private_metrics(self):
        self.assertTrue(mod.validate(self.data))
        self.assertEqual(self.data['repository_count'],13)
        self.assertEqual(self.data['organization_repository_count'],20)
        self.assertEqual(len(self.data['repositories_by_alias']),13)
        self.assertEqual(len(self.data['planned_aliases']),7)
        self.assertTrue(all(isinstance(x,str) for x in self.data['planned_aliases']))
        self.assertEqual(len(set(self.data['planned_aliases']+
            [x['alias'] for x in self.data['repositories_by_alias']])),20)

    def test_planned_entries_cannot_expose_private_repo_data(self):
        for new in ([{'alias':'Secret Repo','commits':7}],
                    ['https://github.com/owner/repo'],['Bussola Segreta']*7,
                    self.data['planned_aliases'][:-1]):
            invalid=copy.deepcopy(self.data)
            invalid['planned_aliases']=new
            with self.assertRaises(ValueError):
                mod.validate(invalid)

    def test_tree_sidebar_selection_share_the_same_catalog(self):
        app=(ROOT/'app.js').read_text()
        parent=(ROOT/'stillwater-integration.js').read_text()
        child=(ROOT/'stillwater/vstopia-bridge.js').read_text()
        self.assertIn("publishedAliases()",app)
        self.assertIn("vstopia:aliases",app)
        self.assertIn("vstopia:choose-alias",app)
        self.assertIn("vstopia:alias-selected",parent)
        self.assertIn("signal('configured'",child)
        self.assertIn("send('ping')",parent)
        self.assertIn("if(names.length===next.length",child)

    def test_mobile_keeps_real_webgl_with_smaller_gpu_budget(self):
        scene=(ROOT/'stillwater/scene.js').read_text()
        bridge=(ROOT/'stillwater/vstopia-bridge.js').read_text()
        style=(ROOT/'site-design.css').read_text()
        self.assertIn("new THREE.WebGLRenderer",scene)
        self.assertIn("lowPower?24000:180000",scene)
        self.assertIn("lowPower?256:1024",scene)
        self.assertIn("lowPower?512:2048",scene)
        self.assertIn("window.matchMedia('(max-width:760px), (pointer:coarse)')",bridge)
        self.assertIn("min-height:470px",style)
        self.assertIn("height:440px",style)


if __name__=='__main__':
    unittest.main()
