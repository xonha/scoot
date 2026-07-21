// SPDX-License-Identifier: MIT
//
// Scoot — mouse-sensor cable connector (JST-SH 1.0 mm, 1x06, horizontal SMD)
//
// The peripheral (mouse) half reads a PMW3360/PMW3389 breakout locally over SPI. The breakout
// sits on the bottom plate at the glide surface (~10 mm below the main PCB); a short 6-wire
// cable brings its signals up to this connector. Using a cable — instead of soldering the
// breakout onto the PCB — decouples the sensor's Z-height from the board and keeps the crowded
// bottom face (per-key LEDs + MCU) clear. Peripheral-only: on the central build the footprint
// is unpopulated and its pads sit idle. See ../../docs/mcu.md and the README "Decisions".
//
// The pad LAND PATTERN (mm positions/sizes) matches the part KiCad ships as
// "JST_SH_SM06B-SRSS-TB_1x06-1MP_P1.00mm_Horizontal" — a datasheet-derived land pattern; only
// those dimensions are reused here. This file is original ergogen code, MIT.
//
// Pinout (this connector, pin 1 marked on silk). Wire the cable to match your breakout:
//   1 GND   2 VCC(3V3)   3 SCLK   4 MOSI   5 MISO   6 NCS
// SPI + power is everything QMK's PMW33xx driver needs. The sensor's MOT (motion interrupt)
// and RS (reset) lines are intentionally left out — QMK polls motion over SPI and the sensor
// self-resets on power-up, so they add no value on this wired build. If a future revision wants
// them (e.g. a battery/BLE build, where an interrupt-driven motion pin saves power), add a
// sibling 1x08 footprint — GP24/GP25 stay free on the MCU for exactly that.
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
  },
  body: p => {
    // signal pins in order. Pads land at y = -2 (datasheet), pitch 1.0 mm, centered on x = 0.
    // The two mounting pads (MP) sit at y = +1.875.
    const order = ['GND', 'VCC', 'SCLK', 'MOSI', 'MISO', 'NCS']
    const n = order.length
    const half = (n - 1) / 2                // pad half-span in mm (1.0 pitch) = 2.5
    const mpx = half + 1.3                  // mounting-pad offset (±3.8)
    const fabx = half + 1.5                 // body/Fab half-width (±4.0)
    const silkx = half + 0.44               // cable-side silk half-width (±2.94)
    const p1x = half + 1.0                  // pin-1 marker x (left of pin 1) (±3.5)

    const pad = (name, x, y, w, h, layer, net, rr) => `
    (pad "${name}" smd roundrect (at ${x.toFixed(3)} ${y.toFixed(3)} ${p.r}) (size ${w} ${h}) (layers "${layer}.Cu" "${layer}.Paste" "${layer}.Mask") (roundrect_rratio ${rr}) ${net})`

    // one full land (n signal pads + 2 mechanical) on `layer`; sign = -1 mirrors it across X
    const land = (layer, sign) => {
      let s = ''
      for (let i = 0; i < n; i++) {
        const x = -half + i
        s += pad(String(i + 1), sign * x, -2, 0.6, 1.55, layer, p[order[i]].str, 0.25)
      }
      s += pad('MP', sign * -mpx, 1.875, 1.2, 1.8, layer, '', 0.208333)
      s += pad('MP', sign *  mpx, 1.875, 1.2, 1.8, layer, '', 0.208333)
      return s
    }

    // body outline (Fab) + cable-side silk edge + pin-1 tick, per populated face
    const graphics = (layer, sign) => `
    (fp_line (start ${(sign * -fabx).toFixed(3)} -1.675) (end ${(sign * fabx).toFixed(3)} -1.675) (layer "${layer}.Fab") (stroke (width 0.1) (type solid)))
    (fp_line (start ${(sign * -fabx).toFixed(3)} 2.575) (end ${(sign * fabx).toFixed(3)} 2.575) (layer "${layer}.Fab") (stroke (width 0.1) (type solid)))
    (fp_line (start ${(sign * -fabx).toFixed(3)} -1.675) (end ${(sign * -fabx).toFixed(3)} 2.575) (layer "${layer}.Fab") (stroke (width 0.1) (type solid)))
    (fp_line (start ${(sign * fabx).toFixed(3)} -1.675) (end ${(sign * fabx).toFixed(3)} 2.575) (layer "${layer}.Fab") (stroke (width 0.1) (type solid)))
    (fp_line (start ${(sign * -silkx).toFixed(3)} 2.685) (end ${(sign * silkx).toFixed(3)} 2.685) (layer "${layer}.SilkS") (stroke (width 0.12) (type solid)))
    (fp_line (start ${(sign * -(p1x + 0.55)).toFixed(3)} -3.05) (end ${(sign * -p1x).toFixed(3)} -3.05) (layer "${layer}.SilkS") (stroke (width 0.12) (type solid)))
    (fp_line (start ${(sign * -(p1x + 0.05)).toFixed(3)} -3.05) (end ${(sign * -(p1x + 0.05)).toFixed(3)} -2.1) (layer "${layer}.SilkS") (stroke (width 0.12) (type solid)))`

    const labels = (layer, sign) => {
      if (!p.show_labels) return ''
      return `
    (fp_text user "1" (at ${(sign * -p1x).toFixed(3)} -2 ${p.r}) (layer "${layer}.SilkS")
      (effects (font (size 0.5 0.5) (thickness 0.1))${layer === 'B' ? ' (justify mirror)' : ''}))`
    }

    let content = ''
    if (p.reversible) {
      content = land('F', 1) + land('B', -1) + graphics('F', 1) + graphics('B', -1) + labels('F', 1) + labels('B', -1)
    } else {
      content = land(p.side, 1) + graphics(p.side, 1) + labels(p.side, 1)
    }

    return `
  (footprint "xonha:sensor_connector_jst_sh_1x06"
    (layer "${p.side}.Cu")
    ${p.at}
    (property "Reference" "${p.ref}" (at 0 -4.4 ${p.r}) (layer "${p.side}.SilkS") ${p.ref_hide}
      (effects (font (size 1 1) (thickness 0.15))))
    (attr smd)
    ${content}
  )`
  }
}
