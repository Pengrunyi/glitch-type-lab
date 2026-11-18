import { test } from "node:test";
import assert from "node:assert/strict";
import { initialProject } from "../store/defaults.ts";
import { randomize, seeded } from "./random.ts";
import { EFFECT_KEYS } from "../store/types.ts";
test("seed streams reproduce exactly and different seeds diverge", () => {
  const values = (seed: string) => {
    const r = seeded(seed);
    return Array.from({ length: 100 }, () => r());
  };
  assert.deepEqual(values("future"), values("future"));
  assert.notDeepEqual(values("future"), values("void"));
});
test("chaos is reproducible and enables two to five effects", () => {
  const p = initialProject();
  for (let i = 0; i < 50; i++) {
    const a = randomize(p, `seed-${i}`),
      b = randomize(p, `seed-${i}`);
    assert.deepEqual(a, b);
    const count = EFFECT_KEYS.filter((k) => a.effects[k].enabled).length;
    assert.ok(count >= 2 && count <= 5);
    assert.equal(a.layers[0].text, p.layers[0].text);
  }
});
test("locked colors, font, text, and effects survive randomization", () => {
  const p = initialProject();
  p.locks = { colors: true, font: true, text: true };
  p.effects.rgb = { enabled: true, amount: 94, locked: true };
  const before = structuredClone(p);
  const next = randomize(p, "changed");
  assert.equal(next.primary, p.primary);
  assert.equal(next.secondary, p.secondary);
  assert.equal(next.accent, p.accent);
  assert.deepEqual(next.effects.rgb, p.effects.rgb);
  assert.deepEqual(
    next.layers.map((l) => [l.font, l.text]),
    p.layers.map((l) => [l.font, l.text]),
  );
  assert.deepEqual(p, before);
});
test("many seeds produce diverse style, color, and parameter combinations", () => {
  const p = initialProject();
  const outputs = Array.from({ length: 60 }, (_, i) =>
    randomize(p, `variation-${i}`),
  );
  assert.equal(new Set(outputs.map((p) => p.preset)).size, 6);
  assert.ok(new Set(outputs.map((p) => p.secondary)).size >= 5);
  assert.ok(new Set(outputs.map((p) => JSON.stringify(p.effects))).size > 55);
});
