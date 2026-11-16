// Wrapper around the Next.js CLI.
// - Disables Next.js telemetry (no data leaves this PC).
// - Binds to 127.0.0.1 by default. Pass --lan to listen on your home network.
// - On "start": reinstalls dependencies and rebuilds automatically when the code has changed
//   (e.g. after downloading a new version), and refuses to start twice on the same port.
import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [cmd = "start", ...rest] = process.argv.slice(2);
const lan = rest.includes("--lan");
const port = process.env.PORT || "3100";
const host = lan ? "0.0.0.0" : "127.0.0.1";
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1", ALLOW_LAN: lan ? "1" : "0" };
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function hashOf(paths) {
  const h = crypto.createHash("sha256");
  const walk = (p) => {
    if (!fs.existsSync(p)) return;
    const st = fs.statSync(p);
    if (st.isDirectory()) for (const f of fs.readdirSync(p).sort()) walk(path.join(p, f));
    else h.update(p.slice(root.length)).update(fs.readFileSync(p));
  };
  for (const p of paths) walk(path.join(root, p));
  return h.digest("hex");
}

const read = (f) => { try { return fs.readFileSync(f, "utf8"); } catch { return ""; } };
const run = (args) => {
  const r = spawnSync(npm, args, { cwd: root, env, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

function portInUse(p) {
  return new Promise((resolve) => {
    const s = net.connect({ host: "127.0.0.1", port: Number(p) }, () => { s.destroy(); resolve(true); });
    s.on("error", () => resolve(false));
  });
}

if (cmd === "start") {
  if (await portInUse(port)) {
    console.log(`\n  The dashboard (or something else) is already running on port ${port}.`);
    console.log("  Close the other dashboard window, or run stop-dashboard.bat, then start again.\n");
    process.exit(1);
  }
  const lockHash = hashOf(["package-lock.json"]);
  const lockStamp = path.join(root, "node_modules", ".installed-lock-hash");
  if (read(lockStamp) !== lockHash) {
    console.log("\n  Installing dependencies into this folder...\n");
    run(["ci", "--no-fund", "--no-audit"]);
    fs.writeFileSync(lockStamp, lockHash);
  }
  const srcHash = hashOf(["app", "components", "lib", "middleware.ts", "next.config.mjs", "postcss.config.mjs", "package-lock.json", "tsconfig.json"]);
  const buildStamp = path.join(root, ".next", ".source-hash");
  if (!fs.existsSync(path.join(root, ".next", "BUILD_ID")) || read(buildStamp) !== srcHash) {
    console.log("\n  New or changed code found. Building (about a minute)...\n");
    run(["run", "build"]);
    fs.writeFileSync(buildStamp, srcHash);
  }
}

const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const args = [nextBin, cmd];
if (cmd === "dev" || cmd === "start") args.push("-H", host, "-p", port);

if (cmd !== "build") {
  console.log(`\n  Dashboard: http://127.0.0.1:${port}`);
  if (lan) console.log("  LAN mode ON: reachable from other devices on your network. Use only on a trusted home network.");
  console.log("  Keep this window open. Close it to stop the dashboard.\n");
}

const child = spawn(process.execPath, args, { cwd: root, env, stdio: "inherit" });
if (cmd === "start" && process.argv.includes("--open")) {
  setTimeout(() => {
    const opener = process.platform === "win32" ? ["cmd", ["/c", "start", "", `http://127.0.0.1:${port}`]] : process.platform === "darwin" ? ["open", [`http://127.0.0.1:${port}`]] : ["xdg-open", [`http://127.0.0.1:${port}`]];
    spawn(opener[0], opener[1], { stdio: "ignore", detached: true }).on("error", () => {});
  }, 2500);
}
child.on("exit", (code) => process.exit(code ?? 0));
