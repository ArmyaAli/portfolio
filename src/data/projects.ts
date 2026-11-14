export type Project = {
  title: string;
  type: string;
  description: string;
  tech: string[];
  href: string;
};

export const projects: Project[] = [
  {
    title: "gratitude.forum",
    type: "Realtime social app",
    description:
      "A warm little gratitude journal. People post short notes and watch them drift across a shared live canvas in the same room.",
    tech: ["TypeScript", "Realtime"],
    href: "https://gratitude.forum",
  },
  {
    title: "Shroom.io",
    type: "Multiplayer game",
    description:
      "A browser-based .io game with realtime multiplayer and persistent connections. A long-term project aimed at a polished, hosted release.",
    tech: ["JavaScript", "WebSockets", "PocketBase", "SQLite"],
    href: "https://github.com/ArmyaAli/shroom.io",
  },
  {
    title: "Mushroom Bot",
    type: "Discord bot",
    description:
      "A Discord bot with a music player, queueing, and playback controls, deployed and configured with Ansible.",
    tech: ["Node", "SQLite", "OAuth", "Ansible"],
    href: "https://github.com/ArmyaAli/Mushroom-Bot",
  },
  {
    title: "Audio Visualizer",
    type: "Browser experiment",
    description:
      "Upload an MP3 and see visualizations driven by the audio signal. Self-hosted with DNS, a load balancer, Cloudflare, and GitHub Actions deploys.",
    tech: ["JavaScript", "Canvas API"],
    href: "https://audio.lordmushroom.dev",
  },
];
