import { readFile, writeFile } from "node:fs/promises";
import { parseResume } from "../src/lib/resume/parse";

const pdf = new Uint8Array(
  await readFile(new URL("../public/resume.pdf", import.meta.url)),
);
const resume = await parseResume(pdf);

await writeFile(
  new URL("../src/data/resume.generated.json", import.meta.url),
  `${JSON.stringify(resume, null, 2)}\n`,
);

console.log(
  `[resume] ${resume.meta.pages} pages · ${resume.experience.length} roles · ${resume.projects.length} projects · ${resume.skills.length} skill groups`,
);

for (const warning of resume.meta.warnings) {
  console.warn(`[resume] warning: ${warning}`);
}
