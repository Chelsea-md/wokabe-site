const http = require("http");
const fs = require("fs");
const path = require("path");

const rootDir = __dirname;
const port = Number(process.env.PORT || 4173);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function send(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, headers);
  response.end(body);
}

function resolveSitePath(urlPath) {
  if (urlPath === "/" || urlPath === "") {
    return { filePath: path.join(rootDir, "index.html") };
  }

  if (urlPath === "/gamewiki" || urlPath === "/gamewiki/") {
    return { redirect: "/" };
  }

  const relativePath = decodeURIComponent(urlPath.replace(/^\//, ""));
  const normalizedPath = path.normalize(relativePath);

  if (normalizedPath.startsWith("..") || path.isAbsolute(normalizedPath)) {
    return { forbidden: true };
  }

  return { filePath: path.join(rootDir, normalizedPath) };
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const route = resolveSitePath(url.pathname);

  if (route.redirect) {
    return send(response, 302, "Found", { Location: route.redirect });
  }

  if (route.forbidden) {
    return send(response, 403, "Forbidden", { "Content-Type": "text/plain; charset=utf-8" });
  }

  if (route.notFound || !route.filePath) {
    return send(response, 404, "Not Found", { "Content-Type": "text/plain; charset=utf-8" });
  }

  fs.readFile(route.filePath, (error, file) => {
    if (error) {
      return send(response, 404, "Not Found", { "Content-Type": "text/plain; charset=utf-8" });
    }

    const extension = path.extname(route.filePath).toLowerCase();
    send(response, 200, file, {
      "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
      "Content-Type": contentTypes[extension] || "application/octet-stream",
    });
  });
});

server.listen(port, () => {
  console.log(`GAME WIKI is running at http://localhost:${port}/`);
});
