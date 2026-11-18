import { GlitchEngine } from "./GlitchEngine";
import type { Project } from "../store/types";
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
export async function exportArtwork(
  p: Project,
  format: "png" | "svg",
  scale: number,
  time: number,
  auxiliary: boolean,
) {
  await document.fonts.ready;
  const c = document.createElement("canvas");
  c.width = p.width * scale;
  c.height = p.height * scale;
  new GlitchEngine().render(c, p, time, false, auxiliary);
  const name = `GLITCH_TYPE_${p.name.replace(/[^\w-]/g, "_")}_${new Date().toISOString().replace(/[:.]/g, "-")}`;
  if (format === "png") {
    const blob = await new Promise<Blob | null>((resolve) =>
      c.toBlob(resolve, "image/png"),
    );
    if (!blob) throw new Error("PNG encoding failed");
    download(blob, `${name}.png`);
  } else {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${c.width}" height="${c.height}" viewBox="0 0 ${p.width} ${p.height}"><title>GLITCH TYPE — ${p.name.replace(/[<>&]/g, "")}</title><desc>Canvas composition embedded as PNG to preserve pixel effects exactly. Text is rasterized.</desc><image width="${p.width}" height="${p.height}" xlink:href="${c.toDataURL("image/png")}"/></svg>`;
    download(new Blob([svg], { type: "image/svg+xml" }), `${name}.svg`);
  }
}
export function saveProject(p: Project) {
  download(
    new Blob([JSON.stringify({ version: 1, project: p }, null, 2)], {
      type: "application/json",
    }),
    `GLITCH_TYPE_${p.name}.json`,
  );
}
