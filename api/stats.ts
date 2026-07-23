import { IncomingMessage, ServerResponse } from "http";
import * as querystring from "querystring";
import { TerminalGeneratorEngine } from "../src/services/TerminalGeneratorEngine";
import { buildConfigOverride } from "../src/utils/config-override.utils";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    try {
        const rawQuery = (req.url || "").split("?")[1] || "";
        const query = querystring.parse(rawQuery);

        const username = (query.username as string) || "";
        const target = (query.target as string) || username;
        const sourceType = (query.sourceType as string) || "user";
        const mock = query.mock === "true" || query.mock === "1";

        // Validation
        if (!target) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing required 'username' or 'target' query parameter." }));
            return;
        }

        const configOverride = buildConfigOverride({
            theme: query.theme as string,
            headerStyle: query.headerStyle as string,
            effect: query.effect as string,
            typingSpeed: query.typingSpeed as string,
            hostname: query.hostname as string,
            commands: query.commands as string,
            sourceType,
            target,
            art: query.art as string,
            customCommands: query.customCommands as string,
            customTheme: query.customTheme as string
        });

        // Leverage server environment secrets if available
        const token = process.env.GHT || process.env.GITHUB_TOKEN || undefined;

        // Generate the SVG string in memory
        const svgString = await TerminalGeneratorEngine.generateSvgString(
            target,
            token,
            configOverride,
            sourceType as "user" | "repo",
            mock
        );

        // Configure edge-caching headers (Cache-Control: public, s-maxage=3600, stale-while-revalidate=1800)
        res.writeHead(200, {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=1800",
            "Access-Control-Allow-Origin": "*"
        });

        res.end(svgString);
    } catch (error: any) {
        console.error("Vercel Serverless API Error:", error);

        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            error: "Failed to generate dynamic terminal SVG.",
            details: error?.message || error
        }));
    }
}
