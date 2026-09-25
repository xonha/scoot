# Open items

Decisions and verifications that are still pending. Anything here is a reason a board is not
ready to fab, a firmware is not ready to flash, or a doc is lying. Ordered by what it blocks.

## Blocks fab

### 2. Which EC10E terminal is the common

The Alps catalog labels the encoder's terminals A B C and defines only two: "A: Output signal A",
"B: Output signal B". C is the common **by elimination** — and note it is an *end* terminal, not
the middle one, the opposite of an EC11. `config.yml` currently assumes `A: RE_A`, `B: RE_B`,
`C: GND` on that basis.

**Verification needed:** meter on the physical part — rotate the wheel and find the terminal with
continuity to both others. If it turns out to be the middle pin, the net map in `config.yml` and
the jumper map in item 3 both change.

### 3. EC10E reversibility — resolved with solder jumpers

Because the common is an end terminal, mirroring the board swaps the two end holes and would land
GND on a signal hole. Fixed in the footprint (`jumpers: true` in `config.yml`): the two end holes
carry local nets, and each reaches A or C through a solder-jumper pair (1.2 × 0.7 mm pads, 0.3 mm
gap) just below the terminal row.

- **Right build (F up):** bridge the F-face jumpers — hole 1 → A, hole 3 → C.
- **Left build (B up):** bridge the B-face jumpers — hole 1 → C, hole 3 → A.
- **Never both faces:** that shorts RE_A to GND. Meter RE_A–GND before the first plug-in.

Same land pattern, same body position on both hands, so the plate slot is unchanged. DRC reports
no copper conflicts on RE1. Routing must still reach the B-face RE_A/GND pads (item 6).

### 4. Encoder rotation (placement done)

**Placement is settled.** The inherited position overlapped the sensor connector (DRC: pad A of RE1
touching SENSOR1's mounting pad). The encoder now sits between the reset switch / TRRS jack and
the sensor connector, shifted ~5.3 mm toward the MCU (`shift: [-6.65, KeyY + 5.6]` from
`thumb_far`, outline blob moved by the same amount); DRC reports no copper conflicts on RE1.

**Rotation still needs a deliberate check.** The wheel rolls along the footprint's X axis (the
terminal row), and the part ends up at 80° on the board — so the wheel rolls roughly
fore-and-aft, like a mouse wheel. That is the intended feel, but the value was not chosen with a
finger on a printout: confirm the angle against where the thumb/index actually rests before fab,
and that the wheel (≤ 14 mm, item 9) clears the `thumb_far` keycap through the plate.

### 5. Verify GP26–GP29 on the physical module

`keyboard_mcu_list` warns that some Tenstar RP2040 Pro Micro units ship with mis-placed components
that leave GP26–GP29 non-functional, and the sensor's whole SPI bus lives there. Flash a minimal
firmware that toggles/reads each pin and confirm before committing a layout. See
[mcu.md](mcu.md#️-quality-caveat--verify-gp26gp29).

### 5b. Are the module's center pads through-holes or blind pads?

GP25 carries the LED data line and is the one pad under the module's body. Whether it can be
soldered *after* the module is seated depends on something not yet verified on a physical unit:

- **If the module's center pads are plated through-holes** (likely — most RP2040 Pro Micro clones
  do this), a wire dropped through both the module's hole and the PCB's hole is soldered on two
  faces that are both exposed, and it can be done at any point in the build.
- **If they are blind SMD pads**, the joint has to be made *before* the module is seated —
  pre-tin the PCB pad, tack a wire, then mount. Getting the build order wrong means desoldering
  the module.

GP25 now also carries the **key pin** that stops a mirrored mount (mcu.md, *Build rule*). With
through-holes the pin passes through the module; with blind pads it has to be soldered standing
on the pad, which is mechanically weaker — as a key it only needs to survive seating.

**Verification needed:** look at the physical module. The answer becomes a line in the build
instructions either way. This is not a fab blocker — the footprint and routing are the same — but
it is a build blocker if discovered at the wrong moment.

### 6. Route and DRC the generated board

`output/` is git-ignored and builds cleanly from the current `config.yml`
(`npx ergogen . -o output --svg --clean`, after fetching `footprints/ceoloide/` per
[ergogen.md](ergogen.md)). What ergogen emits is placement and nets only: the board still needs
routing in KiCad and a DRC pass, including a check that the fixed-face MCU (item 11b) does not
collide with the reset switch and TRRS jack next to it.

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

### 11b. MCU clearance on both faces

With the fixed-face mount ([mcu.md](mcu.md#resolved--fixed-face-mount-hardware-spi-survives-the-flip))
the module sits on the switch side of the PCB on the right half (F up) and under the PCB on the
left half (B up), components facing away from the board in both. Check that the plate/case
clears the module and its USB-C plug on the switch side, and that the bottom cavity clears it on
the other. Orientation is enforced by the GP25 key pin (see mcu.md, *Build rule*); the case
must also clear that pin's stub on the module's far face.

## Documentation debt

### 12. `misc/scoot-layout.svg` art

The layout SVG and its legend still show and name a roller encoder. The art needs regenerating
for the new part and position once item 4 settles.
