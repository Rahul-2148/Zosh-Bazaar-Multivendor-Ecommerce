import { spawn } from "child_process";
import path from "path";

const apps = ["client", "admin", "seller", "logistics", "delivery-partner"];

console.log(`🚀 [Zosh Bazaar] Launching optimized direct-node parallel build for ${apps.length} applications...\n`);
const startTime = Date.now();

function runCommand(bin, args, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [bin, ...args], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    });

    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.stdout.on("data", (d) => (stderr += d.toString()));

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `Process exited with code ${code}`));
    });
  });
}

const tasks = apps.map(async (app) => {
  const t0 = Date.now();
  const tscBin = path.resolve(app, "node_modules", "typescript", "bin", "tsc");
  const viteBin = path.resolve(app, "node_modules", "vite", "bin", "vite.js");

  try {
    await runCommand(tscBin, ["-b"], app);
    await runCommand(viteBin, ["build"], app);
    const dur = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`✅ [${app.padEnd(16)}] Built in ${dur.padStart(4)}s`);
    return { app, duration: dur };
  } catch (err) {
    const dur = ((Date.now() - t0) / 1000).toFixed(1);
    console.error(`❌ [${app.padEnd(16)}] Build FAILED (${dur}s):\n${err.message}`);
    throw err;
  }
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
