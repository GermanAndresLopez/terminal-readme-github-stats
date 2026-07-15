import * as fs from "fs";
import * as path from "path";
import { CommandRegistry } from "../commands/CommandRegistry";
import { ThemeName, THEMES } from "../constants/themes.constants";
import { CommandContext, CommandContextType } from "../resolvers/DataResolver";
import { GithubRepoResolver } from "../resolvers/GithubRepoResolver";
import { GithubUserResolver } from "../resolvers/GithubUserResolver";
import { Theme } from "../types/theme.types";
import { loadConfig, loadConfigFromPath } from "../utils/file.utils";
import { TerminalService } from "./TerminalService";
import { RepoStatus, GithubUserStats, GithubRepoStats } from "../types/github.types";
import { HeaderStyle, CustomThemeInput } from "../types/terminal.types";
import { fetchImageAsDataUri } from "../utils/ascii-art.utils";
import { PHOTO_SLOT_WIDTH, PHOTO_SLOT_HEIGHT } from "../constants/ascii-art.constants";

/**
 * Merges user-provided color overrides onto the Dracula base palette so a
 * "custom" theme always has a complete 16-slot ANSI palette, even if the
 * caller only customized background/foreground/cursor/accent.
 */
function resolveCustomTheme(overrides: CustomThemeInput): Theme {
    const base = THEMES.dracula;
    const accent = overrides.accent || base.colors["4"];
    return {
        ...base,
        name: "custom",
        background: overrides.background || base.background,
        foreground: overrides.foreground || base.foreground,
        cursor: overrides.cursor || base.cursor,
        colors: {
            ...base.colors,
            "4": accent,
            "12": accent
        }
    };
}

/**
 * High-Level Orchestrator representing the complete three-stage SVG Stats Generator.
 * 1. Stage 1: Resolves statistics dynamically based on source layers (e.g. user details).
 * 2. Stage 2: Chains and executes configured terminal typing simulations (Commands Registry).
 * 3. Stage 3: Renders standard SVG frames and applies window title decorations.
 */
export class TerminalGeneratorEngine {
    /**
     * Orchestrates and runs the dynamic SVG stats generation cycle.
     * 
     * @param username The target GitHub username profile.
     * @param token Optional access token for API authorization.
     * @param outputPath Output path to write the generated SVG file (default: working directory).
     * @param configPath Optional configuration path to load.
     * @param sourceTypeOverride Explicitly force sourceType to "user" or "repo".
     */
    public static async generate(username: string, token?: string, outputPath?: string, configPath?: string, sourceTypeOverride?: "user" | "repo"): Promise<void> {
        // --- Load & Parse Configuration ---
        const config = configPath ? loadConfigFromPath(configPath) : loadConfig();
        
        console.log(`[Stage 1/3] Loading configuration and resolving stats...`);
        const styledSvg = await TerminalGeneratorEngine.generateSvgString(username, token, config, sourceTypeOverride);

        console.log(`[Stage 3/3] Writing SVG to local storage...`);
        // Save output to local filesystem
        const finalPath = outputPath || path.resolve(process.cwd(), "github_stats.svg");
        fs.writeFileSync(finalPath, styledSvg);

        console.log(`✓ Terminal Stats SVG successfully compiled at: ${finalPath}`);
    }

    /**
     * Generates and returns the styled SVG string directly in memory.
     * Helpful for serverless API endpoints and web integration.
     */
    public static async generateSvgString(
        username: string, 
        token?: string, 
        configOverride?: any, 
        sourceTypeOverride?: "user" | "repo",
        useMockData: boolean = false
    ): Promise<string> {
        const config = configOverride || loadConfig();
        const finalThemeName = (config.theme || "dracula") as ThemeName | "custom";
        const theme = finalThemeName === "custom" && config.customTheme
            ? resolveCustomTheme(config.customTheme as CustomThemeInput)
            : THEMES[finalThemeName as ThemeName] || THEMES.dracula;
        const hostname = config.hostname || "github.com";
        const typingSpeed = typeof config.typingSpeed === "number" ? config.typingSpeed : 100;
        const headerStyle: HeaderStyle = config.headerStyle || "mac";

        const defaultCommands = ["whoami", "neofetch", "uptime", "exit"];
        const commandsList = Array.isArray(config.commands) ? config.commands : defaultCommands;

        // Check configuration for sourceType (defaults to user)
        const sourceType = sourceTypeOverride || (config.sourceType || "user") as CommandContextType;
        // Check for target. If sourceTypeOverride is explicitly passed, prioritize the CLI username target.
        const target = sourceTypeOverride ? username : (config.target || username);

        // --- Stage 1: Resolve Data ---
        let stats;
        if (useMockData) {
            if (sourceType === "repo") {
                stats = {
                    name: target.split("/")[1] || "github-stats-terminal-style",
                    fullName: target,
                    description: "Generate GitHub Stats in a retro-style terminal emulator interface!",
                    stars: 128,
                    forks: 32,
                    watchers: 128,
                    openIssues: 3,
                    size: 2450,
                    license: "MIT",
                    createdAt: "2023-03-12T00:00:00Z",
                    pushedAt: "2026-05-27T00:00:00Z",
                    uptime: { years: 3, days: 76, since: "3 years, 76 days" },
                    languages: [
                        { name: "TypeScript", percentage: 84 },
                        { name: "JavaScript", percentage: 12 },
                        { name: "HTML", percentage: 4 }
                    ],
                    recentCommits: [
                        { sha: "9f8a3d1", author: "octocat", date: "2026-05-27", message: "feat: Add interactive playground builder" },
                        { sha: "4b2e1f2", author: "octocat", date: "2026-05-26", message: "refactor: Modularize graphics rendering engine" },
                        { sha: "7d9c8e3", author: "octocat", date: "2026-05-24", message: "chore: Update theme variables & palettes" }
                    ]
                };
            } else {
                stats = {
                    name: "John Doe",
                    bio: "Building the future of developer terminal cards 🚀",
                    repoCount: 42,
                    gistCount: 12,
                    followersCount: 854,
                    totalStars: 432,
                    totalForks: 128,
                    commitCount: 2450,
                    issueCount: 89,
                    prCount: 164,
                    uptime: { years: 3, days: 142, since: "3 years, 142 days" },
                    top_repos: [
                        { name: "github-stats-terminal", stars: 254, forks: 43, language: "TypeScript" },
                        { name: "portfoli-theme", stars: 102, forks: 12, language: "CSS" },
                        { name: "react-lazy-loader", stars: 64, forks: 8, language: "JavaScript" }
                    ],
                    processes: [
                        { name: "github-stats-terminal", status: RepoStatus.Running, lastActivity: "2 hours ago" },
                        { name: "portfoli-theme", status: RepoStatus.Idle, lastActivity: "12 days ago" },
                        { name: "react-lazy-loader", status: RepoStatus.Zombie, lastActivity: "412 days ago" }
                    ],
                    languages: [
                        { name: "TypeScript", percentage: 84 },
                        { name: "JavaScript", percentage: 12 },
                        { name: "HTML", percentage: 4 }
                    ]
                };
            }
        } else if (config.providedStats) {
            // Stats were already resolved elsewhere (e.g. api/resolve.ts, cached client-side)
            // — skip hitting the GitHub API again purely to re-render with a new theme/style.
            stats = config.providedStats;
        } else {
            stats = await TerminalGeneratorEngine.resolveStats(target, token, sourceType);
        }

        const context: CommandContext = {
            type: sourceType,
            target,
            stats,
            config
        };

        // --- Stage 2: Generate Commands ---
        // Auto-scale terminal console height dynamically based on command length to look premium!
        const terminalHeight = Math.max(24, Math.min(60, 10 + commandsList.length * 4.5));

        // Extract simple prompt username (for repositories, we take the repository owner)
        const promptUserName = sourceType === "repo" ? target.split("/")[0] : target;

        const terminal = new TerminalService({
            userName: promptUserName,
            hostname: hostname,
            typingSpeed: typingSpeed,
            theme: theme,
            headerStyle: headerStyle,
            width: 80,
            height: terminalHeight
        });

        // Run commands dynamically from config arrays
        for (const cmdName of commandsList) {
            if (typeof cmdName !== "string") continue;
            const command = CommandRegistry.getCommand(cmdName);
            await command.execute(terminal, context);
        }

        // --- Stage 3: Render & Post-Process ---
        const rawSvg = terminal.render();
        let finalSvg = TerminalGeneratorEngine.applyHeader(rawSvg, headerStyle, theme);

        if (context.photoOverlay) {
            finalSvg = await TerminalGeneratorEngine.applyAvatarPhoto(
                finalSvg,
                context.photoOverlay.avatarUrl,
                context.photoOverlay.startRow,
                context.photoOverlay.startTime,
                terminal.getElapsedTime(),
                headerStyle
            );
        }

        return finalSvg;
    }

    /**
     * Resolves live GitHub stats only, without rendering — the only step that needs
     * to hit the GitHub API. Used by api/resolve.ts so the client can cache the
     * result (e.g. in localStorage) and re-render with different themes/styles
     * afterwards via api/render.ts, without spending any more GitHub API quota.
     *
     * @param target The username or "owner/repo" to resolve.
     * @param token Optional access token for API authorization.
     * @param sourceType Whether to resolve a user profile or a repository.
     */
    public static async resolveStats(
        target: string,
        token: string | undefined,
        sourceType: CommandContextType
    ): Promise<GithubUserStats | GithubRepoStats> {
        const resolver = sourceType === "repo" ? new GithubRepoResolver() : new GithubUserResolver();
        return resolver.resolve(target, token);
    }

    /**
     * Applies the custom window decoration style to the rendered SVG string.
     *
     * @param svg The raw SVG string compiled from the terminal events.
     * @param style The requested title bar/window chrome style.
     * @param theme The visual color palette configuration.
     * @returns The decorated SVG string.
     */
    private static applyHeader(svg: string, style: HeaderStyle, theme: Theme): string {
        if (style === 'retro' || style === 'mac') {
            return svg;
        }

        // Extract the width of the SVG container (shared by every non-mac/retro chrome style)
        const widthMatch = svg.match(/<svg[^>]+width="(\d+(?:\.\d+)?)"/);
        const width = widthMatch ? parseFloat(widthMatch[1]!) : 840;
        const macDotsRegex = /<svg y="0%" x="0%"><circle cx="20"[^>]*><\/circle><circle cx="40"[^>]*><\/circle><circle cx="60"[^>]*><\/circle><\/svg>/;

        const headers: Record<Exclude<HeaderStyle, 'mac' | 'retro'>, () => string> = {
            windows: () => {
                // Control buttons tinted with the theme's accent colors (matches the vibrancy of the 'mac' dots)
                const buttonsX = width - 70;
                return `
<svg y="0%" x="0%" width="100%">
  <!-- Window Title -->
  <text x="20" y="24" font-family="Monaco,Consolas,Menlo,monospace" font-size="12" fill="${theme.foreground}88">Command Prompt</text>
  <!-- Windows Window Control Buttons on the right -->
  <g stroke-dasharray="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4" fill="none">
    <!-- Minimize -->
    <line x1="${buttonsX}" y1="12" x2="${buttonsX + 10}" y2="12" stroke="${theme.colors["3"]}" />
    <!-- Maximize -->
    <rect x="${buttonsX + 20}" y="2" width="10" height="10" stroke="${theme.colors["2"]}" />
    <!-- Close -->
    <line x1="${buttonsX + 40}" y1="2" x2="${buttonsX + 50}" y2="12" stroke="${theme.colors["1"]}" />
    <line x1="${buttonsX + 50}" y1="2" x2="${buttonsX + 40}" y2="12" stroke="${theme.colors["1"]}" />
  </g>
</svg>`.trim();
            },
            // Plain monochrome fallback, kept for anyone who prefers the flat, no-accent original look
            'windows-static': () => {
                const buttonsX = width - 70;
                return `
<svg y="0%" x="0%" width="100%">
  <!-- Window Title -->
  <text x="20" y="24" font-family="Monaco,Consolas,Menlo,monospace" font-size="12" fill="${theme.foreground}88">Command Prompt</text>
  <!-- Windows Window Control Buttons on the right -->
  <g transform="translate(${buttonsX}, 10)" stroke="${theme.foreground}88" stroke-dasharray="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2" fill="none">
    <!-- Minimize -->
    <line x1="0" y1="12" x2="10" y2="12" />
    <!-- Maximize -->
    <rect x="20" y="2" width="10" height="10" />
    <!-- Close -->
    <line x1="40" y1="2" x2="50" y2="12" />
    <line x1="50" y1="2" x2="40" y2="12" />
  </g>
</svg>`.trim();
            },
            windows11: () => {
                const buttonsX = width - 70;
                return `
<svg y="0%" x="0%" width="100%">
  <!-- Window Title -->
  <text x="20" y="24" font-family="Monaco,Consolas,Menlo,monospace" font-size="12" fill="${theme.foreground}88">Windows Terminal</text>
  <!-- Flat Windows 11 minimize/maximize -->
  <g transform="translate(${buttonsX}, 10)" stroke="${theme.foreground}88" stroke-linecap="round" stroke-width="1.1" fill="none">
    <line x1="0" y1="12" x2="10" y2="12" />
    <rect x="20" y="4" width="9" height="9" rx="1" />
  </g>
  <!-- Close, tinted with the theme accent -->
  <g transform="translate(${buttonsX + 40}, 10)" stroke="${theme.colors["1"]}" stroke-linecap="round" stroke-width="1.4" fill="none">
    <line x1="0" y1="2" x2="10" y2="12" />
    <line x1="10" y1="2" x2="0" y2="12" />
  </g>
</svg>`.trim();
            },
            ubuntu: () => `
<svg y="0%" x="0%" width="100%">
  <!-- Header separator -->
  <line x1="0" y1="49" x2="100%" y2="49" stroke="${theme.foreground}22" stroke-width="1" />
  <!-- Menu (hamburger) icon on the left -->
  <g transform="translate(18, 18)" stroke="${theme.foreground}88" stroke-width="1.4" stroke-linecap="round">
    <line x1="0" y1="0" x2="14" y2="0" />
    <line x1="0" y1="5" x2="14" y2="5" />
    <line x1="0" y1="10" x2="14" y2="10" />
  </g>
  <!-- Centered window title -->
  <text x="50%" y="24" text-anchor="middle" font-family="Monaco,Consolas,Menlo,monospace" font-size="12" fill="${theme.foreground}88">Terminal</text>
  <!-- Single close button on the right -->
  <g transform="translate(${width - 34}, 10)" stroke="${theme.foreground}88" stroke-width="1.2" fill="none">
    <circle cx="7" cy="7" r="7" />
    <line x1="4" y1="4" x2="10" y2="10" />
    <line x1="10" y1="4" x2="4" y2="10" />
  </g>
</svg>`.trim(),
            vscode: () => `
<svg y="0%" x="0%" width="100%">
  <!-- Accent-colored active tab indicator -->
  <rect x="0" y="0" width="100%" height="3" fill="${theme.colors["4"]}" />
  <rect x="10" y="6" width="130" height="30" rx="4" fill="${theme.foreground}0d" />
  <text x="24" y="26" font-family="Monaco,Consolas,Menlo,monospace" font-size="11" letter-spacing="1" fill="${theme.foreground}aa">TERMINAL</text>
  <!-- Panel "more actions" kebab menu -->
  <g fill="${theme.foreground}88">
    <circle cx="${width - 30}" cy="16" r="1.6" />
    <circle cx="${width - 24}" cy="16" r="1.6" />
    <circle cx="${width - 18}" cy="16" r="1.6" />
  </g>
</svg>`.trim(),
            word: () => `
<svg y="0%" x="0%" width="100%">
  <rect x="0" y="0" width="100%" height="3" fill="#2b579a" />
  <rect x="14" y="12" width="20" height="20" rx="3" fill="#2b579a" />
  <text x="24" y="27" text-anchor="middle" font-family="Georgia,serif" font-size="14" font-weight="bold" fill="#ffffff">W</text>
  <text x="44" y="25" font-family="Segoe UI,Arial,sans-serif" font-size="12" fill="${theme.foreground}aa">Documento1 - Word</text>
</svg>`.trim(),
            powerpoint: () => `
<svg y="0%" x="0%" width="100%">
  <rect x="0" y="0" width="100%" height="3" fill="#c43e1c" />
  <rect x="14" y="12" width="20" height="20" rx="3" fill="#c43e1c" />
  <text x="24" y="27" text-anchor="middle" font-family="Georgia,serif" font-size="14" font-weight="bold" fill="#ffffff">P</text>
  <text x="44" y="25" font-family="Segoe UI,Arial,sans-serif" font-size="12" fill="${theme.foreground}aa">Presentacion1 - PowerPoint</text>
</svg>`.trim(),
            linkedin: () => `
<svg y="0%" x="0%" width="100%">
  <rect x="0" y="0" width="100%" height="3" fill="#0a66c2" />
  <rect x="14" y="12" width="20" height="20" rx="4" fill="#0a66c2" />
  <text x="24" y="27" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#ffffff">in</text>
  <text x="44" y="25" font-family="Segoe UI,Arial,sans-serif" font-size="12" fill="${theme.foreground}aa">LinkedIn</text>
  <g stroke="${theme.foreground}88" stroke-width="1.2" fill="none">
    <line x1="${width - 26}" y1="14" x2="${width - 16}" y2="24" />
    <line x1="${width - 16}" y1="14" x2="${width - 26}" y2="24" />
  </g>
</svg>`.trim(),
            chrome: () => `
<svg y="0%" x="0%" width="100%">
  <rect x="10" y="8" width="150" height="28" rx="6" fill="${theme.foreground}0d" />
  <circle cx="22" cy="18" r="3" fill="#ea4335" />
  <circle cx="30" cy="18" r="3" fill="#fbbc05" />
  <circle cx="22" cy="26" r="3" fill="#34a853" />
  <circle cx="30" cy="26" r="3" fill="#4285f4" />
  <text x="40" y="26" font-family="Arial,sans-serif" font-size="11" fill="${theme.foreground}aa">New Tab</text>
  <g stroke="${theme.foreground}88" stroke-width="1.2" fill="none">
    <line x1="${width - 26}" y1="12" x2="${width - 16}" y2="22" />
    <line x1="${width - 16}" y1="12" x2="${width - 26}" y2="22" />
  </g>
</svg>`.trim(),
            slack: () => `
<svg y="0%" x="0%" width="100%">
  <rect x="0" y="0" width="100%" height="3" fill="#4a154b" />
  <text x="20" y="19" font-family="Monaco,Consolas,monospace" font-size="13" font-weight="bold" fill="#ECB22E">#</text>
  <text x="32" y="19" font-family="Segoe UI,Arial,sans-serif" font-size="11" fill="${theme.foreground}aa">general</text>
  <circle cx="${width - 60}" cy="16" r="3" fill="#E01E5A" />
  <circle cx="${width - 48}" cy="16" r="3" fill="#36C5F0" />
  <circle cx="${width - 36}" cy="16" r="3" fill="#2EB67D" />
</svg>`.trim()
        };

        const buildHeader = headers[style as Exclude<HeaderStyle, 'mac' | 'retro'>];
        return buildHeader ? svg.replace(macDotsRegex, buildHeader()) : svg;
    }

    /**
     * Overlays the user's real GitHub avatar (as an actual image, not ASCII art) as a
     * circular badge in the top-right corner of the card. Used by the "photo" art mode.
     * Any failure (network, invalid image) leaves the SVG untouched.
     *
     * @param svg The fully rendered (and header-decorated) SVG string.
     * @param avatarUrl The user's GitHub avatar URL.
     */
    private static async applyAvatarPhoto(
        svg: string,
        avatarUrl: string,
        startRow: number,
        startTime: number,
        totalDuration: number,
        headerStyle: HeaderStyle
    ): Promise<string> {
        try {
            const dataUri = await fetchImageAsDataUri(avatarUrl);

            // svg-term's fixed rendering constants (DEFAULT_THEME): each column is 10px wide,
            // each row is fontSize * lineHeight * 10 = 1.67 * 1.3 * 10 px tall. The terminal
            // content is offset by (15, 50) inside the outer frame whenever window chrome is
            // drawn (i.e. any headerStyle other than "retro").
            const CHAR_WIDTH_PX = 10;
            const CHAR_HEIGHT_PX = 1.67 * 1.3 * 10;
            const offsetX = headerStyle === "retro" ? 0 : 15;
            const offsetY = headerStyle === "retro" ? 0 : 50;

            const slotWidthPx = PHOTO_SLOT_WIDTH * CHAR_WIDTH_PX;
            const slotHeightPx = PHOTO_SLOT_HEIGHT * CHAR_HEIGHT_PX;
            const slotX = offsetX;
            const slotY = offsetY + startRow * CHAR_HEIGHT_PX;

            const diameter = Math.min(slotWidthPx, slotHeightPx) * 0.85;
            const cx = slotX + slotWidthPx / 2;
            const cy = slotY + slotHeightPx / 2;
            const x = cx - diameter / 2;
            const y = cy - diameter / 2;

            // Stay invisible until the recording reaches the neofetch line, then pop in — same
            // beat as the rest of the terminal's steps(1,end) typing reveal — and loop with it.
            const revealPercent = totalDuration > 0 ? Math.min(99.9, (startTime / totalDuration) * 100) : 0;
            const badge = `
<style>
.avatarPhotoReveal{opacity:0;animation:avatarPhotoRevealKf ${totalDuration}s steps(1,end) infinite;}
@keyframes avatarPhotoRevealKf{
0%{opacity:0}
${revealPercent}%{opacity:0}
${revealPercent}%{opacity:1}
100%{opacity:1}
}
</style>
<defs><clipPath id="avatarPhotoClip"><circle cx="${cx}" cy="${cy}" r="${diameter / 2}" /></clipPath></defs>
<image class="avatarPhotoReveal" href="${dataUri}" x="${x}" y="${y}" width="${diameter}" height="${diameter}" clip-path="url(#avatarPhotoClip)" preserveAspectRatio="xMidYMid slice" />`.trim();

            const lastCloseIdx = svg.lastIndexOf("</svg>");
            if (lastCloseIdx === -1) return svg;
            return svg.slice(0, lastCloseIdx) + badge + svg.slice(lastCloseIdx);
        } catch (error) {
            console.warn("[neofetch] Failed to embed avatar photo, leaving card unchanged:", error);
            return svg;
        }
    }
}
