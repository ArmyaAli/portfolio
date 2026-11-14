import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const messageFile = process.argv[2];

if (!messageFile) {
  console.error("check-commit-msg: missing commit message file");
  process.exit(1);
}

const message = await readFile(messageFile, "utf8");
const lines = message
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"));

const subject = lines[0] ?? "";

if (/^(Merge|Revert|fixup!|squash!)\b/i.test(subject)) {
  process.exit(0);
}

const ids = [...message.matchAll(/#(\d+)\b/g)].map((match) => match[1]);

if (ids.length === 0) {
  console.error(
    [
      "Commit rejected: no Roadmapped task reference.",
      "Use a subject like: feat(#3): parse resume.pdf into typed data",
      "See CONTRIBUTING.md.",
    ].join("\n"),
  );
  process.exit(1);
}

async function collectIds(dir, found = new Set()) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      await collectIds(path, found);
      continue;
    }

    if (!entry.name.endsWith(".yaml")) continue;

    const text = await readFile(path, "utf8");
    const match = text.match(/^id:\s*(\d+)\s*$/m);
    if (match) found.add(match[1]);
  }

  return found;
}

const taskIds = await collectIds(
  fileURLToPath(new URL("../docs/tasks/", import.meta.url)),
);
const missing = ids.filter((id) => !taskIds.has(id));

if (missing.length > 0) {
  console.error(
    `Commit rejected: unknown Roadmapped task id(s): ${missing
      .map((id) => `#${id}`)
      .join(", ")}. Existing ids: ${[...taskIds]
      .sort((a, b) => Number(a) - Number(b))
      .map((id) => `#${id}`)
      .join(" ")}`,
  );
  process.exit(1);
}
