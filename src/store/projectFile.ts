import type { Project } from "./types";
import { EFFECT_KEYS } from "./types";
import { initialProject } from "./defaults";
/** Bound imported loop counts and bitmap sizes before handing data to the renderer. */
export function validateProject(value: unknown): value is Project {
  if (!value || typeof value !== "object") return false;
  const p = value as Project,
    base = initialProject();
  for (const k of Object.keys(base) as (keyof Project)[])
    if (typeof p[k] !== typeof base[k]) return false;
  const limits: Partial<Record<keyof Project, [number, number]>> = {
    width: [200, 2400],
    height: [200, 2400],
    preset: [0, 5],
    intensity: [0, 100],
    slices: [2, 80],
    randomness: [0, 100],
    sliceHeight: [1, 40],
    sliceWidth: [10, 100],
    waveFrequency: [5, 100],
    waveSpeed: [0, 100],
    scanOpacity: [0, 100],
    scanThickness: [1, 5],
    blockSize: [2, 80],
    blockOffset: [0, 150],
    glowStrength: [0, 100],
    asciiDensity: [4, 18],
    asciiBrightness: [10, 100],
  };
  for (const [k, [min, max]] of Object.entries(limits)) {
    const n = p[k as keyof Project];
    if (typeof n !== "number" || !Number.isFinite(n) || n < min || n > max)
      return false;
  }
  if (
    !Number.isInteger(p.width) ||
    !Number.isInteger(p.height) ||
    !Number.isInteger(p.preset) ||
    !Array.isArray(p.layers) ||
    p.layers.length > 100 ||
    !p.effects ||
    !p.locks
  )
    return false;
  if (
    !["solid", "gradient", "transparent"].includes(p.backgroundMode) ||
    ![
      "None",
      "Grid",
      "Noise",
      "Dots",
      "Crosshatch",
      "Scanlines",
      "Static",
    ].includes(p.texture) ||
    !["horizontal", "vertical"].includes(p.waveAxis) ||
    !["color", "mono"].includes(p.noiseMode) ||
    !["replace", "mixed"].includes(p.corruptionMode) ||
    p.charset.length > 256 ||
    p.seed.length > 256
  )
    return false;
  if (!Object.values(p.locks).every((v) => typeof v === "boolean"))
    return false;
  return (
    p.layers.every(
      (l) =>
        l &&
        typeof l.text === "string" &&
        l.text.length <= 10000 &&
        typeof l.id === "string" &&
        typeof l.font === "string" &&
        ["left", "center", "right"].includes(l.align) &&
        [
          "x",
          "y",
          "size",
          "rotation",
          "scale",
          "weight",
          "spacing",
          "opacity",
          "lineHeight",
        ].every((k) => Number.isFinite(l[k as keyof typeof l])) &&
        l.scale >= 0.1 &&
        l.scale <= 4 &&
        l.size >= 10 &&
        l.size <= 400 &&
        l.opacity >= 0 &&
        l.opacity <= 1 &&
        l.lineHeight >= 0.5 &&
        l.lineHeight <= 2,
    ) &&
    EFFECT_KEYS.every(
      (k) =>
        p.effects[k] &&
        Number.isFinite(p.effects[k].amount) &&
        p.effects[k].amount >= 0 &&
        p.effects[k].amount <= 100 &&
        typeof p.effects[k].enabled === "boolean",
    ) &&
    [p.primary, p.secondary, p.accent, p.background, p.scanColor].every((c) =>
      /^#[0-9a-f]{6}$/i.test(c),
    )
  );
}
