#!/usr/bin/env python3
"""Public Pages validation: v2 aggregates OR v3 opaque alias metrics only."""
from __future__ import annotations
import json
import pathlib
import re
import sys

BASE={'schema_version','data_policy','scope','updated_at','repository_count',
      'default_branch_commits','open_issues','open_pull_requests','merged_pull_requests_all_time',
      'people','push_count_policy','personal_counts_policy','workload_policy'}
EXT={'organization_repository_count','repositories_by_alias','branch_age_policy',
     'pr_age_policy','last_activity_policy'}
PERSON={'name','github','commits','prs_opened_all_time','prs_merged_all_time',
        'push_events_observed_30d','last_interaction_at','last_interaction_type',
        'event_coverage_partial','assigned_open_issues','assigned_open_prs','reviews_requested'}
COUNTS={'default_branch_commits','branches','non_default_branches','oldest_branch_observed_days',
        'unlisted_branches','open_issues','open_prs','merged_prs','oldest_open_pr_days',
        'oldest_open_issue_days','unlisted_prs'}
REPO=COUNTS|{'alias','branch_ages','pr_ages','pending','last_activity_at','last_actor','last_activity_type'}
USERS={'ostinsolo','InnovateSN'}

def nat(x):
    return type(x) is int and 0<=x<=100000000

def validate(data):
    if type(data) is not dict or data.get('schema_version') not in (2,3):raise ValueError('Unexpected schema')
    version=data['schema_version']
    if set(data)!=(BASE if version==2 else BASE|EXT):raise ValueError('Unexpected published fields')
    if data['data_policy']!='public-authorized-team-summary' or data['scope']!='repositories-readable-by-both-collaborators':
        raise ValueError('Invalid authorization scope')
    for key in ('repository_count','default_branch_commits','open_issues','open_pull_requests','merged_pull_requests_all_time'):
        if not nat(data[key]):raise ValueError('Invalid organization count')
    people=data['people']
    if type(people) is not list or len(people)!=2 or {x.get('github') for x in people}!=USERS:
        raise ValueError('Unexpected collaborators')
    for person in people:
        if type(person) is not dict or set(person)!=PERSON or person['name'] not in ('Agostino','Marcello'):
            raise ValueError('Unexpected collaborator field')
        for key in PERSON-{'name','github','last_interaction_at','last_interaction_type','event_coverage_partial'}:
            if not nat(person[key]):raise ValueError('Invalid collaborator metric')
        if type(person['event_coverage_partial']) is not bool:
            raise ValueError('Invalid coverage')
    if version==3:
        rows=data['repositories_by_alias']
        if not nat(data['organization_repository_count']) or data['organization_repository_count']<data['repository_count']:
            raise ValueError('Invalid repository scope totals')
        if type(rows) is not list or len(rows)!=data['repository_count'] or len(rows)>100:
            raise ValueError('Invalid anonymous repository list')
        names=set()
        for repo in rows:
            if type(repo) is not dict or set(repo)!=REPO:raise ValueError('Unapproved repo fields')
            alias=repo['alias']
            # User-facing names are words, NEVER paths, URLs, GH slugs or IDs.
            if not isinstance(alias,str) or not re.fullmatch(r"[A-Za-zÀ-ÖØ-öø-ÿ ]{4,40}",alias) or alias in names:
                raise ValueError('Unsafe or repeated alias')
            names.add(alias)
            if any(not nat(repo[k]) for k in COUNTS):raise ValueError('Invalid alias metric')
            if repo['non_default_branches']>repo['branches']:raise ValueError('Invalid branch counts')
            if type(repo['branch_ages']) is not list or len(repo['branch_ages'])>24:
                raise ValueError('Invalid branch age data')
            for branch in repo['branch_ages']:
                if type(branch) is not dict or set(branch)!={'label','observed_days'} or not nat(branch['observed_days']) or not re.fullmatch(r'Ramo [0-9]{2,}',branch['label']):
                    raise ValueError('Unsafe branch metadata')
            if type(repo['pr_ages']) is not list or len(repo['pr_ages'])>24:
                raise ValueError('Invalid PR age data')
            for pr in repo['pr_ages']:
                if type(pr) is not dict or set(pr)!={'label','open_days','draft','requested_from'} or not re.fullmatch(r'PR [0-9]{2,}',pr['label']) or not nat(pr['open_days']) or type(pr['draft']) is not bool or type(pr['requested_from']) is not list or not set(pr['requested_from'])<=USERS:
                    raise ValueError('Unsafe PR metadata')
            if type(repo['pending']) is not dict or set(repo['pending'])!=USERS:
                raise ValueError('Unsafe assignment metadata')
            for work in repo['pending'].values():
                if type(work) is not dict or set(work)!={'issues','prs','reviews'} or not all(nat(v) for v in work.values()):
                    raise ValueError('Unsafe assignment count')
            if repo['last_actor'] not in USERS|{'team'} or repo['last_activity_type'] not in {'push','pull_request','review','issue','comment','branch','merge','commit','unknown'}:
                raise ValueError('Unsafe event labels')
            if repo['last_activity_at'] is not None and (not isinstance(repo['last_activity_at'],str) or len(repo['last_activity_at'])>40):
                raise ValueError('Unsafe event date')
        for top,sub in [('default_branch_commits','default_branch_commits'),('open_issues','open_issues'),('open_pull_requests','open_prs'),('merged_pull_requests_all_time','merged_prs')]:
            if sum(r[sub] for r in rows)!=data[top]:raise ValueError('Aggregates mismatch aliases')
        for key in EXT-{'organization_repository_count','repositories_by_alias'}:
            if not isinstance(data[key],str) or len(data[key])>260:raise ValueError('Invalid source policy')
    payload=json.dumps(data,ensure_ascii=False)
    if any(term in payload for term in ('https://github.com/','github_pat_','ghp_','gho_',
                                      'private_repo_name','repository_url','SECRET_REPOSITORY','PRIVATE_MESSAGE')):
        raise ValueError('Internal repository data in public snapshot')
    return True

if __name__=='__main__':
    if len(sys.argv)!=2:raise SystemExit('Specify snapshot JSON path')
    snapshot=json.loads(pathlib.Path(sys.argv[1]).read_text())
    validate(snapshot)
    for asset in ('app.js','index.html','style.css'):
        body=pathlib.Path(asset).read_text()
        if any(fake in body for fake in ('DEMO COMMITS','Create a new animation','ESEMPIO DI ATTIVITÀ')):
            raise ValueError('Synthetic activity remains on public site')
        if any(term in body for term in ('gho_','ghp_','github_pat_','/api/overview')):
            raise ValueError('Private token/backend reference in public site')
    print('PASS: public-only allowlisted GitHub snapshot v'+str(snapshot['schema_version']))
