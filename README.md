# Scoot

A wired, low-latency, 42-key split ergonomic keyboard where **the entire right half is a physical desk mouse**.

A Corne-style 3×6+3 layout, driven by a **single** controller. There's no second microcontroller — the right half carries only its keys plus pointing/scroll hardware, all wired back to the left half over a tether. Electrically it behaves like one unibody board that happens to be physically split.

> **Status: concept.** This repo is currently just the idea and its open questions — no firmware, no PCB, no case. Implementation comes after the concept is settled.

## The core bets

- **One controller, two halves.** A single MCU on the left half reads every key, both encoders, and the mouse sensor directly — matrix and peripheral lines cross the tether. No split-link protocol, no inter-half sync latency.
- **The right half *is* the mouse.** An optical sensor mounts face-down on the bottom plate; you pick up the right half and move it on the desk to drive the cursor — instead of a trackball or trackpad.
- **Dedicated scroll + media.** A roller wheel on the right half is a pure scroll wheel; a rotary encoder on the left handles volume / play-pause.
- **Wired and fast.** Targets 1000 Hz polling — favoring latency and simplicity over wireless.

## Hardware sketch

| Part | Role |
| --- | --- |
| Waveshare RP2040-Zero | Sole controller, left half |
| PMW3360 breakout (lens included) | Desk-mouse sensor, right half, face-down |
| EC11 rotary encoder | Left half — volume / play-pause |
| EVQVYA001 roller encoder | Right half — scroll wheel (no click) |
| USB-C ↔ USB-C tether | Carries matrix + peripheral + power between halves |

### Does it fit? (feasibility)

Two constraints decide whether the single-controller idea actually works:

- **Matrix size.** 42 keys + the encoder click need a grid of at least that many nodes (`rows × cols ≥ 43`). A **6×8 = 48-node** matrix covers it with headroom — left finger keys on rows 0–2, right on rows 3–5, thumbs sharing a column.
- **GPIO budget.** Everything has to land on the RP2040-Zero's pins:

  | Subsystem | Pins |
  | --- | --- |
  | Matrix (6 rows + 8 cols) | 14 |
  | Mouse sensor (SPI) | 4 |
  | Left encoder (A/B) | 2 |
  | Right roller (A/B) | 2 |
  | **Total** | **22** |

  The Zero breaks out ~20 pins on its edge castellations plus more on underside pads, so 22 fits — but it's tight, and that tightness is itself a design constraint to keep in mind.

## Decisions made so far

- **Not a true split.** One controller means the right half is passive wiring, not a second smart half. Simpler and lower-latency, at the cost of more conductors in the tether.
- **6×8 matrix.** Chosen over tighter grids so 42 keys + the encoder click fit with a few spare nodes.
- **PMW3360, not PAW3204.** The PAW3204 is an OEM part that isn't realistically buyable. The PMW3360 sells as an assembled breakout *with the lens fitted* and speaks standard 4-wire SPI.

## Open questions to resolve

The point of this stage — these shape everything downstream:

1. **Is "move the whole half" the right pointing method?** It's the distinctive idea, but it means lifting your hand off home row and sliding a keyed object around — and the half must glide smoothly. Worth pressure-testing against a trackball or a flat capacitive trackpad before committing.
2. **Fingerprint USB-A pass-through — in or out?** The original idea (tap "spare" D+/D- off the MCU's USB) can't work: the RP2040 has a single USB PHY. Doing it properly means adding a **USB 2.0 hub IC** on the left half so the PC enumerates both the keyboard and the dongle. Keep it (more complex board) or drop it?
3. **Tether conductor count.** With left = rows 0–2 and right = rows 3–5, roughly 7 cols + 3 rows + 4 sensor + 2 roller lines must cross the cable. Confirm a real USB-C breakout passes that many conductors — or rethink the row/column split to reduce crossings.
4. **Sensor Z-height vs case thickness.** The optical sensor + lens needs a focus standoff and a clean window in the bottom plate (~10 mm stack). This sets the minimum case height under the right half — at odds with a low-profile feel.
5. **Mousing handedness.** The right half is the mouse. Fine for right-handed users; no plan yet for left-handed mousing.

## Roadmap (rough)

1. **Concept** ← we are here: settle the questions above.
2. Block diagram + tether/conductor plan.
3. Schematic + PCB (per half).
4. Case / bottom-plate design (sensor window, glide surface).
5. Firmware.
