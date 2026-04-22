import {createServer} from "node:http";
import {createReadStream, existsSync, statSync} from "node:fs";
import {extname, join, normalize} from "node:path";
import {handleAsk} from "./api/ask.js";
import {getDuckDbRuntimeConfig} from "./api/lib/duckdb.js";
import {getPublicRuntimeStatus} from "./api/lib/runtimeConfig.js";

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3001);
const publicHost = host === "0.0.0.0" ? "127.0.0.1" : host;
const root = process.cwd();
const searchRoots = [join(root, "dist"), join(root, "src"), root];

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".svg", "image/svg+xml"],
  [".ico", "image/x-icon"],
  [".txt", "text/plain; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"]
]);

async function nodeRequestToWebRequest(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const origin = req.headers.host ? `http://${req.headers.host}` : `http://${publicHost}:${port}`;
  const url = new URL(req.url || "/", origin);
  return new Request(url, {
    method: req.method,
    headers: req.headers,
    body,
    duplex: "half"
  });
}

async function sendWebResponse(res, webResponse) {
  const headers = Object.fromEntries(webResponse.headers.entries());
  res.writeHead(webResponse.status, headers);
  const buffer = Buffer.from(await webResponse.arrayBuffer());
  res.end(buffer);
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  return normalized;
}

function resolvePath(urlPath) {
  const requestPath = safePath(urlPath);
  const candidates = [];

  if (requestPath === "/" || requestPath === "") {
    candidates.push("/index.html");
  } else {
    candidates.push(requestPath);
    if (!extname(requestPath)) {
      candidates.push(`${requestPath}.html`);
      candidates.push(join(requestPath, "index.html"));
    }
  }

  for (const baseRoot of searchRoots) {
    for (const candidate of candidates) {
      const filePath = join(baseRoot, candidate);
      if (existsSync(filePath) && statSync(filePath).isFile()) {
        return filePath;
      }
    }
  }

  return null;
}

const server = createServer(async (req, res) => {
  if ((req.url || "").startsWith("/api/health") || (req.url || "").startsWith("/healthz")) {
    const duckdbRuntime = getDuckDbRuntimeConfig();
    const checks = {
      dist_index: existsSync(join(root, "dist", "index.html")),
      duckdb_db: existsSync(duckdbRuntime.dbPath),
      duckdb_query_script: existsSync(duckdbRuntime.queryScriptPath)
    };
    const ok = Object.values(checks).every(Boolean);
    res.writeHead(ok ? 200 : 503, {"Content-Type": "application/json; charset=utf-8"});
    res.end(
      JSON.stringify(
        {
          status: ok ? "ok" : "degraded",
          service: "clinical-observable-phase2-ai",
          runtime: getPublicRuntimeStatus(),
          duckdb_runtime: {
            python_bin: duckdbRuntime.pythonBin,
            db_path: duckdbRuntime.dbPath,
            query_script_path: duckdbRuntime.queryScriptPath
          },
          checks
        },
        null,
        2
      )
    );
    return;
  }

  if ((req.url || "").startsWith("/api/ask")) {
    try {
      const request = await nodeRequestToWebRequest(req);
      const response = await handleAsk(request);
      await sendWebResponse(res, response);
    } catch (error) {
      res.writeHead(500, {"Content-Type": "application/json; charset=utf-8"});
      res.end(JSON.stringify({error: error.message}));
    }
    return;
  }

  const filePath = resolvePath(req.url || "/");

  if (!filePath) {
    res.writeHead(404, {"Content-Type": "text/plain; charset=utf-8"});
    res.end(`Not found: ${req.url}`);
    return;
  }

  const type = contentTypes.get(extname(filePath).toLowerCase()) || "application/octet-stream";
  res.writeHead(200, {"Content-Type": type});
  createReadStream(filePath).pipe(res);
});

server.listen(port, host, () => {
  console.log(`Static server running at http://${publicHost}:${port}/`);
});
