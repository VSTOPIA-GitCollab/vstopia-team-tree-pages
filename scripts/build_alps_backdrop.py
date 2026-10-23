#!/usr/bin/env python3
"""Deterministic CC0 Poly Haven Alps Field sky/foreground removal.

Source: https://polyhaven.com/a/alps_field (author: Andreas Mischok)
Input: source 8K panorama JPG; output: front-facing 180° from 8K, 4096px desktop/2048px mobile WebP ridges.
Offline build only; browser does not depend on scipy/OpenCV.
"""
from pathlib import Path
from PIL import Image
import numpy as np,cv2
from scipy.ndimage import gaussian_filter1d
import time
import argparse
parser=argparse.ArgumentParser()
parser.add_argument('--source',required=True,
 help='Original 8192×4096 CC0 Alps Field panorama from polyhaven.com/a/alps_field')
args=parser.parse_args()
source=Path(args.source)
dest=Path(__file__).resolve().parents[1]/'stillwater/assets/sky'
rgb=np.asarray(Image.open(source).convert('RGB'))
h,w=rgb.shape[:2]
assert (w,h)==(8192,4096)
# Hand-traced 360 skyline from actual photo, includes cols near both seams.
points=np.array([
(0,291),(45,289),(90,296),(135,311),(170,319),(210,334),
(250,329),(290,335),(325,345),(365,342),(405,349),(440,351),
(480,340),(510,326),(550,291),(575,281),(610,281),
(650,284),(690,277),(720,274),(760,280),(800,271),(830,267),
(870,267),(905,270),(940,292),(975,310),(1000,324),
(1035,344),(1070,358),(1100,364),(1125,367),
(1155,350),(1190,347),(1220,332),(1260,322),(1300,309),
(1340,309),(1380,301),(1420,298),(1460,290),(1505,291),(1536,297)],dtype=np.float32)
x=np.arange(w)
guide=np.interp(x,points[:,0]*w/1536,points[:,1]*h/768)
# Native-resolution local edge refinement, bounded to avoid picking
# clouds, lens flare or dark field patterns as the skyline.
y0=1070;y1=2210
band=np.ascontiguousarray(rgb[y0:y1])
grey=cv2.cvtColor(band,cv2.COLOR_RGB2GRAY)
grey=cv2.GaussianBlur(grey,(5,5),0)
grad=np.abs(cv2.Sobel(grey,cv2.CV_32F,0,1,ksize=3))/10
blue=np.asarray(band[:,:,2],dtype=np.float32)-np.asarray(band[:,:,0],dtype=np.float32)
bluDelta=np.maximum(0,cv2.Sobel(blue,cv2.CV_32F,0,1,ksize=3))/15
dy=np.arange(-34,35,dtype=np.int32)
ys=np.clip(np.round(guide[None,:]).astype(np.int32)+dy[:,None]-y0,0,grad.shape[0]-1)
cols=np.arange(w)[None,:]
score=grad[ys,cols]+.55*bluDelta[ys,cols]-.015*(dy[:,None]**2)
pick=ys[np.argmax(score,axis=0),x]+y0
# Reject unreasonable edge perturbations and smooth subtle pixel jitter.
picked=np.where(np.abs(pick-guide)>32,guide,pick)
skyline=gaussian_filter1d(picked.astype(np.float32),sigma=3.5)
# Correct false mountain edges caused by clouds and pale-blue lower sky:
# genuine mountains become much darker than sky sampled 85 px above crest.
# The 8K source contains occasional bright cirrus under our guided contour;
# without this pass that sky is mistakenly made opaque, causing blue slabs.
refY=np.clip(np.rint(skyline-85).astype(np.int32),0,h-1)
skyLum=(.2126*rgb[refY,x,0]+.7152*rgb[refY,x,1]+.0722*rgb[refY,x,2]).astype(np.float32)
offsets=np.arange(-8,181,dtype=np.int32)
roiY=np.clip(np.rint(skyline[None,:]).astype(np.int32)+offsets[:,None],0,h-1)
roi=rgb[roiY,x[None,:]]
roiLum=.2126*roi[:,:,0]+.7152*roi[:,:,1]+.0722*roi[:,:,2]
trueMountain=(skyLum[None,:]-roiLum>25)&(roiLum<191)
# Require a short persistent cluster, not one high-contrast cloud pixel.
hits=np.zeros_like(trueMountain,dtype=np.int16)
for k in range(7):
 hits[k:]+=trueMountain[:len(offsets)-k].astype(np.int16)
isGround=hits>=6
found=np.any(isGround,axis=0)
first=np.argmax(isGround,axis=0)
first=np.where(found,first,np.minimum(len(offsets)-1,48))
refined=np.rint(skyline).astype(np.float32)+offsets[first]
skyline=gaussian_filter1d(refined.astype(np.float32),sigma=3.5)

# Broad foot fade below the distant ridge. Crop exact useful vertical band.
top=1170;bottom=2190
coords=np.arange(top,bottom,dtype=np.float32)[:,None]
# Full source photo stays in its real spherical aspect ratio: do NOT expand
# the 180-degree front half into a whole 360-degree background.
# We keep the 8K source azimuths [90°, 270°] (2048..6144 columns), leaving
# the opposite half of the world to the original animated HDR sky.
# Restore the original summit contour and photographic color treatment
# from BEFORE the later top-edge experiment. The 180-degree partial crop and
# no-repeat mapping are retained; only the mountain TOP alpha/color changes.
alpha=np.clip((coords-skyline[None,:]+1.8)/8.5,0,1)
alpha=alpha*alpha*(3-2*alpha)
fade=np.clip((2075-coords)/162,0,1)
fade=fade*fade*(3-2*fade)
alpha=np.minimum(alpha,fade)
cut=rgb[top:bottom]
# Crop the native source azimuth interval: 4096px for 180° at source detail,
# and 2048px mobile. No seam stitching, periodic repetition or horizontal
# stretching. Only the mountain band is retained in vertical pixels.
arc0,arc1=w//4,3*w//4
rgba=np.concatenate((cut[:,arc0:arc1],np.round(alpha[:,arc0:arc1][:,:,None]*255).astype(np.uint8)),axis=2)
base=Image.fromarray(rgba,'RGBA')
for resolution,quality in [(4096,94),(2048,93)]:
 im=base if resolution==4096 else base.resize((resolution,510),Image.Resampling.LANCZOS)
 outfile=dest/('alps-field-mountains-8k.webp' if resolution==4096 else 'alps-field-mountains-4k.webp')
 im.save(outfile,'WEBP',quality=quality,method=6,exact=True)
 print('CREATED',outfile.name,'pixels',im.size,'bytes',outfile.stat().st_size,flush=True)
preview=Image.new('RGBA',(2048,510),(153,184,208,255))
preview.alpha_composite(base.resize((2048,510)))
preview.convert('RGB').save('/tmp/vstopia-alps-field-hq-preview.jpg',quality=94)
print('SOURCE',w,h,'CROP',top,bottom,'skyline_minmax',int(skyline.min()),int(skyline.max()),flush=True)
