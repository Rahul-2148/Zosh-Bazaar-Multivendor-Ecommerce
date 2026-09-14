import { spawn } from "child_process";

import path from "path";

const apps = ["client", "admin", "seller", "logistics", "delivery-partner"];

console.log(`⚡ [Zosh Bazaar] Ultra-Fast Parallel Bundling (Direct Node + esbuild) for ${apps.length} apps...\n`);
const startTime = Date.now();

const tasks = apps.map((app) => {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const viteBin = path.resolve(app, "node_modules", "vite", "bin", "vite.js");
    const proc = spawn(process.execPath, [viteBin, "build"], {
      cwd: app,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    });

    let stderrData = "";
    proc.stderr.on("data", (chunk) => {
      stderrData += chunk.toString();
    });

    proc.on("close", (code) => {
      const dur = ((Date.now() - t0) / 1000).toFixed(1);
      if (code === 0) {
        console.log(`⚡ [${app.padEnd(16)}] Bundled in ${dur.padStart(4)}s`);
        resolve({ app, duration: dur });
      } else {
        console.error(`❌ [${app.padEnd(16)}] Build FAILED (${dur}s):\n${stderrData}`);
        reject(new Error(`[${app}] build failed with code ${code}`));
      }
    });
  });
});

Promise.all(tasks)
  .then(() => {
    const total = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n🎉 [Zosh Bazaar] All ${apps.length} applications bundled in ${total}s!`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(`\n❌ [Zosh Bazaar] Bundling error: ${err.message}`);
    process.exit(1);
  });
