# MCU — Tenstar RP2040 "Pro Micro"

The controller Scoot uses (one per half): the generic **Tenstar Robot "RP2040 Pro Micro"**
— the cheapest Pro-Micro-shaped RP2040 (~US$3–5 on AliExpress). It is poorly documented,
so this page is the consolidated, cross-checked reference for its real pinout and quirks.

**Source / confirmation:** the facts below are reconciled against the vendor pinout render
and the community survey **[bgkendall/keyboard_mcu_list](https://github.com/bgkendall/keyboard_mcu_list)**
(see its "RP2040 Pro Micro (Tenstar Robot/Generic)" row).

## Pinout (top view, USB at top)

Vendor pinout image, added for reference (source:
[keycapsss.com](https://keycapsss.com/media/da/b2/b3/1762952293/rp2040-pro-micro-controller-16mb-pinout.png)):

![Tenstar RP2040 Pro Micro pinout — the board this project uses](../misc/rp2040-pro-micro-pinout.png)

> **Heads-up — the LED is NOT RGB.** The image labels GP17 as `RGB_LED`, but the on-board
> LED on this module is a **single-color red LED**, not an addressable RGB. It cannot drive
> our SK6812 chain (and GP17 has no exposed pad anyway — see below).

A simplified, function-oriented view of the same board (schematic, not mechanical —
`GP18/GP24` are the center pads, `GP25` sits at the bottom-left, `GP12–GP16` the bottom row):

```
                        ┌───────────────┐
                 BOOT ● │     USB-C     │
                        └───────┬───────┘
      ╔═════════════════════════╪═════════════════════════╗
 GP10 ║ ●10                                           11● ║ GP11
  GP0 ║ ●0                                            5V● ║ 5V  (RAW)
  GP1 ║ ●1                                           GND● ║ GND
  GND ║ ●G                                           RST● ║ RST
  GND ║ ●G                                           3V3● ║ 3V3 (VCC)
  GP2 ║ ●2         ┌─── center pads ───┐              29● ║ GP29 ·ADC3
  GP3 ║ ●3         │  ●GP18    ●GP24   │              28● ║ GP28 ·ADC2
  GP4 ║ ●4         │       ●GP25       │              27● ║ GP27 ·ADC1
  GP5 ║ ●5         └───────────────────┘              26● ║ GP26 ·ADC0
  GP6 ║ ●6                                            22● ║ GP22
  GP7 ║ ●7     GP17 → on-board LED  (NO PAD)          20● ║ GP20
  GP8 ║ ●8     GP19 → VBUS detect   (NO PAD)          23● ║ GP23
  GP9 ║ ●9                                            21● ║ GP21
      ╚═══●12═════●13═════●14═════●15═════●16═════════════╝
          GP12    GP13    GP14    GP15    GP16
```

Legend: `●` = a solderable/socketable THT pad. `GP18/GP24/GP25` are the three **center
pads** (normal pads, not castellated edges — GP25 is the isolated one, GP18/GP24 a pair).
`GP17` and `GP19` are **internal only, no pad** (see below). Positions are schematic, not
mechanical — verify against your physical module before laying out a board.

## Usable GPIO = 28 (not the "26" the listing claims)

The RP2040 has **30 GPIO** (GP0–GP29). This module exposes all but two:

| Pin | State | Why |
| --- | --- | --- |
| **GP17** | no pad | Hard-wired to the on-board LED (a single **red** LED, despite the "RGB" silk — unusable as an addressable-LED data line). |
| **GP19** | no pad | Tied to the on-board **VBUS-detect** circuit. |

So **30 − 2 = 28 usable GPIO.** The AliExpress listing and `keyboard_mcu_list`'s summary
say "26", but that number is wrong — the list's own breakdown (18 + 5 + 2 + 3) sums to 28,
and counting the exposed pads independently also gives 28.

### Where the 28 live

| Group | Pads | GPIO |
| --- | --- | --- |
| Left column | GP10, GP0, GP1, GP2–GP9 | 11 |
| Right column | GP11, GP29, GP28, GP27, GP26, GP22, GP20, GP23, GP21 | 9 |
| Bottom row | GP12, GP13, GP14, GP15, GP16 | 5 |
| Center pads | GP18, GP24, GP25 | 3 |
| **Total** | | **28** |

Power/other pads (not GPIO): `5V` (RAW), `3V3` (VCC), `GND` ×3, `RST`, `BOOT`.
`GP26–GP29` double as ADC0–ADC3.

## Flash — 4 MB is plenty, 16 MB is overkill

The module ships in 4 MB and 16 MB variants. A full QMK build for Scoot (core + split +
RGB Matrix with the whole effect catalog + PMW33xx pointing driver + hold-to-mouse layer)
is well under **~512 KB** — 4 MB leaves 6–8× headroom. QMK keeps no filesystem or large
assets in flash, and flash *size* does not affect XIP speed. **Pick 4 MB** for cost and use
the **same size on both halves**. Bigger only matters for out-of-scope experiments (audio
samples, logging, RMK/ZMK tinkering).

## Boot — no combined reset/boot button

`keyboard_mcu_list` marks this board **`1-Btn. Boot = No`**: it has **two separate on-board
buttons, BOOT and RESET**, so an off-board reset button alone cannot enter the bootloader.

- **First flash:** hold the on-board **BOOT** + tap **RESET** (or hold BOOT while plugging
  USB) → the board mounts as a UF2 drive; drag the `.uf2`.
- **After that:** QMK's `RP2040_BOOTLOADER_DOUBLE_TAP_RESET` (a firmware feature that works
  on any RP2040, independent of this hardware) makes a **double-tap of the reset button**
  enter the bootloader. The `QK_BOOT` keycode also works. → a board-level reset switch is
  worth having; it becomes the day-to-day reflash button.

## VBUS detect — GP19

`keyboard_mcu_list` lists **VBUS Det. = GPIO19** (footnote: undocumented, but the circuitry
is present and reported working). This is *why* GP19 has no pad — it is consumed by the
VBUS-sense circuit. It's a **free feature, not a loss**: QMK's `SPLIT_USB_DETECT` uses it to
auto-pick the primary half (central = VBUS present → primary; peripheral = tether-powered,
no host USB → secondary). If it turns out not to work on a given unit, fall back to
`EE_HANDS` (handedness stored in each half's emulated EEPROM at flash time — costs no pin).

## ⚠️ Quality caveat — verify GP26–GP29

`keyboard_mcu_list` warns that **some Tenstar units ship with mis-placed components that
leave GP26–GP29 non-functional** ("check for misaligned components in product photos").
GP26–GP29 are 4 of the 28 usable pins, so **test them on the physical unit before committing
a board layout** — flash a minimal firmware that toggles/reads each and confirm. If they
fail, that unit can't host a design that needs them; source a good unit rather than
switching module family (alternatives in the list expose *fewer* GPIO, and most don't break
out GP26–GP29 at all).

---

## Resolved Scoot pin assignment

The live assignment lives in the ergogen [`config.yml`](../config.yml) (`mcu` footprint params).
It fits entirely in the module's **25 edge pads**, and the footprint drops the 3 center pads
outright (`include_gp18` / `include_gp24` / `include_gp25` all `false`), so a reverse-mounted
module has no hole under its own body at all:

| Subsystem | GPIO | Pads |
| --- | --- | --- |
| 18 keys, direct to GPIO | GP0–GP16, GP20 | 18 |
| Rotary encoder A/C (scroll only) | GP21, GP22 | 2 |
| UART tether (single-wire half duplex) | GP23 | 1 |
| Mouse sensor SPI (peripheral only) | GP26–GP29 | 4 |
| **Total** | | **25 / 25 edge** |

The peripheral build uses all 25; the central build uses 21 and leaves the 4 sensor pads idle.
Two subsystems were dropped to make this fit (see the README "Decisions"): there are **no
addressable LEDs**, and the encoder is **scroll only, with no click**
(`include_momentary_switch_pads: false`). The middle click it would have provided already exists as
a remapped finger key in mouse mode.

The encoder is an **Alps EC11 / EC12** (`ceoloide/rotary_encoder_ec11_ec12`), not the Panasonic
EVQWGD001 roller the design started with — see the README "Decisions" for the trade. Its three
rotation pins are A and C to GPIO plus B to GND, so the 2-pin budget is unchanged. **EC12
(EC12E2440301) is the part to source**: short through-shaft, low profile, and it has no momentary
switch at all, which is exactly what this design wants. The footprint is inherently reversible (all
THT, no solder jumper), but **A and C swap between hands** — the firmware pin map has to invert them
per hand or the wheel scrolls backwards on one half.

The **peripheral-only mouse sensor** (a PMW3360/3389 breakout, connected by cable to a
JST-SH 6-pin header — `xonha/sensor_connector_jst_sh_1x06`) uses four pins:

| Sensor line | GPIO | RP2040 SPI1 |
| --- | --- | --- |
| SCLK | GP26 | SCK |
| MOSI | GP27 | TX |
| MISO | GP28 | RX |
| NCS  | GP29 | (CS driven as a plain GPIO) |

Plus VCC (3V3) and GND — 6 conductors total. SCLK/MOSI/MISO land on RP2040 **SPI1**, so QMK can
use hardware SPI. **GP18, GP24 and GP25 are not emitted at all** — no pad, no drill. Besides
removing solder joints that sit under a reverse-mounted module (impractical to reach after
assembly), it removes unconnected copper pressed against the module's bottom face. The cost is that
those three GPIO are now a **respin, not a solder-a-wire escape hatch**: a future revision wanting
the sensor's optional MOT/RS lines (a sibling `1x08` footprint), an addressable-LED data line, or
the roller's click switch has to flip the flags back on and re-route. On the central build the
sensor connector is unpopulated, so GP26–GP29 are free there. The breakout mounts on the
bottom plate at the glide surface; the cable keeps its Z-height decoupled from the main PCB
(~10 mm standoff) and off the crowded bottom face — see the README "Decisions".

### ⚠️ Open item — hardware SPI does not survive the mirror

The reversible MCU footprint mirrors the column rows (`mcu_rp2040_pro_micro.js`), so on the flipped
build the four sensor nets land on GP5/GP4/GP3/GP2 instead of GP26–GP29 — SPI0 CSn/RX/TX/SCK, i.e.
the wrong roles. And no pad *pair* on this module is SPI-TX-capable at both ends, so **no 4-wire
assignment works in both orientations**. Since the peripheral may be built for either hand, one of
the two handedness options needs a fix:

- **Solder-jumper the 4 sensor rows** so those holes keep their printed labels on both hands. The
  footprint already implements this for all column rows via `only_required_jumpers: false`; doing
  it for just those four rows wants a small `jumper_rows` param. Keeps one firmware image.
- **Or build two firmware images**, one per peripheral handedness (`POINTING_DEVICE_LEFT` /
  `_RIGHT` is compile-time anyway, so this is partly forced regardless).
- **Or bitbang SPI**, which makes pin function irrelevant — not available in QMK core for the
  PMW33xx driver.

This is the last unresolved item in the pin plan; nothing else in the assignment depends on a pin's
alternate function, because every other net is a plain GPIO that a per-hand pin map handles.
