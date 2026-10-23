#!/usr/bin/env python3
"""Import a user-approved rendered Alpine image into VSTOPIA Living Tree.

Workflow: generate/edit image visually, download PNG; if it is RGB on black,
reconstruct alpha from its primary connected foreground component, then
replace ONLY the canonical active photo textures in this checkout. The
original download remains untouched. Requires Pillow, NumPy, OpenCV and SciPy.
Explicit operation: this overwrites existing *approved-alpine* texture assets;
the old procedural photo generators and far Alps are not modified.
"""
from pathlib import Path
from PIL import Image, ImageChops
import numpy as np, cv2, hashlib, subprocess, argparse
from scipy.ndimage import distance_transform_edt
parser=argparse.ArgumentParser(description='Convert a user-approved black-background mountain picture into the single active transparent panorama source, with 8K/4K outputs.')
parser.add_argument('--source',type=Path,required=True,help='Local user-approved PNG with black background')
args=parser.parse_args()
r=Path(__file__).resolve().parents[1]
source=args.source.expanduser()
assets=r/'stillwater/assets/sky'
assert r.is_dir() and source.is_file() and assets.is_dir()
assert subprocess.run(['git','-C',str(r),'branch','--show-current'],capture_output=True,text=True).stdout.strip()=='main'
# Preserve the existing dirty main branch; don't assume a permanent commit hash.
b=np.array(Image.open(source).convert('RGB'),dtype=np.uint8)
h,w=b.shape[:2]
assert (w,h)==(2172,724)
# User-edited image is RGB, with a genuinely black, nontransparent sky.
# Use only the biggest contiguous photographic subject as the alpha mask.
# Keep dark real forest pixels INSIDE the closed silhouette fully opaque.
candidate=(b.max(2)>12).astype('uint8')
n,labels,stats,_=cv2.connectedComponentsWithStats(candidate,8)
component=1+int(np.argmax(stats[1:,cv2.CC_STAT_AREA]))
subject=np.uint8(labels==component)*255
contours,_=cv2.findContours(subject,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
solid=np.zeros((h,w),np.uint8)
cv2.drawContours(solid,contours,-1,255,cv2.FILLED)
# Just antialias the real silhouette ~0.6px. Never fade the top mountain.
alpha=cv2.GaussianBlur(solid,(3,3),.60)
# Black-matted fringe correction: replace dark RGB within 2px of newly
# created transparent pixels with nearest internal landscape color.
# Preserve original color of all fully interior mountain pixels.
band=cv2.dilate(solid,np.ones((3,3),np.uint8),iterations=2)
exterior=np.where((band>0)&(solid==0),255,0).astype('uint8')
rgb=cv2.inpaint(b,exterior,2,cv2.INPAINT_TELEA)
rgba=np.dstack([rgb,alpha])
canvas_original=Image.fromarray(rgba,'RGBA')
print('MASK source-sha',hashlib.sha256(source.read_bytes()).hexdigest(),'dimension',canvas_original.size,
      'alpha-bbox',canvas_original.getchannel('A').getbbox(),'alpha-0',int((alpha==0).sum()),flush=True)
# Keep same source aspect ratio and SAME canvas fit used in the previous
# approved cutout. No layout, mapping, weather, shader or geometry changes.
target_orig=assets/'approved-alpine-mountains-source.png'
assert target_orig.is_file()
print('OLD_SRC_HASH',hashlib.sha256(target_orig.read_bytes()).hexdigest())
for name,size,quality in [('8k',(4096,1020),93),('4k',(2048,510),87)]:
 cw,ch=size
 scale=min(cw/w,ch/h)
 dw,dh=round(w*scale),round(h*scale)
 resized=canvas_original.resize((dw,dh),Image.Resampling.LANCZOS)
 af=resized.getchannel('A')
 # Same 2.5% taper only at L/R endpoints; mountain tops are unmodified.
 edge=max(1,round(dw*.025))
 fade=Image.new('L',(dw,1))
 pix=fade.load()
 for x in range(dw):
  f=min(1.,x/edge,(dw-1-x)/edge)
  pix[x,0]=round(255*max(0.,f)**.7)
 resized.putalpha(ImageChops.multiply(af,fade.resize((dw,dh))))
 fitted=Image.new('RGBA',size,(0,0,0,0))
 fitted.alpha_composite(resized,((cw-dw)//2,(ch-dh)//2))
 # A short inward-only alpha gradient at the ACTUAL silhouette perimeter:
 # 8 px desktop / 4 px mobile at source texture resolution. This fades just
 # a few pixels of real rock into the backdrop, without generating an outer
 # black fringe, moving the crest, or washing out the entire mountaintop.
 # Start from the unfeathered canonical downloaded image every regeneration:
 # repeated imports must not accumulate increasingly transparent borders.
 aa=np.asarray(fitted.getchannel('A'),dtype=np.float32)
 inside=np.uint8(aa>=128)
 inward=cv2.distanceTransform(inside,cv2.DIST_L2,cv2.DIST_MASK_PRECISE)
 width=8.0 if name=='8k' else 4.0
 falloff=np.clip(inward/width,0.0,1.0)
 falloff=falloff*falloff*(3.0-2.0*falloff)
 alphaGradient=np.uint8(np.rint(aa*falloff))
 fitted.putalpha(Image.fromarray(alphaGradient,'L'))
 # Source-photo RGB must extend beyond the transparent alpha fringe.
 # Otherwise WebP mipmap/color filtering mixes near-black invisible texels
 # into the antialiased mountain ridge, creating the user's dark edge line.
 # Nearest opaque mountain RGB is propagated into transparent texels while
 # leaving existing alpha values AND all opaque pixels unchanged.
 data=np.array(fitted,dtype=np.uint8)
 opaque=data[:,:,3]>=250
 assert opaque.any()
 nearest=distance_transform_edt(~opaque,return_distances=False,return_indices=True)
 outside=~opaque
 donor=data[nearest[0][outside],nearest[1][outside],:3]
 data[outside,:3]=donor
 fitted=Image.fromarray(data,'RGBA')
 dest=assets/f'approved-alpine-midground-{name}.webp'
 assert dest.is_file()
 old=hashlib.sha256(dest.read_bytes()).hexdigest()
 # Atomic replacement, leave all unrelated images untouched.
 temp=assets/f'.approved-alpine-midground-{name}.tmp.webp'
 assert not temp.exists()
 fitted.save(temp,format='WEBP',quality=quality,method=5,exact=True)
 with Image.open(temp) as chk:
  assert chk.size==size
  a=np.asarray(chk.convert('RGBA').getchannel('A'))
  assert (a[0]==0).all() and a.max()>200
 temp.replace(dest)
 print('UPDATED',dest,'bytes',dest.stat().st_size,'previous_sha',old,'alpha_bbox',fitted.getchannel('A').getbbox(),flush=True)
temp=assets/'.approved-alpine-mountains-source.tmp.png'
assert not temp.exists()
canvas_original.save(temp,format='PNG')
temp.replace(target_orig)
print('UPDATED SOURCE',target_orig,'size',target_orig.stat().st_size)
# Do not generate another project folder or persist extra source versions.
print('READY single canonical source PNG + desktop/mobile WebP. Refresh the loader URL version manually after running.')
