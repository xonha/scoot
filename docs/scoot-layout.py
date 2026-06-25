#!/usr/bin/env python3
"""Scoot physical layout — bare keys, GitHub dark theme, matching the
keymap-drawer reference photo. Outputs docs/scoot-layout.svg."""

PITCH = 72
KEY = 64
RX = 7
MARGIN = 40
TOP = 56

# column vertical stagger (outer pinky -> inner index), in key units,
# measured from the reference photo.
COLOFF = [0.32, 0.32, 0.10, 0.0, 0.19, 0.32]
ROWS = 3
BLOCKW = 5 * PITCH + KEY
GAP = 230
LX = MARGIN
RX0 = LX + BLOCKW + GAP

# thumbs (LEFT frame), outermost first:
# (column_center, y_units_from_TOP, rotation_deg, width_u, height_u)
THUMBS = [
    (3.05, 3.15, 13, 1.0, 1.0),
    (4.05, 3.42, 26, 1.0, 1.0),
    (5.25, 3.88, 40, 1.0, 1.5),   # innermost: longer keycap, set further to the side
]

parts = []
def add(s): parts.append(s)

def cap(cx, cy, rot, w=1.0, h=1.0):
    kw, kh = KEY * w, KEY * h
    add(f'<g transform="rotate({rot} {cx:.1f} {cy:.1f})">'
        f'<rect class="cap" x="{cx-kw/2:.1f}" y="{cy-kh/2:.1f}" '
        f'width="{kw:.1f}" height="{kh:.1f}" rx="{RX}"/></g>')

def finger(origin, mirror):
    for c in range(6):
        for r in range(ROWS):
            cxl = c * PITCH + KEY / 2
            cx = origin + (BLOCKW - cxl if mirror else cxl)
            cy = TOP + (COLOFF[c] + r) * PITCH + KEY / 2
            cap(cx, cy, 0)

def thumbs(origin, mirror):
    for cc, yu, rot, w, h in THUMBS:
        cxl = cc * PITCH + KEY / 2
        cx = origin + (BLOCKW - cxl if mirror else cxl)
        cy = TOP + yu * PITCH + KEY / 2
        cap(cx, cy, -rot if mirror else rot, w, h)

finger(LX, False)
thumbs(LX, False)
finger(RX0, True)
thumbs(RX0, True)

W = RX0 + BLOCKW + MARGIN
maxbottom = max(TOP + yu * PITCH + KEY / 2 + (KEY * h) / 2 + 14 for _, yu, _, _, h in THUMBS)
H = int(maxbottom + 30)

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-label="Scoot physical layout">
<defs>
  <linearGradient id="capg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#262c35"/>
    <stop offset="1" stop-color="#1f242b"/>
  </linearGradient>
</defs>
<style>
  .canvas {{ fill: #0d1117; }}
  .cap {{ fill: url(#capg); stroke: #30363d; stroke-width: 1; }}
</style>
<rect class="canvas" x="0" y="0" width="{W}" height="{H}"/>
{''.join(parts)}
</svg>
'''

out = "/home/henrique/Projects/scoot/docs/scoot-layout.svg"
with open(out, "w") as f:
    f.write(svg)
print("wrote", out, f"({W}x{H})")
