export type Theme = "light" | "dark";

export type Palette = {
  background: number;
  surface: number;
  ink: number;
  muted: number;
  line: number;
  accent: number;
  green: number;
  yellow: number;
};

export const palettes: Record<Theme, Palette> = {
  dark: {
    background: 0x171310,
    surface: 0x1e1814,
    ink: 0xfaf0dc,
    muted: 0xc8b99f,
    line: 0x5a3d37,
    accent: 0xf07f68,
    green: 0xaecb7d,
    yellow: 0xf0c66a,
  },
  light: {
    background: 0xf4f0e8,
    surface: 0xfbf8f1,
    ink: 0x1b1a15,
    muted: 0x55564c,
    line: 0xcfc7b7,
    accent: 0xa3482a,
    green: 0x4f7a3a,
    yellow: 0x9a6b1f,
  },
};

export const palette = palettes.dark;

export function paletteFor(theme: Theme) {
  return palettes[theme];
}
