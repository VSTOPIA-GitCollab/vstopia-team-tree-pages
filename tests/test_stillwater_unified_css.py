"""Regression tests for single stylesheet, tall inspector and non-white mountains."""
from pathlib import Path
import re,unittest
R=Path(__file__).resolve().parents[1]
HTML=(R/'index.html').read_text()
DESIGN=(R/'site-design.css').read_text()
BUILD=(R/'scripts/build_site_css.py').read_text()
BUNDLE=(R/'site-unified.css').read_text()
NATURE=(R/'stillwater/nature.js').read_text()
class UnifiedDesign(unittest.TestCase):
 def test_one_loaded_css_but_source_modules_retained(self):
  links=re.findall(r'<link[^>]+rel="stylesheet"[^>]+>',HTML)
  self.assertEqual(len(links),1,links)
  self.assertIn('href="./site-unified.css"',links[0])
  for fn in ('style.css','liquid-glass.css','scene-polish.css','apple-glass.css','water-garden.css','team-readable.css','stillwater-integration.css','site-design.css'):
   self.assertIn(fn,BUILD)
   self.assertIn('/* '+fn+' */',BUNDLE)
 def test_right_inspector_has_two_rows_without_internal_scroll(self):
  self.assertIn('.layout>.inspector{grid-column:3!important;grid-row:1 / 3!important',DESIGN)
  self.assertIn('.layout>.bottom-metrics{grid-column:2!important;grid-row:2!important',DESIGN)
  self.assertIn('overflow:visible!important',DESIGN)
  self.assertIn('font-size:12px!important',DESIGN)
  self.assertIn('@media(max-width:760px)',DESIGN)
 def test_original_mountain_shape_and_darkened_source_tint(self):
  self.assertIn("c.set('#596c73')",NATURE)
  self.assertIn("c.multiplyScalar((.8+n*.30)*.88)",NATURE)
  self.assertIn('const y=-6+envelope*(47+n*125)*broad',NATURE)
  self.assertIn('haze=clamp(1.-exp(-mountainDistance*.00036),.0,.27)',NATURE)
  self.assertNotIn("c.set('#29363b')",NATURE)
 def test_apple_font_and_real_demo_distinction(self):
  self.assertIn('SF Pro Text',DESIGN)
  self.assertIn('DEMO',HTML)
  self.assertIn('VERIFIED GITHUB DATA',HTML)
if __name__=='__main__':unittest.main()
