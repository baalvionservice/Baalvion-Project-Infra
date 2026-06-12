import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const TXT = path.join(ROOT, "error-report.txt");
const JSON_OUT = path.join(ROOT, "error-report.json");

console.log("\n🔍 Running Monorepo Error Scanner...\n");

let raw = "";
let failedApps = [];

try {
  raw = execSync("pnpm build", {
    encoding: "utf-8",
    stdio: "pipe",
    maxBuffer: 1024 * 1024 * 50,
  });

  console.log("✅ All builds passed!");

} catch (err) {
  raw =
    (err?.stdout?.toString?.() || "") +
    "\n" +
    (err?.stderr?.toString?.() || "") +
    "\n" +
    (err?.message || "");

  const lines = raw.split("\n");

  const appMap = new Map();

  for (const line of lines) {
    const isError =
      line.includes("ERROR") ||
      line.includes("Failed") ||
      line.includes("ELIFECYCLE") ||
      line.includes("×") ||
      line.toLowerCase().includes("error");

    if (!isError) continue;

    // ✅ Improved app detection (Turbo + workspace aware)
    let app = "UNKNOWN_APP";

    const turboMatch = line.match(/×\s+([^:]+):/);
    const frontendMatch = line.match(/Frontend\/[^\s]+/);
    const backendMatch = line.match(/Backend\/[^\s]+/);

    if (turboMatch) {
      app = turboMatch[1].trim();
    } else if (frontendMatch) {
      app = frontendMatch[0];
    } else if (backendMatch) {
      app = backendMatch[0];
    }

    if (!appMap.has(app)) appMap.set(app, []);
    appMap.get(app).push(line.trim());
  }

  failedApps = [...appMap.entries()].map(([app, errors]) => ({
    app,
    errorCount: errors.length,
    sampleErrors: errors.slice(0, 5),
  }));
}

// ✅ Safe fallback when no failures
const report = {
  timestamp: new Date().toISOString(),
  status: failedApps.length > 0 ? "FAILED" : "SUCCESS",
  failedApps: failedApps.length > 0 ? failedApps : [],
};

fs.writeFileSync(TXT, formatText(report));
fs.writeFileSync(JSON_OUT, JSON.stringify(report, null, 2));

console.log("\n📊 SCAN COMPLETE");
console.log("Status:", report.status);
console.log("Failed Apps:", failedApps.length);

console.log("\n📄 Reports generated:");
console.log("- error-report.txt");
console.log("- error-report.json");

function formatText(report) {
  if (!report.failedApps.length) {
    return `
===== BAALVION ERROR SCAN =====

Time: ${report.timestamp}
Status: SUCCESS

🎉 No errors detected in monorepo.

==============================
`;
  }

  return `
===== BAALVION ERROR SCAN =====

Time: ${report.timestamp}
Status: FAILED

FAILED APPS:
${report.failedApps
  .map(
    (f) => `
❌ ${f.app}
Errors: ${f.errorCount}
${f.sampleErrors?.join("\n") || ""}
`
  )
  .join("\n")}

==============================
`;
}