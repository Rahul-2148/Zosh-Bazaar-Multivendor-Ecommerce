import { spawn } from "child_process";

const apps = ["client", "admin", "seller", "logistics", "delivery-partner"];
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

console.log(`🚀 [Zosh Bazaar] Launching parallel build for ${apps.length} applications...\n`);
const startTime = Date.now();

const tasks = apps.map((app) => {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const proc = spawn(npmCmd, ["--prefix", app, "run", "build"], {
      stdio: ["ignore", "pipe", "pipe"],
      shell: isWin,
    });

    let stderrData = "";
    proc.stderr.on("data", (chunk) => {
      stderrData += chunk.toString();
    });

    proc.on("close", (code) => {
      const dur = ((Date.now() - t0) / 1000).toFixed(1);
      if (code === 0) {
        console.log(`✅ [${app.padEnd(16)}] Built in ${dur.padStart(4)}s`);
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
    console.log(`\n🎉 [Zosh Bazaar] All ${apps.length} applications built successfully in ${total}s!`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(`\n❌ [Zosh Bazaar] Parallel build error: ${err.message}`);
    process.exit(1);
  });
