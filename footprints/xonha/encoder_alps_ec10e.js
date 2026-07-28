// SPDX-License-Identifier: MIT
//
// Scoot — Alps Alpine EC10E "through shaft" encoder footprint (mouse-style scroll wheel)
//
// The EC10E is a HORIZONTAL-axis hollow-shaft encoder: the shaft runs *parallel* to the PCB,
// so a wheel mounted on it scrolls up/down like a mouse wheel. This is the whole reason it is
// here instead of an EC11/EC12, whose shaft is perpendicular to the board (a knob you twist).
// Alps calls this "Control part orientation: Horizontal" in the catalog product list.
//
// SOURCE — Alps Alpine catalog, "Encoders / Through shaft Encoder / EC10E Series",
// pages D-23..D-25, Update:2510, Drawing No.1. Every dimension below is read off that
// catalog's "Mounting Hole Dimensions" and "Dimensions" drawings; nothing is inferred except
// where marked. The catalog's own Note 1 says: "This catalog shows only outline
// specifications. When using the products, please obtain formal specifications for supply."
//
// # One footprint, five part numbers
//
//   Part no.        Detent torque   Mount height H   Detents   Pulses
//   EC10E1220505    5±3 mN·m        7.0 mm           24        12
//   EC10E1220501    5±3 mN·m        9.0 mm           24        12
//   EC10E1220503    5±3 mN·m        11.0 mm          24        12
//   EC10E1260502    6±3 mN·m        7.0 mm           12        12
//   EC10E1260507    6±3 mN·m        11.0 mm          24        12
//
// The catalog's five "Mounting Hole Dimensions" drawings are byte-identical bitmaps, and so
// are the five "Dimensions" drawings — the land pattern does not change with H. H is the
// height of the shaft axis above the mounting surface, so it changes the WHEEL geometry and
// the plate cutout, not the PCB. Scoot targets EC10E1220505 (H = 7.0 mm, 24 detents): the
// lowest profile with mouse-standard detent count.
//
// # Land pattern (catalog "Mounting Hole Dimensions", viewed from mounting side, tol. ±0.1)
//
//   3 × o1.0 ±0.05 terminal holes, 2.5 mm pitch (5 mm across all three)
//   2 × 1.8 (+0.1/0) x 2.1 (+0.1/0) rectangular mounting-lug holes, 10.8 mm apart
//   The lug row sits 2 mm from the terminal row; both rows are centred on the part axis.
//
// Origin here = the CENTRE terminal hole (pin B), the one feature you can measure directly.
// -Y points toward the mounting-lug row (so the KiCad view matches the catalog drawing).
//
// # Terminals — read this before assigning nets
//
// The catalog labels the terminals A B C across the part and defines only two of them:
// "A: Output signal A", "B: Output signal B". C is left undefined, so C is the COMMON by
// elimination. Note what that means: **the common is an END terminal, not the middle one.**
// That is the opposite of an EC11, where the common is in the centre. Confirm it with a
// meter on the physical part before fab (rotate the wheel and find the terminal that shows
// continuity to both others) — if the common turns out to be the middle pin, the net map and
// the reversibility scheme below both change.
//
// # ⚠️ Reversibility is NOT free on this part
//
// All pads are THT, so the holes serve either face — but mirroring the board reverses the
// terminal order, which moves the END terminals into each other's holes. Because one end is
// the COMMON, a flipped build lands GND on a signal hole and a signal on GND. Unlike the
// EC11 (common in the middle, so mirroring only swaps the two phases and merely reverses
// scroll direction — a firmware fix), here it is a hard net error that firmware cannot
// repair. Options:
//
//   1. Solder jumpers on the two end holes, each selecting {signal, GND} per build. Same
//      technique the MCU footprint already uses for its rail rows. Costs 4 jumper pads.
//   2. Fix the encoder to one handedness and populate it on that build only — cheap, but it
//      gives up the "peripheral can be either hand" property for this component.
//
// This footprint does NOT emit the jumper field yet; pick an option first.
//
// # Notes
//
// - The wheel is NOT part of this component. The catalog shows "Shaft insert →": the shaft is
//   hollow (o2.2 bore, 1.73 across-flats hex socket, o2.98 boss) and you supply the shaft and
//   wheel. A dead mouse is the cheapest source of both. "Shaft hole position will be at
//   random" per the catalog, so the hex angle cannot be used to index a wheel.
// - Scroll direction runs along X (the terminal row). The shaft axis runs along Y, through the
//   part's short 4.4 mm dimension. Rotate the placement so X points the way your finger
//   travels.
// - No Edge.Cuts slot: the wheel rises above the board and exits through the plate, unlike the
//   EVQWGD001 roller, which had to breach the board edge.
// - Body is 9.8 mm (X) × 4.4 mm (Y) per the catalog. Its Y position relative to the hole rows
//   is NOT dimensioned there, so the silkscreen rectangle is DERIVED (centred on the two
//   rows) — treat it as a placement guide, not a spec.
//
// STATUS: land pattern and terminal geometry taken from the catalog drawing and safe to route.
// Unverified against a physical part: which end terminal is the common (see above), and the
// silkscreen body offset. Print at 1:1 and drop the part on it before committing to fab.

module.exports = {
  params: {
    designator: 'RE',
    side: 'F',
    reversible: false,
    include_silkscreen: true,
    include_plated_mounting_holes: true,
    // Land pattern — catalog Drawing No.1, "Mounting Hole Dimensions"
    terminal_pitch: 2.5,            // 5 mm across three holes
    terminal_drill: 1.0,            // o1.0 ±0.05 specified for the hole
    terminal_pad: 1.7,              // pad diameter (annular ring, not from catalog)
    mounting_holes_position: 5.4,   // 10.8 mm apart, so ±5.4 from the axis
    mounting_holes_offset: 2.0,     // lug row to terminal row
    mounting_hole_width: 1.8,       // +0.1/0
    mounting_hole_height: 2.1,      // +0.1/0
    // Body, for silkscreen only
    body_width: 9.8,
    body_depth: 4.4,
    A: { type: 'net', value: 'RE_A' },  // Output signal A   (end terminal)
    B: { type: 'net', value: 'RE_B' },  // Output signal B   (centre terminal)
    C: { type: 'net', value: 'GND' },   // common, by elimination — VERIFY
  },
  body: (p) => {
    const pitch = p.terminal_pitch
    const lug_y = -p.mounting_holes_offset
    const silk_sides = p.reversible ? ['F', 'B'] : [p.side]

    const term = (name, net, x) => `
    (pad "${name}" thru_hole circle (at ${x} 0 ${p.r}) (size ${p.terminal_pad} ${p.terminal_pad}) (drill ${p.terminal_drill}) (layers "*.Cu" "*.Mask") ${net})`

    const lug = (name, x) => p.include_plated_mounting_holes
      ? `
    (pad "${name}" thru_hole oval (at ${x} ${lug_y} ${p.r}) (size ${p.mounting_hole_width + 0.6} ${p.mounting_hole_height + 0.6}) (drill oval ${p.mounting_hole_width} ${p.mounting_hole_height}) (layers "*.Cu" "*.Mask"))`
      : `
    (pad "" np_thru_hole oval (at ${x} ${lug_y} ${p.r}) (size ${p.mounting_hole_width} ${p.mounting_hole_height}) (drill oval ${p.mounting_hole_width} ${p.mounting_hole_height}) (layers "*.Cu" "*.Mask"))`

    // Body rectangle: X is dimensioned (9.8), Y centring is derived — see header.
    const x0 = -p.body_width / 2, x1 = p.body_width / 2
    const yc = lug_y / 2
    const y0 = yc - p.body_depth / 2, y1 = yc + p.body_depth / 2

    const line = (x1_, y1_, x2_, y2_, layer) => `
    (fp_line (start ${x1_} ${y1_}) (end ${x2_} ${y2_}) (layer "${layer}") (stroke (width 0.15) (type solid)))`

    const outline = (layer) =>
      line(x0, y0, x1, y0, layer) + line(x1, y0, x1, y1, layer) +
      line(x1, y1, x0, y1, layer) + line(x0, y1, x0, y0, layer)

    const text = (txt, x, y, layer, size = 0.5) => `
    (fp_text user "${txt}" (at ${x} ${y} ${p.r}) (layer "${layer}")
      (effects (font (size ${size} ${size}) (thickness 0.1))${layer.startsWith('B') ? ' (justify mirror)' : ''}))`

    let silk = ''
    if (p.include_silkscreen) {
      for (const s of silk_sides) {
        const layer = s + '.SilkS'
        silk += outline(layer)
        // terminal labels, and a marker for the scroll axis (wheel rolls along X)
        silk += text('A', -pitch, 1.6, layer) + text('B', 0, 1.6, layer) + text('C', pitch, 1.6, layer)
        silk += text('scroll <->', 0, y0 - 0.9, layer, 0.4)
      }
    }

    return `
  (footprint "xonha:encoder_alps_ec10e"
    (layer "${p.side}.Cu")
    ${p.at}
    (property "Reference" "${p.ref}" (at 0 ${lug_y / 2} ${p.r}) (layer "${p.side}.SilkS") ${p.ref_hide}
      (effects (font (size 1 1) (thickness 0.15))))
    (attr through_hole)

    ${'' /* body outline on a doc layer regardless of silkscreen setting */}
    ${outline('Dwgs.User')}
    ${silk}

    ${'' /* 3 terminals: A / B / C across X, 2.5 mm pitch */}
    ${term('A', p.A.str, -pitch)}${term('B', p.B.str, 0)}${term('C', p.C.str, pitch)}

    ${'' /* 2 mounting-lug holes, 10.8 mm apart, on the row 2 mm from the terminals */}
    ${lug('MH1', -p.mounting_holes_position)}${lug('MH2', p.mounting_holes_position)}
  )`
  },
}
