# Scoot — Schematic design (rev 0.4, WIP)

Net-level design capture — the spec a KiCad schematic transcribes. This rev replaces the earlier single-controller / IO-expander / matrix-with-diodes design (rev 0.3) with a **two-MCU true split, direct-wired (no diodes), hand-built from modules**.

## Architecture decisions (locked)

- **Pointing:** desk-mouse, PMW3360 (or PMW3389) sensor on an assembled breakout, lens fitted.
- **Two MCUs:** one **RP2040 "Pro Micro" module per half** (e.g. TENSTAR RP2040 Pro Micro, ~29 usable GPIO). Hand-soldered/socketed, so a dead controller swaps out. No bare QFN, no fab assembly required.
- **Right half is a full controller**, not a passive/expander half: it reads its own keys and roller, drives the **PMW3360 over local SPI**, and sends reports to the left over the split serial link. This keeps the timing-sensitive sensor bus *off* the roaming tether.
- **Direct wiring, no diodes:** every key is `GPIO — switch — GND`, read with the MCU's internal pull-up (QMK `DIRECT_PINS`). No matrix, no diodes, no ghosting, native NKRO. Feasible only because the split halves the key count per MCU.
- **Layout: 5 columns, 36 keys (3×5 + 3 thumb per half), fixed.** No detachable outer column.
- **Tether:** a thin serial link — UART (single-wire half-duplex via RP2040 PIO, or 2-wire) + power + GND, ~4 conductors. A slim/coiled cable works since no SPI/I²C crosses.
- **Build:** off-the-shelf modules + a sensor breakout, soldered (and socketed where useful) onto a custom PCB. Hotswap sockets are hand-soldered SMD; switches push in. A fab-assembled "bare" revision is a future option only (see README roadmap).

## Per-half GPIO budget (resolved)

Each MCU only handles its own half, so direct wiring fits with margin on a ~29-pin board:

| Function | Left pins | Right pins |
| --- | --- | --- |
| 18 keys (3×5 finger + 3 thumb), direct | 18 | 18 |
| Roller encoder A / B | 2 | 2 |
| Roller push (direct GPIO) | 1 | 1 |
| Mouse sensor SPI (SCK/MOSI/MISO/CS) | — | 4 |
| Inter-half UART link | 1 | 1 |
| **Total** | **22 / 29** | **26 / 29** |

> Verify the chosen module actually breaks out ~29 *usable* GPIO — a couple of pins are often reserved for an onboard LED/NeoPixel or BOOT. The budget above assumes single-wire UART; a 2-wire link costs one more pin on each side (still fits).

## Tether conductor budget (resolved)

| Signal | Conductors |
| --- | --- |
| UART data (single-wire half-duplex; 2 if full-duplex) | 1–2 |
| Power (3V3 or 5V) | 1 |
| GND | 1 |
| **Total** | **3–4** |

No raw SPI/I²C crosses, so the cable can be slim and flexible/coiled — which the roaming right half needs. A simple 4-conductor cable (TRRS, JST, or a captive soldered cable) is sufficient; nothing here requires USB-C.

> **Power & flashing caution.** The right module is powered over the tether *and* has its own USB-C used for flashing/debug. Don't let both feed power at once: either unplug the tether before flashing the right half, or send 5 V over the tether to the module's 5V/VIN pin and Schottky-diode-OR it against the USB VBUS so either source can power the board safely.

## Sheet plan

| # | Sheet | Status |
| --- | --- | --- |
| 1 | Left controller (RP2040 module) + host USB | locked |
| 2 | Right controller (RP2040 module) | locked |
| 3 | Direct-wired keys (both halves) | locked |
| 4 | Pointing sensor (U_R, on right) | locked |
| 5 | Encoders (rollers, both halves) | locked |
| 6 | Inter-half tether (serial link) | locked |

## Sheet 1 — Left controller (primary) *(locked)*

- An RP2040 "Pro Micro" module. Its onboard USB-C is the **host link** (this half enumerates to the PC). QMK runs here as the split **primary**.
- Direct-wired left keys + left roller on its GPIO (see Sheet 3 / budget).
- One pin to the UART tether; 3V3 (or 5V) + GND out to the tether to power the right half.

## Sheet 2 — Right controller (secondary) *(locked)*

- A second RP2040 "Pro Micro" module, the split **secondary**. Its onboard USB-C is used only for **flashing/debug** — the right half never connects to the host (see the power caution above).
- Direct-wired right keys + right roller + the PMW3360 SPI + one UART pin.

## Sheet 3 — Direct-wired keys *(locked)*

- **No matrix, no diodes.** Each switch: one terminal to a dedicated **GPIO**, the other to **GND**. Firmware enables the internal pull-up and reads the pin low = pressed (QMK `DIRECT_PINS`).
- 18 keys per half: 15 finger (3 rows × 5 cols) + 3 thumb.
- **Hotswap:** Kailh hotswap sockets, hand-soldered (two pads each); a **switch plate** is required so switch-swap pull-out force loads the plate, not the solder joints.
- Roller push is just another direct key GPIO (Sheet 5).

## Sheet 4 — Pointing sensor (U_R, PMW3360/PMW3389) *(locked)*

On an **assembled breakout with the lens fitted**, mounted face-down, read by the **right** MCU over local SPI. Only pointing *reports* cross the tether (via the split protocol), never SPI.

| Breakout pin | Net | Right MCU |
| --- | --- | --- |
| SCLK | SPI_SCK | a GPIO |
| MOSI | SPI_TX | a GPIO |
| MISO | SPI_RX | a GPIO |
| NCS | SENSOR_CS | a GPIO |
| VI / VCC | 3V3 (check module: many regulate 3.3–5 V) | — |
| GND | GND | — |
| MT (motion) | NC | wire to a spare GPIO only for interrupt-driven polling |

- Decoupling per the module (it usually carries its own caps; the PMW3360 wants 4.7 µF + 1 µF + 100 nF nearby). SPI clock stays low (≤ ~2 MHz), trivial on short local traces.
- **Lens/standoff:** the breakout's lens needs the **~10 mm sensor-to-surface standoff** and a clean optical window in the bottom plate. This sets the right half's bottom-cavity height. Hold it rigid and consistent or tracking suffers.
- If pins are tight in a future 6-column variant, a **PMW3610** (3-wire SPI, shared SDIO → 3 pins) frees one GPIO.

## Sheet 5 — Encoders *(locked)*

Both encoders are **EVQWGD001 clickable rollers** (6-pin: rotary A, B, common, plus an SPST push). Same part on each half.

| Enc | Half | A | B | Common | Push | Function |
| --- | --- | --- | --- | --- | --- | --- |
| ENC_L (roller) | left | GPIO | GPIO | GND | direct GPIO | volume / play-pause |
| ENC_R (roller) | right | GPIO | GPIO | GND | direct GPIO | scroll / middle-click |

100 nF A/B-to-GND debounce caps per encoder (optional small series R). Each roller is local to its own half's MCU — nothing encoder-related crosses the tether.

## Sheet 6 — Inter-half tether (serial link) *(locked)*

- One UART data line between the two MCUs (QMK split serial; RP2040 supports a single-wire half-duplex transport over PIO, or use 2 wires for full-duplex), plus power + GND. ~3–4 conductors total (see budget).
- Connector: a simple 4-pin link (TRRS / JST / pin header) or a captive soldered cable. The roaming right half favors a flexible/coiled cable; a captive cable avoids a wear-prone connector entirely.
- Power sent from the left (host-powered). See the power & flashing caution above.

---

## BOM — hand-built

### Per half

| Ref | Part | Notes |
| --- | --- | --- |
| U | RP2040 "Pro Micro" module | ~29 GPIO; onboard USB-C (host on left, flash-only on right) |
| SW… | Kailh hotswap sockets ×18 | hand-soldered SMD; needs a switch plate |
| ENC | EVQWGD001 clickable roller | through-hole/niche; hand-soldered |
| — | passives: encoder debounce caps; UART/power link parts | SMD or THT |

### Right half only

| Ref | Part | Notes |
| --- | --- | --- |
| U_R | PMW3360 / PMW3389 breakout (lens fitted) | AliExpress/Tindie; SPI to the right MCU |

### You hand-finish

| Item | Why |
| --- | --- |
| Key switches | push into the hand-soldered hotswap sockets |
| Sensor breakout + lens standoff | mount face-down; set the ~10 mm optical standoff + bottom-plate window |
| Case, plate, tether cable, final assembly | mechanical |

> Everything is buyable off the shelf — no PCBA service, no MOQ reels, no fine-pitch QFN. Your iron touches the modules, hotswap sockets, encoders, and the sensor breakout's header. A future product revision could move all of this to fab-assembled bare chips (bare RP2040s, embedded PMW3360, and the integrated fingerprint USB hub) — see the README roadmap.
</content>
