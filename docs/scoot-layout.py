#!/usr/bin/env python3
"""Scoot physical layout — keys plus a roller encoder per half, GitHub dark
theme, matching the keymap-drawer reference photo. Outputs docs/scoot-layout.svg."""

# ---- colors (GitHub dark theme, tuned) ----
BG = "#262c36"  # canvas background
KEY_FILL = "#151b23"  # finger + thumb keys
OUTER_FILL = "#212830"  # outer (detachable) column
STROKE = "#30363d"  # key border

ACCENT_PURPLE = "#946cdc"
ACCENT_GREEN = "#347d39"
ACCENT_RED = "#e35a52"
ACCENT_BLUE = "#478be6"
ACCENT_AMBER = "#c69026"

# ---- geometry ----
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
    (3.883, 3.206, 13, 1.0, 1.0),
    (4.856, 3.530, 26, 1.0, 1.0),
    (5.861, 3.936, 40, 1.0, 1.5),  # innermost: longer keycap, set toward the centre
]

# roller encoder (one per half): a wheel in the inner pocket, beside the
# bottom index key (B / N) and above the innermost thumb. Column-aligned
# with that thumb so it reads as sitting just above it.
ENC_CC = THUMBS[-1][0]  # share the innermost thumb's column centre
ENC_YU = 2.80  # between the bottom finger row and the thumb cluster
ENC_R = KEY * 0.36  # roller radius

parts = []


def add(s):
    parts.append(s)


def cap(cx, cy, rot, w=1.0, h=1.0, fill=KEY_FILL):
    kw, kh = KEY * w, KEY * h
    add(
        f'<g transform="rotate({rot} {cx:.1f} {cy:.1f})">'
        f'<rect class="cap" x="{cx - kw / 2:.1f}" y="{cy - kh / 2:.1f}" '
        f'width="{kw:.1f}" height="{kh:.1f}" rx="{RX}" fill="{fill}"/></g>'
    )


def finger(origin, mirror):
    for c in range(6):
        fill = OUTER_FILL if c == 0 else KEY_FILL
        for r in range(ROWS):
            cxl = c * PITCH + KEY / 2
            cx = origin + (BLOCKW - cxl if mirror else cxl)
            cy = TOP + (COLOFF[c] + r) * PITCH + KEY / 2
            cap(cx, cy, 0, fill=fill)


def thumbs(origin, mirror):
    for cc, yu, rot, w, h in THUMBS:
        cxl = cc * PITCH + KEY / 2
        cx = origin + (BLOCKW - cxl if mirror else cxl)
        cy = TOP + yu * PITCH + KEY / 2
        cap(cx, cy, -rot if mirror else rot, w, h)


def encoder(origin, mirror):
    cxl = ENC_CC * PITCH + KEY / 2
    cx = origin + (BLOCKW - cxl if mirror else cxl)
    cy = TOP + ENC_YU * PITCH + KEY / 2
    add(
        f'<circle class="enc" cx="{cx:.1f}" cy="{cy:.1f}" r="{ENC_R:.1f}" fill="{ACCENT_PURPLE}"/>'
    )
    for dy in (-7, 0, 7):  # tread lines hint at a scroll roller
        add(
            f'<line class="enc-tread" x1="{cx - ENC_R * 0.55:.1f}" y1="{cy + dy}" '
            f'x2="{cx + ENC_R * 0.55:.1f}" y2="{cy + dy}"/>'
        )


finger(LX, False)
thumbs(LX, False)
encoder(LX, False)
finger(RX0, True)
thumbs(RX0, True)
encoder(RX0, True)

W = RX0 + BLOCKW + MARGIN
maxbottom = max(
    TOP + yu * PITCH + KEY / 2 + (KEY * h) / 2 + 14 for _, yu, _, _, h in THUMBS
)
H = int(maxbottom + 26)

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-label="Scoot physical layout">
<style>
  .canvas {{ fill: {BG}; }}
  .cap {{ stroke: {STROKE}; stroke-width: 1; }}
  .enc {{ stroke: {STROKE}; stroke-width: 1; }}
  .enc-tread {{ stroke: rgba(255,255,255,0.35); stroke-width: 2; stroke-linecap: round; }}
</style>
<rect class="canvas" x="0" y="0" width="{W}" height="{H}"/>
{"".join(parts)}
</svg>
'''

out = "/home/henrique/Projects/scoot/docs/scoot-layout.svg"
with open(out, "w") as f:
    f.write(svg)
print("wrote", out, f"({W}x{H})")
