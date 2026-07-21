// SPDX-License-Identifier: MIT
//
// Scoot — mouse-sensor cable connector (JST-SH 1.0 mm, 8-pin, horizontal SMD)
//
// The peripheral (mouse) half reads a PMW3360/PMW3389 breakout locally over SPI. The breakout
// sits on the bottom plate at the glide surface (~10 mm below the main PCB); a short 8-wire
// cable brings its signals up to this connector. Using a cable — instead of soldering the
// breakout onto the PCB — decouples the sensor's Z-height from the board and keeps the crowded
// bottom face (per-key LEDs + MCU) clear. Peripheral-only: on the central build the footprint
// is unpopulated and its pads sit idle. See ../../docs/mcu.md and the README "Decisions".
//
// The pad LAND PATTERN (mm positions/sizes) is the one KiCad ships as
// "JST_SH_SM08B-SRSS-TB_1x08-1MP_P1.00mm_Horizontal" — a datasheet-derived land pattern; only
// those dimensions are reused here. This file is original ergogen code, MIT.
//
// Pinout (this connector, pin 1 marked on silk). Wire the cable to match your breakout:
//   1 GND    2 VCC(3V3)    3 SCLK    4 MOSI    5 MISO    6 NCS    7 MOT    8 RS
// SPI needs only 1-6; MOT (motion interrupt) and RS (sensor reset) are optional — leave the
// nets unset to drop them, they still get pads.
//
// # Reversibility
//
// The board is reversible, so the peripheral half can be built for either hand; the face that
// points down (where the sensor cable lands) swaps with the hand. With reversible: true the
// land is emitted on BOTH faces, mirrored across X and sharing nets (same scheme as the switch
// / LED / MCU footprints) — solder the connector on whichever face is down for your build. The
// mirrored back land reverses pin order in space so a single cable pinout lands on the same
// nets whichever face you populate.

module.exports = {
  params: {
    designator: 'SENSOR',
    side: 'F',
    reversible: false,
    show_labels: true,
    SCLK: { type: 'net', value: 'SCLK' },
    MOSI: { type: 'net', value: 'MOSI' },
    MISO: { type: 'net', value: 'MISO' },
    NCS:  { type: 'net', value: 'NCS'  },
    VCC:  { type: 'net', value: 'VCC'  },
    GND:  { type: 'net', value: 'GND'  },
    MOT:  { type: 'net', value: 'MOT'  },
    RS:   { type: 'net', value: 'RS'   },
  },
  body: p => {
    // pin -> [pad name, net-param key, x on F.Cu]. Signal pads land at y = -2 (datasheet), the
    // two mounting pads (MP) at y = +1.875. Pitch 1.0 mm, pin 1 at x = -3.5.
    const pins = [
      ['1', 'GND',  -3.5],
      ['2', 'VCC',  -2.5],
      ['3', 'SCLK', -1.5],
      ['4', 'MOSI', -0.5],
      ['5', 'MISO',  0.5],
      ['6', 'NCS',   1.5],
      ['7', 'MOT',   2.5],
      ['8', 'RS',    3.5],
    ]

    const pad = (name, x, y, w, h, layer, net, rr) => `
    (pad "${name}" smd roundrect (at ${x.toFixed(3)} ${y.toFixed(3)} ${p.r}) (size ${w} ${h}) (layers "${layer}.Cu" "${layer}.Paste" "${layer}.Mask") (roundrect_rratio ${rr}) ${net})`

    // one full land (8 signal pads + 2 mechanical) on `layer`; sign = -1 mirrors it across X
    const land = (layer, sign) => {
      let s = ''
      pins.forEach(([name, key, x]) => {
        s += pad(name, sign * x, -2, 0.6, 1.55, layer, p[key].str, 0.25)
      })
      s += pad('MP', sign * -4.8, 1.875, 1.2, 1.8, layer, '', 0.208333)
      s += pad('MP', sign *  4.8, 1.875, 1.2, 1.8, layer, '', 0.208333)
      return s
    }

    // body outline (Fab) + a cable-side silk edge + pin-1 marker, per populated face
    const graphics = (layer, sign) => `
    (fp_line (start ${(sign * -5).toFixed(3)} -1.675) (end ${(sign * 5).toFixed(3)} -1.675) (layer "${layer}.Fab") (stroke (width 0.1) (type solid)))
    (fp_line (start ${(sign * -5).toFixed(3)} 2.575) (end ${(sign * 5).toFixed(3)} 2.575) (layer "${layer}.Fab") (stroke (width 0.1) (type solid)))
    (fp_line (start ${(sign * -5).toFixed(3)} -1.675) (end ${(sign * -5).toFixed(3)} 2.575) (layer "${layer}.Fab") (stroke (width 0.1) (type solid)))
    (fp_line (start ${(sign * 5).toFixed(3)} -1.675) (end ${(sign * 5).toFixed(3)} 2.575) (layer "${layer}.Fab") (stroke (width 0.1) (type solid)))
    (fp_line (start ${(sign * -3.94).toFixed(3)} 2.685) (end ${(sign * 3.94).toFixed(3)} 2.685) (layer "${layer}.SilkS") (stroke (width 0.12) (type solid)))
    (fp_line (start ${(sign * -4.6).toFixed(3)} -3.05) (end ${(sign * -3.5).toFixed(3)} -3.05) (layer "${layer}.SilkS") (stroke (width 0.12) (type solid)))
    (fp_line (start ${(sign * -4.05).toFixed(3)} -3.05) (end ${(sign * -4.05).toFixed(3)} -2.1) (layer "${layer}.SilkS") (stroke (width 0.12) (type solid)))`

    // pin-1 dot + function labels (labels only fit stacked, so print them on the cable side)
    const labels = (layer, sign) => {
      if (!p.show_labels) return ''
      let s = `
    (fp_text user "1" (at ${(sign * -4.5).toFixed(3)} -2 ${p.r}) (layer "${layer}.SilkS")
      (effects (font (size 0.5 0.5) (thickness 0.1))${layer === 'B' ? ' (justify mirror)' : ''}))`
      return s
    }

    let content = ''
    if (p.reversible) {
      content = land('F', 1) + land('B', -1) + graphics('F', 1) + graphics('B', -1) + labels('F', 1) + labels('B', -1)
    } else {
      content = land(p.side, 1) + graphics(p.side, 1) + labels(p.side, 1)
    }

    return `
  (footprint "xonha:sensor_connector_jst_sh"
    (layer "${p.side}.Cu")
    ${p.at}
    (property "Reference" "${p.ref}" (at 0 -4.4 ${p.r}) (layer "${p.side}.SilkS") ${p.ref_hide}
      (effects (font (size 1 1) (thickness 0.15))))
    (attr smd)
    ${content}
  )`
  }
}
