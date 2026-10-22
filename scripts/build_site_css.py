#!/usr/bin/env python3
"""Single deterministic CSS entrypoint, original ordered source kept readable."""
from pathlib import Path
r=Path(__file__).resolve().parents[1]
files=['style.css','liquid-glass.css','scene-polish.css','apple-glass.css','water-garden.css','team-readable.css','stillwater-integration.css','site-design.css']
s='/* GENERATED — do not hand-edit. Change site-design.css. */\n'
for name in files:s+='\n/* '+name+' */\n'+(r/name).read_text()+'\n'
(r/'site-unified.css').write_text(s.rstrip()+'\n')
print('Built unified CSS from',len(files),'source modules')
