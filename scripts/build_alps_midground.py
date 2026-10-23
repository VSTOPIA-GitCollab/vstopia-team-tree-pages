#!/usr/bin/env python3
"""Prepare photographic forest-band only, with bounded horizon alpha.

Source: https://polyhaven.com/a/alps_field (CC0, Andreas Mischok).
Preserves main scene's original 180-degree mountain band and avoids new
meshes, repeated backdrops, photographed sky or distant field.
Requires Pillow/NumPy/SciPy only when intentionally rebuilding assets.
"""
from pathlib import Path
from PIL import Image
import numpy as np
from scipy.ndimage import gaussian_filter1d
import argparse
parser=argparse.ArgumentParser(description='Build source-resolution CC0 Alpine forest midground')
parser.add_argument('--source',required=True,help='Original 8192x4096 Alps Field tonemapped JPG')
parser.add_argument('--overwrite',action='store_true',help='Regenerate existing generated midground assets')
args=parser.parse_args()
src=Path(args.source)
dst=Path(__file__).resolve().parents[1]/'stillwater/assets/sky'
assert src.is_file() and dst.is_dir()
# Reuse established skyline geometry without changing the original mask or
# any assets. Use the darker forest/cliffs BELOW the distant ridge.
rgb=np.asarray(Image.open(src).convert('RGB'))
h,w=rgb.shape[:2];assert (w,h)==(8192,4096)
points=np.array([
(0,291),(45,289),(90,296),(135,311),(170,319),(210,334),
(250,329),(290,335),(325,345),(365,342),(405,349),(440,351),
(480,340),(510,326),(550,291),(575,281),(610,281),
(650,284),(690,277),(720,274),(760,280),(800,271),(830,267),
(870,267),(905,270),(940,292),(975,310),(1000,324),
(1035,344),(1070,358),(1100,364),(1125,367),
(1155,350),(1190,347),(1220,332),(1260,322),(1300,309),
(1340,309),(1380,301),(1420,298),(1460,290),(1505,291),(1536,297)],dtype=np.float32)
# PHOTO-CORRECT MOUNTAIN SILHOUETTE, NOT a synthesized sine/soft hill.
# Use an independent 180 degree section of the REAL 8K source panorama.
# The approved distant original keeps columns 2048..6144 unchanged;
# this nearer stratum takes 0..4096 of the same original for distinct terrain.
# No horizontal stretching and no duplicate mountain silhouettes.
import cv2
start,end=0,4096
xx=np.arange(start,end,dtype=np.int32)
guide=np.interp(xx,points[:,0]*w/1536,points[:,1]*h/768)
y0,y1=1070,2210
band=np.ascontiguousarray(rgb[y0:y1,start:end,:])
gray=cv2.GaussianBlur(cv2.cvtColor(band,cv2.COLOR_RGB2GRAY),(5,5),0)
grad=np.abs(cv2.Sobel(gray,cv2.CV_32F,0,1,ksize=3))/10.
blue=np.asarray(band[:,:,2],dtype=np.float32)-np.asarray(band[:,:,0],dtype=np.float32)
bluDelta=np.maximum(0,cv2.Sobel(blue,cv2.CV_32F,0,1,ksize=3))/15
dy=np.arange(-34,35,dtype=np.int32)
ys=np.clip(np.rint(guide[None,:]).astype(np.int32)+dy[:,None]-y0,0,grad.shape[0]-1)
score=grad[ys,np.arange(end-start)[None,:]]+.55*bluDelta[ys,np.arange(end-start)[None,:]]-.015*(dy[:,None]**2)
pick=ys[np.argmax(score,axis=0),np.arange(end-start)]+y0
rawSkyline=np.where(np.abs(pick-guide)>32,guide,pick)
crest=gaussian_filter1d(rawSkyline.astype(np.float32),3.5)
# Same sky-color/land-luminance validation used by the approved 8K cutout.
sampleY=np.clip(np.rint(crest-85).astype(np.int32),0,h-1)
skyLum=(.2126*rgb[sampleY,xx,0]+.7152*rgb[sampleY,xx,1]+.0722*rgb[sampleY,xx,2]).astype(np.float32)
offsets=np.arange(-8,181,dtype=np.int32)
roiY=np.clip(np.rint(crest[None,:]).astype(np.int32)+offsets[:,None],0,h-1)
roi=rgb[roiY,xx[None,:]].astype(np.float32)
roiLum=.2126*roi[:,:,0]+.7152*roi[:,:,1]+.0722*roi[:,:,2]
land=(skyLum[None,:]-roiLum>25)&(roiLum<191)
hits=np.zeros_like(land,dtype=np.int16)
for k in range(7):hits[k:]+=land[:len(offsets)-k].astype(np.int16)
strong=hits>=6
exists=np.any(strong,axis=0)
first=np.where(exists,np.argmax(strong,axis=0),48)
crest=gaussian_filter1d(np.rint(crest).astype(np.float32)+offsets[first],3.5)
localTop,localBottom=1170,2190
Y=np.arange(localTop,localBottom,dtype=np.float32)[:,None]
# Original photographic skyline: ONLY 2.5 source pixels of antialias.
# The former 20px smooth fade and fabricated sinusoidal top are deleted.
topAlpha=np.clip((Y-crest[None,:]+1.4)/2.5,0,1)
# Preserve photo's real forest & rock. Gradually remove only the grassy
# foreground / lower foot, behind the pre-existing 3D land.
foot=crest[None,:]+355
footAlpha=np.clip((foot-Y)/115,0,1)
footAlpha=footAlpha*footAlpha*(3-2*footAlpha)
u=np.arange(end-start,dtype=np.float32)/(end-start-1)
edge=np.minimum(np.clip(u/.08,0,1),np.clip((1-u)/.08,0,1))
edge=edge*edge*(3-2*edge)
alpha=np.minimum(topAlpha,footAlpha)*edge[None,:]
# Do NOT artificially darken the RGB source. The scene shader controls
# light according to sun/rain; keep the photo's real contrast and colors.
part=rgb[localTop:localBottom,start:end,:].copy()
# Opaque terrain color in transparent pixels prevents pale sky bleeding into
# narrow alpha transitions with WebP filtering, without changing visible rock.
terrainY=np.clip(np.rint(crest+12).astype(np.int32),localTop,localBottom-1)
terrainRGB=rgb[terrainY,xx,:]
onlyTransparent=Y<crest[None,:]+1.5
part=np.where(onlyTransparent[:,:,None],terrainRGB[None,:,:],part)
rgba=np.dstack([part,np.uint8(np.clip(np.rint(alpha*255),0,255))])
base=Image.fromarray(rgba,'RGBA')
for label,size,q in [('8k',(4096,1020),92),('4k',(2048,510),87)]:
 out=base if label=='8k' else base.resize(size,Image.Resampling.LANCZOS)
 path=dst/f'alps-midground-{label}.webp'
 assert not path.exists() or args.overwrite,f'Regeneration requires --overwrite: {path}'
 out.save(path,format='WEBP',quality=q,method=5,exact=True)
 print('GENERATED',str(path),out.size,path.stat().st_size,flush=True)
# Standalone non-UI QA preview of photo band against a muted background.
preview=Image.new('RGBA',(2048,510),(109,140,151,255))
preview.alpha_composite(base.resize((2048,510),Image.Resampling.LANCZOS))
preview.convert('RGB').save('/tmp/vstopia-midground-source-band-preview.jpg',quality=90)
print('REAL_CREST',int(crest.min()),int(crest.max()),'ACTIVE_PIXELS',int((alpha>.25).sum()),flush=True)
