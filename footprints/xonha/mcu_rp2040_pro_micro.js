// SPDX-License-Identifier: MIT
//
// Scoot — RP2040 "Pro Micro" (Tenstar / MiniPico) MCU footprint
//
// The controller Scoot uses, one per half. See ../../docs/mcu.md for the pinout and the
// 28-usable-GPIO derivation. This is our own footprint (the ceoloide library has nice!nano /
// SuperMini, but not this 28-pad RP2040 Pro Micro), so it lives in footprints/xonha/. Licensed MIT.
//
// The pad LAND PATTERN (mm positions/sizes) is taken from Reinout Roels'
// kicad_pro_micro_rp2040 footprint (https://github.com/rroels/kicad_pro_micro_rp2040, MIT ©
// 2023 Reinout Roels), re-centered so the origin sits at the middle of the pad array (columns
// land at the standard Pro Micro ±7.62 mm). Only the dimensions are reused; the code is ours.
//
// Pads: 28 usable GPIO + RAW(5V) + VCC(3V3) + GND×3 + RST + a broken-out BOOT pad. GP17
// (on-board LED) and GP19 (VBUS detect) have no pad and are intentionally absent.
//
// STATUS: non-reversible (single side). A reversible jumper variant is a later step.

module.exports = {
  params: {
    designator: 'MCU',
    side: 'F',
    reverse_mount: false, // mirror the pinout (components face the PCB, protected)
    show_labels: true,
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
    BOOT: { type: 'net', value: 'BOOT' }, // broken-out BOOTSEL pad
  },
  body: p => {
    // Re-center rroels' coordinates (pad-array center) onto the footprint origin.
    // reverse_mount mirrors X, so the module sits component-side-down (pinout flips L<->R).
    const CX = 8.87, CY = -16.5, mx = p.reverse_mount ? -1 : 1

    // [param key, raw x, raw y, pad size]  (raw coords from rroels' kicad_pro_micro_rp2040)
    const pads = [
      // left column (top -> bottom)
      ['GP10', 1.30, -31.74], ['GP0', 1.25, -29.20], ['GP1', 1.25, -26.66],
      ['GND', 1.25, -24.12], ['GND', 1.25, -21.58], ['GP2', 1.25, -19.04],
      ['GP3', 1.25, -16.50], ['GP4', 1.25, -13.96], ['GP5', 1.25, -11.42],
      ['GP6', 1.25, -8.88], ['GP7', 1.25, -6.34], ['GP8', 1.25, -3.80], ['GP9', 1.25, -1.26],
      // right column (top -> bottom)
      ['GP11', 16.49, -31.74], ['RAW', 16.49, -29.20], ['GND', 16.49, -26.66],
      ['RST', 16.49, -24.12], ['VCC', 16.49, -21.58], ['GP29', 16.49, -19.04],
      ['GP28', 16.49, -16.50], ['GP27', 16.49, -13.96], ['GP26', 16.49, -11.42],
      ['GP22', 16.49, -8.88], ['GP20', 16.49, -6.34], ['GP23', 16.49, -3.80], ['GP21', 16.49, -1.26],
      // bottom row
      ['GP12', 3.79, -1.26], ['GP13', 6.33, -1.26], ['GP14', 8.87, -1.26],
      ['GP15', 11.41, -1.26], ['GP16', 13.95, -1.26],
      // inner / center pads + BOOT
      ['GP25', 3.79, -3.80],
      ['GP18', 12.01, -15.70, 1.6], ['GP24', 14.00, -15.70, 1.6],
      ['BOOT', 4.00, -24.93],
    ]

    const pad_str = pads.map(([key, x, y, size]) => {
      const s = size || 1.8
      return `
    (pad "${key}" thru_hole circle (at ${(mx * (x - CX)).toFixed(3)} ${(y - CY).toFixed(3)} ${p.r}) (size ${s} ${s}) (drill 0.95) (layers "*.Cu" "*.Mask") ${p[key].str})`
    }).join('')

    const label_str = p.show_labels ? pads.map(([key, x, y]) => `
    (fp_text user "${key}" (at ${(mx * (x - CX)).toFixed(3)} ${(y - CY - 1.0).toFixed(3)} ${p.r}) (layer "F.Fab")
      (effects (font (size 0.5 0.5) (thickness 0.08))))`).join('') : ''

    // module body outline (USB at top, -Y)
    const outline = `
    (fp_line (start -9 -18) (end 9 -18) (layer "Dwgs.User") (stroke (width 0.15) (type solid)))
    (fp_line (start 9 -18) (end 9 17) (layer "Dwgs.User") (stroke (width 0.15) (type solid)))
    (fp_line (start 9 17) (end -9 17) (layer "Dwgs.User") (stroke (width 0.15) (type solid)))
    (fp_line (start -9 17) (end -9 -18) (layer "Dwgs.User") (stroke (width 0.15) (type solid)))`

    return `
  (footprint "xonha:mcu_rp2040_pro_micro"
    (layer "${p.side}.Cu")
    ${p.at}
    (property "Reference" "${p.ref}" (at 0 -19 ${p.r}) (layer "${p.side}.SilkS") ${p.ref_hide}
      (effects (font (size 1 1) (thickness 0.15))))
    (attr through_hole)
    ${outline}
    ${pad_str}
    ${label_str}
  )`
  }
}
