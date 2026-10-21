"""Source-level regression tests for actual 3D bark anchor attachments."""
import pathlib, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
TREE=(ROOT/'ez-tree-scene.js').read_text()
HTML=(ROOT/'index.html').read_text()
APP=(ROOT/'app.js').read_text()
STYLE=(ROOT/'apple-glass.css').read_text()
class AnchorTests(unittest.TestCase):
    def test_labels_attach_to_real_branch_mesh_vertices(self):
        self.assertIn('const branchMesh=tree.branchesMesh',TREE)
        self.assertIn('branchMesh.geometry?.attributes?.position',TREE)
        self.assertIn('anchor.position.set(winner.x,winner.y,winner.z)',TREE)
        self.assertIn('branchMesh.add(anchor)',TREE)
        self.assertIn('sphereMarker(anchor,name,i)',TREE)
        self.assertIn("stage.dataset.anchorType='actual-bark-vertex-object3d'",TREE)
        self.assertNotIn('const points=[]',TREE)
    def test_marker_projection_tracks_camera_without_clamping(self):
        self.assertIn('anchor.getWorldPosition(pt).project(camera)',TREE)
        self.assertIn('camera.updateMatrixWorld(true)',TREE)
        self.assertIn('tree.updateMatrixWorld(true)',TREE)
        self.assertIn('stage.getBoundingClientRect()',TREE)
        self.assertIn('el.style.left=`${x.toFixed(2)}px`',TREE)
        self.assertNotIn('Math.max(79,Math.min',TREE)
        self.assertIn('window.VstopiaEzTreeAnchors=',TREE)
        self.assertIn('api.getAnchorDiagnostics=',TREE)
    def test_only_project_text_remains_over_tree(self):
        self.assertIn("el.className='living-node'",TREE)
        self.assertIn("text.className='living-node-label'",TREE)
        self.assertNotIn('living-orb',TREE)
        for forbidden in ('forestAnimationSpeed','forest-speed-control','stage-coordinate','stage-legend','stage-instructions','workbench-footer','tourButton','resetView'):
            self.assertNotIn(forbidden,HTML)
        self.assertIn('living-node{transform:translate(-50%,-50%)!important}',STYLE)
    def test_animated_tree_remains_enabled(self):
        self.assertIn('const animationSpeed=2;',TREE)
        self.assertIn('tree.update(windPhase)',TREE)
        self.assertIn("stage.dataset.windSpeed=animationSpeed.toFixed(2)",TREE)
        self.assertIn("window.addEventListener('vstopia:select'",APP)
if __name__=='__main__':unittest.main()
