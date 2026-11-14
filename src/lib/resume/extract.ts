import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { PositionedLine } from "./types.ts";

type Item = {
  str: string;
  transform: number[];
  width?: number;
};

type Group = {
  y: number;
  items: { x: number; text: string; width: number }[];
};

function normalize(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function extractResumeLines(
  pdf: Uint8Array,
): Promise<{ lines: PositionedLine[]; pages: number }> {
  const loadingTask = getDocument({
    data: pdf,
    useSystemFonts: false,
    disableFontFace: true,
  });
  const document = await loadingTask.promise;
  const pages = document.numPages;
  const lines: PositionedLine[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const groups: Group[] = [];

    for (const raw of content.items) {
      const item = raw as Item;
      if (typeof item.str !== "string" || item.str.length === 0) continue;

      const x = item.transform[4];
      const y = item.transform[5];
      const group =
        groups.find((candidate) => Math.abs(candidate.y - y) <= 2.5) ??
        (() => {
          const created = { y, items: [] as Group["items"] };
          groups.push(created);
          return created;
        })();

      group.items.push({
        x,
        text: item.str,
        width: item.width ?? item.str.length * 4,
      });
    }

    for (const group of groups.sort((a, b) => b.y - a.y)) {
      const items = group.items.sort((a, b) => a.x - b.x);
      if (items.length === 0) continue;

      let text = "";
      let previousEnd: number | undefined;
      const segments: { text: string; x: number }[] = [];
      let segmentText = "";
      let segmentX = items[0].x;

      for (const item of items) {
        if (previousEnd !== undefined) {
          const gap = item.x - previousEnd;

          if (gap > 60 && segmentText.trim()) {
            segments.push({ text: normalize(segmentText), x: Math.round(segmentX) });
            segmentText = "";
            segmentX = item.x;
          }

          if (gap > 1.5 && !/\s$/.test(text) && !/^\s/.test(item.text)) {
            text += " ";
          }
        }

        text += item.text;
        segmentText += item.text;
        previousEnd = item.x + item.text.length * 4.5;
      }

      if (segmentText.trim()) {
        segments.push({ text: normalize(segmentText), x: Math.round(segmentX) });
      }

      const normalized = normalize(text);
      if (!normalized) continue;

      lines.push({
        text: normalized,
        segments,
        x: Math.round(items[0].x),
        y: Math.round(group.y),
        page: pageNumber,
      });
    }

    page.cleanup();
  }

  await loadingTask.destroy();
  return { lines, pages };
}
