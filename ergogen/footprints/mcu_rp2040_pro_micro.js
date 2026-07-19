// SPDX-License-Identifier: MIT
//
// Scoot — RP2040 "Pro Micro" (Tenstar / generic) MCU footprint
//
// The controller Scoot uses, one per half. See ../../docs/mcu.md for the pinout and the
// 28-usable-GPIO derivation. This is our own footprint (the ceoloide library has nice!nano /
// SuperMini, but not this 28-pad RP2040 Pro Micro), so it lives in footprints/ (versioned,
// alongside the git-ignored ceoloide/ fetch). Licensed MIT — written from the pinout, not
// derived from ceoloide's CC-BY-NC-SA MCU footprints.
//
// STATUS: v1 — NON-REVERSIBLE. The two main side columns use the standard Pro Micro geometry
// (2.54 mm pitch, columns at x = ±7.62 mm) and are reliable. The bottom row (GP12–GP16) and
// the center pads (GP18/GP24/GP25) are placed at PROVISIONAL positions — this module has no
// public mechanical drawing, so verify these against the physical board (calipers) before
// fabricating. Reversible jumpers come in a later step; see docs/mcu.md.
//
// Pads exposed: 28 usable GPIO + RAW(5V) + VCC(3V3) + GND + RST. GP17 (on-board LED) and GP19
// (VBUS detect) have no pad and are intentionally absent.

module.exports = {
  params: {
    designator: 'MCU',
    side: 'F',
    reversible: false, // TODO(5b-ii): add reversible jumper option (see mcu_nice_nano.js)
    show_labels: true,

    // one net per exposed pin; defaults to a net named after the pin
    GP0:  { type: 'net', value: 'GP0'  },
    GP1:  { type: 'net', value: 'GP1'  },
    GP2:  { type: 'net', value: 'GP2'  },
    GP3:  { type: 'net', value: 'GP3'  },
    GP4:  { type: 'net', value: 'GP4'  },
    GP5:  { type: 'net', value: 'GP5'  },
    GP6:  { type: 'net', value: 'GP6'  },
    GP7:  { type: 'net', value: 'GP7'  },
    GP8:  { type: 'net', value: 'GP8'  },
    GP9:  { type: 'net', value: 'GP9'  },
    GP10: { type: 'net', value: 'GP10' },
    GP11: { type: 'net', value: 'GP11' },
    GP12: { type: 'net', value: 'GP12' },
    GP13: { type: 'net', value: 'GP13' },
    GP14: { type: 'net', value: 'GP14' },
    GP15: { type: 'net', value: 'GP15' },
    GP16: { type: 'net', value: 'GP16' },
    GP18: { type: 'net', value: 'GP18' },
    GP20: { type: 'net', value: 'GP20' },
    GP21: { type: 'net', value: 'GP21' },
    GP22: { type: 'net', value: 'GP22' },
    GP23: { type: 'net', value: 'GP23' },
    GP24: { type: 'net', value: 'GP24' },
    GP25: { type: 'net', value: 'GP25' },
    GP26: { type: 'net', value: 'GP26' },
    GP27: { type: 'net', value: 'GP27' },
    GP28: { type: 'net', value: 'GP28' },
    GP29: { type: 'net', value: 'GP29' },
    RAW:  { type: 'net', value: 'RAW'  }, // 5V pad
    VCC:  { type: 'net', value: 'VCC'  }, // 3V3 pad
    GND:  { type: 'net', value: 'GND'  },
    RST:  { type: 'net', value: 'RST'  },
  },
  body: p => {
    const PITCH = 2.54
    const COL_X = 7.62      // standard Pro Micro half-spacing (columns 15.24 mm apart)
    const TOP_Y = -12.7     // row 0 y; 13 rows run downward from here

    // Physical top→bottom order of each side column (13 rows), per docs/mcu.md.
    const left_col  = ['GP10','GP0','GP1','GND','GND','GP2','GP3','GP4','GP5','GP6','GP7','GP8','GP9']
    const right_col = ['GP11','RAW','GND','RST','VCC','GP29','GP28','GP27','GP26','GP22','GP20','GP23','GP21']

    // Build the pad list: {pin, x, y}. `pin` is the param/net name (GND repeats — same net).
    const pads = []
    left_col.forEach((pin, i)  => pads.push({ pin, x: -COL_X, y: TOP_Y + i * PITCH }))
    right_col.forEach((pin, i) => pads.push({ pin, x:  COL_X, y: TOP_Y + i * PITCH }))

    // --- PROVISIONAL positions below — verify against the physical module before fab ---
    // Bottom row GP12–GP16 (5 pads, left→right), one pitch below the last side row.
    const BOTTOM_Y = TOP_Y + 13 * PITCH // 20.32
    ;['GP12','GP13','GP14','GP15','GP16'].forEach((pin, i) =>
      pads.push({ pin, x: -2 * PITCH + i * PITCH, y: BOTTOM_Y }))
    // Center inset pads: GP18/GP24 a pair, GP25 isolated below them.
    pads.push({ pin: 'GP18', x: -PITCH / 2, y: 2.54 })
    pads.push({ pin: 'GP24', x:  PITCH / 2, y: 2.54 })
    pads.push({ pin: 'GP25', x: 0,          y: 5.08 })
    // --- end provisional ---

    const pad_str = pads.map((pd, idx) => `
    (pad "${idx + 1}" thru_hole circle (at ${pd.x} ${pd.y} ${p.r}) (size 1.7 1.7) (drill 1) (layers "*.Cu" "*.Mask") ${p[pd.pin].str})`).join('')

    const label_str = p.show_labels ? pads.map(pd => `
    (fp_text user "${pd.pin}" (at ${pd.x} ${pd.y - 1.1} ${p.r}) (layer "F.Fab")
      (effects (font (size 0.5 0.5) (thickness 0.08))))`).join('') : ''

    // Provisional body outline (Dwgs.User) — rough bounding box of the module.
    const HW = 9.0, T = -16.5, B = 22.0
    const outline = `
    (fp_line (start -${HW} ${T}) (end ${HW} ${T}) (layer "Dwgs.User") (stroke (width 0.15) (type solid)))
    (fp_line (start ${HW} ${T}) (end ${HW} ${B}) (layer "Dwgs.User") (stroke (width 0.15) (type solid)))
    (fp_line (start ${HW} ${B}) (end -${HW} ${B}) (layer "Dwgs.User") (stroke (width 0.15) (type solid)))
    (fp_line (start -${HW} ${B}) (end -${HW} ${T}) (layer "Dwgs.User") (stroke (width 0.15) (type solid)))`

    return `
  (footprint "scoot:mcu_rp2040_pro_micro"
    (layer "${p.side}.Cu")
    ${p.at}
    (property "Reference" "${p.ref}" (at 0 -18 ${p.r}) (layer "${p.side}.SilkS") ${p.ref_hide}
      (effects (font (size 1 1) (thickness 0.15))))
    (attr through_hole)
    ${outline}
    ${pad_str}
    ${label_str}
  )`
  }
}
