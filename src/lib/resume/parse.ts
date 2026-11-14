import { createHash } from "node:crypto";
import { extractResumeLines } from "./extract";
import type {
  Certification,
  Contact,
  EducationEntry,
  ExperienceEntry,
  PositionedLine,
  ProjectEntry,
  ResumeDocument,
  SkillGroup,
} from "./types";

const MONTH =
  "(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)";
const SINGLE_DATE = `${MONTH}\\s+\\d{4}`;
const DATE_RANGE = `${MONTH}\\s+\\d{4}\\s*(?:[–—-]|to)\\s*(?:Present|Current|${MONTH}\\s+\\d{4})`;
const DATE_RE = new RegExp(`\\s+(${DATE_RANGE}|${SINGLE_DATE})\\s*$`, "i");
const LOCATION_RE = /\s+([A-Z][A-Za-z.' -]+),\s*([A-Z][A-Za-z.' -]+)$/;
const LOCATION_PART_RE = /^([A-Z][A-Za-z.' -]+),\s*([A-Z][A-Za-z.' -]+)$/;
const BULLET_RE = /^•\s*/;

const HEADINGS: Record<string, string> = {
  "professional summary": "summary",
  experience: "experience",
  education: "education",
  projects: "projects",
  "technical skills": "skills",
  certifications: "certifications",
  interests: "interests",
};

const REQUIRED_SECTIONS = [
  "experience",
  "education",
  "projects",
  "skills",
] as const;

type SectionName =
  | "summary"
  | "experience"
  | "education"
  | "projects"
  | "skills"
  | "certifications"
  | "interests";

type ParsedDate = { left: string; date: string };

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function splitDate(value: string): ParsedDate {
  const match = value.match(DATE_RE);
  if (!match) return { left: clean(value), date: "" };

  return {
    left: clean(value.slice(0, match.index)),
    date: clean(match[1]),
  };
}

function splitLocation(value: string): { left: string; location?: string } {
  const match = value.match(LOCATION_RE);
  if (!match) return { left: clean(value) };

  return {
    left: clean(value.slice(0, match.index)),
    location: clean(`${match[1]}, ${match[2]}`),
  };
}

function splitDateLine(line: PositionedLine): ParsedDate {
  const last = line.segments.at(-1);

  if (last && DATE_RE.test(last.text)) {
    return {
      left: clean(
        line.segments
          .slice(0, -1)
          .map((segment) => segment.text)
          .join(" "),
      ),
      date: clean(last.text),
    };
  }

  return splitDate(line.text);
}

function splitLocationLine(line: PositionedLine): {
  left: string;
  location?: string;
} {
  const last = line.segments.at(-1);

  if (last && !DATE_RE.test(last.text) && LOCATION_PART_RE.test(last.text)) {
    return {
      left: clean(
        line.segments
          .slice(0, -1)
          .map((segment) => segment.text)
          .join(" "),
      ),
      location: clean(last.text),
    };
  }

  return splitLocation(line.text);
}

function splitList(value: string) {
  return value
    .split(",")
    .map(clean)
    .filter(Boolean);
}

function parseContact(lines: PositionedLine[]): Contact {
  const name = clean(lines[0]?.text ?? "");
  const contactLine = lines.find((line) => line.text.includes("@"))?.text;

  if (!name || !contactLine) {
    throw new Error("Resume parser: contact block with a name and email was not found");
  }

  const contact: Contact = { name, email: "" };

  for (const part of contactLine.split("|").map(clean)) {
    if (!part) continue;

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(part)) {
      contact.email = part;
    } else if (/github\.com/i.test(part)) {
      contact.github = part;
    } else if (/linkedin\.com/i.test(part)) {
      contact.linkedin = part;
    } else if (/^\+?[\d\s().-]{7,}$/.test(part)) {
      contact.phone = part;
    } else if (!contact.website) {
      contact.website = part;
    }
  }

  if (!contact.email) {
    throw new Error("Resume parser: contact email was not found");
  }

  return contact;
}

function parseSummary(lines: PositionedLine[]): string | undefined {
  const text = lines.map((line) => line.text).join(" ").trim();
  return text || undefined;
}

function parseExperience(lines: PositionedLine[]): ExperienceEntry[] {
  const entries: ExperienceEntry[] = [];
  let current: ExperienceEntry | undefined;

  for (const line of lines) {
    const text = line.text;

    if (text.startsWith("•")) {
      if (!current) {
        throw new Error(`Resume parser: orphan experience bullet "${text}"`);
      }
      current.bullets.push(clean(text.replace(BULLET_RE, "")));
      continue;
    }

    if (current && line.x >= 63 && current.bullets.length > 0) {
      const index = current.bullets.length - 1;
      current.bullets[index] = clean(`${current.bullets[index]} ${text}`);
      continue;
    }

    const { left, date } = splitDateLine(line);

    if (date) {
      current = {
        title: left,
        organization: "",
        date,
        bullets: [],
      };
      entries.push(current);
      continue;
    }

    if (current && !current.organization) {
      const { left: organization, location } = splitLocationLine(line);
      current.organization = organization;
      current.location = location;
      continue;
    }

    if (current) {
      current.organization = clean(`${current.organization} ${text}`);
    }
  }

  return entries;
}

function parseProjects(lines: PositionedLine[]): ProjectEntry[] {
  const entries: ProjectEntry[] = [];
  let current: ProjectEntry | undefined;

  for (const line of lines) {
    const text = line.text;

    if (text.startsWith("•")) {
      if (!current) {
        throw new Error(`Resume parser: orphan project bullet "${text}"`);
      }
      current.bullets.push(clean(text.replace(BULLET_RE, "")));
      continue;
    }

    if (current && line.x >= 63 && current.bullets.length > 0) {
      const index = current.bullets.length - 1;
      current.bullets[index] = clean(`${current.bullets[index]} ${text}`);
      continue;
    }

    const { left, date } = splitDateLine(line);
    const [title, technologies] = left.split("|").map(clean);

    current = {
      title,
      technologies: technologies ? splitList(technologies) : [],
      date,
      bullets: [],
    };
    entries.push(current);
  }

  return entries;
}

function parseEducation(lines: PositionedLine[]): EducationEntry[] {
  const entries: EducationEntry[] = [];
  let pending: { credential: string; location?: string } | undefined;

  for (const line of lines) {
    const { left: datedLeft, date } = splitDateLine(line);
    const { left: locatedLeft, location } = splitLocationLine(line);
    const value = date ? datedLeft : locatedLeft;

    if (date) {
      entries.push({
        credential: pending?.credential ?? value,
        institution: pending ? value : "",
        location: pending?.location ?? location,
        date,
      });
      pending = undefined;
    } else {
      if (pending) {
        entries.push({
          credential: pending.credential,
          institution: value,
          location: pending.location ?? location,
        });
      }
      pending = { credential: value, location };
    }
  }

  if (pending) {
    entries.push({
      credential: pending.credential,
      institution: "",
      location: pending.location,
    });
  }

  return entries;
}

function parseSkills(lines: PositionedLine[]): SkillGroup[] {
  const groups: SkillGroup[] = [];
  let current: SkillGroup | undefined;

  const append = (group: SkillGroup, value: string) => {
    group.items.push(...splitList(value));
  };

  for (const line of lines) {
    const match = line.text.match(/^([^:]{1,40}):\s*(.*)$/);

    if (match) {
      current = { label: clean(match[1]), items: [] };
      groups.push(current);
      append(current, match[2]);
    } else if (current) {
      append(current, line.text);
    }
  }

  return groups;
}

function parseCertifications(lines: PositionedLine[]): Certification[] {
  return lines.map((line) => {
    const { left, date } = splitDateLine(line);
    return { name: left, date };
  });
}

function parseInterests(lines: PositionedLine[]): string[] {
  return splitList(lines.map((line) => line.text).join(" "));
}

export async function parseResume(pdf: Uint8Array): Promise<ResumeDocument> {
  const sourceSha256 = createHash("sha256").update(pdf).digest("hex");
  const { lines, pages } = await extractResumeLines(pdf);

  const sections: Record<SectionName, PositionedLine[]> = {
    summary: [],
    experience: [],
    education: [],
    projects: [],
    skills: [],
    certifications: [],
    interests: [],
  };
  const header: PositionedLine[] = [];
  let currentSection: SectionName | undefined;

  for (const line of lines) {
    const section = HEADINGS[line.text.toLowerCase()];

    if (section) {
      currentSection = section as SectionName;
      continue;
    }

    if (currentSection) {
      sections[currentSection].push(line);
    } else if (line.page === 1) {
      header.push(line);
    }
  }

  for (const section of REQUIRED_SECTIONS) {
    if (sections[section].length === 0) {
      throw new Error(`Resume parser: missing required "${section}" section`);
    }
  }

  const contact = parseContact(header);
  const experience = parseExperience(sections.experience);
  const education = parseEducation(sections.education);
  const projects = parseProjects(sections.projects);
  const skills = parseSkills(sections.skills);
  const certifications = parseCertifications(sections.certifications);
  const interests = parseInterests(sections.interests);
  const warnings: string[] = [];

  if (experience.length === 0) warnings.push("No experience entries parsed");
  if (education.length === 0) warnings.push("No education entries parsed");
  if (projects.length === 0) warnings.push("No project entries parsed");
  if (skills.length === 0) warnings.push("No skill groups parsed");

  return {
    contact,
    summary: parseSummary(sections.summary),
    experience,
    education,
    projects,
    skills,
    certifications,
    interests,
    meta: {
      source: "resume.pdf",
      sourceSha256,
      pages,
      warnings,
    },
  };
}
