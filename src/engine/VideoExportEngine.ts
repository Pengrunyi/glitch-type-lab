import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import type { Project } from "../store/types";
import { GlitchEngine } from "./GlitchEngine";
import { download } from "./ExportEngine";

export type VideoQuality = 720 | 1080;
export type VideoExportOptions = {
  duration: number;
  fps: 24 | 30;
  quality: VideoQuality;
  startTime: number;
  auxiliary: boolean;
  signal: AbortSignal;
  onProgress: (percent: number) => void;
};

/** Even dimensions and a 1920px long-edge cap keep H.264 files phone-compatible. */
export function videoDimensions(
  p: Pick<Project, "width" | "height">,
  quality: VideoQuality,
) {
  const scale = Math.min(
    quality / Math.min(p.width, p.height),
    (quality === 1080 ? 1920 : 1280) / Math.max(p.width, p.height),
  );
  return {
    width: Math.max(2, Math.round((p.width * scale) / 2) * 2),
    height: Math.max(2, Math.round((p.height * scale) / 2) * 2),
  };
}

/** Encode every procedural frame into a seekable H.264 MP4, independently of display timing. */
export async function exportVideo(
  project: Project,
  options: VideoExportOptions,
) {
  const { duration, fps, quality, startTime, auxiliary, signal, onProgress } =
    options;
  if (
    ![3, 5, 10, 15].includes(duration) ||
    ![24, 30].includes(fps) ||
    ![720, 1080].includes(quality)
  ) {
    throw new Error(
      "Choose a supported video duration, frame rate and resolution.",
    );
  }
  if (
    !window.isSecureContext ||
    !("VideoEncoder" in window) ||
    !("VideoFrame" in window)
  ) {
    throw new Error(
      "MP4 export needs a recent Chrome or Edge browser. Open this project on your computer to export.",
    );
  }
  signal.throwIfAborted();
  await document.fonts.ready;
  const { width, height } = videoDimensions(project, quality);
  const config: VideoEncoderConfig = {
    codec: "avc1.420028",
    width,
    height,
    bitrate: quality === 1080 ? 8_000_000 : 4_000_000,
    framerate: fps,
    avc: { format: "avc" },
  };
  if (!(await VideoEncoder.isConfigSupported(config)).supported) {
    throw new Error(
      "This browser cannot encode MP4 at this resolution. Try 720p in Chrome or Edge.",
    );
  }
  signal.throwIfAborted();
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: "avc", width, height, frameRate: fps },
    fastStart: "in-memory",
  });
  let failure: Error | null = null;
  const encoder = new VideoEncoder({
    output(chunk, metadata) {
      try {
        muxer.addVideoChunk(chunk, metadata);
      } catch (error) {
        failure =
          error instanceof Error ? error : new Error("Video packaging failed.");
      }
    },
    error(error) {
      failure = error;
    },
  });
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const engine = new GlitchEngine();
  // H.264 has no alpha channel, so use the chosen solid background when needed.
  const p: Project = {
    ...project,
    backgroundMode:
      project.backgroundMode === "transparent"
        ? "solid"
        : project.backgroundMode,
  };
  const frames = Math.round(duration * fps);
  let progress = -1;
  try {
    encoder.configure(config);
    for (let i = 0; i < frames; i++) {
      signal.throwIfAborted();
      if (failure) throw failure;
      engine.render(canvas, p, startTime + (i * 1000) / fps, false, auxiliary);
      const timestamp = Math.round((i * 1_000_000) / fps);
      const frame = new VideoFrame(canvas, {
        timestamp,
        duration: Math.round(((i + 1) * 1_000_000) / fps) - timestamp,
      });
      try {
        encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      } finally {
        frame.close();
      }
      // Bound native encoder memory; yield so progress and cancellation remain responsive.
      if (encoder.encodeQueueSize >= 6) await encoder.flush();
      const next = Math.floor(((i + 1) / frames) * 96);
      if (next !== progress) {
        progress = next;
        onProgress(progress);
      }
      if (i % 3 === 0)
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    await encoder.flush();
    signal.throwIfAborted();
    if (failure) throw failure;
    onProgress(98);
    muxer.finalize();
    const blob = new Blob([target.buffer], { type: "video/mp4" });
    const filename = `GLITCH_TYPE_${p.name.replace(/[^\w-]/g, "_")}_${new Date().toISOString().replace(/[:.]/g, "-")}.mp4`;
    signal.throwIfAborted();
    download(blob, filename);
    onProgress(100);
    return { width, height, duration, fps, bytes: blob.size };
  } finally {
    if (encoder.state !== "closed") encoder.close();
    canvas.width = canvas.height = 1;
  }
}
