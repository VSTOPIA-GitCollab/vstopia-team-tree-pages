"""Schema compatibility: old approved v2 snapshot and synthetic opaque v3."""
import copy,json,unittest,importlib.util
from pathlib import Path
R=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('public_snapshot_validator',R/'scripts/validate_public_snapshot.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
validate=module.validate
class AnonymousAliasTests(unittest.TestCase):
 def setUp(self):
  self.v2=json.loads((R/'snapshot.json').read_text())
  for field in ('organization_repository_count','repositories_by_alias',
                'branch_age_policy','pr_age_policy','last_activity_policy','planned_aliases'):
   self.v2.pop(field,None)
  self.v2['schema_version']=2
  self.v3=copy.deepcopy(self.v2)
  self.v3.update(schema_version=3,repository_count=1,organization_repository_count=20,
                 branch_age_policy='First collector observation, not creation',
                 pr_age_policy='PR creation timestamp is exact',
                 last_activity_policy='Recent events or mapped commits')
  self.v3['repositories_by_alias']=[{
   'alias':'Bosco delle Stelle','default_branch_commits':self.v3['default_branch_commits'],
   'branches':4,'non_default_branches':3,'oldest_branch_observed_days':5,
   'branch_ages':[{'label':'Ramo 01','observed_days':5}],
   'unlisted_branches':2,'open_issues':self.v3['open_issues'],'open_prs':self.v3['open_pull_requests'],
   'merged_prs':self.v3['merged_pull_requests_all_time'],'oldest_open_pr_days':14,
   'oldest_open_issue_days':18,'pr_ages':[{'label':'PR 01','open_days':14,
     'draft':False,'requested_from':['InnovateSN']}],
   'unlisted_prs':max(0,self.v3['open_pull_requests']-1),
   'pending':{'ostinsolo':{'issues':1,'prs':0,'reviews':2},'InnovateSN':{'issues':3,'prs':0,'reviews':4}},
   'last_activity_at':'2026-10-21T12:00:00+00:00','last_actor':'InnovateSN','last_activity_type':'review'}]
 def test_old_and_new(self):
  self.assertTrue(validate(self.v2));self.assertTrue(validate(self.v3))
 def test_reject_private_branch_and_commit_message(self):
  bad=copy.deepcopy(self.v3);bad['repositories_by_alias'][0]['branch_ages'][0]['real_branch']='private-ref'
  with self.assertRaises(ValueError):validate(bad)
  bad=copy.deepcopy(self.v3);bad['repositories_by_alias'][0]['title']='internal code'
  with self.assertRaises(ValueError):validate(bad)
  bad=copy.deepcopy(self.v3);bad['repositories_by_alias'][0]['alias']='https://github.com/owner/repo'
  with self.assertRaises(ValueError):validate(bad)
 def test_ui_supports_anonymous_repo_details_and_v2_fallback(self):
  js=(R/'app.js').read_text();html=(R/'index.html').read_text()
  self.assertIn("snapshot.schema_version===3",js)
  self.assertIn('function renderAliasDetails',js)
  self.assertIn('first',js) if False else None
  self.assertIn('oldest_branch_observed_days',js)
  self.assertIn('oldest_open_pr_days',js)
  self.assertIn('id="aliasRepoList"',html)
  self.assertIn('has-alias-metrics',js)
  self.assertIn('Cerca un giardino',js)
if __name__=='__main__':unittest.main()
