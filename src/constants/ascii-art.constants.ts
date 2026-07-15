/**
 * Built-in ASCII-art logo catalog shown next to the `neofetch` command output.
 * Selectable via the `art` config/query option (see NeofetchCommand).
 *
 * Shapes are pre-rendered from vector math (circles, triangles, spirals) on a
 * supersampled grid corrected for the terminal's character-cell aspect ratio,
 * then downsampled to shaded block characters (" ░▒▓█") for anti-aliased edges.
 */
export const ASCII_ART = {
    github: [
        "          ████████          ",
        "       ██████████████       ",
        "     ███  ████████  ███     ",
        "    ████            ████    ",
        "    ████            ████    ",
        "    ███              ███    ",
        "    ████            ████    ",
        "    █████          █████    ",
        "     ██ ████    ███████     ",
        "      ██         █████      ",
        "         ██      ██         "
    ],
    linux: [
        "                                ",
        "                                ",
        "             ▒████▒             ",
        "             ██████░            ",
        "             ░▒▓▓▓░             ",
        "               ▓▓░              ",
        "               ░░               ",
        "           ░▒▓████▓▓░           ",
        "          ▒██████████▓          ",
        "         ▒████████████▓         ",
        "         ▓█████████████         ",
        "          ▓███████████░         ",
        "           ▒▓███████▒           ",
        "              ░░░░              ",
        "           ███    ███           "
    ],
    arch: [
        "               ░▒               ",
        "              ░██▒              ",
        "             ░████▒             ",
        "            ░██████░            ",
        "            ░░░░░░░░            ",
        "           ▓▓▓▓▓▓▓▓▓▓░          ",
        "          ▓███████████░         ",
        "         ▓█████████████         ",
        "        ░▒▒▒▒▒▒▒▒▒▒▒▒▒▒░        ",
        "       ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒       ",
        "      ▒██████████████████▓      ",
        "     ▒████████████████████▓     ",
        "    ▒██████████████████████▓    ",
        "   ▒████████████████████████▓   "
    ],
    debian: [
        "                                ",
        "                                ",
        "                                ",
        "             ░▒▒▒▒░             ",
        "           ░███████▓░           ",
        "           ░████████▓           ",
        "           ░████▓ ▓██           ",
        "          ░▒████▓███▓           ",
        "          ▒████████▓            ",
        "          ░▓█████▓░             ",
        "                                ",
        "                                "
    ],
    windows: [
        "                                ",
        "   ████████████  ████████████   ",
        "   ████████████  ████████████   ",
        "   ████████████  ████████████   ",
        "   ████████████  ████████████   ",
        "                                ",
        "   ████████████  ████████████   ",
        "   ████████████  ████████████   ",
        "   ████████████  ████████████   ",
        "   ████████████  ████████████   ",
        "                                "
    ],
    apple: [
        "               ▒▒░██░           ",
        "               ▒▒ ░░            ",
        "               ░░               ",
        "                                ",
        "         █████████▓░            ",
        "         ██████████████         ",
        "         ██████████████         ",
        "         ██████████████         ",
        "         ██████████████         ",
        "               ░░░              ",
        "                                ",
        "                                "
    ],
    xbox: [
        "      ░░                ░░      ",
        "     ▒██▓░            ░▓██▓     ",
        "     ░█████▒  ░░░░  ░▓████░     ",
        "       ▒██████▓▒▒▓██████▓░      ",
        "         ▓█████▒▒██████         ",
        "        ░█▓▒▓███████▒▒█▒        ",
        "        ░█▓░▓██████▓░▒█▒        ",
        "         ▓█████▓▓██████         ",
        "       ░▓█████▓░░▒██████▒       ",
        "     ░▓████▓░░▒▒▒▒░░▒█████░     ",
        "     ▒███▒            ▒███▓     ",
        "     ░▓▒                ▒▓░     "
    ],
    playstation: [
        "         ░                      ",
        "        ▒▓                      ",
        "       ░██▒         ▒████▓      ",
        "       ████░       ░██████▒     ",
        "      ▓█████        ▒████▓      ",
        "     ▒██████▓                   ",
        "     ░░░░░░░░                   ",
        "                                ",
        "     ████████     ▒▓▒    ░▓▒    ",
        "     █▓▒▒▒▒▓█     ░▓██▒░▓██░    ",
        "     █▒    ▒█       ░████▒      ",
        "     █▓▒▒▒▒▓█      ▒██▓▓██▒░    ",
        "     ████████     ▒█▓░  ░▒█▓    ",
        "                   ░            "
    ]
} as const satisfies Record<string, readonly string[]>;

/**
 * Union of all built-in catalog art names (does not include the dynamic "avatar" option).
 */
export type ArtName = keyof typeof ASCII_ART;

/**
 * Footprint (in characters) reserved for the logo column next to `neofetch` output.
 * Shared by NeofetchCommand (which blanks this area out in "photo" mode) and
 * TerminalGeneratorEngine (which overlays the real photo into this exact slot).
 */
export const PHOTO_SLOT_WIDTH = 30;
export const PHOTO_SLOT_HEIGHT = 11;
