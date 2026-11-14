export type Contact = {
  name: string;
  phone?: string;
  email: string;
  website?: string;
  linkedin?: string;
  github?: string;
};

export type ExperienceEntry = {
  title: string;
  organization: string;
  location?: string;
  date: string;
  bullets: string[];
};

export type EducationEntry = {
  credential: string;
  institution: string;
  location?: string;
  date?: string;
};

export type ProjectEntry = {
  title: string;
  technologies: string[];
  date: string;
  bullets: string[];
};

export type SkillGroup = {
  label: string;
  items: string[];
};

export type Certification = {
  name: string;
  date: string;
};

export type ResumeDocument = {
  contact: Contact;
  summary?: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  skills: SkillGroup[];
  certifications: Certification[];
  interests: string[];
  meta: {
    source: "resume.pdf";
    sourceSha256: string;
    pages: number;
    warnings: string[];
  };
};

export type PositionedLine = {
  text: string;
  segments: { text: string; x: number }[];
  x: number;
  y: number;
  page: number;
};
