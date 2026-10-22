"""Prevent the artificial dark line / collapsed distant meadow ring."""
import math
import unittest
from pathlib import Path

SOURCE=(Path(__file__).resolve().parents[1]/'stillwater/scene.js').read_text()

def simulate_ring(radial, segments, rotated):
    # Three.js RingGeometry starts in XY; after rotateX(-pi/2), Y -> -Z.
    xs=[];zs=[]
    for band in range(radial+1):
        radius=144+(9600-144)*band/radial
        for i in range(segments+1):
            phase=i/segments*math.tau
            old_x=radius*math.cos(phase)
            old_z=-radius*math.sin(phase) if rotated else 0.
            old_r=math.hypot(old_x,old_z)
            t=max(0,min(1,(old_r-144)/(9600-144)))
            new_r=144+(9600-144)*pow(t,1.44)
            x=old_x*new_r/max(.001,old_r)
            z=old_z*new_r/max(.001,old_r)
            xs.append(x);zs.append(z)
    return (max(xs)-min(xs), max(zs)-min(zs))

class DistantMeadowRingGeometryTests(unittest.TestCase):
    def test_ring_is_rotated_before_reading_z(self):
        constructor='const farGroundGeo=new THREE.RingGeometry(144,FAR_MEADOW_RADIUS,lowPower?180:448,lowPower?95:240);'
        rotation='farGroundGeo.rotateX(-Math.PI/2);'
        read='const fgp=farGroundGeo.attributes.position, fgu=farGroundGeo.attributes.uv;'
        self.assertIn(constructor,SOURCE)
        self.assertIn(rotation,SOURCE)
        self.assertTrue(SOURCE.index(constructor)<SOURCE.index(rotation)<SOURCE.index(read))

    def test_preserves_meadow_heights_uv_and_materials(self):
        self.assertIn('fgp.setXYZ(i,x,distantMeadowHeight(x,z),z);',SOURCE)
        self.assertIn('fgu.setXY(i,(x+170)/340,(170-z)/340);',SOURCE)
        self.assertIn('farGroundGeo.computeVertexNormals();',SOURCE)
        self.assertIn("new THREE.MeshLambertMaterial({",SOURCE)
        self.assertIn("farGround.receiveShadow=true;",SOURCE)

    def test_both_desktop_and_phone_rings_have_area_in_x_and_z(self):
        for radial,segments in ((240,448),(95,180)):
            before=simulate_ring(radial,segments,False)
            after=simulate_ring(radial,segments,True)
            self.assertAlmostEqual(before[1],0,delta=1e-6)
            self.assertGreater(after[0],19100)
            self.assertGreater(after[1],19100)
            self.assertLess(abs(after[0]-after[1]),2)

if __name__=='__main__':
    unittest.main()
