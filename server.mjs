import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3100);
const DIST_DIR = path.join(__dirname, "dist");
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "project-data.json");

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function sendText(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".woff2":
      return "font/woff2";
    default:
      return "application/octet-stream";
  }
}

async function readBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > 1024 * 1024) {
      throw new Error("Payload too large");
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

async function handleApi(req, res) {
  if (req.url !== "/api/project") return false;

  if (req.method === "GET") {
    try {
      const raw = await readFile(DATA_FILE, "utf-8");
      sendJson(res, 200, JSON.parse(raw));
      return true;
    } catch {
      res.writeHead(204);
      res.end();
      return true;
    }
  }

  if (req.method === "PUT") {
    try {
      const raw = await readBody(req);
      const parsed = JSON.parse(raw);
      await mkdir(path.dirname(DATA_FILE), { recursive: true });
      await writeFile(DATA_FILE, JSON.stringify(parsed, null, 2), "utf-8");
      sendJson(res, 200, { ok: true });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid request";
      sendJson(res, 400, { ok: false, error: message });
      return true;
    }
  }

  sendText(res, 405, "Method not allowed");
  return true;
}

async function serveStatic(req, res) {
  const reqPath = (req.url || "/").split("?")[0];
  const unsafe = decodeURIComponent(reqPath);
  const cleaned = unsafe.replace(/^\/+/, "");
  const absolute = path.join(DIST_DIR, cleaned);
  const safePath = absolute.startsWith(DIST_DIR) ? absolute : DIST_DIR;

  try {
    const data = await readFile(safePath);
    res.writeHead(200, { "Content-Type": contentTypeFor(safePath) });
    res.end(data);
    return;
  } catch {
    // Fall through to SPA index.
  }

  try {
    const indexPath = path.join(DIST_DIR, "index.html");
    const index = await readFile(indexPath);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(index);
  } catch {
    sendText(res, 500, "Missing dist/index.html");
  }
}

const server = createServer(async (req, res) => {
  if (await handleApi(req, res)) return;
  await serveStatic(req, res);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
