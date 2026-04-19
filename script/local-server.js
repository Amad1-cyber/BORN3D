const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT) || 3000;
const LIVE_RELOAD_PATH = "/__born3d_events";
const WATCH_PATHS = [
  path.join(ROOT_DIR, "play.html"),
  path.join(ROOT_DIR, "game.html"),
  path.join(ROOT_DIR, "index.html"),
  path.join(ROOT_DIR, "src", "app.js"),
  path.join(ROOT_DIR, "src", "game.css"),
  path.join(ROOT_DIR, "src", "propLoader.js"),
  path.join(ROOT_DIR, "styles", "main.css")
];

const sseClients = new Set();
let reloadTimer = null;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".otf": "font/otf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".wav": "audio/wav",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function sendFile(res, filePath) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Internal Server Error");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "Surrogate-Control": "no-store"
    });
    res.end(data);
  });
}

function broadcastReload() {
  for (const client of sseClients) {
    client.write("event: reload\n");
    client.write(`data: ${Date.now()}\n\n`);
  }
}

function scheduleReloadBroadcast() {
  if (reloadTimer) {
    clearTimeout(reloadTimer);
  }
  reloadTimer = setTimeout(() => {
    reloadTimer = null;
    broadcastReload();
  }, 150);
}

function watchTarget(targetPath) {
  try {
    fs.watch(targetPath, { persistent: true }, () => {
      scheduleReloadBroadcast();
    });
  } catch (error) {
    console.warn(`Live reload watcher failed for ${targetPath}: ${error.message}`);
  }
}

function resolveRequestPath(requestPath) {
  if (requestPath === "/") {
    return path.join(ROOT_DIR, "index.html");
  }

  if (requestPath === "/play") {
    return path.join(ROOT_DIR, "play.html");
  }

  if (requestPath === "/game") {
    return path.join(ROOT_DIR, "game.html");
  }

  const normalized = path.normalize(requestPath).replace(/^(\.\.(\/|\\|$))+/, "");
  return path.join(ROOT_DIR, normalized);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  const requestPath = decodeURIComponent(url.pathname);

  if (requestPath === LIVE_RELOAD_PATH) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*"
    });
    res.write("retry: 1000\n\n");
    sseClients.add(res);
    req.on("close", () => {
      sseClients.delete(res);
    });
    return;
  }

  const filePath = resolveRequestPath(requestPath);

  fs.stat(filePath, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(res, filePath);
      return;
    }

    if (requestPath === "/play.html") {
      sendFile(res, path.join(ROOT_DIR, "play.html"));
      return;
    }

    if (requestPath === "/game.html") {
      sendFile(res, path.join(ROOT_DIR, "game.html"));
      return;
    }

    if (requestPath === "/index.html") {
      sendFile(res, path.join(ROOT_DIR, "index.html"));
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Born 3D local server listening on http://127.0.0.1:${PORT}`);
});

WATCH_PATHS.forEach(watchTarget);