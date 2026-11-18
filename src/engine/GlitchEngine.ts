import type { Project } from "../store/types";
import { seeded } from "./random";
import { drawText } from "./TextRenderer";
import { tint, distort, ascii, noise } from "./EffectRenderer";
export class GlitchEngine {
  private source = document.createElement("canvas");
  private processed = document.createElement("canvas");
  private channel = document.createElement("canvas");
  private asciiCanvas = document.createElement("canvas");
  private sourceKey = "";
  render(
    canvas: HTMLCanvasElement,
    p: Project,
    time = 0,
    before = false,
    auxiliary = true,
  ) {
    const { width: w, height: h } = p;
    for (const c of [
      this.source,
      this.processed,
      this.channel,
      this.asciiCanvas,
    ])
      if (c.width !== w || c.height !== h) {
        c.width = w;
        c.height = h;
      }
    const ctx = canvas.getContext("2d")!;
    ctx.save();
    ctx.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const r = seeded(p.seed + ":" + Math.floor(time / 130));
    if (p.backgroundMode !== "transparent") {
      ctx.fillStyle = p.background;
      if (p.backgroundMode === "gradient") {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, p.background);
        g.addColorStop(1, p.secondary + "28");
        ctx.fillStyle = g;
      }
      ctx.fillRect(0, 0, w, h);
    }
    this.texture(ctx, p, r, time);
    const s = this.source.getContext("2d")!;
    const sourceKey = JSON.stringify([
      w,
      h,
      p.layers,
      p.primary,
      before,
      auxiliary,
      !before && p.effects.corrupt.enabled
        ? [
            p.seed,
            Math.floor(time / 130),
            p.intensity,
            p.effects.corrupt.amount,
            p.charset,
            p.corruptionMode,
          ]
        : null,
    ]);
    if (sourceKey !== this.sourceKey) {
      s.clearRect(0, 0, w, h);
      const textRandom = seeded(p.seed + ":text:" + Math.floor(time / 130));
      for (const l of p.layers)
        if (l.visible && (before ? auxiliary || !l.auxiliary : !l.auxiliary))
          drawText(s, l, p, textRandom, before);
      this.sourceKey = sourceKey;
    }
    if (before) {
      ctx.drawImage(this.source, 0, 0);
      ctx.restore();
      return;
    }
    distort(this.source, this.processed, p, r, time);
    let art = this.processed;
    if (p.preset === 4) {
      ascii(art, this.asciiCanvas, p, r);
      art = this.asciiCanvas;
    }
    const power = p.intensity / 100;
    const e = p.effects;
    if (e.glow.enabled) {
      ctx.save();
      ctx.shadowColor = p.secondary;
      ctx.shadowBlur = e.glow.amount * 0.65;
      ctx.globalAlpha = p.glowStrength / 100;
      ctx.drawImage(art, 0, 0);
      ctx.shadowBlur = e.glow.amount * 0.2;
      ctx.drawImage(art, 0, 0);
      ctx.restore();
    }
    if (e.rgb.enabled) {
      const d = e.rgb.amount * power * 0.65;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      tint(art, this.channel, p.accent);
      ctx.globalAlpha = 0.9;
      ctx.drawImage(this.channel, -d, Math.sin(time / 180) * d * 0.08);
      tint(art, this.channel, p.secondary);
      ctx.drawImage(this.channel, d, 0);
      ctx.globalAlpha = 0.8;
      ctx.drawImage(art, 0, 0);
      ctx.restore();
    } else ctx.drawImage(art, 0, 0);
    if (e.blocks.enabled) {
      for (let i = 0; i < e.blocks.amount * power * 0.7; i++) {
        const x = r() * w,
          y = h * (0.3 + r() * 0.4),
          bw = 8 + r() * p.blockSize * 5,
          bh = 1 + r() * p.blockSize * 0.4;
        ctx.drawImage(
          art,
          x,
          y,
          Math.min(bw, w - x),
          Math.min(bh, h - y),
          x + (r() - 0.5) * p.blockOffset * 2,
          y,
          bw,
          bh,
        );
        if (r() > 0.6) {
          ctx.fillStyle = r() > 0.5 ? p.accent : p.secondary;
          ctx.globalAlpha = 0.7;
          ctx.fillRect(x, y, bw * 0.4, bh * 0.3);
          ctx.globalAlpha = 1;
        }
      }
    }
    if (e.noise.enabled) noise(ctx, p, r, e.noise.amount * power);
    if (e.scanlines.enabled) {
      ctx.fillStyle = p.scanColor;
      ctx.globalAlpha = p.scanOpacity / 100;
      const pitch = Math.max(2, Math.round(14 - e.scanlines.amount * 0.12));
      for (let y = (time / 55) % pitch; y < h; y += pitch)
        ctx.fillRect(0, y, w, p.scanThickness);
      ctx.globalAlpha = 1;
    }
    if (p.preset === 3) {
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = p.primary;
      ctx.fillRect(0, (time / 8) % h, w, 35);
      ctx.globalAlpha = 1;
    }
    if (auxiliary) {
      for (const l of p.layers)
        if (l.visible && l.auxiliary) drawText(ctx, l, p, () => 1, true);
    }
    ctx.restore();
  }
  private texture(
    ctx: CanvasRenderingContext2D,
    p: Project,
    r: () => number,
    time: number,
  ) {
    const { width: w, height: h, texture: t } = p;
    ctx.save();
    ctx.strokeStyle = p.primary;
    ctx.fillStyle = p.primary;
    ctx.globalAlpha = 0.055;
    ctx.lineWidth = 1;
    if (t === "Grid" || t === "Crosshatch") {
      for (let x = 0; x < w; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(t === "Grid" ? x : x + h, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, t === "Grid" ? y : y - w);
        ctx.stroke();
      }
    } else if (t === "Dots") {
      for (let x = 0; x < w; x += 20)
        for (let y = 0; y < h; y += 20) ctx.fillRect(x, y, 1, 1);
    } else if (t === "Scanlines") {
      for (let y = 0; y < h; y += 5) ctx.fillRect(0, y, w, 1);
    } else if (t === "Noise" || t === "Static") {
      for (let i = 0; i < (t === "Static" ? 14000 : 7000); i++)
        ctx.fillRect(r() * w, r() * h, r() > 0.98 ? 10 : 1, 1);
      if (t === "Static") ctx.fillRect(0, (time / 20) % h, w, 3);
    }
    ctx.restore();
  }
}
