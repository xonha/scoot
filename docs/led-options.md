# LED options — making the SK6812 chain populate-optional

Scoot's lighting is a single-wire addressable chain (SK6812 MINI-E, WS2812 protocol):
**18 per-key + 1 status + 6 underglow = 25 LEDs per half**, all on one data GPIO. Not
everyone wants all of it. This page is the PCB precaution that lets a builder populate a
**subset** without a board respin, plus the firmware caveat that comes with it.

The design keeps this deliberately simple — **one bypass jumper, one decision.**

## The problem — an addressable chain is wired in series

The LEDs form a **daisy chain**: `DIN → DOUT → DIN → DOUT …`. Each LED reads the first 24
bits and forwards the rest to the next one.

- **5 V and GND** of every LED are in **parallel** → leaving an LED unpopulated does not
  affect the others. Easy.
- **The data line is in series** → if a mid-chain LED is missing, the signal dead-ends there
  and **everything downstream of it goes dark.**

So "optional LED" is not simply "don't solder it": skip a group in the middle of the chain
and you kill every group after it. That is what the PCB has to plan for.

## The solution — one bypass jumper on the per-key block

Chain order and the single jumper:

```
MCU ─→ [ status (1) ] ─→ [ per-key (18) ] ─→ [ underglow (6) ] ─→ end
                            │ J_P │
```

- **status** — first, **always populated** (it's one cheap LED and the anchor of the chain).
- **per-key** — the middle block; **J_P** shorts its `DIN → DOUT` so it can be skipped while
  the underglow after it still lights.
- **underglow** — the tail, so it needs **no** jumper (not populating it just ends the chain
  early).

A solder jumper is two copper pads bridged with solder (or an optional 0 Ω) — near-zero cost.

## Every supported combination

| Config | Populate | Close J_P? |
| --- | --- | --- |
| Nothing | — | — |
| Status only | S | — |
| Status + per-key | S, P | — |
| Status + underglow | S, U |  ✅ |
| Everything | S, P, U | — |

**The one rule a builder needs:** *close J_P only if you want underglow but not the per-key
LEDs.* Everything else is just "solder what you want" — the status LED is always in, and the
underglow at the tail drops off for free.

### What this trades away (on purpose)

Skipping the status LED is **not** supported — you cannot build per-key-only or
underglow-only *without* the status LED. That's the simplification: dropping the second jumper
removes three niche configs (per-key only, underglow only, per-key + underglow, all sans
status) in exchange for a single, obvious instruction for new builders. Since the status LED
is one ~$0.10 part, treating it as "always present when the board has any LEDs" costs nothing
real. (A fully dark board is still fine — see *No LEDs at all* below.)

## Why status is first — two firmware bonuses, now unconditional

Because the status LED is always populated and always first:

1. **Status is LED index 0, always.** Its index never shifts with how many per-key/underglow
   LEDs follow, so `rgb_matrix_indicators_user()` addresses the indicator with a constant `0`
   in every build.
2. **The head of the chain is fixed.** The first LED after the MCU — the one that has to read
   3.3 V logic and is the level-shifter candidate — is always the status LED, in the same
   physical spot. You settle the level-shift question once and it holds across every build.

Both bonuses used to depend on "if status is populated"; with the single-jumper scheme they
are unconditional.

## Power — parallel, so size for the maximum

Since every LED taps 5 V/GND in parallel, **size the copper for the fully-populated worst case
(~1.4 A per half, all-white at full brightness)** and any smaller subset is safe by
definition — a lighter config just draws less. Nothing conditional is needed on the power
side. (The peripheral half's LED current also crosses the tether, so size the tether's 5 V/GND
conductors for that same worst case.)

## Head-of-chain essentials (populate-optional)

Regardless of config, provide footprints at the **start** of the chain:

- **Series resistor ~330–470 Ω** on the first `DIN` — tames reflection/ringing.
- **Bulk electrolytic ~470–1000 µF** across 5 V/GND at the entry — absorbs the inrush when
  many LEDs light at once.
- **Level-shifter footprint (74AHCT125)** — the data leaves the MCU at 3.3 V and the first LED
  wants ~5 V logic. Short runs often work direct; keep the footprint (even unpopulated by
  default) so a marginal unit is fixable without a respin.

## Firmware caveat — the chain length must match the build

WS2812 has no readback, and QMK cannot auto-detect chain length. `RGB_MATRIX_LED_COUNT` and
the `g_led_config` X/Y map **must match the populated set** — mismatch and the data lands on
the wrong LEDs.

Consequence: **each hardware config needs its own firmware build** (a `#define` per config, a
build target, or an EEPROM-selectable set). This cannot be avoided with addressable LEDs. With
the single-jumper scheme there are only three lit configs to ship — e.g. `full` (25),
`status_perkey` (19), and `status_underglow` (7) — plus a dark build.

## No LEDs at all — nothing to do on the PCB

If a builder wants **zero** LEDs, the hardware needs nothing: don't populate any LED (or the
head-of-chain passives), leave J_P **open** — the data GPIO simply drives an open trace, which
is harmless because there is no downstream to break. The only change is in firmware: build
with `RGB_MATRIX_ENABLE = no` (QMK expects `RGB_MATRIX_LED_COUNT ≥ 1`, so a zero-LED config
won't build cleanly with the feature on), which also frees that GPIO for reuse.

## Fabrication details

- **Test points** on the data line at the block boundaries — if the chain breaks, probe to
  find the guilty block instead of guessing.
- **Clear silk** on J_P, e.g. *"close if per-key LEDs not fitted"* — the logic is inverted
  (closed = skip), so it must be spelled out or nobody will guess it.
