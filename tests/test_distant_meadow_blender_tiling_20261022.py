"""Blender-style macro tiling/fogless grass brighten at the far ring."""
import unittest
from pathlib import Path

SRC=(Path(__file__).resolve().parents[1]/'stillwater/scene.js').read_text()

class DistantMeadowBlenderTiling(unittest.TestCase):
    def test_near_and_far_share_physical_standard_material_and_world_uv(self):
        self.assertIn('const terrain=new THREE.Mesh(terrainGeo,new THREE.MeshStandardMaterial(',SRC)
        self.assertIn('const farMeadowMat=new THREE.MeshStandardMaterial({',SRC)
        self.assertIn('map:groundTex,vertexColors:true,roughness:1,metalness:0,',SRC)
        self.assertIn('fgu.setXY(i,(x+170)/340,(170-z)/340)',SRC)

    def test_color_blend_is_distance_smooth_and_not_an_abrupt_dark_band(self):
        self.assertIn('float meadowFade=smoothstep(165.0,640.0,meadowR)',SRC)
        self.assertIn('outgoingLight=mix(outgoingLight,sunlitGrass,meadowFade*.86)',SRC)
        self.assertIn('vec3 sunlitGrass=vec3(.26,.38,.21)',SRC)
        self.assertIn('macroA',SRC)
        self.assertIn('macroB',SRC)
        self.assertIn('macroC',SRC)
        self.assertNotIn("map:groundTex,vertexColors:true,color:'#d4e0d0',fog:false",SRC)
        self.assertNotIn('new THREE.MeshLambertMaterial',SRC)

    def test_keep_xz_fix_and_animated_lake_and_sky(self):
        self.assertIn('farGroundGeo.rotateX(-Math.PI/2)',SRC)
        self.assertIn('water.material.uniforms.time.value+=motionDt',SRC)
        self.assertIn("new RGBELoader().setDataType(THREE.HalfFloatType)",SRC)
        self.assertIn('vFarMeadowXZ=(modelMatrix*vec4(transformed,1.0)).xz',SRC)

if __name__=='__main__':
    unittest.main()
