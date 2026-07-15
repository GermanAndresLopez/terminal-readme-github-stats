import { ThemeName } from "../constants/themes.constants";
import { HeaderStyle, CustomThemeInput } from "../types/terminal.types";

/**
 * Raw, loosely-typed request parameters as they arrive from either a query
 * string (api/stats.ts, api/resolve.ts) or a JSON request body (api/render.ts).
 */
export interface RawConfigParams {
    theme?: string;
    headerStyle?: string;
    typingSpeed?: string | number;
    hostname?: string;
    commands?: string | string[];
    sourceType?: string;
    target?: string;
    art?: string;
    customCommands?: string | Record<string, string>;
    customTheme?: string | CustomThemeInput;
}

function parseMaybeJson<T>(value: string | T | undefined): T | undefined {
    if (!value) return undefined;
    if (typeof value !== "string") return value;
    try {
        return JSON.parse(value) as T;
    } catch {
        return undefined;
    }
}

/**
 * Builds the shared TerminalGeneratorEngine config override object from raw
 * request parameters. Used by every API endpoint so query-string (GET) and
 * JSON-body (POST) callers stay in sync without duplicating this parsing logic.
 */
export function buildConfigOverride(params: RawConfigParams) {
    let commandsList = ["whoami", "neofetch", "uptime", "exit"];
    if (typeof params.commands === "string" && params.commands) {
        commandsList = params.commands.split(",").map(c => c.trim()).filter(Boolean);
    } else if (Array.isArray(params.commands) && params.commands.length > 0) {
        commandsList = params.commands;
    }

    return {
        theme: (params.theme || "dracula") as ThemeName | "custom",
        headerStyle: (params.headerStyle || "mac") as HeaderStyle,
        hostname: params.hostname || "github.com",
        typingSpeed: typeof params.typingSpeed === "number" ? params.typingSpeed : parseInt(String(params.typingSpeed || "100"), 10),
        sourceType: params.sourceType || "user",
        target: params.target,
        commands: commandsList,
        customCommands: parseMaybeJson(params.customCommands) ?? {},
        customTheme: parseMaybeJson(params.customTheme),
        art: params.art || "github"
    };
}
