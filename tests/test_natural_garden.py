import json, pathlib, unittest
R=pathlib.Path(__file__).resolve().parents[1]
W=(R/'water-environment.js').read_text()
UI=(R/'index.html').read_text()
CSS=(R/'water-garden.css').read_text()
GLASS=(R/'glass-react-source/specy-header.jsx').read_text()
class NaturalGardenTests(unittest.TestCase):
 def test_long_river_reaches_real_edge(self):
  self.assertIn('[-7950,-430]',W)
  self.assertIn('terrainEdgeX:-8000',W)
  self.assertIn('riverSegments:CHANNEL.length',W)
  self.assertIn('const creekWidth=t=>14+',W)
  self.assertIn('const creekCurve=new THREE.CatmullRomCurve3',W)
  self.assertIn('makeRiverGeometry()',W)
 def test_lake_irregular_and_away_from_tree(self):
  self.assertIn('const LAKE={x:-145,z:-210,rx:62,rz:44',W)
  self.assertIn('const lakeEdge=a=>1+.16*Math.sin(a*3+',W)
  self.assertIn('makeLakeGeometry()',W)
  self.assertNotIn('lake.scale.set',W)
 def test_rocks_are_irregular_and_scattered_not_a_ring(self):
  self.assertIn('new THREE.IcosahedronGeometry(1,1)',W)
  self.assertIn('rp.setXYZ(i,x*v,y*v,z*v)',W)
  self.assertIn('for(let i=0;i<185;i++)',W)
  self.assertIn('for(let i=0;i<48;i++)',W)
 def test_riparian_grass_and_full_meadow(self):
  self.assertIn('InstancedMesh(grassGeo,grassMat,33000)',W)
  self.assertIn('if(i<11500)',W)
  self.assertIn('creekCurve.getPoint(t)',W)
  self.assertIn('stage.dataset.waterGrass',W)
 def test_no_redundant_sidebar_disclaimer(self):
  self.assertNotIn('PUBLIC STATS · AGGREGATES ONLY',UI)
  self.assertNotIn('Sito pubblico. Solo conteggi aggregati autorizzati.',UI)
 def test_real_three_canvas_beneath_translucent_header_and_panels(self):
  self.assertIn('position:fixed!important;inset:0!important',CSS)
  self.assertIn('background:rgba(234,249,253,.12)',CSS)
  self.assertIn('background:rgba(247,251,255,.17)',CSS)
  self.assertIn('max-height:none!important',CSS)
 def test_single_original_specy_glass_island(self):
  self.assertIn("from '@specy/liquid-glass-react'",GLASS)
  self.assertEqual(UI.count('id="specyGlassHeader"'),1)
  self.assertIn('vendor/vstopia-specy-header.mjs',UI)
  self.assertGreater((R/'vendor/vstopia-specy-header.mjs').stat().st_size,150000)
  self.assertEqual(json.loads((R/'glass-react-source/package.json').read_text())['dependencies']['@specy/liquid-glass-react'],'1.0.2')
if __name__=='__main__':unittest.main()
