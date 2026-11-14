import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseResume } from "./parse";

const pdf = new Uint8Array(
  await readFile(new URL("../../../public/resume.pdf", import.meta.url)),
);
const resume = await parseResume(pdf);

test("parses the contact block", () => {
  assert.equal(resume.contact.name, "Ali Umar");
  assert.equal(resume.contact.email, "ali.umar.work@gmail.com");
  assert.equal(resume.contact.website, "aliumar.dev");
  assert.match(resume.contact.linkedin ?? "", /linkedin\.com\/in\/aliumardev1/);
  assert.match(resume.contact.github ?? "", /github\.com\/ArmyaAli/);
});

test("parses both pages and the professional summary", () => {
  assert.equal(resume.meta.pages, 2);
  assert.match(resume.summary ?? "", /4 years/);
  assert.equal(resume.meta.warnings.length, 0);
});

test("parses all experience entries and wrapped bullets", () => {
  assert.equal(resume.experience.length, 3);
  assert.equal(
    resume.experience[0]?.title,
    "Sr. Software Developer / Sr. Programmer Analyst",
  );
  assert.equal(
    resume.experience[0]?.organization,
    "Ministry of Children, Youth & Social Services",
  );
  assert.equal(resume.experience[0]?.location, "Toronto, Ontario");
  assert.equal(resume.experience[0]?.date, "Sep 2023 – Present");
  assert.ok((resume.experience[0]?.bullets.length ?? 0) >= 10);
  assert.match(resume.experience[0]?.bullets[0] ?? "", /\$180,000/);
});

test("parses education, projects, skills, certifications, and interests", () => {
  assert.equal(resume.education.length, 2);
  assert.equal(
    resume.education[0]?.credential,
    "BS. Computer Science",
  );
  assert.equal(
    resume.education[0]?.institution,
    "Honours Bachelor of Science, York University",
  );
  assert.equal(resume.projects.length, 3);
  assert.deepEqual(
    resume.projects.map((project) => project.title),
    ["Gratitude.forum", "Compiler - Bminor Language", "Homelab - Dell PowerEdge R730"],
  );
  assert.deepEqual(resume.projects[0]?.technologies, [
    "Go",
    "PocketBase",
    "JavaScript",
  ]);
  assert.deepEqual(
    resume.skills.map((group) => group.label),
    ["Fundamentals", "Tools", "Familiarity with"],
  );
  assert.equal(resume.certifications.length, 2);
  assert.ok(resume.interests.includes("3D printing"));
});

test("the committed generated data matches the PDF", async () => {
  const generated = JSON.parse(
    await readFile(
      new URL("../../data/resume.generated.json", import.meta.url),
      "utf8",
    ),
  );
  assert.deepEqual(generated, resume);
});
