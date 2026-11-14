export const site = {
  name: "Ali Umar",
  title: "Ali Umar — Software engineer",
  description:
    "Software engineer building realtime, browser-first tools. Projects, experiments, and the occasional game.",
  url: "https://aliumar.dev",
  ogImage: "/profile.jpg",
  links: {
    github: "https://github.com/ArmyaAli",
    linkedin: "https://www.linkedin.com/in/aliumardev",
    discord: "https://discordapp.com/users/143621097328345088",
  },
  formspreeEndpoint: "https://formspree.io/f/mvovjjvo",
} as const;

export const nav = [
  { label: "Work", href: "/#work" },
  { label: "About", href: "/#about" },
  { label: "Domains", href: "/domains" },
  { label: "Resume", href: "/resume" },
] as const;
