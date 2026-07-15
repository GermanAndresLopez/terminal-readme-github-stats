import { IncomingMessage, ServerResponse } from "http";
import * as querystring from "querystring";
import { TerminalGeneratorEngine } from "../src/services/TerminalGeneratorEngine";

/**
 * Resolves live GitHub stats only (no SVG rendering) — the only endpoint that
 * actually spends GitHub API quota. Callers (e.g. the Visual Configurator) can
 * cache the returned `stats` and re-render as many times as they want via
 * api/render.ts without hitting GitHub again.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
    try {
        const rawQuery = (req.url || "").split("?")[1] || "";
        const query = querystring.parse(rawQuery);

        const username = (query.username as string) || "";
        const sourceType = ((query.sourceType as string) || "user") as "user" | "repo";
        const target = (query.target as string) || username;

        if (!target) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing required 'username' or 'target' query parameter." }));
            return;
        }

        const token = process.env.GHT || process.env.GITHUB_TOKEN || undefined;
        const stats = await TerminalGeneratorEngine.resolveStats(target, token, sourceType);

        res.writeHead(200, {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=1800",
            "Access-Control-Allow-Origin": "*"
        });
        res.end(JSON.stringify({ stats, sourceType, target }));
    } catch (error: any) {
        console.error("Vercel Serverless API Error (resolve):", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            error: "Failed to resolve GitHub stats.",
            details: error?.message || error
        }));
    }
}
