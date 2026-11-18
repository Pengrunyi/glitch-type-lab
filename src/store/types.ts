export type EffectKey =
  | "rgb"
  | "tear"
  | "noise"
  | "scanlines"
  | "wave"
  | "corrupt"
  | "blocks"
  | "glow";
export type Effect = { enabled: boolean; amount: number; locked: boolean };
export type TextLayer = {
  id: string;
  text: string;
  x: number;
  y: number;
  size: number;
  font: string;
  weight: number;
  spacing: number;
  lineHeight: number;
  align: CanvasTextAlign;
  rotation: number;
  scale: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  color: string;
  auxiliary: boolean;
};
export type Project = {
  name: string;
  preset: number;
  seed: string;
  width: number;
  height: number;
  background: string;
  backgroundMode: "solid" | "gradient" | "transparent";
  texture: string;
  primary: string;
  secondary: string;
  accent: string;
  layers: TextLayer[];
  effects: Record<EffectKey, Effect>;
  intensity: number;
  slices: number;
  randomness: number;
  sliceHeight: number;
  sliceWidth: number;
  waveFrequency: number;
  waveSpeed: number;
  waveAxis: "horizontal" | "vertical";
  noiseMode: "color" | "mono";
  scanOpacity: number;
  scanThickness: number;
  scanColor: string;
  blockSize: number;
  blockOffset: number;
  glowStrength: number;
  charset: string;
  corruptionMode: "replace" | "mixed";
  asciiDensity: number;
  asciiBrightness: number;
  locks: { colors: boolean; font: boolean; text: boolean };
};
export const EFFECT_NAMES: Record<EffectKey, string> = {
  rgb: "RGB separation",
  tear: "Horizontal tearing",
  noise: "Digital noise",
  scanlines: "Scanlines",
  wave: "Wave distortion",
  corrupt: "Character corruption",
  blocks: "Glitch blocks",
  glow: "Neon glow",
};
export const EFFECT_KEYS = Object.keys(EFFECT_NAMES) as EffectKey[];
