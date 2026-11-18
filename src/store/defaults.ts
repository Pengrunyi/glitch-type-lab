import type { Project, TextLayer, EffectKey } from "./types";
export const PRESETS = [
  {
    name: "RGB GLITCH",
    tag: "CHROMATIC / SPLIT",
    word: "GLITCH",
    color: "#00e5ff",
  },
  {
    name: "CYBERPUNK NEON",
    tag: "HIGH VOLTAGE",
    word: "NEON",
    color: "#ff2e78",
  },
  {
    name: "DIGITAL CORRUPTION",
    tag: "DATA / DECAY",
    word: "C0RRUPT",
    color: "#b7ff35",
  },
  {
    name: "SIGNAL FAILURE",
    tag: "NO SIGNAL",
    word: "SIGNAL",
    color: "#f2f4f8",
  },
  {
    name: "ASCII CHAOS",
    tag: "CHARACTER / MATRIX",
    word: "ASCII",
    color: "#00e5ff",
  },
  {
    name: "ACID DISTORTION",
    tag: "LIQUID / FREQUENCY",
    word: "ACID",
    color: "#b7ff35",
  },
];
export const PALETTES = [
  { name: "CYBERPUNK", colors: ["#f2f4f8", "#00e5ff", "#ff2e78"] },
  { name: "MATRIX", colors: ["#b7ff35", "#20c76a", "#e8ffca"] },
  { name: "ACID", colors: ["#b7ff35", "#ff2e78", "#f2f4f8"] },
  { name: "BLOOD", colors: ["#ff2e78", "#ff6b42", "#f2f4f8"] },
  { name: "ULTRAVIOLET", colors: ["#c099ff", "#683dff", "#ff2e78"] },
  { name: "MONOCHROME", colors: ["#f2f4f8", "#969da9", "#535b69"] },
];
const amounts = [
  [25, 34, 12, 38, 0, 0, 16, 0],
  [16, 12, 5, 24, 8, 0, 0, 65],
  [10, 65, 22, 32, 0, 45, 55, 0],
  [8, 70, 65, 80, 12, 14, 40, 0],
  [12, 5, 8, 12, 0, 5, 0, 0],
  [35, 20, 10, 20, 65, 0, 24, 25],
];
export function applyPreset(p: Project, index: number): Project {
  const a = amounts[index];
  const palette = PALETTES[index === 2 ? 1 : index === 5 ? 2 : 0].colors;
  return {
    ...p,
    preset: index,
    intensity: 78,
    primary: palette[0],
    secondary: palette[1],
    accent: palette[2],
    effects: Object.fromEntries(
      (
        [
          "rgb",
          "tear",
          "noise",
          "scanlines",
          "wave",
          "corrupt",
          "blocks",
          "glow",
        ] as EffectKey[]
      ).map((k, i) => [
        k,
        {
          enabled: a[i] > 0,
          amount: a[i],
          locked: p.effects[k]?.locked ?? false,
        },
      ]),
    ) as Project["effects"],
  };
}
export function newLayer(text: string, size = 100): TextLayer {
  return {
    id: crypto.randomUUID(),
    text,
    x: 0.5,
    y: 0.5,
    size,
    font: "Arial Black",
    weight: 900,
    spacing: -6,
    lineHeight: 1.05,
    align: "center",
    rotation: 0,
    scale: 1,
    opacity: 1,
    visible: true,
    locked: false,
    color: "",
    auxiliary: false,
  };
}
export function initialProject(): Project {
  return applyPreset(
    {
      name: "UNTITLED_001",
      preset: 0,
      seed: "CHAOS-001",
      width: 1200,
      height: 1200,
      background: "#08090d",
      backgroundMode: "solid",
      texture: "Noise",
      primary: "#f2f4f8",
      secondary: "#00e5ff",
      accent: "#ff2e78",
      layers: [
        { ...newLayer("GLITCH", 235), y: 0.47 },
        {
          ...newLayer("SYSTEM FAILURE_001", 25),
          y: 0.635,
          font: "monospace",
          weight: 500,
          spacing: 4,
          auxiliary: true,
        },
        {
          ...newLayer("DIGITAL CORRUPTION / VOL.01", 15),
          y: 0.86,
          font: "monospace",
          weight: 400,
          spacing: 3,
          auxiliary: true,
        },
      ],
      effects: {} as Project["effects"],
      intensity: 78,
      slices: 28,
      randomness: 72,
      sliceHeight: 8,
      sliceWidth: 100,
      waveFrequency: 48,
      waveSpeed: 40,
      waveAxis: "horizontal",
      noiseMode: "color",
      scanOpacity: 32,
      scanThickness: 1,
      scanColor: "#08090d",
      blockSize: 28,
      blockOffset: 60,
      glowStrength: 70,
      charset: "@#$%&*/01_",
      corruptionMode: "mixed",
      asciiDensity: 8,
      asciiBrightness: 85,
      locks: { colors: false, font: false, text: true },
    },
    0,
  );
}
