"""Keep the updating branch and supervisor content, remove their dark cards."""
import unittest
from pathlib import Path
R=Path(__file__).resolve().parents[1]
HTML=(R/'index.html').read_text()
CSS=(R/'site-design.css').read_text()
BUNDLE=(R/'site-unified.css').read_text()
JS=(R/'app.js').read_text()
class PlainDynamicPanels(unittest.TestCase):
 def test_visible_live_content_slots_preserved(self):
  for token in ('id="selectedDetail"','id="activityFeed"','id="selectedIndicator"','SELECTED BRANCH','TEAM SUPERVISOR'):
   self.assertIn(token,HTML)
  for token in ("function renderDetail()",'root.replaceChildren()','function supervisor()',"$('supervisorMessage')",'setInterval(loadPublicSnapshot,300000)',"activity.lastChild.id='supervisorMessage'"):
   self.assertIn(token,JS)
 def test_no_nested_dark_glass_on_the_two_sections(self):
  for token in ('background:transparent!important','background-color:transparent!important','background-image:none!important','border:0!important','box-shadow:none!important','backdrop-filter:none!important','outline:0!important','detail-section,.collaborator','#supervisorMessage'):
   self.assertIn(token,CSS)
  self.assertIn('Text-only Selected Branch and Team Supervisor',BUNDLE)
 def test_css_source_remains_last_in_single_bundle(self):
  self.assertIn('<link rel="stylesheet" href="./site-unified.css">',HTML)
  self.assertEqual(BUNDLE.count('/* site-design.css */'),1)
if __name__=='__main__':unittest.main()
