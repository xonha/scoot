// SPDX-License-Identifier: MIT
//
// Scoot — Panasonic EVQWGD001 roller / scroll-wheel encoder footprint
//
// Our own footprint for the EVQWGD001 (the roller the Scoot design uses). The pad LAND
// PATTERN (mm positions/sizes) is the one KiCad ships as
// "RollerEncoder_Panasonic_EVQWGD001" — a datasheet-derived land pattern; only those
// dimensions are reused here. This file is original ergogen code, MIT.
//
// Pinout (https://github.com/rroels/EVQWGD001-Pinout + the datasheet):
//   A = encoder channel A   -> a GPIO
//   B = encoder channel B   -> a GPIO
//   C, D = common           -> GND
//   S1, S2 = the wheel's momentary click switch (leave unset if unused; else S1 -> GPIO,
//            S2 -> GND). rroels only characterises the 3 rotation pins, so verify C/D and
//            S1/S2 against your physical part before wiring.
//
// So a working scroll needs only 2 GPIO (A, B) + GND — one fewer than an EC11 (no separate
// common/2nd channel), and the click (if wired) is a 3rd.
//
// NOTE: the scroll wheel protrudes past the board's RIGHT edge; the real part needs an
// Edge.Cuts slot there. It is intentionally NOT emitted here (it would punch a slot wherever
// the footprint lands) — add it to the board outline once the placement is final.
//
// STATUS: single-side (F). Positions are the datasheet land pattern — verify against the
// physical part before fab. Reversible variant is a later step.

module.exports = {
  params: {
    designator: "RE",
    side: "F",
    A: { type: "net", value: "RE_A" },
    B: { type: "net", value: "RE_B" },
    C: { type: "net", value: "GND" },
    D: { type: "net", value: "GND" },
    S1: { type: "net", value: "" },
    S2: { type: "net", value: "" },
  },
  body: (p) => {
    const pad = (name, net, x, y) => `
    (pad "${name}" thru_hole circle (at ${x} ${y} ${p.r}) (size 1.6 1.6) (drill 0.9) (layers "*.Cu" "*.Mask") ${net})`;

    const silk = p.side + ".SilkS";
    return `
  (footprint "xonha:roller_encoder_evqwgd001"
    (layer "${p.side}.Cu")
    ${p.at}
    (property "Reference" "${p.ref}" (at 0 0 ${p.r}) (layer "${silk}") ${p.ref_hide}
      (effects (font (size 1 1) (thickness 0.15))))
    (attr through_hole)

    ${"" /* body outline */}
    (fp_line (start -8.4 -6.4) (end 8.4 -6.4) (layer "Dwgs.User") (stroke (width 0.12) (type solid)))
    (fp_line (start -8.4 7.4) (end -8.4 -6.4) (layer "Dwgs.User") (stroke (width 0.12) (type solid)))
    (fp_line (start 8.4 -6.4) (end 8.4 7.4) (layer "Dwgs.User") (stroke (width 0.12) (type solid)))
    (fp_line (start 8.4 7.4) (end -8.4 7.4) (layer "Dwgs.User") (stroke (width 0.12) (type solid)))

    ${"" /* silkscreen (open on the terminal side) */}
    (fp_line (start -8.5 -6.5) (end -8.5 -4.5) (layer "${silk}") (stroke (width 0.2) (type solid)))
    (fp_line (start -8.5 5.5) (end -8.5 7.5) (layer "${silk}") (stroke (width 0.2) (type solid)))
    (fp_line (start -8.5 7.5) (end 6.9 7.5) (layer "${silk}") (stroke (width 0.2) (type solid)))
    (fp_line (start -7.9 -6.5) (end -8.5 -6.5) (layer "${silk}") (stroke (width 0.2) (type solid)))
    (fp_line (start 6.9 -6.5) (end -4 -6.5) (layer "${silk}") (stroke (width 0.2) (type solid)))

    ${"" /* non-plated mounting hole */}
    (pad "" np_thru_hole circle (at -5.625 6.3 ${p.r}) (size 1.5 1.5) (drill 1.5) (layers "*.Cu" "*.Mask"))

    ${"" /* encoder + switch terminals */}${pad("A", p.A.str, -5.625, -3.81)}${pad("B", p.B.str, -5.625, -1.27)}${pad("C", p.C.str, -5.625, 1.27)}${pad("D", p.D.str, -5.625, 3.81)}${pad("S1", p.S1.str, -6.85, -6.2)}${pad("S2", p.S2.str, -5, -6.2)}
  )`;
  },
};
