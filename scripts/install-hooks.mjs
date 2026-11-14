import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

let gitDir;

try {
  gitDir = execFileSync("git", ["rev-parse", "--git-dir"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
} catch {
  console.log("install-hooks: no git repository, skipping");
  process.exit(0);
}

const hooksDir = join(gitDir, "hooks");
const hookPath = join(hooksDir, "commit-msg");
const command = 'node scripts/check-commit-msg.mjs "$1"';

await mkdir(hooksDir, { recursive: true });

let existing = "";

try {
  existing = await readFile(hookPath, "utf8");
} catch {
  // No existing commit-msg hook.
}

if (existing.includes("scripts/check-commit-msg.mjs")) {
  console.log("install-hooks: commit-msg rule already installed");
  process.exit(0);
}

const hook = existing
  ? `${existing.replace(/\s*$/, "")}\n\n# Roadmapped task reference rule\n${command}\n`
  : `#!/bin/sh\n# Roadmapped task reference rule\n${command}\n`;

await writeFile(hookPath, hook, "utf8");
await chmod(hookPath, 0o755);
console.log(`install-hooks: installed commit-msg rule in ${hookPath}`);
