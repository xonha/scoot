#include QMK_KEYBOARD_H

enum layers {
    _BASE,
    _LOWER,
    _RAISE,
};

/* LAYOUT argument order (matches info.json -> layouts.LAYOUT.layout):
 *   row 0/3  : left top   ... right top
 *   row 1/4  : left home  ... right home
 *   row 2/5  : left bottom... right bottom
 *   thumbs   : L0 L1 L2  R0 R1 R2     (all on matrix col 6)
 *   last arg : EC11 center-click       (matrix [0,7])
 */
const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
    [_BASE] = LAYOUT(
        KC_TAB,  KC_Q,    KC_W,    KC_E,    KC_R,    KC_T,        KC_Y,    KC_U,    KC_I,    KC_O,    KC_P,    KC_BSPC,
        KC_LCTL, KC_A,    KC_S,    KC_D,    KC_F,    KC_G,        KC_H,    KC_J,    KC_K,    KC_L,    KC_SCLN, KC_QUOT,
        KC_LSFT, KC_Z,    KC_X,    KC_C,    KC_V,    KC_B,        KC_N,    KC_M,    KC_COMM, KC_DOT,  KC_SLSH, KC_RSFT,
                          KC_LGUI, MO(_LOWER), KC_SPC,           KC_ENT,  MO(_RAISE), KC_RALT,
        KC_MPLY  /* EC11 center click */
    ),

    [_LOWER] = LAYOUT(
        KC_GRV,  KC_1,    KC_2,    KC_3,    KC_4,    KC_5,        KC_6,    KC_7,    KC_8,    KC_9,    KC_0,    KC_DEL,
        _______, KC_MINS, KC_EQL,  KC_LBRC, KC_RBRC, KC_BSLS,     KC_LEFT, KC_DOWN, KC_UP,   KC_RGHT, KC_SCLN, KC_QUOT,
        _______, KC_F1,   KC_F2,   KC_F3,   KC_F4,   KC_F5,       KC_F6,   KC_F7,   KC_F8,   KC_F9,   KC_F10,  _______,
                          _______, _______, _______,             _______, _______, _______,
        _______
    ),

    [_RAISE] = LAYOUT(
        KC_ESC,  KC_EXLM, KC_AT,   KC_HASH, KC_DLR,  KC_PERC,     KC_CIRC, KC_AMPR, KC_ASTR, KC_LPRN, KC_RPRN, KC_DEL,
        _______, KC_F11,  KC_F12,  XXXXXXX, XXXXXXX, XXXXXXX,     KC_HOME, KC_PGDN, KC_PGUP, KC_END,  XXXXXXX, XXXXXXX,
        _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX,     XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, _______,
                          _______, _______, _______,             _______, _______, _______,
        _______
    ),
};

/* ------------------------------------------------------------------ *
 *  Encoder handlers
 *  index 0 = left EC11    -> Volume Up/Down (center click is KC_MPLY,
 *                            handled as a normal matrix key above)
 *  index 1 = right roller -> mouse wheel scroll (no center click)
 *
 *  All four keycodes (KC_VOLU/VOLD/KC_MS_WH_UP/DOWN) are <= 0xFF, so
 *  tap_code() is the correct, lightweight call here.
 * ------------------------------------------------------------------ */
bool encoder_update_user(uint8_t index, bool clockwise) {
    switch (index) {
        case 0: /* left EC11 — media volume */
            tap_code(clockwise ? KC_VOLU : KC_VOLD);
            break;
        case 1: /* right EVQVYA001 roller — mouse wheel */
            tap_code(clockwise ? KC_MS_WH_UP : KC_MS_WH_DOWN);
            break;
    }
    return false; /* we fully handled it; don't run the default map */
}
