"""English-only public UI without changing pseudonymous GitHub source data."""
import json
import re
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
INDEX=(ROOT/'index.html').read_text()
APP=(ROOT/'app.js').read_text()
PARENT=(ROOT/'stillwater-integration.js').read_text()
SNAPSHOT=json.loads((ROOT/'snapshot.json').read_text())


class EnglishSiteTests(unittest.TestCase):
    def test_document_locale_and_cache_versions(self):
        self.assertIn('<html lang="en">',INDEX)
        self.assertNotIn('<html lang="it">',INDEX)
        self.assertIn('app.js?v=english-ui-20261023',INDEX)
        self.assertIn('rock-normals-v8-crisp-shadows-english-ui-20261023',INDEX)
        self.assertIn("new Intl.NumberFormat('en-GB')",APP)
        self.assertIn("toLocaleString('en-GB'",APP)
        self.assertNotIn("'it-IT'",APP)

    def test_all_public_fictional_aliases_have_english_display(self):
        match=re.search(r"const aliasEnglish = (\{[\s\S]*?\});",APP)
        self.assertIsNotNone(match)
        aliases=json.loads(match.group(1))
        raw={r['alias'] for r in SNAPSHOT['repositories_by_alias']}
        raw.update(SNAPSHOT['planned_aliases'])
        self.assertEqual(set(aliases),raw)
        self.assertEqual(len(aliases),20)
        self.assertEqual(len(set(aliases.values())),20)
        for original,english in aliases.items():
            self.assertNotEqual(english,original)
            self.assertRegex(english,r'^[A-Za-z ]{4,40}$')

    def test_alias_identity_and_selection_preserved(self):
        self.assertIn("selectedAlias=alias.alias",APP)
        self.assertIn("englishAlias(alias.alias)",APP)
        self.assertIn("label:englishAlias(x.alias)",APP)
        self.assertIn("const englishLabels=new Map()",PARENT)
        self.assertIn("englishLabels.set(row.name,row.label||row.name)",PARENT)
        self.assertIn("b.dataset.repo=name",PARENT)
        self.assertIn("vstopia:choose-alias",APP)
        self.assertIn("englishBranchLabel(item.label)",APP)
        self.assertIn("fetch('./snapshot.json',{cache:'no-store'})",APP)

    def test_visible_copy_is_not_italian(self):
        old=[
            'Cerca un giardino','Albero tematico interattivo',
            'Caricamento attività','Seleziona un nodo',
            'ULTIMA ATTIVITÀ','GIARDINI · MONITORATI',
            'PR più vecchia','Branch secondari:',
            'Altri ${extra} elementi','AREA TEMATICA',
            'SUPERVISORE:',"1 giorno","giorni",
            'Nessun progetto corrisponde',
            'IN PROGRAMMAZIONE','DATI NON DISPONIBILI'
        ]
        for word in old:
            self.assertNotIn(word,INDEX)
            self.assertNotIn(word,APP)
        self.assertIn('Search a garden',APP)
        self.assertIn('Tracked branches',APP)
        self.assertIn('ASSIGNED ISSUES',APP)
        self.assertIn('LATEST ACTIVITY:',APP)


if __name__=='__main__':
    unittest.main()
