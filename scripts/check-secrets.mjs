#!/usr/bin/env node
/**
 * Scan staged (or provided) files for likely secrets before commit.
 * Exit 1 if findings; used by husky pre-commit.
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

const ROOT = process.cwd();

const ALLOWLIST = new Set([
  '.env.example',
  'scripts/check-secrets.mjs',
  'docs/DEVELOPMENT.md',
]);

const PATTERNS = [
  { name: 'OpenAI key', re: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { name: 'GitHub token', re: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/ },
  { name: 'AWS access key', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Private key block', re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'Generic API key assignment', re: /(?:api[_-]?key|secret[_-]?key|private[_-]?key)\s*[:=]\s*['"][^'"]{16,}['"]/i },
  { name: 'Bearer token', re: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/ },
  { name: 'Slack token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: 'WalletConnect project id (hex)', re: /EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID\s*=\s*[a-f0-9]{32}/i },
  { name: 'PostHog personal key', re: /\bphc_[A-Za-z0-9]{20,}\b/ },
  { name: 'Cloudflare API token-like', re: /\b[A-Za-z0-9_-]{40}\b.*(CF_|CLOUDFLARE)/i },
];

function stagedFiles() {
  try {
    const out = execSync('git diff --cached --name-only --diff-filter=ACMR', {
      encoding: 'utf8',
    });
    return out.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function shouldScan(file) {
  if (ALLOWLIST.has(file)) return false;
  if (file.endsWith('.lock')) return false;
  if (file.includes('node_modules/')) return false;
  if (file.includes('package-lock.json')) return false;
  if (/\.(png|jpg|jpeg|gif|webp|ico|woff2?|ttf|mp3|mp4|wasm)$/i.test(file)) return false;
  return true;
}

const files = (process.argv.slice(2).length ? process.argv.slice(2) : stagedFiles()).filter(
  shouldScan,
);

const findings = [];

for (const file of files) {
  const abs = isAbsolute(file) ? file : resolve(ROOT, file);
  if (!existsSync(abs)) continue;
  let content;
  try {
    content = readFileSync(abs, 'utf8');
  } catch {
    continue;
  }
  // Skip binary-ish
  if (content.includes('\u0000')) continue;

  for (const { name, re } of PATTERNS) {
    if (re.test(content)) {
      findings.push({ file: relative(ROOT, abs) || file, name });
    }
  }

  // Block committing real env files by name
  if (/^\.env($|\.)/.test(file) && file !== '.env.example') {
    findings.push({ file, name: 'Env file must not be committed' });
  }
}

if (findings.length) {
  console.error('\n❌ Secret scan failed. Remove secrets before committing:\n');
  for (const f of findings) {
    console.error(`  - ${f.file}: ${f.name}`);
  }
  console.error('\nIf this is a false positive, adjust scripts/check-secrets.mjs ALLOWLIST.\n');
  process.exit(1);
}

console.log(`✓ Secret scan passed (${files.length} file(s))`);
