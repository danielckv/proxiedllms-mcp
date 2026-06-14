#!/usr/bin/env node
// @llmsproxy/mcp-server — thin shim that resolves and execs the platform-specific
// binary shipped in @llmsproxy/mcp-server-<platform>-<arch>.
//
// How it works:
//   - The main package declares 5 optionalDependencies, one per supported
//     platform. npm installs only the one matching process.platform +
//     process.arch (the others fail their `os`/`cpu` gate and are skipped).
//   - This shim resolves the installed platform package, exec's the binary,
//     forwards stdio, propagates SIGINT/SIGTERM, and exits with the binary's
//     status code (or re-raises the signal so the parent shell sees it).
//
// Invariants:
//   - No network during install (the binary is embedded in the platform package).
//   - No postinstall script (sandboxed MCP client spawn must not run shell).
//   - No process.env mutation — env (LLMSPROXY_API_KEY, LLMSPROXY_BASE_URL) is
//     forwarded as-is to the binary, which owns the auth/base-url contract.

"use strict";

const { spawn } = require("child_process");

const SUPPORTED = new Set([
  "darwin-arm64",
  "darwin-x64",
  "linux-arm64",
  "linux-x64",
  "win32-x64",
]);

const platform = process.platform;
const arch = process.arch;
const target = `${platform}-${arch}`;

if (!SUPPORTED.has(target)) {
  process.stderr.write(
    `[@llmsproxy/mcp-server] Unsupported platform: ${target}\n` +
      `Supported: ${[...SUPPORTED].sort().join(", ")}\n` +
      `Email support: contact@llmsproxy.ai\n`,
  );
  process.exit(1);
}

const pkg = `@llmsproxy/mcp-server-${target}`;
const exe = platform === "win32" ? "mcp-server.exe" : "mcp-server";

let binPath;
try {
  binPath = require.resolve(`${pkg}/bin/${exe}`);
} catch (err) {
  process.stderr.write(
    `[@llmsproxy/mcp-server] Could not locate the platform binary.\n` +
      `Expected optionalDependency '${pkg}' to be installed.\n` +
      `This usually means:\n` +
      `  1. The optional dependency was skipped because of an --omit=optional / --no-optional flag.\n` +
      `  2. The npm install ran in a different OS/arch than the current process.\n` +
      `Try: npm install -g @llmsproxy/mcp-server   (without --no-optional)\n` +
      `Underlying error: ${err && err.message ? err.message : err}\n`,
  );
  process.exit(1);
}

const child = spawn(binPath, process.argv.slice(2), {
  stdio: "inherit",
  env: process.env,
  windowsHide: true,
});

// Forward terminating signals to the child. spawn() doesn't put the child in a
// separate process group by default, so terminal-driven SIGINT (Ctrl-C) already
// reaches it; this guards the parent-sent-SIGTERM case (e.g. an MCP client
// killing the process on app quit).
const forward = (signal) => () => {
  if (!child.killed) child.kill(signal);
};
process.on("SIGINT", forward("SIGINT"));
process.on("SIGTERM", forward("SIGTERM"));
process.on("SIGHUP", forward("SIGHUP"));

child.on("error", (err) => {
  process.stderr.write(
    `[@llmsproxy/mcp-server] Failed to spawn ${binPath}: ${err.message}\n`,
  );
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    // Re-raise so the parent (shell / MCP client) sees the original signal.
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
