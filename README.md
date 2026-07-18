# Scoot Keyboard

A wired, low-latency, 36-key split ergonomic keyboard where **the entire peripheral half is a physical desk mouse**.

A Corne 3×5+3 layout (36 keys) — **two RP2040 "Pro Micro" modules (~18 × 33 mm each), one per half** (a true split), wired together over a thin serial tether. The two halves are the **central** half (wired to the computer over USB, stays planted as the typing anchor) and the **peripheral** half (carries its own MCU plus the pointing sensor and *is* the desk mouse). The peripheral half reads its MCU, keys, and sensor locally; only its key/pointer reports cross the cable. Built to be **hand-soldered and repairable** from off-the-shelf modules — and the board is reversible, so the peripheral (mouse) half can be built for either hand.

<p align="center">
  <img src="docs/scoot-layout.svg" width="100%"
       alt="Scoot Keyboard physical layout — a Corne 3×5+3 split: two mirrored halves, each with three rows of five staggered finger keys, a three-key fanned thumb cluster, and a roller encoder in the inner pocket beside the index key. There is no detachable column. Accent markers show the internal parts: an RP2040 'Pro Micro' module on each half (green), the USB-C tether port (blue), the reset button (red), a dedicated layer/status LED just below it (yellow), and the roller encoder (purple). The PMW3360 pointing sensor is implicit — mounted under the peripheral (mouse) half's module.">


</p>

<p align="center">
  🟩 MCU&nbsp;&nbsp;·&nbsp;&nbsp;🟦 USB-C connector&nbsp;&nbsp;·&nbsp;&nbsp;🟥 Reset button&nbsp;&nbsp;·&nbsp;&nbsp;🟨 Layer/status LED&nbsp;&nbsp;·&nbsp;&nbsp;🟪 Roller encoder
</p>

> **Halves.** *Central* = the half wired to the computer over USB; it stays planted and is the typing anchor (QMK split primary). *Peripheral* = the roaming half that carries the pointing sensor and *is* the desk mouse (QMK split secondary), reporting to the central over the tether. The board is **reversible**, so which physical hand the peripheral sits under is a build-time choice.

## The core bets

- **The peripheral half *is* the mouse.** An optical sensor mounts face-down on the bottom plate; you pick up the peripheral half and move it on the desk to drive the cursor — instead of a trackball or trackpad.
- **Two MCUs, a true split.** One RP2040 "Pro Micro" module (~18 × 33 mm) per half. The peripheral half reads its own keys, its roller, and the mouse sensor *locally*; only compact reports cross the tether. No timing-sensitive bus runs over the roaming cable.
- **Direct-wired, no diodes.** Every key gets its own GPIO (switch → pin → GND). No matrix, no per-key diodes, no ghosting, free NKRO — and far less to hand-solder.
- **Hand-built and repairable.** Off-the-shelf modules (RP2040 boards, a PMW3360/3389 sensor breakout) soldered onto a custom PCB. A dead controller or sensor unplugs and swaps; nothing is a fab-only QFN.
- **Matching rollers, both halves.** Each half carries a clickable roller wheel: the peripheral roller is scroll + middle-click, the central roller is volume / play-pause.
- **Wired and fast.** Targets 1000 Hz polling on the host link — favoring latency and simplicity over wireless.

## Hardware sketch

| Part | Role |
| --- | --- |
| RP2040 "Pro Micro" module (×2) | One controller per half — TENSTAR RP2040 Pro Micro, **28 usable GPIO** (full pinout, flash/boot/VBUS notes, and quirks in [docs/mcu.md](docs/mcu.md)) |
| PMW3360 / PMW3389 breakout (lens included) | Desk-mouse sensor, peripheral half, face-down, read by the peripheral MCU |
| EVQWGD001 roller encoder (×2) | Both halves — clickable rollers: central = volume / play-pause, peripheral = scroll / middle-click |
| USB-C tether (UART + power) | Carries the split link + power between halves — ~4 conductors; USB-C connector per half (non-USB pinout) |

### Does it fit? (feasibility)

The split means each MCU only handles its own half, so **direct wiring (one GPIO per key, no diodes) fits per half** on a ~29-pin RP2040 board:

| Subsystem | Central pins | Peripheral pins |
| --- | --- | --- |
| 18 keys (3×5 + 3 thumb), direct to GPIO | 18 | 18 |
| Roller encoder (A/B + push) | 3 | 3 |
| Mouse sensor SPI (SCK/MOSI/MISO/CS) | — | 4 |
| Inter-half UART link | 1 | 1 |
| Addressable-LED data (WS2812 / SK6812) | 1 | 1 |
| **Total** | **23 / 29** | **27 / 29** |

Both halves fit with margin. The encoder *push* is just another direct GPIO — no matrix node to share. The layout is a **single fixed 3×5+3 (18 keys per half)** — no detachable column, one board for everyone. Even *with* an addressable-LED data line, the central keeps **6 spare pins** and the peripheral **2** (27/29); the peripheral's spare pins can back a repair pad or the sensor's motion-interrupt. If a future variant wants more headroom on the peripheral, a 3-wire **PMW3610** sensor frees one pin (see *Decisions*).

## Decisions made so far

- **Pointing method: the desk-mouse.** Committed. The peripheral half moving on the desk *is* the cursor — we accept the engineering that makes it usable (see below) as the price of the concept, rather than retreating to a trackball or trackpad.
- **Two MCUs, true split.** One RP2040 module per half. The peripheral half reads its keys, roller, and the PMW3360 over *local* SPI, and ships reports to the central over a serial link. This keeps the sensor's timing-sensitive bus off the long, flexing, roaming tether — the single biggest reliability win over the original single-controller idea.
- **Direct wiring, no diodes.** Each key is one GPIO to GND (QMK `DIRECT_PINS`). Only possible *because* the split halves the key count per MCU. Trades GPIO headroom for ~36 fewer parts to solder and no diode-orientation footguns.
- **Single fixed layout — 3×5+3 (18 keys per half), nothing detachable.** A straightforward Corne-style column-stagger with no breakaway — one unified board, no build-time layout choice, no repair-pads-on-a-seam scheme. Direct-wiring fits with room to spare (central **23/29**, peripheral **27/29** *including* an addressable-LED data line), so LEDs are in without giving anything up. If a future peripheral build wants more free pins, a 3-wire **PMW3610** sensor frees one.
- **Per-board addressable LEDs (SK6812 MINI-E), wired in.** One WS2812-family data line per half drives a local chain — LEDs never cross the tether (same rule as the sensor and roller). The **SK6812 MINI-E** is the pick: RGB, WS2812 protocol, and *extended side pads* that make it the easiest addressable LED to hand-solder. It costs 1 GPIO per half and the budget absorbs it. Placement is **per-key + underglow** — one LED per switch for reactive effects, plus a short underglow ring for ambient light, all on the same single-wire chain; power is a non-issue on the wired 5 V.
  - **Effects are fully in scope — not just a static color, and the topology is set for the richest ones.** Because the LEDs are addressable, QMK drives animated effects at **zero extra GPIO cost** (the whole chain rides that one data line; count, placement, and effect complexity never change the pin budget — only 5 V current scales with LED count, and that's a non-issue on the wired rail). Going **per-key + underglow** means **RGB Matrix** (not the simpler chain-index RGBLIGHT): it gives spatial per-key reactive effects — e.g. splash/ripple that radiates from the pressed key — *and* the ambient underglow, together. Reactive effects work regardless of the chain's wiring order — RGB Matrix keys off each LED's physical X/Y in `g_led_config`, not its position in the chain — so the chain serpentines over the keys and out to the underglow ring freely, as long as the coordinates are right.
  - **Effect scope: effectively the whole QMK RGB Matrix catalog.** The per-key X/Y map unlocks *all* effect classes — non-reactive animations (breathing, cycle/rainbow, spiral, gradient…), per-key **reactive** effects (splash, solid_reactive and variants), framebuffer effects (typing heatmap, digital rain), and user-written `RGB_MATRIX_CUSTOM_USER` effects. The RP2040 has the flash/RAM to compile them all in at once. Three honest asterisks, none of which is a missing effect: (1) it's RGB Matrix's set, not RGBLIGHT's — a practical superset, only some mode *names* differ; (2) no animation spans both halves (see below) — cross-half unified sweeps aren't a thing here; (3) dense framebuffer effects (heatmap, digital rain) *run* but look coarse on 24 LEDs — an aesthetic limit, not a capability one, and it's cured only by adding LEDs to the chain (still 1 GPIO, just more 5 V current).
  - **The two halves light independently — no cross-tether RGB sync.** Each half runs its own RGB subsystem over its own local chain; effects are scoped per-half (an effect nucleates and dies on the half that owns it). This keeps the tether carrying only UART + power (a keypress on one half does **not** need to ripple onto the other), and matches the "nothing but the sensor/roller/LED stays local" rule. A future revision could sync the halves over the UART tether, but it is explicitly a non-goal here.
  - **Dedicated layer/status LED — one per half, 0 extra GPIO.** On top of the per-key + underglow, add **one more SK6812 at the tail of each half's chain**, reserved as a status indicator rather than an animated pixel. It rides the existing single data line, so it costs **no additional pin** — no OLED, no I²C, no discrete RGB (which would burn 3 GPIO). In firmware it's flagged out of the animations (`RGB_MATRIX_LED_FLAGS`) and driven in `rgb_matrix_indicators_user()`. Both halves read the **split-synced `layer_state`** and paint the color **locally**, so they always agree without any cross-tether RGB sync — only the layer *number* crosses, which the split already sends. Placement: **just below the reset button on each half** (yellow marker in the layout SVG), ideally behind a small light-pipe/diffuser so it reads as a clean status dot, not spill from the key field.
    - **Layer → color (default, adjustable):** Base = **off** (any lit color means "you left home"), Lower/Nav = **blue**, Raise/Sym = **green**, Adjust/Fn = **magenta**, Mouse (hold-to-mouse) = **amber**.
    - **Future wireless:** the same LED remaps to **battery level** (green → amber → red, or a charge pulse), reported **per half** since each roaming half would carry its own pack. Same part, same indicator hook — only the data source changes.
- **One reversible PCB for both halves.** A single board design, fabricated twice and **flipped to make the two mirror-image halves** — like a mainstream split. Scoot Keyboard is *almost* symmetric (each half has its own MCU, roller, reset button, and USB-C tether port), so reversibility is cheap: lay the common parts mirror-symmetric, let QMK handedness sort the firmware, and the direct-wired keys mirror trivially (no diode orientation to fight). The **one asymmetry is the desk-mouse sensor** (peripheral half only) — it lives on an **optional footprint** populated only on the peripheral build; on the central build those 4 SPI pads simply sit idle (the central has spare GPIO anyway). Constraints that fall out: the sensor footprint must sit on the face that points *down* in the peripheral orientation. The **case/bottom-plate stays half-specific** (only the peripheral needs the optical window + ~10 mm standoff) — reversibility is a property of the PCB, not the enclosure. Because the PCB is reversible, the peripheral (mouse) half can be built under either hand — only the enclosure changes.
- **Hand-built from modules.** RP2040 "Pro Micro" boards + a sensor breakout, soldered (and socketed where it helps) onto a custom PCB. Cheaper at one-off quantity, fully repairable, and continuous with the breadboard/Corne prototype. A fab-assembled "bare chip" revision is a *future option* only if Scoot Keyboard ever becomes a product (see roadmap).
- **PMW3360 / PMW3389 breakout, not embedded.** Both sell as assembled breakouts *with the lens fitted* (AliExpress/Tindie) and speak standard SPI; QMK drives either. The fitted lens sidesteps the hardest, least-documented part (optical alignment). Embedding the bare sensor is left to a possible future bare revision.
- **Tether: thin serial over USB-C.** UART (single-wire half-duplex via RP2040 PIO, or 2-wire) plus 3V3/5V and GND — roughly 4 conductors — through a **USB-C connector on each half** (reversible and robust; a slim/coiled USB-C cable works). It carries *only* UART + power, **not** USB data, so it's a non-USB pinout: key/label the port and use only the Scoot Keyboard tether cable. Port placement is **symmetric** — below the roller on each half, facing the inner edge for the shortest cable run.
- **Wired to the host, not wireless (BLE considered, rejected for now).** A BLE build was explored — an nRF52840 central with an onboard battery in the central's tenting cavity (dead space it has only for height symmetry with the peripheral's ~10 mm sensor standoff), firmware on RMK (which does support a pointing device on the peripheral half and USB/BLE dual-mode). It was rejected because **the peripheral is the mouse and stays tethered to the central regardless** (for power + the sensor link), so going wireless only removes the *host* cable while the inter-half cable stays — all the battery/charging/latency/firmware cost to drop 1 of 2 cables. Wired also **keeps both core bets at once** (direct-wiring *and* the reversible PCB — BLE forced sacrificing one: a mixed nRF/RP2040 pair breaks the single reversible board, while nRF-on-both-halves only fits by reverting to a diode matrix), preserves the 1000 Hz / low-latency path that matters *more* here because the device is a mouse, and avoids RP2040 + PMW3360 draining a battery. The door isn't shut: RMK's **dual-mode** (wired by default, BLE when unplugged) reuses ~all of this design and can be a future revision.

## Interaction model

Typing and mousing share the same hand — the one resting on the peripheral half — so they're separated by a **hold-to-mouse** mode:

- **Hold a thumb key on the central half** to enter mouse mode; release to return to typing. The central half stays planted, so that key is always under your thumb — no state to forget, no false triggers.
- **While held, the peripheral half becomes the mouse.** Slide it to move the cursor. Its finger keys are **remapped** (not disabled) to Left / Right / Middle click — so resting your hand doesn't actuate, but a press does, exactly like mouse buttons.
- **Modifiers on the central half stay live** (Ctrl / Shift / Alt) → Ctrl-click, Shift-click and click-drag work without leaving the board.
- **Both rollers stay live** in either mode — the peripheral always scrolls (press = middle-click), the central always does volume / play-pause. They're dedicated wheels, independent of mouse mode.

## Making the desk-mouse work

The pointing method is committed, so these are the problems that decide whether it's actually usable:

1. **Accidental clicks while gripping.** With the interaction model settled (hold-to-mouse, see above), the residual risk is that keyboard switches actuate lighter than mouse buttons — and you grip hard to slide. The remapped click keys may need heavier springs, or the buttons assigned to keys you *don't* grip. Tune on a prototype.
2. **The roaming-half tether.** Unlike a normal split, the peripheral half *moves around* — so the inter-half cable must flex and extend across the entire mousing range without tugging the cursor or dragging the central half. Likely a coiled/retractable cable or a generous service loop. Because only a thin serial link crosses (no sensor SPI), the cable can be slim and flexible.
3. **Re-homing.** The peripheral half is also a typing surface — after pointing you have to put it back in a repeatable spot. By feel, a tactile detent, or a physical dock/outline on the desk mat.
4. **Glide, window, Z-height.** The bottom plate needs low-friction skates, a clean optical window for the lens, and the **~10 mm sensor standoff** — while still feeling like a keyboard, not a brick. This standoff sets the peripheral half's bottom-cavity height regardless of anything else.
5. **Clutching fatigue.** Like any mouse you'll lift and reposition when you run out of desk; doing that with a keyboard half is heavier than a mouse, so it's worth prototyping for comfort early.

## Handedness

The board is **reversible**, so the peripheral (mouse) half can be built for either hand: a right-handed build puts the peripheral under the right hand and the central (typing/USB) half on the left; a left-handed build simply mirrors that. Firmware handedness (QMK) and the concrete pointing-device side are set per build. The **case/bottom-plate is the only half-specific part** (the peripheral needs the optical window + ~10 mm standoff), so a left- vs right-handed build differs only in the enclosure, not the PCB.

## Roadmap (rough)

1. **Concept** — core architecture settled (this README).
2. **Corne prototype** — prove the firmware and *pointing-over-split* on an existing XIAO/RP2040 Corne + a sensor breakout: hold-to-mouse, click remapping, sensor on the peripheral half reporting to the central. ([docs/breadboard.md](docs/breadboard.md)) ← we are here.
3. **Standalone PCB** — a custom board holding the modules + breakout. Validates the *physical* desk-mouse: case, standoff, glide, re-homing, the roaming tether. Likely the finish line for a personal build.
4. **Bare PCB (optional)** — only if Scoot Keyboard becomes a product: a fab-assembled revision (bare RP2040s, embedded sensor). Reuses ~90% of the standalone design.
5. Case / bottom-plate design (sensor window, glide surface) — alongside step 3.
6. Firmware — a QMK split with `DIRECT_PINS`, the PMW33xx pointing driver, split pointing, and the hold-to-mouse layer.

## License

Documentation and design materials: [CC BY 4.0](LICENSE). Hardware design files (when added) will carry a hardware-appropriate license such as CERN-OHL.
