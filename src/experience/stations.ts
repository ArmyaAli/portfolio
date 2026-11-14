export type StationId =
  | "origin"
  | "experience"
  | "projects"
  | "skills"
  | "education"
  | "contact";

export type Station = {
  id: StationId;
  index: number;
  kicker: string;
  label: string;
  title: string;
  caption: string;
  x: number;
  y: number;
};

export const stations: Station[] = [
  {
    id: "origin",
    index: 0,
    kicker: "00 — Origin",
    label: "Origin",
    title: "Ali Umar",
    caption: "Software Developer · Toronto",
    x: 0,
    y: 0,
  },
  {
    id: "experience",
    index: 1,
    kicker: "01 — Experience",
    label: "Experience",
    title: "The work",
    caption: "3 roles · 2020 — present",
    x: -5.5,
    y: -12,
  },
  {
    id: "projects",
    index: 2,
    kicker: "02 — Projects",
    label: "Projects",
    title: "Things built",
    caption: "3 projects · shipped + lab",
    x: 5.5,
    y: -24,
  },
  {
    id: "skills",
    index: 3,
    kicker: "03 — Skills",
    label: "Skills",
    title: "The toolkit",
    caption: "Languages · systems · delivery",
    x: -5,
    y: -36,
  },
  {
    id: "education",
    index: 4,
    kicker: "04 — Education",
    label: "Education",
    title: "The foundation",
    caption: "York · Seneca · certifications",
    x: 5,
    y: -48,
  },
  {
    id: "contact",
    index: 5,
    kicker: "05 — Contact",
    label: "Contact",
    title: "Say hello",
    caption: "Email · GitHub · LinkedIn",
    x: 0,
    y: -60,
  },
];

export const stationById = new Map(stations.map((station) => [station.id, station]));

export const worldBounds = {
  minX: -11,
  maxX: 11,
  minY: -69,
  maxY: 7,
};
