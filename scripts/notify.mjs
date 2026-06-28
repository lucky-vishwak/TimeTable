#!/usr/bin/env node
// ----------------------------------------------------------------------------
// notify.mjs — run by cron every minute. Calls the app's /api/notify endpoint,
// which figures out which reminders/tasks are due "now", then pops a native
// macOS notification for each one (via osascript).
//
// Usage:
//   node scripts/notify.mjs           # normal run (window = 1 min)
//   node scripts/notify.mjs --force   # show today's reminders regardless of time
//   node scripts/notify.mjs --dry     # never notify, just print
//
// Cron (every minute):
//   * * * * * cd /path/to/TimeTable && /usr/bin/node scripts/notify.mjs >> /tmp/timetable-notify.log 2>&1
// ----------------------------------------------------------------------------

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Minimal .env.local loader (avoids extra deps).
function loadEnv() {
  try {
    const txt = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        let v = m[2].trim();
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        )
          v = v.slice(1, -1);
        process.env[m[1]] = v;
      }
    }
  } catch {
    /* no .env.local — rely on process env */
  }
}

loadEnv();

const base = process.env.APP_BASE_URL || "http://127.0.0.1:3000";
const args = process.argv.slice(2);
const force = args.includes("--force");
const dry = args.includes("--dry");

function macNotify(title, message) {
  // Escape double quotes for AppleScript string literals.
  const esc = (s) => String(s).replace(/"/g, '\\"');
  const script = `display notification "${esc(message)}" with title "TimeTable" subtitle "${esc(
    title
  )}" sound name "Glass"`;
  return new Promise((resolve) => {
    const p = spawn("osascript", ["-e", script]);
    p.on("close", () => resolve());
    p.on("error", () => resolve());
  });
}

const params = new URLSearchParams();
if (force) params.set("force", "true");
if (dry) params.set("dry", "true");

const url = `${base}/api/notify?${params.toString()}`;

try {
  const res = await fetch(url, { method: "POST" });
  const data = await res.json();
  const ts = new Date().toISOString();
  console.log(`[${ts}] due=${data.dueCount} now=${data.now}`);
  for (const r of data.results || []) {
    console.log(`  - (${r.kind}) ${r.label} :: ${r.message}`);
    // Fire a native macOS notification for each due item (unless dry-run).
    if (!dry) {
      await macNotify(r.label, r.message || r.label);
    }
  }
  if ((data.results || []).length === 0) {
    console.log("  (nothing due)");
  }
} catch (err) {
  console.error(
    `[${new Date().toISOString()}] notify failed: ${err.message}\n` +
      `Is the app running at ${base}? Start it with "npm run dev" or "npm start".`
  );
  process.exit(1);
}
