# ergogen — Scoot PCB source

Ergogen source for the Scoot PCB. The layout, outlines, and footprint placement live in
[`config.yml`](../config.yml) at the repo root; ergogen turns them into KiCad PCBs. `config.yml`
and `footprints/` sit at the root (not in a subfolder) so the repo can be imported directly
into [ergogen.xyz](https://ergogen.xyz/) — ergogen looks for `config.*` and `footprints/` at the
root of whatever you give it.

```
<repo root>
├── config.yml                    # the board definition (tracked)
├── footprints/
│   ├── ceoloide/     # external library — NOT tracked (git-ignored, fetch locally)
│   └── xonha/        # our own footprints (tracked) — mcu_rp2040_pro_micro,
│                     #   roller_encoder_evqwgd001, usb_c_power
└── output/                       # build artifacts (git-ignored)
```

## Footprint dependency — ceoloide (not committed)

The build uses the **[ceoloide/ergogen-footprints](https://github.com/ceoloide/ergogen-footprints)**
library (MIT © 2023 Marco Massarelli). It's an external repo, so we **don't vendor it into
version control** — fetch it locally into `footprints/ceoloide/` before building:

```sh
# from the repo root — clone and drop the .js files in (no nested .git)
tmp=$(mktemp -d)
git clone --depth 1 https://github.com/ceoloide/ergogen-footprints "$tmp"
mkdir -p footprints/ceoloide
cp "$tmp"/*.js "$tmp"/LICENSE footprints/ceoloide/
rm -rf "$tmp"
```

Validated against commit `48935f54b456ff1503d78d6b17d9d146b54e8ade`. If a footprint API
changes upstream, pin to that commit instead of the default branch.

## Building

Point ergogen at the repo root (it finds `config.yml` and injects everything under
`footprints/`):

```sh
npx ergogen . -o output --svg --clean
```

Outputs land in `output/` (git-ignored): `pcbs/scoot.kicad_pcb` plus the top/back plates, and
`outlines/*.svg` for a quick visual check.
