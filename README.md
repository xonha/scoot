# Scoot

A wired, low-latency, 42-key split ergonomic keyboard where **the entire right half is a physical desk mouse**.

Built on a Corne-style 3×6+3 layout, driven by a **single** RP2040-Zero. There's no second microcontroller — the right half is just matrix, a mouse sensor, and a scroll wheel, all wired back to the left half over a USB-C tether. That makes it a *unibody* board electrically, even though it's physically split.

## The idea

- **One MCU, two halves.** A Waveshare RP2040-Zero lives entirely on the left half. Every key, both encoders, and the mouse sensor are read natively by that one chip — matrix and peripheral lines cross the tether. No split-link protocol, no per-half latency budget.
- **The right half *is* the mouse.** A PMW3360 optical sensor mounts face-down on the bottom plate. You pick up the right half and move it on the desk to drive the cursor — no separate trackball or trackpad.
- **Dedicated scroll + media.** A roller encoder on the right half is a pure scroll wheel; a rotary encoder (EC11) on the left handles volume, with its click mapped to play/pause.
- **Wired and fast.** Targets 1000 Hz polling — the RP2040's USB full-speed ceiling.

## Hardware

| Part | Role |
| --- | --- |
| Waveshare RP2040-Zero | Sole MCU, on the left half |
| PMW3360 breakout (lens included) | Desk-mouse sensor, right half, face-down |
| EC11 rotary encoder | Left half — volume / play-pause |
| EVQVYA001 roller encoder | Right half — mouse scroll wheel (no click) |
| USB-C ↔ USB-C tether | Carries matrix + peripheral + power between halves |

### Matrix

42 keys + the EC11 click are read as a **6×8 (rows×cols) `COL2ROW` matrix** — 48 nodes, 43 used. Left finger keys sit on rows 0–2, right finger keys on rows 3–5 (columns 0–5 each); all six thumbs live on column 6; the EC11 click is at `[0,7]`.

### Pin map (RP2040-Zero)

| Block | Pins |
| --- | --- |
| Matrix rows (6) | GP0–GP5 |
| Matrix cols (8) | GP6, GP7, GP10, GP11, GP12, GP13, GP17, GP18 |
| PMW3360 (SPI1) | SCK=GP14, MOSI=GP15, MISO=GP8, CS=GP9 |
| EC11 encoder A/B | GP26, GP27 |
| Roller encoder A/B | GP28, GP29 |

> 22 GPIO total. Twenty come from the Zero's edge castellations (GP0–GP15, GP26–GP29); the last two matrix columns (GP17, GP18) use the underside solder pads. GP16 (onboard WS2812) is left free.

## Firmware

QMK, in [`keyboards/scoot/`](keyboards/scoot/). Data-driven where possible: matrix, encoders, layout, and the RP2040 target all live in `info.json`; sensor + tuning in `config.h`; features in `rules.mk`; layers + encoder handlers in `keymaps/default/keymap.c`.

### Build

```sh
# from a qmk_firmware checkout
ln -s /path/to/this/repo/keyboards/scoot keyboards/scoot
qmk compile -kb scoot -km default
```

Flash the resulting `.uf2` by mounting the RP2040-Zero in bootloader mode (hold BOOT while plugging in).

## Design notes / decisions

A few corrections to the original napkin spec, kept here so the reasoning isn't lost:

- **Not a QMK split.** One MCU = `SPLIT_KEYBOARD = no`. QMK's split feature needs an MCU on each half; this design doesn't have that.
- **Matrix had to grow.** 42 keys need `rows × cols ≥ 42`. The original 5×5 / 5×6 can't address them (25 / 30 nodes); 6×8 gives 48 with headroom.
- **PMW3360, not PAW3204.** The PAW3204 is a 2-wire OEM part that isn't realistically buyable. The PMW3360 sells as an assembled breakout *with the lens fitted*, speaks 4-wire SPI, and has a first-class QMK driver. (Bonus: 4-wire SPI matches the original 4-pin sensor budget.)
- **SPI pins aren't free choice.** On RP2040 the bus must map to a real SPI peripheral — these pins are valid for SPI1.

## Open hardware questions (not firmware)

- **Tether conductor count.** Left=rows 0–2, right=rows 3–5 means 7 cols + 3 rows + 4 sensor/SPI + 2 roller lines cross the cable. Confirm the specific USB-C breakout passes that many conductors.
- **USB-A pass-through.** The RP2040 has a single USB PHY — there are no spare D+/D- to tap for a fingerprint dongle. Hosting a second USB device needs a real hub IC, not a solder bypass. Out of scope for the firmware either way.
- **Sensor Z-height.** The PMW3360 + lens needs a focus standoff and a clean optical window in the bottom plate (~10 mm stack). Sets the minimum case thickness under the right half.

## Status

Early. Firmware compiles as a definition; **not yet flashed or validated on hardware.** Axis rotation/invert and encoder resolutions are first guesses to tune once the board exists.
