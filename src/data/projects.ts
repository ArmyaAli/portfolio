export const projects = [
    {
        title: "Shroom.io",
        description: "Browser based io game. Realtime multiplayer. Utilziing Websockets and hopefully I can start using a UDP based browser API like QUIC... and wire it up to the Go backend. This is more of a long-term project. The goal is to build a polished product and actually have users.. need to figure out the hosting. These will be persistant connections with full duplex low latency data transfer... will require beefy servers..",
        technologies: "JavaScript, Tailwind, Pocketbase, SQLLite",
        link: "https://github.com/ArmyaAli/shroom.io",
        icon: "/shroomio.svg",
        type: "Multiplayer Game"
    },
    {
        title: "Mushroom Bot",
        description: "Discord bot with an excellent music player",
        technologies: "Node, SQLite3, OAuth, Ansible",
        link: "https://github.com/ArmyaAli/Mushroom-Bot",
        icon: "/discord.svg",
        type: "Discord Bot"
    },
    {
        title: "Audio Visualizer",
        description: "You can upload an mp3 file and view visualizations based on the characteristics of the Audio signal. Runs on a VM I configured myself. Load balancer, DNS, Subdomains, Cloudflare CDN. Github Actions CI/CD",
        technologies: "JavaScript, Browser Canvas API",
        link: "https://audio.lordmushroom.dev",
        icon: "/audiovis.png",
        type: "Browser Canvas Application"
    }
]