import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import statsHandler from "./api/stats";
import resolveHandler from "./api/resolve";
import renderHandler from "./api/render";

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  const url = req.url || "/";

  if (url.startsWith("/api/stats")) {
    await statsHandler(req, res);
    return;
  }

  if (url.startsWith("/api/resolve")) {
    await resolveHandler(req, res);
    return;
  }

  if (url.startsWith("/api/render")) {
    await renderHandler(req, res);
    return;
  }

  // Static file serving for the configurator (index.html + any relative assets)
  let filePath = url.split("?")[0] || "/";
  if (filePath === "/") filePath = "/index.html";
  const fullPath = path.join(__dirname, filePath);

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(fullPath);
    const contentType = ext === ".html" ? "text/html"
      : ext === ".js" ? "application/javascript"
      : ext === ".css" ? "text/css"
      : ext === ".svg" ? "image/svg+xml"
      : ext === ".png" ? "image/png"
      : "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Dev server (local stand-in for "vercel dev") listening on http://localhost:${PORT}`);
});
