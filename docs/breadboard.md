# Scoot — prototype (stage 2)

Prove the **firmware and pointing-over-split** before committing to a custom PCB. The fastest path isn't a breadboard — it's an existing **Corne** (the layout Scoot adopts) plus a bought sensor breakout. A XIAO/RP2040 Corne is already a two-MCU split running QMK, so the keyboard, the split, and the encoders are done; the only new thing to bring up is the mouse sensor.

**What this stage proves:** hold-to-mouse, click remapping, and the PMW3360 reporting from the *secondary* half to the *primary* over the split link.
**What it can't prove:** the physical desk-mouse (lifting/sliding the half, the ~10 mm standoff, glide, re-homing). That waits for the standalone PCB (stage 3).

## Parts

| Qty | Part | Note |
| --- | --- | --- |
| 1 | Corne (XIAO RP2040 preferred, runs QMK; nRF/ZMK works but firmware won't port) | the keyboard + split + encoders, already working |
| 1 | PMW3360 or PMW3389 motion-sensor breakout | lens fitted; AliExpress/Tindie |
| — | thin wire (magnet/silicone) + Dupont jumpers | to wire the sensor to one half |

> If you don't have a Corne yet, a literal breadboard with two RP2040 boards + a sensor breakout works too — but the Corne is cheaper to get running and ergonomically real for the typing side.

## Which half gets the sensor

Mount the sensor on the half **not** connected to USB, and plug USB into the **left**, so left = primary, right = secondary + sensor — mirroring Scoot. In QMK: `SPLIT_POINTING_ENABLE` + `#define POINTING_DEVICE_RIGHT`.

## Wiring the sensor (6 lines)

The sensor talks SPI to the **local** MCU on its half; nothing extra crosses the split cable (the split protocol already carries pointing reports).

| Breakout pin | → | Net |
| --- | --- | --- |
| VI / VCC | → | 3V3 (check module voltage; many regulate 3.3–5 V) |
| GND | → | GND |
| SCLK / MOSI / MISO / NCS | → | four free GPIO on that half's MCU |
| MT (motion) | → | leave unconnected |

**Finding 4 free GPIO:** the OLED header conveniently breaks out VCC/GND/SDA/SCL — repurpose SDA/SCL as two SPI signals (they're just GPIO to the firmware) and take power from the same header. Get the other two from the freed RGB pin and a spare pad. On a XIAO RP2040 you have hardware SPI and a bit more room; SPI clock is low, so bit-banged pins on any GPIO are fine. Keep the wires short (≲10–15 cm).

For testing tracking, just set the breakout lens-down and slide it, or wave a textured surface under the lens — it doesn't need the final standoff to prove it works.

## Build in stages

1. **Baseline** — flash the Corne with your QMK config; confirm both halves type and the encoders work. *Verify: normal split keyboard.*
2. **Sensor** — wire the breakout to the secondary half, enable the pointing device + split pointing. *Verify: sliding a surface under the lens moves the cursor.*
3. **Hold-to-mouse** — add the layer: hold a left thumb key → right finger keys remap to L/R/M click, left modifiers stay live, both rollers stay live. *Verify: typing works, and the thumb-hold turns the right keys into mouse buttons while the sensor drives the cursor.*

Firmware: a QMK build with **`DIRECT_PINS`** (matching Scoot's diodeless wiring — though a stock Corne uses a diode matrix, so you keep its matrix here and only adopt `DIRECT_PINS` on the standalone PCB), the **PMW33xx pointing driver**, **split pointing**, and the **hold-to-mouse** layer. That keymap is what carries forward to the standalone board.
</content>
