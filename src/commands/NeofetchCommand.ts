import { TerminalService } from "../services/TerminalService";
import { CommandContext } from "../resolvers/DataResolver";
import { NeoFetchGraphicsData } from "../types/graphics.types";
import { TerminalCommand } from "./TerminalCommand";
import { GithubUserStats, GithubRepoStats } from "../types/github.types";
import { ASCII_ART, ArtName, PHOTO_SLOT_WIDTH, PHOTO_SLOT_HEIGHT } from "../constants/ascii-art.constants";
import { imageToAscii } from "../utils/ascii-art.utils";

/**
 * Command representing faked system telemetry and stats summary using "neofetch".
 * Polymorphically adapts to show user profile details or repository metadata.
 */
export class NeofetchCommand implements TerminalCommand {
    public readonly name = "neofetch";

    public async execute(terminal: TerminalService, context: CommandContext): Promise<void> {
        const hostname = context.config.hostname || "github.com";
        const neoFetchData: NeoFetchGraphicsData = {
            title: {
                user: context.target,
                host: hostname
            },
            info: {},
            logo: []
        };

        if (context.type === 'repo') {
            const stats = context.stats as GithubRepoStats;
            neoFetchData.title.user = stats.name;
            neoFetchData.info = {
                "OS": "GitHub Repo",
                "Stars": stats.stars.toString(),
                "Forks": stats.forks.toString(),
                "Watchers": stats.watchers.toString(),
                "Issues": stats.openIssues.toString(),
                "Size": `${(stats.size / 1024).toFixed(2)} MB`,
                "License": stats.license ?? "None"
            };
            neoFetchData.logo = await this.resolveArt(context.config.art, undefined);
        } else {
            const stats = context.stats as GithubUserStats;
            neoFetchData.info = {
                "OS": "GitHub Profile",
                "Repos": stats.repoCount.toString(),
                "Gists": stats.gistCount.toString(),
                "Stars": stats.totalStars.toString(),
                "Followers": stats.followersCount.toString(),
                "Pull Requests": stats.prCount.toString(),
                "Issues": stats.issueCount.toString(),
            };
            neoFetchData.logo = await this.resolveArt(context.config.art, stats.avatarUrl ?? undefined);
        }

        const { startRow, startTime } = terminal.addCommand(this.name, neoFetchData, "neoFetch");

        if (context.type === 'user' && context.config.art === 'photo') {
            const avatarUrl = (context.stats as GithubUserStats).avatarUrl;
            if (avatarUrl) {
                context.photoOverlay = { avatarUrl, startRow, startTime };
            }
        }
    }

    /**
     * Resolves the requested `art` config option into concrete ASCII-art lines.
     * - "avatar" converts the user's real GitHub profile picture into ASCII art.
     * - "photo" reserves blank space here; the real image is overlaid on the
     *   final SVG afterwards by TerminalGeneratorEngine (see applyAvatarPhoto).
     * - Anything else falls back to the named catalog entry (or "github").
     * Avatar conversion failures (network, decode) fall back to the catalog too.
     */
    private async resolveArt(art: string | undefined, avatarUrl: string | undefined): Promise<string[]> {
        if (art === "photo" && avatarUrl) {
            return Array(PHOTO_SLOT_HEIGHT).fill(" ".repeat(PHOTO_SLOT_WIDTH));
        }

        if (art === "avatar" && avatarUrl) {
            try {
                return await imageToAscii(avatarUrl);
            } catch (error) {
                console.warn(`[neofetch] Failed to convert avatar to ASCII art, falling back to default:`, error);
            }
        }

        const artName = (art && art in ASCII_ART ? art : "github") as ArtName;
        return [...ASCII_ART[artName]];
    }
}
