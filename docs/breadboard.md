# Scoot — breadboard prototype (stage 1)

Prove the keyboard-and-mouse **core** on a breadboard before committing to a PCB — dev modules + jumper wires, nothing permanent, ~$30. The final PCB swaps in the bare chips ([docs/schematic.md](schematic.md)); the firmware is identical (same RP2040).

**Stage it:** skip the USB hub and USB-A dongle for now — plug the Pico straight into your PC. Prove the core first, add the hub later, *then* lay out the PCB.

## Parts

| Qty | Part | Note |
| --- | --- | --- |
| 1 | Raspberry Pi Pico (H, with headers) | same RP2040 as the final board |
| 1 | MCP23017 breakout | the IO expander |
| 1 | PMW3360 motion-sensor breakout | lens fitted |
| 1 | EC11 rotary encoder | left / media |
| 1 | EVQVYA001 roller (or a 2nd EC11) | scroll |
| ~8 | MX / tactile switches | test keys |
| ~10 | 1N4148 diodes | one per test key |
| 2 | 4.7 kΩ resistors | I²C pull-ups |
| 1–2 | solderless breadboard + jumper wires | M-M and M-F |
| 1 | USB cable for the Pico | data, not charge-only |

## Wiring

Power everything from the Pico's **3V3 (OUT)** → breadboard **+ rail**, and **GND** → **− rail**.

**Pico (RP2040)**

| Pico pin | → | Net |
| --- | --- | --- |
| GP14 / GP15 / GP8 / GP9 | → | sensor SCLK / MOSI / MISO / NCS (SPI) |
| GP18 / GP19 | → | expander SDA / SCL (I²C) |
| GP4 / GP5 | → | EC11 A / B |
| GP26 / GP27 | → | roller A / B |
| GP0–GP3 | → | left matrix rows (start GP0, GP1) |
| GP6, GP7, GP10–GP13 | → | left matrix cols (start GP6, GP7) |
| 3V3(OUT) / GND | → | + rail / − rail |

**MCP23017 (expander)**

| Pin | → |
| --- | --- |
| VDD / VSS | + rail / − rail |
| SDA / SCL | Pico GP18 / GP19 |
| A0, A1, A2 | GND (I²C address 0x20) |
| RESET | 3V3 (tie high) |
| GPB0–3 | right matrix rows |
| GPA0–5 | right matrix cols |

Add **4.7 kΩ** from SDA→3V3 and SCL→3V3 (I²C pull-ups).

**PMW3360 breakout**

| Pin | → |
| --- | --- |
| VCC / GND | + rail / − rail |
| SCLK / MOSI / MISO / NCS | Pico GP14 / GP15 / GP8 / GP9 |
| MOT | leave unconnected |

**Encoders**

| Pin | → |
| --- | --- |
| EC11 A / B / C | Pico GP4 / GP5 / GND |
| Roller A / B / C | Pico GP26 / GP27 / GND |

**Test matrices** (2×2 each side to start)

- Left: rows → GP0, GP1 · cols → GP6, GP7
- Right: rows → MCP GPB0, GPB1 · cols → MCP GPA0, GPA1
- Each key: `col → switch → diode → row`, diode **banded end toward the row** (COL2ROW).

## Build in 5 stages

1. **Power rails** — 3V3/GND rails, Pico on USB. *Verify: Pico enumerates on your PC.*
2. **Expander + one key** — wire the MCP23017 + one switch/diode on GPA0/GPB0. *Verify: that key registers (matrix-over-I²C works).*
3. **Sensor** — wire the PMW3360 (power + 4 SPI lines). *Verify: cursor moves when you slide a surface under the lens.*
4. **Encoders** — EC11 → volume, roller → scroll. *Verify: each does the right thing.*
5. **Expand + mouse-mode** — more keys both sides; load the real keymap with hold-to-mouse. *Verify: typing works, and the thumb-hold turns the right keys into mouse clicks.*

Firmware: a QMK build with a **custom matrix** (reads the Pico's direct pins + the MCP23017 over I²C), the **PMW3360 pointing driver**, and the **hold-to-mouse** layer. That sketch is the next software step.
