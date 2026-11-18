import type { Project, TextLayer } from "../store/types";
export function corruptText(text: string, p: Project, r: () => number) {
  const chance = p.effects.corrupt.enabled
    ? ((p.effects.corrupt.amount / 100) * p.intensity) / 100
    : 0;
  return [...text]
    .map((c) => {
      if (c === " " || c === "\n" || r() > chance) return c;
      const n = r();
      const s = p.charset || "01_";
      const char = s[Math.floor(r() * s.length)];
      if (p.corruptionMode === "replace") return char;
      return n < 0.13
        ? ""
        : n < 0.28
          ? c + c
          : n < 0.4
            ? char + c
            : n < 0.52
              ? c.toLowerCase()
              : char;
    })
    .join("");
}
export function drawText(
  ctx: CanvasRenderingContext2D,
  l: TextLayer,
  p: Project,
  r: () => number,
  before: boolean,
) {
  ctx.save();
  ctx.translate(l.x * p.width, l.y * p.height);
  ctx.rotate((l.rotation * Math.PI) / 180);
  ctx.scale(l.scale, l.scale);
  ctx.globalAlpha = l.opacity;
  ctx.fillStyle = l.color || p.primary;
  ctx.font = `${l.weight} ${l.size}px "${l.font}", ${l.font === "monospace" ? "monospace" : "sans-serif"}`;
  ctx.textAlign = l.align;
  ctx.textBaseline = "middle";
  ctx.letterSpacing = `${l.spacing}px`;
  const lines = (before ? l.text : corruptText(l.text, p, r)).split("\n");
  lines.forEach((line, i) =>
    ctx.fillText(line, 0, (i - (lines.length - 1) / 2) * l.size * l.lineHeight),
  );
  ctx.restore();
}
