# Open items

Decisions and verifications that are still pending. Anything here is a reason a board is not
ready to fab, a firmware is not ready to flash, or a doc is lying. Ordered by what it blocks.

## Blocks fab

### 1. Hardware SPI does not survive the mirror (sensor)

The reversible MCU footprint mirrors the column rows, so on the flipped build the four sensor
nets land on GP5/GP4/GP3/GP2 instead of GP26–GP29 — SPI0 CSn/RX/TX/SCK, i.e. the wrong roles.
No pad *pair* on this module is SPI-TX-capable at both ends, so no 4-wire assignment works in
both orientations. Since the peripheral may be built for either hand, one of the two handedness
options needs a fix. Full write-up and the three options in [mcu.md](mcu.md#️-open-item--hardware-spi-does-not-survive-the-mirror).

**Decision needed:** solder-jumper the 4 sensor rows (wants a `jumper_rows` param on
`xonha/mcu_rp2040_pro_micro`), or build one firmware image per peripheral handedness.

### 2. Which EC10E terminal is the common

The Alps catalog labels the encoder's terminals A B C and defines only two: "A: Output signal A",
"B: Output signal B". C is the common **by elimination** — and note it is an *end* terminal, not
the middle one, the opposite of an EC11. `config.yml` currently assumes `A: RE_A`, `B: RE_B`,
`C: GND` on that basis.

**Verification needed:** meter on the physical part — rotate the wheel and find the terminal with
continuity to both others. If it turns out to be the middle pin, the net map in `config.yml` and
the jumper scheme in item 3 both change.

### 3. EC10E reversibility puts GND on a signal hole

Because the common is an end terminal, mirroring the board swaps the two end holes and lands GND
on a signal hole. All pads are THT so the holes serve either face, but this is a net error that
firmware cannot repair — unlike an EC11, where the common sits in the middle and mirroring only
reverses scroll direction. See the header of
[`footprints/xonha/encoder_alps_ec10e.js`](../footprints/xonha/encoder_alps_ec10e.js).

**Decision needed:** either (a) solder jumpers on the two end holes, each selecting
{signal, GND} per build — 4 pads, same technique the MCU footprint uses on its rail rows — or
(b) fix the encoder to one handedness and populate it only on that build, giving up
"peripheral can be either hand" for this component. The footprint does not emit the jumper field
yet.

### 4. Encoder placement and rotation

The `where` block for the encoder was inherited from the EVQWGD001 roller, which was positioned
to breach the board's right edge. The EC10E does not: its wheel rises above the board and exits
through the plate. Two things follow:

- The position needs visual checking once ergogen runs — the envelope changed from ~16.8 × 13.8 mm
  (lying down, hanging off the edge) to ~13.2 × 4.2 mm of land pattern sitting inside the outline.
  The `encoder` outline blob in `config.yml` is deliberately generous for now; resize it after
  looking at the SVG.
- **Rotation is now functional, not cosmetic.** The wheel rolls along the footprint's X axis (the
  terminal row); the shaft runs along Y. `rotate:` therefore sets which way your finger scrolls.
  The inherited value of 20° was chosen for a completely different part and should be picked
  deliberately.

### 5. Verify GP26–GP29 on the physical module

`keyboard_mcu_list` warns that some Tenstar RP2040 Pro Micro units ship with mis-placed components
that leave GP26–GP29 non-functional, and the sensor's whole SPI bus lives there. Flash a minimal
firmware that toggles/reads each pin and confirm before committing a layout. See
[mcu.md](mcu.md#️-quality-caveat--verify-gp26gp29).

### 5b. Are the module's center pads through-holes or blind pads?

GP24 carries the LED data line and is the one pad under the module's body. Whether it can be
soldered *after* the module is seated depends on something not yet verified on a physical unit:

- **If the module's center pads are plated through-holes** (likely — most RP2040 Pro Micro clones
  do this), a wire dropped through both the module's hole and the PCB's hole is soldered on two
  faces that are both exposed, and it can be done at any point in the build.
- **If they are blind SMD pads**, the joint has to be made *before* the module is seated —
  pre-tin the PCB pad, tack a wire, then mount. Getting the build order wrong means desoldering
  the module.

**Verification needed:** look at the physical module. The answer becomes a line in the build
instructions either way. This is not a fab blocker — the footprint and routing are the same — but
it is a build blocker if discovered at the wrong moment.

### 6. Regenerate `output/`

The committed `output/` (KiCad, gerbers, SVG, `drc.json`) predates the LED removal, the center-pad
removal and the encoder change. Run `npx ergogen . -o output --svg --clean` before reading
anything from it.

## Blocks firmware

### 7. `ENCODER_RESOLUTION` for the EC10E

The catalog gives 24 detents and 12 pulses per 360°, so 12 × 4 = 48 quadrature transitions per
revolution ÷ 24 detents = **2 transitions per detent → `ENCODER_RESOLUTION 2`**, not QMK's default
of 4. Derived, not stated — confirm on the bench.

### 8. Encoder A/B swap between hands

Whatever resolves item 3, the two phases still land in mirrored holes on the flipped build, so the
per-hand pin map has to swap them or the wheel scrolls backwards on one half.

### 8b. LED current across the tether

With the 18-LED per-key chain back in, all-white at full brightness is ~55 mA × 18 ≈ **1.0 A per
half**, past a plain USB-2.0 budget — and the peripheral's share crosses the tether on a single
TRRS GND conductor (sleeve contacts are typically rated 0.5–1 A). So:

- `RGB_MATRIX_MAXIMUM_BRIGHTNESS` is **mandatory**, not advisory. Coloured effects at moderate
  brightness draw a fraction of the worst case.
- The spare **R1 conductor** in the tether becomes worth reconsidering as a second GND. It
  currently has no pad at all, because the TRRS footprint runs `symmetric: true`, which reduces it
  to three pads (TP/R2/SL). Going `symmetric: false` brings R1 back at the cost of a larger
  footprint on the inner edge and a re-check of the case cutout.

**Decision needed:** cap brightness and leave `symmetric: true`, or spend the board area to have
a second GND available.

## Blocks sourcing / mechanical

### 9. The wheel and shaft are not part of the encoder

The EC10E is a sensing element: the catalog shows "Shaft insert →" and the shaft is hollow (ø2.2
bore, 1.73 mm across-flats hex socket, ø2.98 boss). You supply the shaft and the wheel — a dead
mouse is the cheapest source of both. "Shaft hole position will be at random" per the catalog, so
the hex angle cannot index a wheel.

**Wheel diameter is capped by the mount height.** The shaft axis sits H above the PCB, so a wheel
of radius > H dips below the board and needs a slot cut in it. For the chosen `EC10E1220505`
(H = 7.0 mm) that means **wheel diameter ≤ 14 mm** for a slot-free board. The 9 mm and 11 mm
variants allow ~18 mm and ~22 mm. Typical mouse wheels are 11–13 mm, so 7.0 mm works — but pick
the wheel before trusting it.

### 10. Formal specification from Alps

The catalog's own Note 1: *"This catalog shows only outline specifications. When using the
products, please obtain formal specifications for supply."* Bulk packing is 3,200 pcs/case, so
buy through a distributor. The land pattern in the footprint is from the catalog drawing, which is
enough to route; the formal spec would also settle item 2.

### 11. Silkscreen body offset

The EC10E body is 9.8 mm (X) × 4.4 mm (Y) per the catalog, but its Y position relative to the two
hole rows is not dimensioned there, so the footprint's silkscreen rectangle is derived. Print the
footprint 1:1 and drop the part on it — that also double-checks the land pattern before fab.

## Documentation debt

### 12. README still describes removed features

`README.md` predates three decisions and now contradicts `config.yml`:

- lines 26, 35 and 77 — "clickable roller wheel", "peripheral = scroll / middle-click",
  "press = middle-click"
- lines 42–51 — the feasibility table (roller at 3 pins, totals 23/28 and 27/28) and the paragraph
  under it
- line 58 — "central **23/28**, peripheral **27/28**"
- lines 59–63 — the addressable-LED bullet survives in substance, but its pin claim ("costs 1 GPIO
  per half and the budget absorbs it") now needs to say *which* pin and why: GP24, the one center
  pad, chosen so the hardest joint on the board carries the only net whose loss is cosmetic
- the roller/EVQWGD001 mentions throughout, now an Alps EC10E

Current truth: 18 keys + encoder A/B + UART + LED data + (peripheral only) 4 sensor pins =
**22 pads on the central, 26 on the peripheral** — 25/25 edge plus GP24. No encoder click. See
[mcu.md](mcu.md#resolved-scoot-pin-assignment).

### 13. `misc/scoot-layout.svg` art

The layout SVG and its legend still show and name a roller encoder. The art needs regenerating
for the new part and position once item 4 settles.
