# Scoot — Schematic design (rev 0.1, WIP)

Net-level design capture — the spec a KiCad schematic transcribes. This is *not* a drawn schematic yet; it's the connection plan, plus the constraints that decide the topology.

**Two decisions block a complete schematic** (see the end): MCU packaging, and how to resolve the tether conductor shortfall below.

---

## ⚠ The hard constraint: tether conductor budget

The "single MCU + passive right half + one USB-C tether" idea runs into a wall. Count what must cross from the right half back to the MCU on the left:

| Signal group | Conductors |
| --- | --- |
| Matrix — right 21 keys (rows 3–5 + cols 0–6) | 10 |
| PMW3360 SPI (SCK, MOSI, MISO, CS) | 4 |
| Roller encoder (A, B) | 2 |
| **Signal subtotal** | **16** |
| Power (3V3 + GND) | 2 |
| **Total** | **18** |

A *full-featured* USB-C cable carries about **13 usable signal wires** (D+/D−, 4 SuperSpeed pairs = 8, SBU1/2, CC) plus VBUS/GND. So **16 signals needed vs ~13 available — short by ~3.** Dropping to the 5-column (36-key) build trims the matrix to ~9 lines → 15 signals, still short by ~2. A plain USB-2 / charge-only USB-C cable (only D+/D−, VBUS, GND) is nowhere close.

The matrix is the culprit: 21 passive keys need ≥10 nets reaching the right half no matter how rows/cols are split (min `r+c` with `r·c ≥ 21` is 10). Sharing rows across the tether doesn't help — a shared net still needs a wire in the cable.

**Resolution options (a decision):**

1. **IO expander / shift register on the right half** (e.g. MCP23017 over I²C, or a 74HC165 chain). The right half scans its own matrix locally; only **I²C (2) + SPI (4) + roller (2) + power (2) = 10 conductors** cross — fits USB-C with room to spare. Cost: a chip on the "passive" right half, and matrix scanning goes through I²C (sub-millisecond, fine for typing, slightly against the purist low-latency framing).
2. **Custom multi-conductor cable** (ribbon, or a non-USB-C connector with ≥18 conductors). Keeps the right half fully passive and the MCU reading everything directly. Cost: abandons the clean "just a USB-C cable" story.
3. **Squeeze: 5-column build + careful USB-C pin use.** Marginal (short by ~2 even then) — not recommended without an expander.

Until this is settled, the tether sheet (J3) and the matrix's physical partition can't be finalized.

---

## Sheet plan

| # | Sheet | Status |
| --- | --- | --- |
| 1 | Power & host USB | pending (MCU decision) |
| 2 | USB hub (U2) | block-level locked |
| 3 | MCU core (U1) | pending (MCU decision) |
| 4 | Key matrix | locked (net level) |
| 5 | Pointing sensor (U3) | locked (net level) |
| 6 | Encoders | locked |
| 7 | Inter-half tether (J3) | pending (conductor decision) |

---

## Reference designators / BOM skeleton

| Ref | Part | Notes |
| --- | --- | --- |
| U1 | RP2040 *(bare)* or RP2040-Zero *(module)* | MCU — packaging pending |
| U2 | FE1.1s | USB 2.0 hub, SSOP-28 (hand-solderable) |
| U3 | PMW3360 | optical sensor, on breakout via J4 |
| U4 | AP2112K-3.3 | 3V3 LDO — bare path only |
| U5 | W25Q128 | QSPI flash — bare path only |
| U6 | *(optional)* MCP23017 | right-half IO expander — if option 1 above |
| Y1 | 12 MHz crystal | RP2040 — bare path only |
| Y2 | 12 MHz crystal | FE1.1s hub |
| J1 | USB-C receptacle | host link |
| J2 | USB-A receptacle | fingerprint dongle |
| J3 | USB-C receptacle | inter-half tether (passive) |
| J4 | 1×7 header | PMW3360 breakout (right half) |
| D1–D43 | 1N4148W | matrix diodes (one per key incl. EC11 click) |
| SW1–SW42 | MX/Choc switch | keys |
| ENC1 | EC11 | rotary, left (with push) |
| ENC2 | EVQVYA001 | roller, right (no push) |

Passives: 5.1 kΩ ×2 (USB-C CC pulldowns on J1), 15 kΩ downstream D± pulldowns (hub), 1 µF/100 nF decoupling, crystal load caps (~15–22 pF), encoder debounce (100 nF + optional series R). Optional polyfuse on J2 VBUS.

---

## Sheet 4 — Key matrix *(locked, net level)*

6×8, `COL2ROW`, one diode per key.

**GPIO map**

| Net | Pin | | Net | Pin |
| --- | --- | --- | --- | --- |
| ROW0 | GP0 | | COL0 | GP6 |
| ROW1 | GP1 | | COL1 | GP7 |
| ROW2 | GP2 | | COL2 | GP10 |
| ROW3 | GP3 | | COL3 | GP11 |
| ROW4 | GP4 | | COL4 | GP12 |
| ROW5 | GP5 | | COL5 | GP13 |
| | | | COL6 | GP17 |
| | | | COL7 | GP18 |

**Partition**
- Left finger keys: rows 0–2 × cols 0–5. Right finger keys: rows 3–5 × cols 0–5.
- Thumbs: col 6 (left rows 0–2, right rows 3–5).
- EC11 push (SW_EC): node [ROW0, COL7].
- **Detachable outer column:** the outer (pinky) finger column is one column net carried onto a removable PCB section, present on both halves. Unpopulating it drops that column's switches (→ 5-col / 36-key build); the net and GPIO map are unchanged.

**Per-key cell:** `COLn — switch — D(anode→cathode) — ROWm`, i.e. **diode cathode (banded end) to the ROW net**. (COL2ROW: rows driven low, columns read with pull-ups → current flows col→row. A flipped diode kills the whole matrix — verify orientation before routing.)

---

## Sheet 5 — Pointing sensor (U3, PMW3360) *(locked, net level)*

On a breakout (lens fitted), wired via J4 — **physically on the right half, so all four SPI nets cross J3**.

| Breakout pin | Net | RP2040 |
| --- | --- | --- |
| SCLK | SPI1_SCK | GP14 |
| MOSI | SPI1_TX | GP15 |
| MISO | SPI1_RX | GP8 |
| NCS | PMW3360_CS | GP9 |
| VCC | 3V3 | — (breakouts accept 3.3–5 V; SPI logic is 3.3 V, matches RP2040) |
| GND | GND | — |
| MOT | — | not connected (QMK polls; wire to a spare GPIO only if you want motion interrupts) |

SPI clock stays low (≤ ~2 MHz in QMK; PMW3360 tolerates ~10 MHz), so running it over the tether is fine at these speeds.

---

## Sheet 6 — Encoders *(locked)*

| Enc | Half | A | B | Common | Push |
| --- | --- | --- | --- | --- | --- |
| ENC1 (EC11) | left | GP26 | GP27 | GND | in matrix [ROW0, COL7] |
| ENC2 (roller) | right | GP28 | GP29 | GND | none — **A/B cross J3** |

Add 100 nF A/B-to-GND debounce caps per encoder (optionally with small series R). The roller's two lines are part of the tether budget above.

---

## Sheets 1–3 — Power, hub, MCU *(pending decisions)*

**Sheet 2 — USB hub (U2, FE1.1s)** — block-level locked:
- Upstream port ⟷ J1 D+/D− (host).
- Downstream 1 ⟷ U1 (RP2040) USB D+/D−.
- Downstream 2 ⟷ J2 USB-A (dongle). +2 spare ports.
- Y2 12 MHz + load caps; 15 kΩ pulldowns on downstream D±; decoupling. Bus-powered strap. Optional polyfuse on J2 VBUS.

**Sheet 1 — Power**: J1 VBUS (5 V) → 3V3 rail. CC1/CC2 → 5.1 kΩ pulldowns (present as device). Bare path adds U4 LDO; module path uses the module's onboard regulator.

**Sheet 3 — MCU core**: depends on packaging —
- *Bare RP2040:* Y1 12 MHz + caps, U5 QSPI flash, BOOT button (QSPI_CS→GND), RUN/reset, core-LDO cap, decoupling, USB D± → hub downstream 1, ESD. (≈ the Pico reference design.)
- *RP2040-Zero module:* wire the castellated GP pads per the maps above; the module's USB-C feeds hub downstream 1 via an internal jumper.

Either way, **the GPIO net assignments in Sheets 4–6 are identical.**

---

## Open decisions blocking completion

1. **MCU packaging** — bare RP2040 (clean hub integration, needs reflow) vs. RP2040-Zero module + internal USB jumper (hand-solderable, kludgier).
2. **Tether conductor shortfall** — IO expander on the right (fits USB-C, adds a chip + I²C scan) vs. custom multi-conductor cable (stays passive, drops the USB-C story) vs. squeeze into 5-col (marginal).
