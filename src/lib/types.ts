export interface EditorSettings {
  font: string;
  fontSize: number;
  chars: string;
  cols: number;
  colour: string;
  baseAlpha: number;
  peakAlpha: number;
  fps: number;
  invertLuminance: boolean;
  background: string;
  transparentBg: boolean;
  clipThreshold: number;
  gamma: number;
  contrast: number;
  brightness: number;
}

export interface ExportMeta {
  cols: number;
  rows: number;
  fps: number;
  totalFrames: number;
  font: string;
  fontSize: number;
  chars: string;
  colour: string;
  baseAlpha: number;
  peakAlpha: number;
  background: string;
  loop: boolean;
  crossfadeFrames: number;
  transparentBackground: boolean;
  clipThreshold: number;
  gamma: number;
  contrast: number;
  brightness: number;
}

export interface AsciiExport {
  meta: ExportMeta;
  frames: string[];
}

export const DEFAULT_SETTINGS: EditorSettings = {
  font: "monospace",
  fontSize: 11,
  chars: "{}[]<>/.,;:#$+-=|~_01",
  cols: 80,
  colour: "#C19A4E",
  baseAlpha: 0.03,
  peakAlpha: 0.08,
  fps: 15,
  invertLuminance: false,
  background: "#151820",
  transparentBg: false,
  clipThreshold: 0,
  gamma: 2.2,
  contrast: 1.0,
  brightness: 0.0,
};

export interface CharSetPreset {
  name: string;
  chars: string;
}

export const CHAR_SET_PRESETS: CharSetPreset[] = [
  { name: "Code", chars: "{}[]<>/.,;:#$+-=|~_01" },
  { name: "Classic", chars: "@#$%&*+=-:. " },
  { name: "Minimal", chars: ".:-=+*#@" },
  { name: "Dense", chars: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,\"^'. " },
  { name: "Blocks", chars: " ░▒▓█" },
  { name: "Binary", chars: "01" },
];

export const RESOLUTION_PRESETS = {
  low: 40,
  medium: 80,
  high: 140,
  ultra: 200,
} as const;

export type ResolutionPreset = keyof typeof RESOLUTION_PRESETS;

export interface FontOption {
  name: string;
  family: string;
  googleUrl?: string;
}

export const BUILT_IN_FONTS: FontOption[] = [
  { name: "JetBrains Mono", family: "JetBrains Mono", googleUrl: "https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap" },
  { name: "Fira Code", family: "Fira Code", googleUrl: "https://fonts.googleapis.com/css2?family=Fira+Code&display=swap" },
  { name: "Source Code Pro", family: "Source Code Pro", googleUrl: "https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap" },
  { name: "IBM Plex Mono", family: "IBM Plex Mono", googleUrl: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono&display=swap" },
  { name: "Space Mono", family: "Space Mono", googleUrl: "https://fonts.googleapis.com/css2?family=Space+Mono&display=swap" },
  { name: "Courier Prime", family: "Courier Prime", googleUrl: "https://fonts.googleapis.com/css2?family=Courier+Prime&display=swap" },
];

export interface StylePreset {
  name: string;
  settings: Partial<EditorSettings>;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    name: "kbanc hero",
    settings: {
      font: "JetBrains Mono",
      chars: "{}[]<>/.,;:#$+-=|~_01",
      colour: "#C19A4E",
      baseAlpha: 0.03,
      peakAlpha: 0.08,
      background: "#151820",
    },
  },
  {
    name: "Terminal green",
    settings: {
      font: "JetBrains Mono",
      chars: "@#$%&*+=-:. ",
      colour: "#4ADE80",
      baseAlpha: 0.1,
      peakAlpha: 1.0,
      background: "#0D1117",
    },
  },
  {
    name: "High contrast",
    settings: {
      font: "Courier Prime",
      chars: "@#$%&*+=-:. ",
      colour: "#FFFFFF",
      baseAlpha: 0.1,
      peakAlpha: 1.0,
      background: "#000000",
    },
  },
];
