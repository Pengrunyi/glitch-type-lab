import type { Project } from "../store/types.ts";
import { EFFECT_KEYS } from "../store/types.ts";
import { applyPreset, PALETTES } from "../store/defaults.ts";
export function seeded(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function randomize(base: Project, seed: string): Project {
  const r = seeded(seed);
  let p = applyPreset(base, Math.floor(r() * 6));
  const palette = PALETTES[Math.floor(r() * 6)].colors;
  const count = 2 + Math.floor(r() * 4);
  const order = EFFECT_KEYS.map((k) => ({ k, n: r() }))
    .sort((a, b) => a.n - b.n)
    .map((v) => v.k);
  p = {
    ...p,
    seed,
    intensity: 60 + Math.round(r() * 40),
    slices: 12 + Math.floor(r() * 45),
    randomness: 40 + Math.round(r() * 60),
    waveFrequency: 20 + r() * 65,
  };
  p.primary = base.locks.colors ? base.primary : palette[0];
  p.secondary = base.locks.colors ? base.secondary : palette[1];
  p.accent = base.locks.colors ? base.accent : palette[2];
  p.layers = base.layers.map((l) => ({
    ...l,
    font:
      base.locks.font || l.locked
        ? l.font
        : ["Arial Black", "Impact", "monospace"][Math.floor(r() * 3)],
    text:
      base.locks.text || l.locked || l.auxiliary
        ? l.text
        : [
            "ERROR",
            "FUTURE",
            "CHAOS",
            "UNKNOWN",
            "SYSTEM",
            "DIGITAL",
            "VOID",
            "DANGER",
          ][Math.floor(r() * 8)],
  }));
  for (const k of EFFECT_KEYS) {
    p.effects[k] = base.effects[k].locked
      ? { ...base.effects[k] }
      : {
          enabled: order.indexOf(k) < count,
          amount: 10 + Math.round(r() * 70),
          locked: false,
        };
  }
  return p;
}
