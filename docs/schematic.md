# Scoot Keyboard — Schematic design (rev 0.4, WIP)

Net-level design capture — the spec a KiCad schematic transcribes. This rev replaces the earlier single-controller / IO-expander / matrix-with-diodes design (rev 0.3) with a **two-MCU true split, direct-wired (no diodes), hand-built from modules**.

> **Halves.** *Central* = the half wired to the computer over USB; it stays planted and is the typing anchor (QMK split primary). *Peripheral* = the roaming half that carries the pointing sensor and *is* the desk mouse (QMK split secondary), reporting to the central over the tether. The board is reversible, so which physical hand the peripheral sits under is a build-time choice.

## Architecture decisions (locked)

- **Pointing:** desk-mouse, PMW3360 (or PMW3389) sensor on an assembled breakout, lens fitted.
- **Two MCUs:** one **RP2040 "Pro Micro" module per half** (e.g. TENSTAR RP2040 Pro Micro, **~18 × 33 mm**, ~29 usable GPIO). Hand-soldered/socketed, so a dead controller swaps out. No bare QFN, no fab assembly required. At ~18 × 33 mm the module footprint is a real placement constraint, not a dot — it sits in the inner region, tucked under the key field on the bottom side where the sensor cavity already provides clearance.
- **Peripheral half is a full controller**, not a passive/expander half: it reads its own keys and roller, drives the **PMW3360 over local SPI**, and sends reports to the central over the split serial link. This keeps the timing-sensitive sensor bus *off* the roaming tether.
- **Direct wiring, no diodes:** every key is `GPIO — switch — GND`, read with the MCU's internal pull-up (QMK `DIRECT_PINS`). No matrix, no diodes, no ghosting, native NKRO. Feasible only because the split halves the key count per MCU.
- **Layout: single fixed 3×5 + 3 thumb + 1 Shift = 19 keys/half (38 total). No detachable column.** The extra key sits at the **bottom of the ring column** and maps to Shift — the one broadly useful key a 6th column would add. No V-score breakaway, no build-time layout choice: one unified board. Direct-wiring fits with margin (central 24/29, peripheral 28/29 *including* an addressable-LED data line — see budget).
- **Tether:** a thin serial link — UART (single-wire half-duplex via RP2040 PIO, or 2-wire) + power + GND, ~4 conductors. A slim/coiled cable works since no SPI/I²C crosses.
- **One reversible PCB:** a single board design used for **both halves**, fabricated twice and flipped to make the two mirror-image halves. Place all common parts (MCU, roller, reset, USB-C tether, keys, LED chain) **mirror-symmetric**; QMK handedness picks central/peripheral in firmware. The sole asymmetry — the **PMW3360 sensor (peripheral only)** — goes on an **optional footprint** populated for the peripheral build and left unpopulated on the central (its 4 SPI GPIO just idle there). The sensor footprint must land on the face that points *down* in the peripheral orientation. The **case/bottom-plate is not reversible** (sensor window + ~10 mm standoff are peripheral-only). Because the PCB is reversible, the peripheral (mouse) half can be built under either hand — only the enclosure changes.
- **Build:** off-the-shelf modules + a sensor breakout, soldered (and socketed where useful) onto a custom PCB. Hotswap sockets are hand-soldered SMD; switches push in. A fab-assembled "bare" revision is a future option only (see README roadmap).

## Per-half GPIO budget (resolved)

Each MCU only handles its own half, so direct wiring fits with margin on a ~29-pin board:

| Function | Central pins | Peripheral pins |
| --- | --- | --- |
| 19 keys (3×5 finger + 3 thumb + 1 Shift), direct | 19 | 19 |
| Roller encoder A / B | 2 | 2 |
| Roller push (direct GPIO) | 1 | 1 |
| Mouse sensor SPI (SCK/MOSI/MISO/CS) | — | 4 |
| Inter-half UART link | 1 | 1 |
| Addressable-LED data (WS2812 / SK6812) | 1 | 1 |
| **Total** | **24 / 29** | **28 / 29** |

> Verify the chosen module actually breaks out ~29 *usable* GPIO — a couple of pins are often reserved for an onboard LED/NeoPixel or BOOT. The budget above assumes single-wire UART; a 2-wire link costs one more pin on each side (still fits).

**Spare pins.** After keys + roller + sensor + UART + LED, the central keeps **5** free GPIO and the peripheral **1** (28/29). Bring a couple of the central's free pins out to **labeled repair pads**, so a dead key's GPIO can be bodged over and remapped in one line of `DIRECT_PINS`. On the peripheral, the lone spare can take the sensor's **MT (motion) interrupt** instead; if a build needs more peripheral headroom, a 3-wire **PMW3610** (−1 pin) frees one.

## Tether conductor budget (resolved)

| Signal | Conductors |
| --- | --- |
| UART data (single-wire half-duplex; 2 if full-duplex) | 1–2 |
| Power (3V3 or 5V) | 1 |
| GND | 1 |
| **Total** | **3–4** |

No raw SPI/I²C crosses, so the cable can be slim and flexible/coiled — which the roaming peripheral half needs. The chosen connector is a **USB-C receptacle on each half** (reversible, robust, and a slim/coiled USB-C cable is easy to source). It carries **only UART + power — not USB data**, so it is a *non-USB pinout*: key/label it and use only the Scoot Keyboard tether cable; never plug a charger or USB device into it.

> Each half therefore has **two USB-C ports**: the controller module's own (host link on the central / flash-only on the peripheral) and this tether port. They are not interchangeable — mark them so the host cable and the tether cable never get swapped.

> **Power & flashing caution.** The peripheral module is powered over the tether *and* has its own USB-C used for flashing/debug. Don't let both feed power at once: either unplug the tether before flashing the peripheral half, or send 5 V over the tether to the module's 5V/VIN pin and Schottky-diode-OR it against the USB VBUS so either source can power the board safely.

## Sheet plan

| # | Sheet | Status |
| --- | --- | --- |
| 1 | Central controller (RP2040 module) + host USB | locked |
| 2 | Peripheral controller (RP2040 module) | locked |
| 3 | Direct-wired keys (both halves) | locked |
| 4 | Pointing sensor (U_P, on peripheral) | locked |
| 5 | Encoders (rollers, both halves) | locked |
| 6 | Inter-half tether (serial link) | locked |

## Sheet 1 — Central controller *(locked)*

- An RP2040 "Pro Micro" module. Its onboard USB-C is the **host link** (this half enumerates to the PC). QMK runs here as the split **central** (primary).
- Direct-wired central keys + central roller on its GPIO (see Sheet 3 / budget).
- One pin to the UART tether; 3V3 (or 5V) + GND out to the tether to power the peripheral half.

## Sheet 2 — Peripheral controller *(locked)*

- A second RP2040 "Pro Micro" module, the split **peripheral** (secondary). Its onboard USB-C is used only for **flashing/debug** — the peripheral half never connects to the host (see the power caution above).
- Direct-wired peripheral keys + peripheral roller + the PMW3360 SPI + one UART pin.

## Sheet 3 — Direct-wired keys *(locked)*

- **No matrix, no diodes.** Each switch: one terminal to a dedicated **GPIO**, the other to **GND**. Firmware enables the internal pull-up and reads the pin low = pressed (QMK `DIRECT_PINS`).
- 19 keys per half: 15 finger (3 rows × 5 cols) + 1 Shift (bottom of the ring column) + 3 thumb.
- **Shift key.** The 19th key is a single hotswap socket at the bottom of the ring column, on a normal GPIO like any other key — no breakaway, no special treatment. It maps to Shift.
- **Hotswap:** Kailh hotswap sockets, hand-soldered (two pads each); a **switch plate** is required so switch-swap pull-out force loads the plate, not the solder joints.
- Roller push is just another direct key GPIO (Sheet 5).

## Sheet 4 — Pointing sensor (U_P, PMW3360/PMW3389) *(locked)*

On an **assembled breakout with the lens fitted**, mounted face-down, read by the **peripheral** MCU over local SPI. Only pointing *reports* cross the tether (via the split protocol), never SPI.

> **Reversible-PCB note.** The sensor is the board's only handedness asymmetry: lay it as an **optional footprint** populated on the peripheral build only, on the face that ends up **down** in the peripheral orientation. The 4 SPI pads stay unpopulated/idle on the central build.

| Breakout pin | Net | Peripheral MCU |
| --- | --- | --- |
| SCLK | SPI_SCK | a GPIO |
| MOSI | SPI_TX | a GPIO |
| MISO | SPI_RX | a GPIO |
| NCS | SENSOR_CS | a GPIO |
| VI / VCC | 3V3 (check module: many regulate 3.3–5 V) | — |
| GND | GND | — |
| MT (motion) | NC | wire to a spare GPIO only for interrupt-driven polling |

- Decoupling per the module (it usually carries its own caps; the PMW3360 wants 4.7 µF + 1 µF + 100 nF nearby). SPI clock stays low (≤ ~2 MHz), trivial on short local traces.
- **Interconnect:** connect the breakout to the main PCB with a **6-pin JST-SH 1.0 mm** connector on the main-board side and **flying leads soldered directly to the breakout pads** (no rigid header on the sensor). This mechanically decouples the breakout so the ~10 mm standoff and optical alignment can be set without loading the solder joints. Add strain relief on the lead bundle so a tug can't lift a pad. The 6 ways carry SCLK/MOSI/MISO/NCS/VCC/GND (MT stays NC).
- **Lens/standoff:** the breakout's lens needs the **~10 mm sensor-to-surface standoff** and a clean optical window in the bottom plate. This sets the peripheral half's bottom-cavity height. Hold it rigid and consistent or tracking suffers.
- If pins get tight on the peripheral (e.g. wiring the sensor motion interrupt or a longer LED chain that needs a spare), a **PMW3610** (3-wire SPI, shared SDIO → 3 pins) frees one GPIO.

## Sheet 5 — Encoders *(locked)*

Both encoders are **EVQWGD001 clickable rollers** (6-pin: rotary A, B, common, plus an SPST push). Same part on each half.

| Enc | Half | A | B | Common | Push | Function |
| --- | --- | --- | --- | --- | --- | --- |
| ENC_C (roller) | central | GPIO | GPIO | GND | direct GPIO | volume / play-pause |
| ENC_P (roller) | peripheral | GPIO | GPIO | GND | direct GPIO | scroll / middle-click |

100 nF A/B-to-GND debounce caps per encoder (optional small series R). Each roller is local to its own half's MCU — nothing encoder-related crosses the tether.

## Sheet 6 — Inter-half tether (serial link) *(locked)*

- One UART data line between the two MCUs (QMK split serial; RP2040 supports a single-wire half-duplex transport over PIO, or use 2 wires for full-duplex), plus power + GND. ~3–4 conductors total (see budget).
- Connector: a **USB-C receptacle on each half** carrying the ~4 conductors (non-USB pinout — see the tether budget note). Reversible and robust, with easy slim/coiled cables for the roaming half.
- **Placement:** symmetric — **below the roller on each half**, facing the inner edge so the cable runs the short path between halves. (On the peripheral half the sensor sits under the module, which is why the port goes below the roller rather than between module and roller; the central mirrors it for symmetry.)
- Power sent from the central (host-powered). See the power & flashing caution above, and mark the tether port distinctly from the module's own USB-C.

---

## BOM — hand-built

### Per half

| Ref | Part | Notes |
| --- | --- | --- |
| U | RP2040 "Pro Micro" module (~18 × 33 mm) | ~29 GPIO; onboard USB-C (host on central, flash-only on peripheral) |
| J | USB-C receptacle (tether) | non-USB pinout (UART + power); distinct from the module's USB-C |
| SW… | Kailh hotswap sockets ×19 | hand-soldered SMD; needs a switch plate |
| ENC | EVQWGD001 clickable roller | through-hole/niche; hand-soldered |
| LED… | SK6812 MINI-E addressable RGB (chain) | WS2812 protocol; extended side pads → easiest to hand-solder; 1 data GPIO/half |
| — | passives: encoder debounce caps; LED decoupling; UART/power link parts | SMD or THT |

### Peripheral half only

| Ref | Part | Notes |
| --- | --- | --- |
| U_P | PMW3360 / PMW3389 breakout (lens fitted) | AliExpress/Tindie; SPI to the peripheral MCU |

### You hand-finish

| Item | Why |
| --- | --- |
| Key switches | push into the hand-soldered hotswap sockets |
| Sensor breakout + lens standoff | mount face-down; set the ~10 mm optical standoff + bottom-plate window |
| Case, plate, USB-C tether cable, final assembly | mechanical |

> Everything is buyable off the shelf — no PCBA service, no MOQ reels, no fine-pitch QFN. Your iron touches the modules, hotswap sockets, encoders, and the sensor breakout's pads. A future product revision could move all of this to fab-assembled bare chips (bare RP2040s, embedded PMW3360) — see the README roadmap.
