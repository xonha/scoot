// SPDX-License-Identifier: MIT
//
// Scoot — RP2040 "Pro Micro" (Tenstar / MiniPico) MCU footprint, reversible ("pretty")
//
// The controller Scoot uses, one per half. See ../../docs/mcu.md for the pinout and the
// 28-usable-GPIO derivation. This is our own footprint (the ceoloide library has nice!nano /
// SuperMini, but not this 28-pad RP2040 Pro Micro), so it lives in footprints/xonha/. MIT.
//
// The pad LAND PATTERN (mm positions/sizes) is taken from Reinout Roels'
// kicad_pro_micro_rp2040 (https://github.com/rroels/kicad_pro_micro_rp2040, MIT © 2023
// Reinout Roels), re-centered so the origin sits at the middle of the pad array (columns land
// at the standard Pro Micro ±7.62 mm).
//
// # Reversibility ("pretty", jumper-based)
//
// One PCB serves both hands: build the MCU on the front for one hand, on the back (flipped)
// for the other. The technique is the "promicro_pretty" solder-jumper scheme popularized by
// @benvallack; the reference implementation we studied is 50an6xy06r6n/keyboard_reversible.pretty
// (MIT © 2021). The code and geometry here are our own.
//
// By default only the 4 power/reset rows get jumpers (only_required_jumpers). Every other row
// is a pure GPIO pair, reversed in firmware (QMK per-hand pin map) — a flipped GPIO pin simply
// lands on the mirror hole, whose net firmware knows about. But the rail rows (GP0/RAW, GP1/GND,
// GND/RST, GND/VCC) mix a GPIO or ground with a power/reset rail; if flipped without a jumper a
// GPIO would short onto 5 V / reset / VCC. So each rail row gets: two socket holes on LOCAL
// nets, two inner vias on the REAL nets, and front/back jumper pads that bridge socket→via
// straight (front build) or crossed (back build). The two back crossover traces run on B.Cu
// offset ±0.9 mm in Y so they pass without shorting.
//
// Set only_required_jumpers: false to jumper ALL main-column rows (like nice!nano's default),
// so every main-column hole always maps to its printed label and the firmware pin map is the
// same on both hands. Costs far more solder joints. Note the bottom row (GP12–16) and center
// pads are NOT part of the column rows, so they stay firmware-reversed / duplicated either way
// (same as nice!nano's extra pins) — so this mode isn't fully "identical firmware" for us.
//
// The center pads (GP18/GP24/GP25) are duplicated on both X sides (same net) when reversible;
// the bottom row (GP12–GP16) is symmetric, so its plain holes work in both orientations.
//
// Params: reverse_mount mirrors X (MCU faces the PCB, components protected). reversible turns
// on the jumper scheme. include_boot / include_gp18 / include_gp24 / include_gp25 drop those pads
// (Scoot drops all four: nothing lands on a center pad, so a reverse-mounted module has no hole
// under its own body). via_size / via_drill size the inner vias. include_traces emits the jumper
// traces.

module.exports = {
  params: {
    designator: 'MCU',
    side: 'F',
    reverse_mount: false,
    reversible: false,
    include_boot: true,
    include_gp18: true,
    include_gp24: true,
    include_gp25: true,
    include_traces: true,
    only_required_jumpers: true,
    show_labels: true,
    via_size: 0.8,
    via_drill: 0.4,
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
    RAW:  { type: 'net', value: 'RAW'  },
    VCC:  { type: 'net', value: 'VCC'  },
    GND:  { type: 'net', value: 'GND'  },
    RST:  { type: 'net', value: 'RST'  },
    BOOT: { type: 'net', value: 'BOOT' },
  },
  body: p => {
    const mx = p.reverse_mount ? -1 : 1
    const fx = x => (mx * x).toFixed(3)

    // [left key, right key] per row, top -> bottom (canonical: reverse_mount = false).
    // Rows 1..4 are the rail rows that need jumpers.
    const rows = [
      ['GP10', 'GP11'],
      ['GP0',  'RAW' ],
      ['GP1',  'GND' ],
      ['GND',  'RST' ],
      ['GND',  'VCC' ],
      ['GP2',  'GP29'],
      ['GP3',  'GP28'],
      ['GP4',  'GP27'],
      ['GP5',  'GP26'],
      ['GP6',  'GP22'],
      ['GP7',  'GP20'],
      ['GP8',  'GP23'],
      ['GP9',  'GP21'],
    ]
    const jump_rows = new Set([1, 2, 3, 4])
    const row_y = i => -15.24 + i * 2.54
    const col_x = (i, side) => (i === 0 && side < 0) ? -7.57 : 7.62 * side // GP10 is inset 0.05

    const socket = (name, x, y, net, size) => `
    (pad "${name}" thru_hole circle (at ${fx(x)} ${y.toFixed(3)} ${p.r}) (size ${size} ${size}) (drill 0.95) (layers "*.Cu" "*.Mask") ${net})`
    const via = (name, x, y, net) => `
    (pad "${name}" thru_hole circle (at ${fx(x)} ${y.toFixed(3)} ${p.r}) (size ${p.via_size} ${p.via_size}) (drill ${p.via_drill}) (layers "*.Cu" "*.Mask") ${net})`
    const jpad = (name, x, y, net, layer) => `
    (pad "${name}" smd rect (at ${fx(x)} ${y.toFixed(3)} ${p.r}) (size 0.7 1.2) (layers "${layer}.Cu" "${layer}.Paste" "${layer}.Mask") ${net})`
    const seg = (x1, y1, x2, y2, layer) => `
  (segment (start ${p.eaxy(mx * x1, y1)}) (end ${p.eaxy(mx * x2, y2)}) (width 0.25) (layer "${layer}.Cu"))`
    // Net/pin labels on BOTH silk sides (mirrored on the back) so they read correctly from
    // whichever face you solder — matches the module's own GPxx silk.
    const silk = (txt, x, y, size = 0.6) => `
    (fp_text user "${txt}" (at ${fx(x)} ${y.toFixed(3)} ${p.r}) (layer "F.SilkS")
      (effects (font (size ${size} ${size}) (thickness 0.1))))
    (fp_text user "${txt}" (at ${fx(x)} ${y.toFixed(3)} ${p.r}) (layer "B.SilkS")
      (effects (font (size ${size} ${size}) (thickness 0.1)) (justify mirror)))`

    let pads = '', labels = '', traces = ''

    rows.forEach(([lk, rk], i) => {
      const y = row_y(i)
      const xl = col_x(i, -1), xr = col_x(i, 1)
      const nl = p[lk].str, nr = p[rk].str
      const jumpered = p.reversible && (jump_rows.has(i) || !p.only_required_jumpers)

      if (!jumpered) {
        // Plain GPIO / top row: sockets carry the real nets (firmware handles the flip).
        pads += socket(lk, xl, y, nl, 1.8)
        pads += socket(rk, xr, y, nr, 1.8)
        if (p.show_labels) { labels += silk(lk, xl + 2.2, y, 0.5); labels += silk(rk, xr - 2.2, y, 0.5) }
      } else {
        // Rail row: local-net sockets + real-net vias + jumpers.
        const ll = p.local_net(10 + i).str, lr = p.local_net(30 + i).str
        const sl = `S${i}L`, sr = `S${i}R`, vl = `V${i}L`, vr = `V${i}R`
        pads += socket(sl, xl, y, ll, 1.8)
        pads += socket(sr, xr, y, lr, 1.8)
        pads += via(vl, -3.0, y, nl)
        pads += via(vr, 3.0, y, nr)
        // Front build: straight (socket -> same-side via).
        pads += jpad(sl, -5.2, y, ll, 'F') + jpad(vl, -4.3, y, nl, 'F')
        pads += jpad(sr, 5.2, y, lr, 'F') + jpad(vr, 4.3, y, nr, 'F')
        // Back build: crossed (socket -> opposite via).
        pads += jpad(sl, -5.2, y, ll, 'B') + jpad(vr, -4.3, y, nr, 'B')
        pads += jpad(sr, 5.2, y, lr, 'B') + jpad(vl, 4.3, y, nl, 'B')
        if (p.include_traces) {
          // socket -> jumper (both layers; socket is through-hole)
          traces += seg(xl, y, -5.2, y, 'F') + seg(xl, y, -5.2, y, 'B')
          traces += seg(xr, y, 5.2, y, 'F') + seg(xr, y, 5.2, y, 'B')
          // via -> front (straight) jumper
          traces += seg(-3.0, y, -4.3, y, 'F') + seg(3.0, y, 4.3, y, 'F')
          // via -> back (crossed) jumper, offset in Y so the two crossings clear each
          // other and the opposite via (JLCPCB min copper clearance)
          traces += seg(-3.0, y, -3.0, y + 0.9, 'B') + seg(-3.0, y + 0.9, 4.3, y + 0.9, 'B') + seg(4.3, y + 0.9, 4.3, y, 'B')
          traces += seg(3.0, y, 3.0, y - 0.9, 'B') + seg(3.0, y - 0.9, -4.3, y - 0.9, 'B') + seg(-4.3, y - 0.9, -4.3, y, 'B')
        }
        if (p.show_labels) { labels += silk(lk, -1.8, y, 0.5); labels += silk(rk, 1.8, y, 0.5) }
      }
    })

    // Bottom row (GP12..GP16), symmetric -> plain holes work both orientations.
    const bottom = [['GP12', -5.08], ['GP13', -2.54], ['GP14', 0], ['GP15', 2.54], ['GP16', 5.08]]
    bottom.forEach(([k, x]) => {
      pads += socket(k, x, 15.24, p[k].str, 1.8)
      if (p.show_labels) labels += silk(k, x, 16.4, 0.5)
    })

    // Center / off-axis pads: duplicate on both X sides when reversible.
    const center = []
    if (p.include_gp18) center.push(['GP18', 3.14, 0.80])
    if (p.include_gp24) center.push(['GP24', 5.13, 0.80])
    if (p.include_gp25) center.push(['GP25', 5.08, 12.70]) // canonical -5.08; dup makes side moot
    if (p.include_boot) center.push(['BOOT', 4.87, -8.43])
    center.forEach(([k, x, y]) => {
      const ax = Math.abs(x)
      const xs = p.reversible ? [ax, -ax] : [(k === 'GP25' ? -ax : x)]
      xs.forEach((cx, j) => {
        pads += socket(`${k}${p.reversible ? (j ? 'b' : 'a') : ''}`, cx, y, p[k].str, 1.6)
      })
    })

    // Build instruction, centered in the empty strip. Each face names the hand it's for:
    // front = RIGHT, back = LEFT (convention — flip if it doesn't match your handedness).
    const instr_line = (front, back, y) => `
    (fp_text user "${front}" (at 0 ${y.toFixed(1)} ${p.r}) (layer "F.SilkS")
      (effects (font (size 0.6 0.6) (thickness 0.1))))
    (fp_text user "${back}" (at 0 ${y.toFixed(1)} ${p.r}) (layer "B.SilkS")
      (effects (font (size 0.6 0.6) (thickness 0.1)) (justify mirror)))`
    const instructions = p.reversible
      ? instr_line('SOLDER', 'SOLDER', 4.5)
        + instr_line('JUMPERS IF', 'JUMPERS IF', 5.5)
        + instr_line('RIGHT SIDE', 'LEFT SIDE', 6.5)
      : ''

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
    ${pads}
    ${labels}
    ${instructions}
  )
  ${p.reversible && p.include_traces ? traces : ''}`
  }
}
