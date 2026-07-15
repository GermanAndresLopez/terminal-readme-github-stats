import { IncomingMessage, ServerResponse } from "http";
import { TerminalGeneratorEngine } from "../src/services/TerminalGeneratorEngine";
import { buildConfigOverride } from "../src/utils/config-override.utils";

function readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", chunk => { body += chunk; });
        req.on("end", () => resolve(body));
        req.on("error", reject);
    });
}

/**
 * Renders an SVG card from stats the caller already resolved (via api/resolve.ts),
 * without ever touching the GitHub API itself. This is what lets the Visual
 * Configurator re-render on every theme/header/art change without spending any
 * GitHub API quota — only switching the username spends a real request.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
    try {
        if (req.method !== "POST") {
            res.writeHead(405, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Method not allowed, use POST." }));
            return;
        }

        const rawBody = await readBody(req);
        const body = JSON.parse(rawBody || "{}");

        const target = body.target as string;
        const sourceType = (body.sourceType as string) || "user";

        if (!target || !body.stats) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing required 'target' or 'stats' in request body." }));
            return;
        }

        const configOverride = {
            ...buildConfigOverride({
                theme: body.theme,
                headerStyle: body.headerStyle,
                typingSpeed: body.typingSpeed,
                hostname: body.hostname,
                commands: body.commands,
                sourceType,
                target,
                art: body.art,
                customCommands: body.customCommands,
                customTheme: body.customTheme
            }),
            providedStats: body.stats
        };

        const svgString = await TerminalGeneratorEngine.generateSvgString(
            target,
            undefined,
            configOverride,
            sourceType as "user" | "repo",
            false
        );

        res.writeHead(200, {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "*"
        });
        res.end(svgString);
    } catch (error: any) {
        console.error("Vercel Serverless API Error (render):", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            error: "Failed to render terminal SVG from provided stats.",
            details: error?.message || error
        }));
    }
}
