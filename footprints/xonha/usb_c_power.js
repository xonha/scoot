// SPDX-License-Identifier: MIT
//
// Scoot — USB-C power-only receptacle (TYPE-C-31-M-17)
//
// The tether connector (one per half). USB-C is used for ruggedness + reversibility, NOT USB
// data — it carries 5 V, GND, and the UART line. This is the 6-contact power-only receptacle
// (VBUS, GND, CC1, CC2) plus 4 through-hole shield/mounting tabs.
//
// The pad LAND PATTERN (mm positions/sizes) is taken from jenschr/USB-C-Connectors
// (TYPE-C-31-M-17_handsolder.kicad_mod, Unlicense / public domain). Only the dimensions are
// reused; this ergogen code is ours, MIT.
//
// Tether wiring (see README): VBUS -> 5 V, GND -> GND, and tie CC1 + CC2 to the single-wire
// half-duplex UART so it works in both plug orientations (reversible). SHIELD -> GND.
//
// NOTE: the receptacle opening faces the board edge (cable plugs in from outside). Place it at
// the edge; the Edge.Cuts opening is not emitted here (add to the outline once placement is
// final). Single-side (F).

module.exports = {
  params: {
    designator: 'J',
    side: 'F',
    VBUS:   { type: 'net', value: 'VBUS' },
    GND:    { type: 'net', value: 'GND' },
    CC1:    { type: 'net', value: 'CC1' },
    CC2:    { type: 'net', value: 'CC2' },
    SHIELD: { type: 'net', value: 'GND' }, // 4 mounting tabs
  },
  body: p => {
    const smd = (name, net, x, y, w) => `
    (pad "${name}" smd rect (at ${x} ${y} ${p.r}) (size ${w} 2.2) (layers "${p.side}.Cu" "${p.side}.Paste" "${p.side}.Mask") ${net})`
    const tab = (net, x, y) => `
    (pad "SH" thru_hole roundrect (at ${x} ${y} ${p.r}) (size 1 1.6) (drill oval 0.6 1.2) (layers "*.Cu" "*.Mask") (roundrect_rratio 0.25) ${net})`

    return `
  (footprint "xonha:usb_c_power"
    (layer "${p.side}.Cu")
    ${p.at}
    (property "Reference" "${p.ref}" (at 0 3.2 ${p.r}) (layer "${p.side}.SilkS") ${p.ref_hide}
      (effects (font (size 1 1) (thickness 0.15))))
    (attr through_hole)

    ${''/* body outline (receptacle opening faces -Y / the board edge) */}
    (fp_line (start -5 -4.6) (end 5 -4.6) (layer "Dwgs.User") (stroke (width 0.12) (type solid)))
    (fp_line (start 5 -4.6) (end 5 2.3) (layer "Dwgs.User") (stroke (width 0.12) (type solid)))
    (fp_line (start 5 2.3) (end -5 2.3) (layer "Dwgs.User") (stroke (width 0.12) (type solid)))
    (fp_line (start -5 2.3) (end -5 -4.6) (layer "Dwgs.User") (stroke (width 0.12) (type solid)))

    ${''/* SMD contacts (front row) */}${smd('A12', p.GND.str, 2.75, -4.30, 0.8)}${smd('B12', p.GND.str, -2.75, -4.30, 0.8)}${smd('A9', p.VBUS.str, 1.52, -4.30, 0.7)}${smd('B9', p.VBUS.str, -1.52, -4.30, 0.7)}${smd('A5', p.CC1.str, -0.50, -4.30, 0.7)}${smd('B5', p.CC2.str, 0.50, -4.30, 0.7)}

    ${''/* shield / mounting tabs */}${tab(p.SHIELD.str, -4.32, -3.80)}${tab(p.SHIELD.str, -4.32, 0.00)}${tab(p.SHIELD.str, 4.32, -3.80)}${tab(p.SHIELD.str, 4.32, 0.00)}
  )`
  }
}
