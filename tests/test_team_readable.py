"""Team card readability and selected project label contrast regression tests."""
from pathlib import Path
import unittest
R=Path(__file__).resolve().parents[1]
CSS=(R/'team-readable.css').read_text()
HTML=(R/'index.html').read_text()
class TeamReadabilityTests(unittest.TestCase):
 def test_our_team_uses_css_grid_areas_not_cramped_single_lines(self):
  self.assertIn("grid-template-areas:'identity identity' 'stats assignments' 'last last'",CSS)
  self.assertIn('grid-template-columns:repeat(2,minmax(0,1fr))!important',CSS)
  self.assertIn('grid-area:stats!important',CSS)
  self.assertIn('grid-area:assignments!important',CSS)
  self.assertIn('grid-area:last!important',CSS)
 def test_no_nested_member_card_scroll(self):
  self.assertIn('height:auto!important',CSS)
  self.assertIn('overflow:visible!important',CSS)
  self.assertIn('layout>.inspector>.team-members',CSS)
 def test_project_labels_selected_and_not_are_white(self):
  self.assertIn('.living-node .living-node-label,.living-node.selected .living-node-label',CSS)
  self.assertIn('color:var(--team-white)!important',CSS)
  self.assertIn('text-shadow:var(--team-shadow)!important',CSS)
 def test_font_sizes_readable(self):
  self.assertIn('font-size:21px!important',CSS)
  self.assertIn('font-size:10.5px!important',CSS)
  self.assertIn('font-size:10px!important',CSS)
 def test_css_loaded_last_and_on_mobile(self):
  self.assertIn('href="./team-readable.css"',HTML)
  self.assertLess(HTML.index('href="./water-garden.css"'),HTML.index('href="./team-readable.css"'))
  self.assertIn('@media(max-width:760px)',CSS)
  self.assertIn('@media(max-width:380px)',CSS)
if __name__=='__main__':unittest.main()
