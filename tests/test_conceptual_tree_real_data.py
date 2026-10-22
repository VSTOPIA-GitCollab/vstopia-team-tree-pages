"""No fabricated per-repository GitHub claims on the public conceptual tree."""
from pathlib import Path
import json,unittest
R=Path(__file__).resolve().parents[1]
APP=(R/'app.js').read_text()
INDEX=(R/'index.html').read_text()
DESIGN=(R/'site-design.css').read_text()
PAGES=(R/'.github/workflows/pages.yml').read_text()
SNAPSHOT=json.loads((R/'snapshot.json').read_text())
class HonestPublicTree(unittest.TestCase):
 def test_real_fields_come_from_approved_static_aggregate_only(self):
  self.assertEqual(SNAPSHOT['data_policy'],'public-authorized-team-summary')
  self.assertIn(SNAPSHOT['schema_version'],(2,3))
  self.assertIn("fetch('./snapshot.json',{cache:'no-store'})",APP)
  self.assertIn("SNAPSHOT GITHUB · ",APP)
  self.assertIn('publishedLabel',APP)
  self.assertIn('id="publicDataHeading"',INDEX)
  self.assertIn("$('publicDataHeading').textContent='GITHUB · SNAPSHOT '+publishedLabel",APP)
 def test_no_fabricated_repo_activity_or_private_names(self):
  for bad in ('ESEMPIO DI ATTIVITÀ','Create a new animation','DEMO COMMITS','r.last_commit','r.issues+r.prs','commits: [','issues: [','last_commit:',"'DEMO'"):
   self.assertNotIn(bad,APP)
  self.assertNotIn('DEMO',INDEX)
  self.assertIn('AREA TEMATICA',APP)
  self.assertIn('Percorso della mappa, non un repository specifico',APP)
  self.assertIn('PROJECT AREAS',INDEX)
 def test_filters_are_categories_not_invented_issue_activity(self):
  self.assertIn('data-filter="creative"',INDEX)
  self.assertIn('data-filter="technical"',INDEX)
  self.assertIn("state.filter===r.category",APP)
  self.assertIn("if(items.length&&!items.some(r=>r.name===state.selected))",APP)
 def test_compact_rows_keep_original_font_size(self):
  self.assertIn('min-height:39px!important;padding:3px 8px!important',DESIGN)
  self.assertIn('.repo-list{gap:5px!important}',DESIGN)
  self.assertIn('.repo-copy small{margin-top:2px!important}',DESIGN)
  self.assertNotIn('font-size:',DESIGN.split('/* Compact the dark thematic sidebar entries')[1].split('/* Anonymous monitored repositories')[0])
 def test_no_new_public_snapshot_fields(self):
  self.assertNotIn('private_repo_name',json.dumps(SNAPSHOT))
  self.assertIn('scripts/validate_public_snapshot.py',PAGES)
  self.assertIn('DEMO COMMITS', (R/'tests/test_conceptual_tree_real_data.py').read_text())
if __name__=='__main__':unittest.main()
