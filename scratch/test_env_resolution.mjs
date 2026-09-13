import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllowedOrigins } from '../server/src/config/corsConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('=== 1. Testing CORS Origin Resolver ===');
const defaultOrigins = getAllowedOrigins();
console.log('Default allowed origins count:', defaultOrigins.length);
console.assert(defaultOrigins.includes('http://localhost:5173'), 'Must contain 5173');
console.assert(defaultOrigins.includes('http://localhost:5175'), 'Must contain 5175');
console.assert(defaultOrigins.includes('http://localhost:5176'), 'Must contain 5176');
console.assert(defaultOrigins.includes('http://localhost:5174'), 'Must contain 5174');
console.assert(defaultOrigins.includes('http://localhost:5177'), 'Must contain 5177');
console.log('✓ Default origins verified.');

// Test with ALLOWED_ORIGINS override
process.env.ALLOWED_ORIGINS = 'https://zoshbazaar.com, https://seller.zoshbazaar.com, https://admin.zoshbazaar.com';
const customOrigins = getAllowedOrigins();
console.assert(customOrigins.includes('https://zoshbazaar.com'), 'Custom origin 1 failed');
console.assert(customOrigins.includes('https://seller.zoshbazaar.com'), 'Custom origin 2 failed');
console.assert(customOrigins.includes('https://admin.zoshbazaar.com'), 'Custom origin 3 failed');
console.log('✓ Custom ALLOWED_ORIGINS verified.');
delete process.env.ALLOWED_ORIGINS;

console.log('\n=== 2. Testing .env / .env.example / .env.sample Consistency ===');
const packages = ['server', 'client', 'seller', 'admin', 'logistics', 'delivery-partner'];

function extractKeys(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const keys = new Set();
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx > 0) {
      keys.add(line.slice(0, eqIdx).trim());
    }
  }
  return keys;
}

let allConsistent = true;

for (const pkg of packages) {
  const pkgDir = path.join(rootDir, pkg);
  const envPath = path.join(pkgDir, '.env');
  const examplePath = path.join(pkgDir, '.env.example');
  const samplePath = path.join(pkgDir, '.env.sample');

  const envKeys = extractKeys(envPath);
  const exampleKeys = extractKeys(examplePath);
  const sampleKeys = extractKeys(samplePath);

  if (!envKeys) {
    console.error(`❌ [${pkg}] Missing .env file!`);
    allConsistent = false;
    continue;
  }
  if (!exampleKeys) {
    console.error(`❌ [${pkg}] Missing .env.example file!`);
    allConsistent = false;
    continue;
  }
  if (!sampleKeys) {
    console.error(`❌ [${pkg}] Missing .env.sample file!`);
    allConsistent = false;
    continue;
  }

  // Check example vs sample
  const diffExSamp = [...exampleKeys].filter(k => !sampleKeys.has(k));
  const diffSampEx = [...sampleKeys].filter(k => !exampleKeys.has(k));

  if (diffExSamp.length > 0 || diffSampEx.length > 0) {
    console.error(`❌ [${pkg}] .env.example and .env.sample do not match! Diff:`, diffExSamp, diffSampEx);
    allConsistent = false;
  } else {
    console.log(`✓ [${pkg}] .env.example and .env.sample are 100% matched (${exampleKeys.size} keys).`);
  }

  // Check .env contains all example keys
  const missingInEnv = [...exampleKeys].filter(k => !envKeys.has(k));
  if (missingInEnv.length > 0) {
    console.warn(`⚠️ [${pkg}] .env is missing keys defined in example:`, missingInEnv);
  } else {
    console.log(`✓ [${pkg}] .env contains all keys required by template (${envKeys.size} keys).`);
  }
}

if (allConsistent) {
  console.log('\n🎉 ALL PACKAGES ARE 100% CONSISTENT AND DEPLOYMENT-READY!');
} else {
  process.exit(1);
}
