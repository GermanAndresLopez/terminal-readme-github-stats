import { ThemeName } from "../constants/themes.constants";
import { HexColor, Theme } from "./theme.types";

/**
 * The available terminal window chrome/header decoration styles.
 */
export type HeaderStyle =
    | 'mac' | 'windows' | 'windows-static' | 'windows11' | 'ubuntu' | 'vscode' | 'retro'
    | 'word' | 'powerpoint' | 'linkedin' | 'chrome' | 'slack';

/**
 * User-provided color overrides for the "custom" theme. Any omitted field
 * falls back to the base palette it's merged onto (see THEMES.dracula).
 */
export interface CustomThemeInput {
    background?: HexColor;
    foreground?: HexColor;
    cursor?: HexColor;
    accent?: HexColor;
}

/**
 * Configuration options for the Terminal session.
 */
export interface TerminalConfig {
    /** The GitHub username to display in the prompt. */
    userName: string;
    /** The visual theme of the terminal — a known theme name, or an already-resolved Theme object (e.g. a custom palette). */
    theme: ThemeName | Theme;
    /** Typing speed simulation in milliseconds per keystroke. */
    typingSpeed: number;
    /** The hostname to display in the prompt (e.g., 'github.com'). */
    hostname: string;
    /** Custom width of the terminal window (default: 80). */
    width?: number;
    /** Custom height of the terminal window (default: 24). */
    height?: number;
    /** The style of the terminal window header/chrome. */
    headerStyle?: HeaderStyle;
    /** Custom list of commands to run. */
    commands?: string[];
}
