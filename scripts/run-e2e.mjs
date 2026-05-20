import { spawn, spawnSync } from "node:child_process";
import http from "node:http";

const port = 3100;
const baseUrl = `http://localhost:${port}`;
const isWindows = process.platform === "win32";
const npxCommand = isWindows ? "npx.cmd" : "npx";
const nodeCommand = isWindows ? "node.exe" : "node";

function spawnProcess(command, args, options) {
  if (!isWindows) {
    return spawn(command, args, options);
  }

  return spawn("cmd.exe", ["/d", "/s", "/c", [command, ...args].join(" ")], options);
}

function requestRoot() {
  return new Promise((resolve) => {
    const request = http.get(baseUrl, (response) => {
      response.resume();
      resolve(response.statusCode !== undefined && response.statusCode < 500);
    });

    request.on("error", () => resolve(false));
    request.setTimeout(1000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(timeoutMs = 60000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await requestRoot()) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return false;
}

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawnProcess(command, args, {
      env: process.env,
      shell: false,
      stdio: "inherit"
    });

    child.on("close", (code) => resolve(code ?? 1));
  });
}

let server;
let ownsServer = false;
let finalExitCode = 1;

if (process.env.SKIP_E2E_SEED !== "1") {
  const seedResult = spawnSync(nodeCommand, ["scripts/seed-demo.mjs"], { env: process.env, stdio: "inherit" });

  if (seedResult.status !== 0) {
    process.exit(seedResult.status ?? 1);
  }
}

if (!(await requestRoot())) {
  ownsServer = true;
  server = spawnProcess(npxCommand, ["next", "dev", "--port", String(port)], {
    env: process.env,
    shell: false,
    stdio: "inherit"
  });

  const ready = await waitForServer();

  if (!ready) {
    console.error(`Next.js dev server did not become ready at ${baseUrl}`);
    if (server.pid && isWindows) {
      spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      server.kill("SIGTERM");
    }
    process.exit(1);
  }
}

try {
  finalExitCode = await run(npxCommand, ["playwright", "test"]);
} finally {
  if (ownsServer && server?.pid) {
    if (isWindows) {
      spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      server.kill("SIGTERM");
    }
  }
}

process.exit(finalExitCode);
