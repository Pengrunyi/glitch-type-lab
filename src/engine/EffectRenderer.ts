import type { Project } from "../store/types";
export function tint(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  color: string,
) {
  const c = target.getContext("2d", { willReadFrequently: true })!;
  c.clearRect(0, 0, target.width, target.height);
  c.globalCompositeOperation = "source-over";
  c.drawImage(source, 0, 0);
  c.globalCompositeOperation = "source-in";
  c.fillStyle = color;
  c.fillRect(0, 0, target.width, target.height);
  c.globalCompositeOperation = "source-over";
}
export function distort(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  p: Project,
  r: () => number,
  time: number,
) {
  const c = target.getContext("2d", { willReadFrequently: true })!;
  const { width: w, height: h } = p;
  c.clearRect(0, 0, w, h);
  const intensity = p.intensity / 100;
  const wave = p.effects.wave.enabled ? p.effects.wave.amount * intensity : 0;
  const tear = p.effects.tear.enabled ? p.effects.tear.amount * intensity : 0;
  const step = wave ? 3 : Math.max(2, Math.floor(h / p.slices));
  if (p.waveAxis === "vertical" && wave) {
    for (let x = 0; x < w; x += step) {
      const dy =
        Math.sin(
          (x / p.width) * p.waveFrequency * 0.6 + (time * p.waveSpeed) / 800,
        ) * wave;
      c.drawImage(source, x, 0, step, h, x, dy, step, h);
    }
  } else {
    for (let y = 0; y < h; y += step) {
      const shift =
        Math.sin((y / h) * p.waveFrequency * 0.6 + (time * p.waveSpeed) / 800) *
        wave;
      const dx =
        tear && r() < p.randomness / 100 ? (r() - 0.5) * tear * 2.4 : 0;
      c.drawImage(source, 0, y, w, step, shift + dx, y, w, step);
    }
  }
  if (tear) {
    for (let i = 0; i < p.slices; i++) {
      const y = Math.floor(r() * h),
        sh = Math.max(1, r() * p.sliceHeight),
        sw = (w * p.sliceWidth) / 100,
        sx = (w - sw) * r();
      c.clearRect(sx, y, sw, sh);
      c.drawImage(
        source,
        sx,
        y,
        sw,
        sh,
        sx + (r() - 0.5) * tear * 3,
        y,
        sw,
        sh,
      );
    }
  }
}
export function ascii(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  p: Project,
  r: () => number,
) {
  const ctx = source.getContext("2d", { willReadFrequently: true })!;
  const out = target.getContext("2d", { willReadFrequently: true })!;
  const { width: w, height: h } = p;
  const cell = p.asciiDensity;
  const data = ctx.getImageData(0, 0, w, h).data;
  out.clearRect(0, 0, w, h);
  out.font = `bold ${cell + 1}px monospace`;
  out.textAlign = "center";
  out.textBaseline = "middle";
  const chars = " .:/+*#%@";
  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      const a = data[(y * w + x) * 4 + 3];
      if (a < 30) continue;
      const brightness = Math.min(1, ((a / 255) * p.asciiBrightness) / 75);
      out.fillStyle = r() < 0.12 ? p.accent : p.secondary;
      out.fillText(
        p.effects.corrupt.enabled && r() < p.effects.corrupt.amount / 160
          ? (p.charset || "01")[Math.floor(r() * (p.charset || "01").length)]
          : chars[
              Math.min(
                chars.length - 1,
                Math.floor(brightness * (chars.length - 1)),
              )
            ],
        x,
        y,
      );
    }
  }
}
export function noise(
  ctx: CanvasRenderingContext2D,
  p: Project,
  r: () => number,
  amount: number,
) {
  ctx.save();
  for (let i = 0; i < amount * 65; i++) {
    const x = r() * p.width,
      y = r() * p.height;
    ctx.globalAlpha = r() * 0.4;
    ctx.fillStyle =
      p.noiseMode === "mono" ? "#ffffff" : r() > 0.5 ? p.secondary : p.accent;
    ctx.fillRect(x, y, r() * 3 + 1, r() > 0.96 ? r() * 12 : 1);
  }
  for (let i = 0; i < amount / 8; i++) {
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = p.secondary;
    ctx.fillRect(r() * p.width, r() * p.height, r() * 90, 1);
  }
  ctx.restore();
}
