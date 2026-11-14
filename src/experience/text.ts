import * as THREE from "three";
import type { ResumeDocument } from "../lib/resume/types";
import type { Station } from "./stations";

type Section = {
  heading?: string;
  meta?: string;
  lines: string[];
  bullets?: boolean;
  note?: string;
};

type Column = Section[];

type Layout = {
  width: number;
  height: number;
  margin: number;
  bodyTop: number;
  bodyBottom: number;
  columnGap: number;
  radius: number;
  kickerY: number;
  titleY: number;
  captionY: number;
  actionY: number;
  dividerY: number;
  kickerSize: number;
  titleSize: number;
  captionSize: number;
  actionSize: number;
  headingSize: number;
  headingLine: number;
  metaSize: number;
  metaLine: number;
  bodySize: number;
  bodyLine: number;
  bulletLine: number;
  noteSize: number;
  noteLine: number;
  sectionGap: number;
  bulletIndent: number;
};

const desktopLayout: Layout = {
  width: 1600,
  height: 933,
  margin: 64,
  bodyTop: 216,
  bodyBottom: 877,
  columnGap: 44,
  radius: 28,
  kickerY: 38,
  titleY: 72,
  captionY: 148,
  actionY: 44,
  dividerY: 190,
  kickerSize: 22,
  titleSize: 56,
  captionSize: 22,
  actionSize: 18,
  headingSize: 30,
  headingLine: 34,
  metaSize: 18,
  metaLine: 24,
  bodySize: 22,
  bodyLine: 28,
  bulletLine: 28,
  noteSize: 18,
  noteLine: 24,
  sectionGap: 22,
  bulletIndent: 18,
};

const mobileLayout: Layout = {
  width: 900,
  height: 1400,
  margin: 56,
  bodyTop: 250,
  bodyBottom: 1320,
  columnGap: 0,
  radius: 24,
  kickerY: 44,
  titleY: 84,
  captionY: 160,
  actionY: 48,
  dividerY: 210,
  kickerSize: 26,
  titleSize: 68,
  captionSize: 26,
  actionSize: 20,
  headingSize: 40,
  headingLine: 46,
  metaSize: 24,
  metaLine: 30,
  bodySize: 32,
  bodyLine: 40,
  bulletLine: 40,
  noteSize: 24,
  noteLine: 30,
  sectionGap: 18,
  bulletIndent: 20,
};

const colors = {
  border: "rgba(74, 48, 45, 0.92)",
  accent: "#e86f5a",
  ink: "#f4e4c1",
  muted: "#9f9077",
  green: "#9dbb6d",
};

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;

    if (context.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function drawText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxY: number,
) {
  const lines = wrapText(context, text, maxWidth);
  let cursor = y;

  for (const line of lines) {
    if (cursor + lineHeight > maxY) {
      context.fillText("…", x, cursor);
      return { y: maxY, truncated: true };
    }

    context.fillText(line, x, cursor);
    cursor += lineHeight;
  }

  return { y: cursor, truncated: false };
}

function drawColumn(
  context: CanvasRenderingContext2D,
  column: Column,
  x: number,
  width: number,
  layout: Layout,
) {
  let y = layout.bodyTop;
  let truncated = false;

  for (const section of column) {
    if (section.heading) {
      context.font = `500 ${layout.headingSize}px "Iowan Old Style", Georgia, serif`;
      context.fillStyle = colors.ink;
      const heading = drawText(
        context,
        section.heading,
        x,
        y,
        width,
        layout.headingLine,
        layout.bodyBottom,
      );
      y = heading.y + 4;
      truncated ||= heading.truncated;
    }

    if (section.meta) {
      context.font = `400 ${layout.metaSize}px "JetBrainsMono Nerd Font", monospace`;
      context.fillStyle = colors.accent;
      const meta = drawText(
        context,
        section.meta,
        x,
        y,
        width,
        layout.metaLine,
        layout.bodyBottom,
      );
      y = meta.y + 8;
      truncated ||= meta.truncated;
    }

    context.font = `400 ${layout.bodySize}px "JetBrainsMono Nerd Font", monospace`;
    context.fillStyle = colors.muted;

    for (const line of section.lines) {
      if (!line) continue;

      if (section.bullets) {
        const lines = wrapText(context, line, width - layout.bulletIndent);
        let first = true;

        for (const wrapped of lines) {
          if (y + layout.bulletLine > layout.bodyBottom) {
            context.fillText("…", x, y);
            truncated = true;
            break;
          }

          if (first) {
            context.fillStyle = colors.accent;
            context.fillText("•", x, y);
            context.fillStyle = colors.muted;
            first = false;
          }

          context.fillText(wrapped, x + layout.bulletIndent, y);
          y += layout.bulletLine;
        }
      } else {
        const result = drawText(
          context,
          line,
          x,
          y,
          width,
          layout.bodyLine,
          layout.bodyBottom,
        );
        y = result.y;
        truncated ||= result.truncated;
      }

      if (truncated) break;
    }

    if (section.note) {
      context.font = `400 ${layout.noteSize}px "JetBrainsMono Nerd Font", monospace`;
      context.fillStyle = colors.accent;
      const note = drawText(
        context,
        section.note,
        x,
        y,
        width,
        layout.noteLine,
        layout.bodyBottom,
      );
      y = note.y;
      truncated ||= note.truncated;
    }

    if (truncated) break;
    y += layout.sectionGap;
  }

  return truncated;
}

function mobileContentFor(station: Station, resume: ResumeDocument): Column[] {
  const role = resume.experience[0];

  switch (station.id) {
    case "origin":
      return [
        [
          { heading: "Profile", lines: [resume.summary ?? ""] },
          {
            heading: "Currently",
            meta: role ? `${role.title} · ${role.organization}` : undefined,
            lines: [],
          },
        ],
      ];

    case "experience": {
      const [first, ...remaining] = resume.experience;
      return [
        [
          ...(first
            ? [
                {
                  heading: first.title,
                  meta: `${first.organization} · ${first.date}`,
                  lines: first.bullets.slice(0, 2),
                  bullets: true,
                  note:
                    first.bullets.length > 2
                      ? `+${first.bullets.length - 2} more in the station panel`
                      : undefined,
                },
              ]
            : []),
          ...remaining.map((entry) => ({
            heading: entry.title,
            meta: `${entry.organization} · ${entry.date}`,
            lines: [],
          })),
        ],
      ];
    }

    case "projects":
      return [
        resume.projects.map((project) => ({
          heading: project.title,
          meta: `${project.technologies.join(" · ")} · ${project.date}`,
          lines: project.bullets.slice(0, 1),
          bullets: true,
        })),
      ];

    case "skills":
      return [
        resume.skills.map((group) => ({
          heading: group.label,
          lines: [group.items.join(", ")],
        })),
      ];

    case "education":
      return [
        [
          ...resume.education.map((entry) => ({
            heading: entry.credential,
            meta: `${entry.institution} · ${entry.date ?? ""}`,
            lines: [],
          })),
          {
            heading: "Certifications",
            lines: resume.certifications.map(
              (certification) =>
                `${certification.name} · ${certification.date}`,
            ),
          },
          {
            heading: "Interests",
            lines: [resume.interests.join(", ")],
          },
        ],
      ];

    case "contact":
      return [
        [
          {
            heading: "Email",
            lines: [resume.contact.email],
          },
          {
            heading: "Elsewhere",
            lines: [
              resume.contact.website ?? "",
              resume.contact.linkedin ?? "",
              resume.contact.github ?? "",
            ],
          },
          {
            heading: "Full resume",
            lines: ["Open the station panel for downloads and the contact form."],
          },
        ],
      ];
  }
}

function contentFor(
  station: Station,
  resume: ResumeDocument,
  narrow = false,
): Column[] {
  if (narrow) return mobileContentFor(station, resume);

  const role = resume.experience[0];

  switch (station.id) {
    case "origin":
      return [
        [
          { heading: "Profile", lines: [resume.summary ?? ""] },
          {
            heading: "Currently",
            meta: role ? `${role.title} · ${role.organization}` : undefined,
            lines: [],
          },
        ],
        [
          {
            heading: "Contact",
            lines: [
              resume.contact.email,
              resume.contact.website ?? "",
              resume.contact.linkedin ?? "",
              resume.contact.github ?? "",
            ],
          },
          {
            heading: "Education",
            lines: resume.education.map(
              (entry) => `${entry.credential} — ${entry.institution}`,
            ),
          },
        ],
      ];

    case "experience": {
      const roleSection = (entry: ResumeDocument["experience"][number]) => {
        const shown = entry.bullets.slice(0, narrow ? 2 : 3);
        const remaining = entry.bullets.length - shown.length;

        return {
          heading: entry.title,
          meta: `${entry.organization} · ${entry.date}`,
          lines: shown,
          bullets: true,
          note:
            remaining > 0
              ? `+${remaining} more in the full station panel`
              : undefined,
        };
      };

      return [
        resume.experience[0] ? [roleSection(resume.experience[0])] : [],
        resume.experience.slice(1).map(roleSection),
      ];
    }

    case "projects":
      return resume.projects.map((project) => [
        {
          heading: project.title,
          meta: `${project.technologies.join(" · ")} · ${project.date}`,
          lines: project.bullets,
          bullets: true,
        },
      ]);

    case "skills":
      return resume.skills.map((group) => [
        {
          heading: group.label,
          lines: [group.items.join(", ")],
        },
      ]);

    case "education":
      return [
        resume.education.map((entry) => ({
          heading: entry.credential,
          meta: `${entry.institution} · ${entry.date ?? ""}`,
          lines: entry.location ? [entry.location] : [],
        })),
        [
          {
            heading: "Certifications",
            lines: resume.certifications.map(
              (certification) =>
                `${certification.name} · ${certification.date}`,
            ),
          },
          {
            heading: "Interests",
            lines: [resume.interests.join(", ")],
          },
        ],
      ];

    case "contact":
      return [
        [
          {
            heading: "Email",
            lines: [resume.contact.email],
          },
          {
            heading: "Elsewhere",
            lines: [
              resume.contact.website ?? "",
              resume.contact.linkedin ?? "",
              resume.contact.github ?? "",
            ],
          },
        ],
        [
          {
            heading: "Resume",
            lines: [
              "Download the PDF or open the full text resume.",
              "The contact form is in the station panel.",
            ],
          },
        ],
      ];
  }
}

export function createStationTextTexture(
  station: Station,
  resume: ResumeDocument,
  narrow = false,
) {
  const layout = narrow ? mobileLayout : desktopLayout;
  const canvas = document.createElement("canvas");
  canvas.width = layout.width;
  canvas.height = layout.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");

  context.beginPath();
  context.roundRect(
    8,
    8,
    layout.width - 16,
    layout.height - 16,
    layout.radius,
  );
  context.fillStyle = "#171310";
  context.fill();
  context.lineWidth = 2;
  context.strokeStyle = colors.border;
  context.stroke();

  context.textBaseline = "top";
  context.fillStyle = colors.accent;
  context.font = `600 ${layout.kickerSize}px "JetBrainsMono Nerd Font", monospace`;
  context.fillText(station.kicker.toUpperCase(), layout.margin, layout.kickerY);

  context.fillStyle = colors.ink;
  context.font = `500 ${layout.titleSize}px "Iowan Old Style", Georgia, serif`;
  context.fillText(station.title, layout.margin - 2, layout.titleY);

  context.fillStyle = colors.muted;
  context.font = `400 ${layout.captionSize}px "JetBrainsMono Nerd Font", monospace`;
  context.fillText(station.caption, layout.margin, layout.captionY);

  context.fillStyle = colors.green;
  context.font = `500 ${layout.actionSize}px "JetBrainsMono Nerd Font", monospace`;
  const action = "CLICK TO OPEN";
  context.fillText(
    action,
    layout.width - layout.margin - context.measureText(action).width,
    layout.actionY,
  );

  context.fillStyle = colors.border;
  context.fillRect(
    layout.margin,
    layout.dividerY,
    layout.width - layout.margin * 2,
    1,
  );

  const source = contentFor(station, resume, narrow);
  const columns = narrow
    ? [source.flat()]
    : source.filter((column) => column.length > 0);
  const columnWidth =
    (layout.width -
      layout.margin * 2 -
      layout.columnGap * Math.max(columns.length - 1, 0)) /
    Math.max(columns.length, 1);

  let truncated = false;
  columns.forEach((column, index) => {
    truncated ||= drawColumn(
      context,
      column,
      layout.margin + index * (columnWidth + layout.columnGap),
      columnWidth,
      layout,
    );
  });

  if (truncated) {
    context.fillStyle = colors.accent;
    context.font = `400 ${layout.noteSize}px "JetBrainsMono Nerd Font", monospace`;
    context.fillText(
      "Open this station for the full text.",
      layout.margin,
      layout.bodyBottom - layout.noteLine,
    );
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function textPanelFor(narrow: boolean) {
  return narrow
    ? { width: 7.4, height: 11.5 }
    : { width: 12, height: 7 };
}
