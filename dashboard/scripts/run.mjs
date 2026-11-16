// Wrapper around the Next.js CLI.
// - Disables Next.js telemetry (no data leaves this PC).
// - Binds to 127.0.0.1 by default. Pass --lan to listen on your home network.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next", { paths: [root] });

const [cmd = "start", ...rest] = process.argv.slice(2);
const lan = rest.includes("--lan");
const port = process.env.PORT || "3100";
const host = lan ? "0.0.0.0" : "127.0.0.1";

const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1", ALLOW_LAN: lan ? "1" : "0" };
const args = [nextBin, cmd];
if (cmd === "dev" || cmd === "start") args.push("-H", host, "-p", port);

if (cmd !== "build") {
  console.log(`\n  Dashboard: http://127.0.0.1:${port}`);
  if (lan) console.log("  LAN mode ON: reachable from other devices on your network. Use only on a trusted home network.");
  console.log("");
}

const child = spawn(process.execPath, args, { cwd: root, env, stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 0));
