#!/usr/bin/env python3
"""Calibrate physical CG ground against multiple photo-ground swatches in sRGB.

References are manually sampled aggregate RGB medians from a supplied screenshot.
The private screenshot itself is NOT committed/published (it contains desktop UI).
In the browser Three.js uses linear sRGB for illumination and ACES for output,
so convert sample colors from display sRGB to linear before estimating ratios.
"""
from __future__ import annotations

import json
from pathlib import Path
from statistics import median

PHOTO = [[88,79,61],[85,76,56],[86,77,55],[72,64,42],[72,65,42],[72,65,42]]
RENDER = [[153,151,108],[156,154,110],[156,155,110],[155,152,106],[154,151,105],[154,150,106]]
# Second pass: photographic grass and rendered ground sampled after first calibration,
# two separate locations on each side (Chrome 1600px public-site frame).
DISPLAY_LEFT_PHOTO = [[108,96,69],[107,94,68]]
DISPLAY_LEFT_GROUND = [[91,85,64],[92,85,64]]
DISPLAY_RIGHT_PHOTO = [[99,87,66],[96,85,64]]
DISPLAY_RIGHT_GROUND = [[97,91,70],[97,92,71]]


def srgb_to_linear(x: float) -> float:
    v = x / 255
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4


def calibration(photograph, cg, visual_headroom: float = 1.12):
    if len(photograph) < 2 or len(photograph) != len(cg):
        raise ValueError('At least two color sample pairs are required')
    correction = []
    for channel in range(3):
        ratios = []
        for target, existing in zip(photograph,cg):
            target_l = srgb_to_linear(target[channel]); existing_l = srgb_to_linear(existing[channel])
            ratios.append(target_l / max(existing_l, 0.001))
        # Median resists distracting grass clumps, contact shadows and isolated labels.
        correction.append(round(max(.12,min(1.4,median(ratios)*visual_headroom)),4))
    return correction


if __name__ == '__main__':
    profile = {
        'schema_version':1,
        'description':'Multi-point HDRI photographed field vs PBR terrain; sRGB-linear robust median with 12% nearfield headroom',
        'sampling_region':'Six separated unoccluded meadow patches spanning both sides of the HDRI and CG meadow',
        'photo_ground_srgb':PHOTO,
        'render_ground_srgb':RENDER,
        'linear_rgb_grade':calibration(PHOTO,RENDER),
        'spatial_grade_left':calibration(DISPLAY_LEFT_PHOTO,DISPLAY_LEFT_GROUND,1.0),
        'spatial_grade_right':calibration(DISPLAY_RIGHT_PHOTO,DISPLAY_RIGHT_GROUND,1.0),
        'spatial_grade_strength':0.50,
        'display_roundtrip_samples':{
          'photo_left':DISPLAY_LEFT_PHOTO, 'ground_left':DISPLAY_LEFT_GROUND,
          'photo_right':DISPLAY_RIGHT_PHOTO, 'ground_right':DISPLAY_RIGHT_GROUND,
        },
        'note':'Aggregated color triples only. The private desktop screenshot is not published.'
    }
    dest = Path(__file__).resolve().parents[1]/'assets/calibration/ground-grade.json'
    dest.write_text(json.dumps(profile,indent=2)+'\n')
    print('linear calibration',profile['linear_rgb_grade'])
    print('spatial left/right',profile['spatial_grade_left'],profile['spatial_grade_right'])
