import {spawn} from "node:child_process";
import {join, resolve} from "node:path";

export function getDuckDbRuntimeConfig() {
  return {
    pythonBin: process.env.DUCKDB_PYTHON_BIN?.trim?.() || "python3",
    queryScriptPath: resolve(
      process.cwd(),
      process.env.DUCKDB_QUERY_SCRIPT?.trim?.() || join("scripts", "query_duckdb.py")
    ),
    dbPath: resolve(
      process.cwd(),
      process.env.DUCKDB_PATH?.trim?.() || join("db", "clinical_demo.duckdb")
    )
  };
}

export async function executeSqlAgainstDemoDb(sql) {
  const {pythonBin, queryScriptPath, dbPath} = getDuckDbRuntimeConfig();
  const payload = JSON.stringify({db_path: dbPath, sql});

  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(pythonBin, [queryScriptPath], {
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      rejectPromise(error);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        rejectPromise(new Error(`DuckDB query process failed (${code}): ${stderr || stdout}`));
        return;
      }

      try {
        resolvePromise(JSON.parse(stdout));
      } catch (error) {
        rejectPromise(new Error(`Failed to parse DuckDB query response: ${error.message}`));
      }
    });

    child.stdin.write(payload);
    child.stdin.end();
  });
}
