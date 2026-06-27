# Scoot

A wired, low-latency, 36-key split ergonomic keyboard where **the entire right half is a physical desk mouse**.

A Corne 3×5+3 layout — **two RP2040 "Pro Micro" modules (~18 × 33 mm each), one per half** (a true split), wired together over a thin serial tether. The right half carries its own MCU plus the pointing sensor and reads them locally; only its key/pointer reports cross the cable. Built to be **hand-soldered and repairable** from off-the-shelf modules.

<p align="center">
  <img src="docs/scoot-layout.svg" width="100%"
       alt="Scoot physical layout — a Corne 3×5+3 split: two mirrored halves, each with three rows of five staggered finger keys, a three-key fanned thumb cluster, and a roller encoder in the inner pocket beside the index key. Accent markers show the internal parts: an RP2040 'Pro Micro' module on each half (green), the PMW3360 pointing sensor under the right module (blue), and the USB-C tether port that links the halves (grey) — between module and roller on the left, below the roller on the right.">

</p>

> <sub>Physical layout ([`docs/scoot-layout.svg`](docs/scoot-layout.svg)) — a hand-built SVG in GitHub's dark palette.</sub>

> **Status: concept.** This repo is currently just the idea and its open questions — no firmware, no PCB, no case. Implementation comes after the concept is settled.

## The core bets

- **The right half *is* the mouse.** An optical sensor mounts face-down on the bottom plate; you pick up the right half and move it on the desk to drive the cursor — instead of a trackball or trackpad.
- **Two MCUs, a true split.** One RP2040 "Pro Micro" module (~18 × 33 mm) per half. The right half reads its own keys, its roller, and the mouse sensor *locally*; only compact reports cross the tether. No timing-sensitive bus runs over the roaming cable.
- **Direct-wired, no diodes.** Every key gets its own GPIO (switch → pin → GND). No matrix, no per-key diodes, no ghosting, free NKRO — and far less to hand-solder.
- **Hand-built and repairable.** Off-the-shelf modules (RP2040 boards, a PMW3360/3389 sensor breakout) soldered onto a custom PCB. A dead controller or sensor unplugs and swaps; nothing is a fab-only QFN.
- **Matching rollers, both halves.** Each half carries a clickable roller wheel: the right is scroll + middle-click, the left is volume / play-pause.
- **Wired and fast.** Targets 1000 Hz polling on the host link — favoring latency and simplicity over wireless.

## Hardware sketch

| Part | Role |
| --- | --- |
| RP2040 "Pro Micro" module (×2) | One controller per half (e.g. TENSTAR RP2040 Pro Micro, ~29 GPIO) |
| PMW3360 / PMW3389 breakout (lens included) | Desk-mouse sensor, right half, face-down, read by the right MCU |
| EVQWGD001 roller encoder (×2) | Both halves — clickable rollers: left = volume / play-pause, right = scroll / middle-click |
| USB-C tether (UART + power) | Carries the split link + power between halves — ~4 conductors; USB-C connector per half (non-USB pinout) |

### Does it fit? (feasibility)

The split means each MCU only handles its own half, so **direct wiring (one GPIO per key, no diodes) fits per half** on a ~29-pin RP2040 board:

| Subsystem | Left pins | Right pins |
| --- | --- | --- |
| 18 keys (3×5 + 3 thumb), direct to GPIO | 18 | 18 |
| Roller encoder (A/B + push) | 3 | 3 |
| Mouse sensor SPI (SCK/MOSI/MISO/CS) | — | 4 |
| Inter-half UART link | 1 | 1 |
| **Total** | **22 / 29** | **26 / 29** |

Both halves fit with margin. The encoder *push* is just another direct GPIO now — no matrix node to share. Committing to **5 columns (36 keys)** is what keeps the right half comfortably under budget; a 6th column would push the sensor half to the ragged edge (see *Decisions*).

## Decisions made so far

- **Pointing method: the desk-mouse.** Committed. The right half moving on the desk *is* the cursor — we accept the engineering that makes it usable (see below) as the price of the concept, rather than retreating to a trackball or trackpad.
- **Two MCUs, true split.** One RP2040 module per half. The right half reads its keys, roller, and the PMW3360 over *local* SPI, and ships reports to the left over a serial link. This keeps the sensor's timing-sensitive bus off the long, flexing, roaming tether — the single biggest reliability win over the original single-controller idea.
- **Direct wiring, no diodes.** Each key is one GPIO to GND (QMK `DIRECT_PINS`). Only possible *because* the split halves the key count per MCU. Trades GPIO headroom for ~36 fewer parts to solder and no diode-orientation footguns.
- **5 columns, 36 keys — fixed.** No detachable outer column. 3×5+3 per half fits direct-wiring on both halves with margin; it also matches an off-the-shelf 5-column Corne for prototyping. A 6th column would need a 3-wire sensor (PMW3610) or a diode'd sub-matrix to fit the pin budget — not worth it.
- **Hand-built from modules.** RP2040 "Pro Micro" boards + a sensor breakout, soldered (and socketed where it helps) onto a custom PCB. Cheaper at one-off quantity, fully repairable, and continuous with the breadboard/Corne prototype. A fab-assembled "bare chip" revision is a *future option* only if Scoot ever becomes a product (see roadmap).
- **PMW3360 / PMW3389 breakout, not embedded.** Both sell as assembled breakouts *with the lens fitted* (AliExpress/Tindie) and speak standard SPI; QMK drives either. The fitted lens sidesteps the hardest, least-documented part (optical alignment). Embedding the bare sensor is left to a possible future bare revision.
- **Tether: thin serial over USB-C.** UART (single-wire half-duplex via RP2040 PIO, or 2-wire) plus 3V3/5V and GND — roughly 4 conductors — through a **USB-C connector on each half** (reversible and robust; a slim/coiled USB-C cable works). It carries *only* UART + power, **not** USB data, so it's a non-USB pinout: key/label the port and use only the Scoot tether cable. Port placement: between module and roller (top side) on the left, below the roller (bottom side) on the right.
- **Fingerprint pass-through: deferred.** The integrated USB-hub idea (one cable to the host, dongle behind it) needs raw access to the host-side MCU's USB lines, which module-based boards don't expose cleanly. It's parked for a possible future bare/wired revision; the prototype runs the dongle on its own cable.

## Interaction model

Typing and mousing share the same right hand, so they're separated by a **hold-to-mouse** mode:

- **Hold a left thumb key** to enter mouse mode; release to return to typing. The left half stays planted, so that key is always under your thumb — no state to forget, no false triggers.
- **While held, the right half becomes the mouse.** Slide it to move the cursor. Its finger keys are **remapped** (not disabled) to Left / Right / Middle click — so resting your hand doesn't actuate, but a press does, exactly like mouse buttons.
- **Left-hand modifiers stay live** (Ctrl / Shift / Alt) → Ctrl-click, Shift-click and click-drag work without leaving the board.
- **Both rollers stay live** in either mode — the right always scrolls (press = middle-click), the left always does volume / play-pause. They're dedicated wheels, independent of mouse mode.

## Making the desk-mouse work

The pointing method is committed, so these are the problems that decide whether it's actually usable:

1. **Accidental clicks while gripping.** With the interaction model settled (hold-to-mouse, see above), the residual risk is that keyboard switches actuate lighter than mouse buttons — and you grip hard to slide. The remapped click keys may need heavier springs, or the buttons assigned to keys you *don't* grip. Tune on a prototype.
2. **The roaming-half tether.** Unlike a normal split, the right half *moves around* — so the inter-half cable must flex and extend across the entire mousing range without tugging the cursor or dragging the left half. Likely a coiled/retractable cable or a generous service loop. Because only a thin serial link crosses (no sensor SPI), the cable can be slim and flexible.
3. **Re-homing.** The mouse is also your right-hand typing surface — after pointing you have to put it back in a repeatable spot. By feel, a tactile detent, or a physical dock/outline on the desk mat.
4. **Glide, window, Z-height.** The bottom plate needs low-friction skates, a clean optical window for the lens, and the **~10 mm sensor standoff** — while still feeling like a keyboard, not a brick. This standoff sets the right half's bottom-cavity height regardless of anything else.
5. **Clutching fatigue.** Like any mouse you'll lift and reposition when you run out of desk; doing that with a keyboard half is heavier than a mouse, so it's worth prototyping for comfort early.

## Other open questions

- **Mousing handedness.** The right half is the mouse — fine for right-handers; no plan yet for left-handed mousing.
- **Fingerprint dongle.** Out of scope for the prototype (own cable); revisit only if a future bare/wired revision wants one-cable pass-through.

## Roadmap (rough)

1. **Concept** — core architecture settled (this README).
2. **Corne prototype** — prove the firmware and *pointing-over-split* on an existing XIAO/RP2040 Corne + a sensor breakout: hold-to-mouse, click remapping, sensor on the secondary half reporting to the primary. ([docs/breadboard.md](docs/breadboard.md)) ← we are here.
3. **Standalone PCB** — a custom board holding the modules + breakout; net-level capture in [docs/schematic.md](docs/schematic.md). Validates the *physical* desk-mouse: case, standoff, glide, re-homing, the roaming tether. Likely the finish line for a personal build.
4. **Bare PCB (optional)** — only if Scoot becomes a product: a fab-assembled revision (bare RP2040s, embedded sensor, integrated fingerprint hub). Reuses ~90% of the standalone design.
5. Case / bottom-plate design (sensor window, glide surface) — alongside step 3.
6. Firmware — a QMK split with `DIRECT_PINS`, the PMW33xx pointing driver, split pointing, and the hold-to-mouse layer.

## License

Documentation and design materials: [CC BY 4.0](LICENSE). Hardware design files (when added) will carry a hardware-appropriate license such as CERN-OHL.
</content>
</invoke>
