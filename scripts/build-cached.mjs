import fs from "fs";
import path from "path";
import crypto from "crypto";
import { spawn } from "child_process";

const apps = ["client", "admin", "seller", "logistics", "delivery-partner"];
const isForce = process.argv.includes("--force") || process.argv.includes("-f");
const cacheDir = path.resolve(".build-cache");

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

function getDirHash(dirPath) {
  const hash = crypto.createHash("sha256");
  if (!fs.existsSync(dirPath)) return "";

  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules" && entry.name !== "dist" && entry.name !== ".tmp") {
          walk(full);
        }
      } else if (entry.isFile()) {
        hash.update(entry.name);
        const stat = fs.statSync(full);
        hash.update(String(stat.size));
        hash.update(String(stat.mtimeMs));
      }
    }
  }

  walk(dirPath);
  return hash.digest("hex");
}

function getAppHash(app) {
  const hash = crypto.createHash("sha256");
  const filesToCheck = [
    path.join(app, "package.json"),
    path.join(app, "vite.config.ts"),
    path.join(app, "tsconfig.json"),
    path.join(app, "tsconfig.app.json"),
    path.join(app, "index.html"),
  ];

  for (const f of filesToCheck) {
    if (fs.existsSync(f)) {
      hash.update(fs.readFileSync(f));
    }
  }

  hash.update(getDirHash(path.join(app, "src")));
  hash.update(getDirHash(path.join(app, "public")));
  return hash.digest("hex");
}

function isCached(app, currentHash) {
  const distHtml = path.join(app, "dist", "index.html");
  if (!fs.existsSync(distHtml)) return false;

  const hashFile = path.join(cacheDir, `${app}.hash`);
  if (!fs.existsSync(hashFile)) return false;

  const savedHash = fs.readFileSync(hashFile, "utf8").trim();
  return savedHash === currentHash;
}

function saveCache(app, currentHash) {
  const hashFile = path.join(cacheDir, `${app}.hash`);
  fs.writeFileSync(hashFile, currentHash, "utf8");
}

console.log(`🧠 [Zosh Bazaar] Smart Monorepo Build Runner (Content-Hash Cache + Multi-Core)...`);
if (isForce) console.log(`   (Running with --force: ignoring cache)\n`);
else console.log(`   (Incremental Mode: Unchanged apps will be served instantly from cache)\n`);

const startTime = Date.now();

const tasks = apps.map((app) => {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const currentHash = getAppHash(app);

    if (!isForce && isCached(app, currentHash)) {
      console.log(`⚡ [${app.padEnd(16)}] [CACHE HIT] Up-to-date (0.01s)`);
      return resolve({ app, duration: "0.01", cached: true });
    }

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
        saveCache(app, currentHash);
        console.log(`✨ [${app.padEnd(16)}] [BUILT] Bundled in ${dur.padStart(4)}s`);
        resolve({ app, duration: dur, cached: false });
      } else {
        console.error(`❌ [${app.padEnd(16)}] Build FAILED (${dur}s):\n${stderrData}`);
        reject(new Error(`[${app}] build failed with code ${code}`));
      }
    });
  });
});

Promise.all(tasks)
  .then((results) => {
    const total = ((Date.now() - startTime) / 1000).toFixed(1);
    const cachedCount = results.filter((r) => r.cached).length;
    const builtCount = results.filter((r) => !r.cached).length;
    console.log(`\n🎉 [Zosh Bazaar] Summary: ${cachedCount} cached, ${builtCount} built in ${total}s!`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(`\n❌ [Zosh Bazaar] Build error: ${err.message}`);
    process.exit(1);
  });
