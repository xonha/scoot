# Scoot — Schematic design (rev 0.2, WIP)

Net-level design capture — the spec a KiCad schematic transcribes. The architecture is now **locked**; what remains is drawing it and finalizing component values/footprints in the EDA tool.

## Architecture decisions (locked)

- **Pointing:** desk-mouse, PMW3360 sensor (on a breakout, lens fitted).
- **One MCU:** **bare RP2040** on the left half (not the RP2040-Zero module) — clean USB routing into the hub, and JLCPCB assembles it so the reflow isn't ours to do. Copy a proven RP2040 reference circuit (Pico-class) for the flash/crystal/regulator/boot subsystem; don't freelance it.
- **Right half is near-passive:** it carries one *dumb* chip — an **MCP23017 I²C IO expander (U6)** — that scans the right matrix locally. No firmware on the right. This resolves the tether shortfall (below).
- **Tether:** **USB-C**, full-featured cable. Only ~10 conductors cross, so it fits comfortably.
- **Hub:** FE1.1s on the left (host + RP2040 + USB-A dongle behind one cable).
- **Assembly:** JLCPCB PCBA places all SMD parts (RP2040, hub, expander, flash, passives, hotswap sockets); you hand-finish the sensor module, switches, and encoders. See the split BOM at the end.

## Tether conductor budget (resolved)

With the expander scanning the right matrix, the raw matrix lines no longer cross — only the expander's I²C does:

| Signal group | Conductors |
| --- | --- |
| I²C to expander (SDA, SCL) | 2 |
| PMW3360 SPI (SCK, MOSI, MISO, CS) | 4 |
| Roller encoder (A, B) — kept direct for reliable scroll | 2 |
| **Signal subtotal** | **8** |
| Power (3V3 + GND) | 2 |
| **Total** | **10** |

A full-featured USB-C cable carries ~13 signal wires + VBUS/GND, so 8 signals leave **~4–5 spare**. Comfortable.

> ⚠ **J3 is a USB-C *connector* carrying non-USB signals** — a proprietary pinout, not a USB port. Plugging a charger or real USB device into J3 can feed 5 V into the 3V3/signal lines and damage the board. **Label or mechanically key J3**, and only ever use the Scoot tether cable. (The host port J1 *is* real USB and is safe to treat normally.)

## Sheet plan

| # | Sheet | Status |
| --- | --- | --- |
| 1 | Power & host USB | locked |
| 2 | USB hub (U2) | locked |
| 3 | MCU core — bare RP2040 (U1) | locked (copy reference) |
| 4 | Key matrix (split: left direct / right via expander) | locked |
| 5 | Pointing sensor (U3) | locked |
| 6 | Encoders | locked |
| 7 | Inter-half tether (J3) | locked |
| 8 | Right-half expander (U6) | locked |

## RP2040 GPIO map (master)

20 of 30 GPIO used; 10 spare (GP16, GP17, GP20–25, GP28, GP29).

| Function | Pins |
| --- | --- |
| Left matrix rows R0–R3 | GP0, GP1, GP2, GP3 |
| Left matrix cols C0–C5 | GP6, GP7, GP10, GP11, GP12, GP13 |
| Left EC11 A / B | GP4, GP5 |
| Sensor SPI (SPI1): SCK / MOSI / MISO / CS | GP14 / GP15 / GP8 / GP9 |
| Expander I²C (I²C1): SDA / SCL | GP18 / GP19 |
| Roller A / B (direct, across tether) | GP26 / GP27 |

---

## Sheet 4 — Key matrix *(locked)*

**Two independent sub-matrices**, combined into one logical keymap by a QMK custom matrix:

- **Left half** — a 4×6 matrix read **directly by the RP2040** (rows R0–R2 = finger rows, R3 = thumb row; 6 columns). 21 keys + the EC11 click = 22 of 24 nodes.
- **Right half** — a 4×6 matrix read **by the MCP23017 (U6)** over I²C (same row/col layout). 21 keys of 24 nodes.

Both are `COL2ROW` with one diode per key.

**Per-key cell:** `COLn — switch — D(anode→cathode) — ROWm`, i.e. **diode cathode (banded end) to the ROW net**. (COL2ROW: rows driven low, columns read with pull-ups → current flows col→row. A flipped diode kills that matrix — verify before routing.)

- **EC11 push (SW_EC):** a node in the left thumb row (R3).
- **Detachable outer column:** the outer finger column (one column net per half) sits on a removable PCB section; unpopulating it gives the 5-col / 36-key build. Row/col counts and the GPIO map are unchanged.
- The MCP23017's internal pull-ups are weak (~100 kΩ); add external column pull-ups on the right board if scan reliability needs it.

---

## Sheet 5 — Pointing sensor (U3, PMW3360) *(locked)*

On a breakout (lens fitted), wired via J4 — physically on the right half, so the 4 SPI nets cross J3 to the RP2040.

| Breakout pin | Net | RP2040 |
| --- | --- | --- |
| SCLK | SPI1_SCK | GP14 |
| MOSI | SPI1_TX | GP15 |
| MISO | SPI1_RX | GP8 |
| NCS | PMW3360_CS | GP9 |
| VCC | 3V3 | — (breakout accepts 3.3–5 V; SPI logic 3.3 V) |
| GND | GND | — |
| MOT | — | NC (QMK polls; wire to a spare GPIO only for motion interrupts) |

SPI clock stays ≤ ~2 MHz in QMK, so running it over the tether is fine.

---

## Sheet 6 — Encoders *(locked)*

| Enc | Half | A | B | Common | Push |
| --- | --- | --- | --- | --- | --- |
| ENC1 (EC11) | left | GP4 | GP5 | GND | in left matrix (R3) |
| ENC2 (roller) | right | GP26 | GP27 | GND | none — A/B cross J3 |

100 nF A/B-to-GND debounce caps per encoder (optional small series R). Roller A/B are part of the tether budget; debounce caps go on the right board.

---

## Sheet 7 — Inter-half tether (J3, USB-C) *(locked)*

Suggested wire mapping onto a full-featured USB-C cable (exact pin pairs finalize at layout):

| USB-C wire | Scoot net | | USB-C wire | Scoot net |
| --- | --- | --- | --- | --- |
| VBUS | 3V3 | | RX1± | MISO, CS |
| GND | GND | | TX2± | Roller A, B |
| D+ / D− | SDA, SCL | | RX2±, SBU1/2, CC | spare (~5) |
| TX1± | SCK, MOSI | | | |

Power is sent as **3V3** (regulated on the left), so the right half needs no regulator. See the not-USB caution above.

---

## Sheet 8 — Right-half expander (U6, MCP23017) *(locked)*

- I²C from the RP2040 over J3 (SDA/SCL); address pins A0–A2 tied for a fixed address; RESET tied high; 100 nF decoupling.
- 10 of its 16 GPIO drive/read the right 4×6 matrix (GPB0–3 = rows, GPA0–5 = cols); 6 spare.
- I²C pull-ups (~4.7 kΩ) on SDA/SCL — place on the **left** board (at the MCU) so the right half stays minimal.

---

## Sheets 1–3 — Power, hub, MCU *(locked)*

**Sheet 1 — Power:** J1 VBUS (5 V) → U4 (AP2112K-3.3) → 3V3 rail. J1 CC1/CC2 → 5.1 kΩ pulldowns (present as a USB device). 3V3 feeds the RP2040, and crosses J3 to power the expander + sensor on the right. Bulk + per-rail decoupling.

**Sheet 2 — USB hub (U2, FE1.1s):** upstream ⟷ J1 D+/D−; downstream 1 ⟷ U1 RP2040 USB; downstream 2 ⟷ J2 USB-A; +2 spare. Y2 12 MHz + load caps, 15 kΩ downstream D± pulldowns, bus-powered strap, decoupling. Optional polyfuse on J2 VBUS.

**Sheet 3 — MCU core (U1, bare RP2040):** Y1 12 MHz + load caps, U5 W25Q128 QSPI flash, BOOT button (QSPI_CS→GND), RUN/reset, core-LDO cap on the RP2040, generous decoupling, USB D± → hub downstream 1, USB ESD. **Copy a proven RP2040 reference (the Pico schematic) for this subsystem.**

---

## BOM — split by who solders it

### JLCPCB assembles (PCBA, machine-placed SMD)

**Left board**

| Ref | Part | Package |
| --- | --- | --- |
| U1 | RP2040 | QFN-56 |
| U5 | W25Q128 QSPI flash | SOIC-8 |
| U4 | AP2112K-3.3 LDO | SOT-23-5 |
| Y1 | 12 MHz crystal | SMD |
| U2 | FE1.1s USB 2.0 hub | SSOP-28 |
| Y2 | 12 MHz crystal | SMD |
| J1 | USB-C receptacle (host) | SMD |
| J2 | USB-A receptacle (dongle) | SMD if available |
| D… | 1N4148W left matrix diodes | SOD-123 |
| — | Kailh hotswap sockets (left) | SMD |
| — | passives: 5.1 kΩ ×2, 4.7 kΩ I²C pull-ups, 15 kΩ ×N, decoupling, crystal caps, polyfuse | SMD |

**Right board**

| Ref | Part | Package |
| --- | --- | --- |
| U6 | MCP23017 IO expander | SOIC-28 |
| D… | 1N4148W right matrix diodes | SOD-123 |
| J3 | USB-C receptacle (tether) | SMD |
| J4 | PMW3360 breakout header | SMD or PTH |
| — | Kailh hotswap sockets (right) | SMD |
| — | passives: decoupling, roller debounce caps, optional column pull-ups | SMD |

### You hand-finish

| Item | Why it's not fab-assembled |
| --- | --- |
| PMW3360 sensor breakout (+ lens) | optical/mechanical; lens is hand-fitted, sensor not in the LCSC catalog → attaches to J4 |
| Key switches | push into the fab-placed hotswap sockets — **no soldering** (or hand-solder if solder-in) |
| ENC1 — EC11 rotary | through-hole; hand-soldered |
| ENC2 — EVQVYA001 roller | through-hole / niche, not in catalog; hand-soldered |
| Case, plate, lens window, tether cable, final assembly | mechanical |

> Use **LCSC-catalog parts** in the BOM so JLCPCB can source them; prefer in-stock "Basic" parts to avoid per-part feeder fees, and verify the FE1.1s / RP2040 / MCP23017 stock at order time. Hotswap sockets being fab-placed means switches just snap in — your iron only touches the sensor module and the two encoders.
