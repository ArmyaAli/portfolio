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

const WIDTH = 1600;
const HEIGHT = 933;
const MARGIN = 64;
const BODY_TOP = 216;
const BODY_BOTTOM = HEIGHT - 56;
const COLUMN_GAP = 44;

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
) {
  let y = BODY_TOP;
  let truncated = false;

  for (const section of column) {
    if (section.heading) {
      context.font = '500 30px "Iowan Old Style", Georgia, serif';
      context.fillStyle = colors.ink;
      const heading = drawText(
        context,
        section.heading,
        x,
        y,
        width,
        34,
        BODY_BOTTOM,
      );
      y = heading.y + 4;
      truncated ||= heading.truncated;
    }

    if (section.meta) {
      context.font = '400 18px "JetBrainsMono Nerd Font", monospace';
      context.fillStyle = colors.accent;
      const meta = drawText(
        context,
        section.meta,
        x,
        y,
        width,
        24,
        BODY_BOTTOM,
      );
      y = meta.y + 8;
      truncated ||= meta.truncated;
    }

    context.font = section.bullets
      ? '400 23px "JetBrainsMono Nerd Font", monospace'
      : '400 22px "JetBrainsMono Nerd Font", monospace';
    context.fillStyle = colors.muted;

    for (const line of section.lines) {
      if (!line) continue;

      if (section.bullets) {
        const indent = 18;
        const lines = wrapText(context, line, width - indent);
        let first = true;

        for (const wrapped of lines) {
          if (y + 28 > BODY_BOTTOM) {
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

          context.fillText(wrapped, x + indent, y);
          y += 28;
        }
      } else {
        const result = drawText(context, line, x, y, width, 28, BODY_BOTTOM);
        y = result.y;
        truncated ||= result.truncated;
      }

      if (truncated) break;
    }

    if (section.note) {
      context.font = '400 18px "JetBrainsMono Nerd Font", monospace';
      context.fillStyle = colors.accent;
      const note = drawText(
        context,
        section.note,
        x,
        y,
        width,
        24,
        BODY_BOTTOM,
      );
      y = note.y;
      truncated ||= note.truncated;
    }

    if (truncated) break;
    y += 22;
  }

  return truncated;
}

function contentFor(station: Station, resume: ResumeDocument): Column[] {
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
        const shown = entry.bullets.slice(0, 3);
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
) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");

  context.beginPath();
  context.roundRect(8, 8, WIDTH - 16, HEIGHT - 16, 28);
  context.fillStyle = "#171310";
  context.fill();
  context.lineWidth = 2;
  context.strokeStyle = colors.border;
  context.stroke();

  context.textBaseline = "top";
  context.fillStyle = colors.accent;
  context.font = '600 22px "JetBrainsMono Nerd Font", monospace';
  context.fillText(station.kicker.toUpperCase(), MARGIN, 38);

  context.fillStyle = colors.ink;
  context.font = '500 56px "Iowan Old Style", Georgia, serif';
  context.fillText(station.title, MARGIN - 2, 72);

  context.fillStyle = colors.muted;
  context.font = '400 22px "JetBrainsMono Nerd Font", monospace';
  context.fillText(station.caption, MARGIN, 148);

  context.fillStyle = colors.green;
  context.font = '500 18px "JetBrainsMono Nerd Font", monospace';
  const action = "CLICK TO OPEN";
  context.fillText(
    action,
    WIDTH - MARGIN - context.measureText(action).width,
    44,
  );

  context.fillStyle = colors.border;
  context.fillRect(MARGIN, 190, WIDTH - MARGIN * 2, 1);

  const columns = contentFor(station, resume).filter(
    (column) => column.length > 0,
  );
  const columnWidth =
    (WIDTH - MARGIN * 2 - COLUMN_GAP * Math.max(columns.length - 1, 0)) /
    Math.max(columns.length, 1);

  let truncated = false;
  columns.forEach((column, index) => {
    truncated ||= drawColumn(
      context,
      column,
      MARGIN + index * (columnWidth + COLUMN_GAP),
      columnWidth,
    );
  });

  if (truncated) {
    context.fillStyle = colors.accent;
    context.font = '400 18px "JetBrainsMono Nerd Font", monospace';
    context.fillText(
      "Open this station for the full text.",
      MARGIN,
      BODY_BOTTOM - 22,
    );
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const textPanelSize = { width: 12, height: 7 } as const;
