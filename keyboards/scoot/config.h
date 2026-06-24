#pragma once

/* ------------------------------------------------------------------ *
 *  PMW3360 optical mouse sensor (right half, face-down = desk mouse)
 *
 *  4-wire SPI. On RP2040 the bus pins are NOT free choice: they must
 *  land on a real SPI peripheral. We use SPI1:
 *      SCK  -> GP14   (SPI1 SCK)
 *      MOSI -> GP15   (SPI1 TX)
 *      MISO -> GP8    (SPI1 RX)
 *      CS   -> GP9    (driven manually by the driver; any GPIO is fine)
 * ------------------------------------------------------------------ */
#define SPI_DRIVER     SPID1
#define SPI_SCK_PIN    GP14
#define SPI_MOSI_PIN   GP15
#define SPI_MISO_PIN   GP8
#define PMW3360_CS_PIN GP9

/* Sensor tuning. CPI/DPI is settable at runtime too; this is the boot
 * default. Lift-off and rotation depend on how the breakout is mounted
 * face-down on the bottom plate -- flash, drag the half on the desk,
 * then enable whichever rotation/invert makes the cursor track. */
#define PMW3360_CPI 800
// #define POINTING_DEVICE_ROTATION_90
// #define POINTING_DEVICE_ROTATION_180
// #define POINTING_DEVICE_ROTATION_270
// #define POINTING_DEVICE_INVERT_X
// #define POINTING_DEVICE_INVERT_Y
#define MOUSE_EXTENDED_REPORT          // 16-bit deltas: smoother high-speed motion

/* ------------------------------------------------------------------ *
 *  Encoders
 *  index 0 = left EC11    (GP26/GP27) -> media
 *  index 1 = right roller (GP28/GP29) -> mouse wheel
 *  EC11s are typically 4 pulses/detent. The roller is often 1-2;
 *  bump its value if one notch scrolls too far, lower it if sluggish.
 * ------------------------------------------------------------------ */
#define ENCODER_RESOLUTIONS { 4, 2 }

/* ------------------------------------------------------------------ *
 *  Latency
 *  RP2040 enumerates as USB full-speed, so 1 ms (1000 Hz) is the
 *  hardware ceiling and the QMK default -- set explicitly for clarity.
 *  DEBOUNCE is per-key bounce filtering, unrelated to poll rate.
 * ------------------------------------------------------------------ */
#define USB_POLLING_INTERVAL_MS 1
#define DEBOUNCE 5
