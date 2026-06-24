# MCU / bootloader are data-driven from info.json (processor + bootloader).

# --- This is a UNIBODY board: one MCU reads all 42 keys over the tether. ---
# Do NOT turn this on. SPLIT_KEYBOARD expects an MCU on each half talking
# over serial/I2C, which is not this design.
SPLIT_KEYBOARD = no

# --- Encoders: left EC11 + right roller, both handled in keymap.c ---
ENCODER_ENABLE = yes

# --- Media keys: KC_VOLU / KC_VOLD / KC_MPLY (consumer + system control) ---
EXTRAKEY_ENABLE = yes

# --- Mouse keycodes: KC_MS_WH_UP / KC_MS_WH_DOWN for the roller ---
MOUSEKEY_ENABLE = yes

# --- PMW3360 pointing device (SPI1, pins in config.h) ---
POINTING_DEVICE_ENABLE = yes
POINTING_DEVICE_DRIVER = pmw3360

# Keep the image lean / latency predictable.
CONSOLE_ENABLE = no
COMMAND_ENABLE = no
