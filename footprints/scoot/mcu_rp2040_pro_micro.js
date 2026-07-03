// Copyright (c) 2026 Scoot Keyboard
//
// SPDX-License-Identifier: CC-BY-SA-4.0
//
// Description:
//   A single-side or reversible footprint for an RP2040 "Pro Micro" module
//   (e.g. the generic RP2040 Pro Micro / TENSTAR / Elite-Pi form factor).
//
//   The 24 outer castellated pads use the canonical Pro Micro layout and abstract
//   pin names (RAW, GND, RST, VCC, P0..P21) so the footprint is compatible with ANY
//   Pro-Micro-form-factor RP2040 board. Map these to your board's RP2040 GPIO in
//   firmware. An optional block of 8 extra broken-out GPIO (P100..P107) covers the
//   RP2040's higher pin count — POSITIONS ARE VENDOR-SPECIFIC, verify against your
//   board and adjust the coordinates in `extra_pins` below.
//
//   Pads are THT (plated through-hole), so they connect on both copper layers and
//   the module can be soldered on either face. This footprint is reversible by
//   drawing silkscreen on both sides — it deliberately does NOT use solder jumpers.
//   When the board is flipped to build the mirror half, the physical pin order
//   mirrors left/right; Scoot resolves this in firmware (QMK handedness), per the
//   design in README.md. If you instead need same-net-to-same-pin reversibility
//   handled in copper, use ceoloide/mcu_nice_nano (jumper-based) instead.
//
// Pinout (top view, USB at top, MCU facing away from PCB — reverse_mount = false):
//   Left  (top→bottom): RAW GND RST VCC P21 P20 P19 P18 P15 P14 P16 P10
//   Right (top→bottom): P1  P0  GND GND P2  P3  P4  P5  P6  P7  P8  P9
//   Extra (center 2x4): P100 P101 / P102 P103 / P104 P105 / P106 P107
//
// Params:
//   side: default 'F' — 'F' or 'B', the side the silk/designator primarily reads on.
//   reversible: default false — if true, draw silkscreen on both sides.
//   reverse_mount: default false — if true, the module faces the PCB (pin columns
//     swap left/right so RAW ends up top-right).
//   include_extra_pins: default true — place the 8 extra broken-out GPIO (P100..P107).
//   show_silk_labels: default true — draw the per-pad pin names in silkscreen.
//   RAW/GND/RST/VCC/P0..P21/P100..P107: nets (see pinout above).
//   mcu_3dmodel_filename / _xyz_offset / _xyz_scale / _xyz_rotation: optional 3D model.

module.exports = {
  params: {
    designator: 'MCU',
    side: 'F',
    reversible: false,
    reverse_mount: false,
    include_extra_pins: true,
    show_silk_labels: true,

    RAW: { type: 'net', value: 'RAW' },
    GND: { type: 'net', value: 'GND' },
    RST: { type: 'net', value: 'RST' },
    VCC: { type: 'net', value: 'VCC' },
    P0:  { type: 'net', value: 'P0'  },
    P1:  { type: 'net', value: 'P1'  },
    P2:  { type: 'net', value: 'P2'  },
    P3:  { type: 'net', value: 'P3'  },
    P4:  { type: 'net', value: 'P4'  },
    P5:  { type: 'net', value: 'P5'  },
    P6:  { type: 'net', value: 'P6'  },
    P7:  { type: 'net', value: 'P7'  },
    P8:  { type: 'net', value: 'P8'  },
    P9:  { type: 'net', value: 'P9'  },
    P10: { type: 'net', value: 'P10' },
    P14: { type: 'net', value: 'P14' },
    P15: { type: 'net', value: 'P15' },
    P16: { type: 'net', value: 'P16' },
    P18: { type: 'net', value: 'P18' },
    P19: { type: 'net', value: 'P19' },
    P20: { type: 'net', value: 'P20' },
    P21: { type: 'net', value: 'P21' },
    P100: { type: 'net', value: 'P100' },
    P101: { type: 'net', value: 'P101' },
    P102: { type: 'net', value: 'P102' },
    P103: { type: 'net', value: 'P103' },
    P104: { type: 'net', value: 'P104' },
    P105: { type: 'net', value: 'P105' },
    P106: { type: 'net', value: 'P106' },
    P107: { type: 'net', value: 'P107' },

    mcu_3dmodel_filename: '',
    mcu_3dmodel_xyz_offset: [0, 0, 0],
    mcu_3dmodel_xyz_scale: [1, 1, 1],
    mcu_3dmodel_xyz_rotation: [0, 0, 0],
  },
  body: p => {
    // Canonical Pro Micro layout, vertical (USB at top / -Y).
    const col_left  = ['RAW', 'GND', 'RST', 'VCC', 'P21', 'P20', 'P19', 'P18', 'P15', 'P14', 'P16', 'P10'];
    const col_right = ['P1',  'P0',  'GND', 'GND', 'P2',  'P3',  'P4',  'P5',  'P6',  'P7',  'P8',  'P9'];
    const rows_y = [-13.97, -11.43, -8.89, -6.35, -3.81, -1.27, 1.27, 3.81, 6.35, 8.89, 11.43, 13.97];
    const xL = p.reverse_mount ? 7.62 : -7.62;  // left column X (swaps when MCU faces PCB)
    const xR = -xL;

    const pad = (num, shape, x, y, net) =>
      `(pad "${num}" thru_hole ${shape} (at ${x} ${y} ${p.r}) (size 1.7 1.7) (drill 1) (layers "*.Cu" "*.Mask") ${net})`;

    // Silk label next to a pad, offset toward the board centre, on the given side.
    const label = (name, x, y, side) => {
      if (!p.show_silk_labels) return '';
      const off = x < 0 ? 1.5 : -1.5;                // push text inward
      const mirror = side === 'B' ? ' (justify mirror)' : '';
      return `(fp_text user "${name}" (at ${x + off} ${y} ${p.r}) (layer "${side}.SilkS")` +
        ` (effects (font (size 0.7 0.7) (thickness 0.1))${mirror}))`;
    };

    let pads = '';
    let labels_f = '';
    let labels_b = '';
    let n = 1;
    const emit = (name, x, y) => {
      pads += pad(n, n === 1 ? 'rect' : 'circle', x, y, p[name]) + '\n    ';
      labels_f += label(name, x, y, 'F') + '\n    ';
      if (p.reversible) labels_b += label(name, -x, y, 'B') + '\n    ';
      n++;
    };
    for (let i = 0; i < 12; i++) emit(col_left[i], xL, rows_y[i]);
    for (let i = 0; i < 12; i++) emit(col_right[i], xR, rows_y[i]);

    // Extra broken-out RP2040 GPIO (center 2x4). VENDOR-SPECIFIC — verify positions.
    let extra_pins = '';
    if (p.include_extra_pins) {
      const ex = [
        ['P100', -3.81, -3.81], ['P101', 3.81, -3.81],
        ['P102', -3.81, -1.27], ['P103', 3.81, -1.27],
        ['P104', -3.81,  1.27], ['P105', 3.81,  1.27],
        ['P106', -3.81,  3.81], ['P107', 3.81,  3.81],
      ];
      for (const [name, x, y] of ex) {
        extra_pins += pad(n, 'circle', x, y, p[name]) + '\n    ';
        labels_f += label(name, x, y, 'F') + '\n    ';
        if (p.reversible) labels_b += label(name, -x, y, 'B') + '\n    ';
        n++;
      }
    }

    // Silk outline (both sides when reversible) + USB overhang + pin-1 marker.
    const outline = (side) => `
    (fp_line (start -8.89 -16.51) (end 8.89 -16.51) (layer "${side}.SilkS") (stroke (width 0.15) (type solid)))
    (fp_line (start 8.89 -16.51) (end 8.89 16.51) (layer "${side}.SilkS") (stroke (width 0.15) (type solid)))
    (fp_line (start 8.89 16.51) (end -8.89 16.51) (layer "${side}.SilkS") (stroke (width 0.15) (type solid)))
    (fp_line (start -8.89 16.51) (end -8.89 -16.51) (layer "${side}.SilkS") (stroke (width 0.15) (type solid)))`;

    const pin1 = `(fp_circle (center ${xL - 2.4} -13.97) (end ${xL - 1.9} -13.97) (layer "${p.side}.SilkS") (stroke (width 0.2) (type solid)) (fill none))`;

    const mcu_3dmodel = `
    (model ${p.mcu_3dmodel_filename}
      (offset (xyz ${p.mcu_3dmodel_xyz_offset[0]} ${p.mcu_3dmodel_xyz_offset[1]} ${p.mcu_3dmodel_xyz_offset[2]}))
      (scale (xyz ${p.mcu_3dmodel_xyz_scale[0]} ${p.mcu_3dmodel_xyz_scale[1]} ${p.mcu_3dmodel_xyz_scale[2]}))
      (rotate (xyz ${p.mcu_3dmodel_xyz_rotation[0]} ${p.mcu_3dmodel_xyz_rotation[1]} ${p.mcu_3dmodel_xyz_rotation[2]}))
    )`;

    return `
    (footprint "scoot:mcu_rp2040_pro_micro"
      (layer "${p.side}.Cu")
      ${p.at}
      (property "Reference" "${p.ref}"
        (at 0 0 ${p.r})
        (layer "${p.side}.SilkS")
        ${p.ref_hide}
        (effects (font (size 1 1) (thickness 0.15)))
      )
      (attr through_hole exclude_from_pos_files)

      ${'' /* USB overhang illustration (top edge) */}
      (fp_line (start -3.81 -16.51) (end -3.81 -19.3) (layer "Dwgs.User") (stroke (width 0.15) (type solid)))
      (fp_line (start 3.81 -16.51) (end 3.81 -19.3) (layer "Dwgs.User") (stroke (width 0.15) (type solid)))
      (fp_line (start -3.81 -19.3) (end 3.81 -19.3) (layer "Dwgs.User") (stroke (width 0.15) (type solid)))

      ${outline('F')}
      ${p.reversible ? outline('B') : ''}
      ${pin1}

      ${pads}
      ${extra_pins}
      ${labels_f}
      ${p.reversible ? labels_b : ''}
      ${p.mcu_3dmodel_filename ? mcu_3dmodel : ''}
    )`;
  }
}
