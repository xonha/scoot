# LED options — making the SK6812 chain populate-optional

Scoot's lighting is a single-wire addressable chain (SK6812 MINI-E, WS2812 protocol):
**18 per-key + 1 status + 6 underglow = 25 LEDs per half**, all on one data GPIO. Not
everyone wants all of it — some builders want per-key only, some want underglow only, some
want nothing. This page is the PCB precaution that makes every subset buildable **without a
board respin**, plus the firmware caveat that comes with it.

## The problem — an addressable chain is wired in series

The LEDs form a **daisy chain**: `DIN → DOUT → DIN → DOUT …`. Each LED reads the first 24
bits and forwards the rest to the next one.

- **5 V and GND** of every LED are in **parallel** → leaving an LED unpopulated does not
  affect the others. Easy.
- **The data line is in series** → if a mid-chain LED is missing, the signal dead-ends there
  and **everything downstream of it goes dark.**

So "optional LED" is not simply "don't solder it": skip a group in the middle of the chain
and you kill every group after it. That is what the PCB has to plan for.

## The solution — segment the chain + bypass jumpers

Split the chain into logical blocks and, **between blocks, place a solder jumper** (two
copper pads, bridged with solder — or an optional 0 Ω) that shorts that block's `DIN → DOUT`.

- Block **populated** → jumper **open**, data flows through the LEDs.
- Block **empty** → jumper **closed**, data hops over the block untouched to the next one.

A solder jumper is ~free (bare copper + a solder blob), so full flexibility is cheap.

## Canonical order — `status → per-key → underglow`

```
MCU ─→ [ status (1) ] ─→ [ per-key (18) ] ─→ [ underglow (6) ] ─→ end
          │ J_S │            │ J_P │
```

- **J_S** — bypass the status block
- **J_P** — bypass the per-key block
- **underglow** — it is the tail, so it needs **no** jumper (not populating it just ends the
  chain early)

Two jumpers cover **all eight** subsets.

## Every combination

| Config | Populate | Close jumper |
| --- | --- | --- |
| Nothing | — | none |
| Status | S | none |
| Per-key | P | **J_S** |
| Underglow | U | **J_S + J_P** |
| Status + per-key | S, P | none |
| Status + underglow | S, U | **J_P** |
| Per-key + underglow | P, U | **J_S** |
| Everything | S, P, U | none |

**The rule:** close the jumper of every empty block that still has a populated block after
it. The underglow block, being last, never counts toward that.

Because the status block comes first, the zero-jumper configs are the ones that **include the
status LED** (`status`, `status + per-key`, `everything`) — and status is one cheap LED, so
those are the common builds. The configs that *skip* status pay a jumper, and those are the
niche ones.

## Why status goes first — two firmware bonuses

When the status LED is populated (the common case), putting it first buys:

1. **Status is LED index 0, fixed.** Its index does not shift with how many per-key/underglow
   LEDs follow, so `rgb_matrix_indicators_user()` can address the indicator with a constant
   instead of a per-build number.
2. **The head of the chain is deterministic.** The first LED after the MCU — the one that has
   to read 3.3 V logic and is the level-shifter candidate — is always the status LED, in the
   same physical spot. You settle the level-shift question once and it holds across builds.

(In the niche configs that *skip* status, the head becomes the next populated block — but that
build's firmware already knows its own layout, so it is not a problem.)

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
build target, or an EEPROM-selectable set). This cannot be avoided with addressable LEDs. Plan
to ship a few named builds — e.g. `full`, `per_key`, `underglow_only` — matching the table
above.

## No LEDs at all — nothing to do on the PCB

If a builder wants **zero** LEDs, the hardware needs nothing: don't populate any LED (or the
head-of-chain passives), leave every jumper **open** — the data GPIO simply drives an open
trace, which is harmless because there is no downstream to break. The only change is in
firmware: build with `RGB_MATRIX_ENABLE = no` (QMK expects `RGB_MATRIX_LED_COUNT ≥ 1`, so a
zero-LED config won't build cleanly with the feature on), which also frees that GPIO for reuse.

## Fabrication details

- **Test points** on the data line at the block boundaries — if the chain breaks, probe to
  find the guilty block instead of guessing.
- **Clear silk** on each jumper, e.g. *"close if per-key not fitted"* — the logic is inverted
  (closed = skip), so it must be spelled out or nobody will guess it.
