import { useEffect, useMemo, useRef, useState } from "react";
import { X, Download, ArrowUpRight, Film } from "lucide-react";
import type { Project } from "../store/types";
import { exportArtwork } from "../engine/ExportEngine";
import {
  exportVideo,
  videoDimensions,
  type VideoQuality,
} from "../engine/VideoExportEngine";
import { Thumbnail } from "./ArtworkCanvas";

type Format = "mp4" | "png" | "svg";
export function ExportDialog({
  project,
  time,
  close,
  notify,
}: {
  project: Project;
  time: number;
  close: () => void;
  notify: (s: string) => void;
}) {
  const [format, setFormat] = useState<Format>("mp4");
  const [scale, setScale] = useState(2);
  const [quality, setQuality] = useState<VideoQuality>(1080);
  const [duration, setDuration] = useState(5);
  const [fps, setFps] = useState<24 | 30>(30);
  const [background, setBackground] = useState(project.backgroundMode);
  const [ratio, setRatio] = useState("current");
  const [aux, setAux] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const isVideo = format === "mp4";
  const actualBackground =
    isVideo && background === "transparent" ? "solid" : background;
  const p = useMemo(() => {
    let result = { ...project, backgroundMode: actualBackground };
    if (ratio !== "current") {
      const [a, b] = ratio.split(":").map(Number);
      result = { ...result, width: 1200, height: Math.round((1200 * b) / a) };
    }
    return result;
  }, [project, actualBackground, ratio]);
  const dimensions = isVideo
    ? videoDimensions(p, quality)
    : { width: p.width * scale, height: p.height * scale };

  async function startExport() {
    setBusy(true);
    setError("");
    setProgress(0);
    const abort = new AbortController();
    controller.current = abort;
    try {
      if (format === "mp4") {
        const result = await exportVideo(p, {
          duration,
          fps,
          quality,
          startTime: time,
          auxiliary: aux,
          signal: abort.signal,
          onProgress: (value) => {
            if (controller.current === abort && !abort.signal.aborted)
              setProgress(value);
          },
        });
        notify(
          `MP4 exported · ${result.width} × ${result.height} · ${duration}s`,
        );
      } else {
        await exportArtwork(p, format, scale, time, aux);
        if (abort.signal.aborted) return;
        notify(
          `${format.toUpperCase()} exported · ${dimensions.width} × ${dimensions.height}`,
        );
      }
      close();
    } catch (cause) {
      if (!abort.signal.aborted)
        setError(
          cause instanceof Error
            ? cause.message
            : "Export failed. Please try again.",
        );
    } finally {
      if (controller.current === abort && !abort.signal.aborted) setBusy(false);
    }
  }
  function cancel() {
    controller.current?.abort();
    setBusy(false);
    setProgress(0);
    setError("");
  }

  return (
    <div className="modal-backdrop" onClick={close}>
      <section
        className="modal export-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-top">
          <span>OUTPUT / EXPORT</span>
          <button
            className="icon-btn"
            title="Close export"
            aria-label="Close export"
            autoFocus
            onClick={close}
          >
            <X size={18} />
          </button>
        </div>
        <h2 id="export-title">
          Release the chaos<span>.</span>
        </h2>
        <p>
          {isVideo
            ? "Take the motion with you. Ready for your phone."
            : "Your experiment, ready for the outside world."}
        </p>
        <div className="export-preview">
          <Thumbnail project={p} time={time} auxiliary={aux} />
          {isVideo && (
            <span className="video-preview-label">
              <Film size={12} />
              {duration}s · {fps} FPS
            </span>
          )}
        </div>
        <fieldset disabled={busy} className="export-options">
          <div className="field-pair">
            <label>
              File format
              <select
                aria-label="Export format"
                value={format}
                onChange={(e) => {
                  setFormat(e.target.value as Format);
                  setError("");
                }}
              >
                <option value="mp4">MP4 video · phone ready</option>
                <option value="png">PNG image</option>
                <option value="svg">SVG · embedded artwork</option>
              </select>
            </label>
            <label>
              Resolution
              {isVideo ? (
                <select
                  aria-label="Video resolution"
                  value={quality}
                  onChange={(e) => setQuality(+e.target.value as VideoQuality)}
                >
                  {([1080, 720] as const).map((n) => {
                    const size = videoDimensions(p, n);
                    return (
                      <option key={n} value={n}>
                        {n === 1080 ? "Full HD" : "HD"} · {size.width} ×{" "}
                        {size.height}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <select
                  aria-label="Export resolution"
                  value={scale}
                  onChange={(e) => setScale(+e.target.value)}
                >
                  {[1, 2, 3].map((n) => (
                    <option key={n} value={n}>
                      {n}× · {p.width * n} × {p.height * n}
                    </option>
                  ))}
                </select>
              )}
            </label>
          </div>
          {isVideo && (
            <div className="field-pair">
              <label>
                Duration
                <select
                  aria-label="Video duration"
                  value={duration}
                  onChange={(e) => setDuration(+e.target.value)}
                >
                  {[3, 5, 10, 15].map((n) => (
                    <option key={n} value={n}>
                      {n} seconds
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Frame rate
                <select
                  aria-label="Video frame rate"
                  value={fps}
                  onChange={(e) => setFps(+e.target.value as 24 | 30)}
                >
                  <option value={30}>30 fps · smooth</option>
                  <option value={24}>24 fps · cinematic</option>
                </select>
              </label>
            </div>
          )}
          <div className="field-pair">
            <label>
              Background
              <select
                aria-label="Export background"
                value={actualBackground}
                onChange={(e) =>
                  setBackground(e.target.value as Project["backgroundMode"])
                }
              >
                <option value="solid">Solid color</option>
                <option value="gradient">Gradient</option>
                {!isVideo && <option value="transparent">Transparent</option>}
              </select>
            </label>
            <label>
              Aspect ratio
              <select
                aria-label="Export aspect ratio"
                value={ratio}
                onChange={(e) => setRatio(e.target.value)}
              >
                <option value="current">Current canvas</option>
                {["1:1", "4:5", "3:4", "16:9", "9:16"].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="effect-row">
            Include auxiliary text
            <input
              aria-label="Include auxiliary text"
              type="checkbox"
              checked={aux}
              onChange={(e) => setAux(e.target.checked)}
            />
          </label>
        </fieldset>
        <p className="help">
          {isVideo
            ? "Animated MP4 for iPhone & Android. No audio. Transparency is filled with your background color. Choose 9:16 for vertical video."
            : format === "svg"
              ? "SVG preserves all pixel effects with an embedded PNG. Text is not editable as vector paths."
              : "Exports the frozen canvas frame at full resolution. Editor grid and controls are excluded."}
        </p>
        {error && (
          <p className="export-error" role="alert">
            {error}
          </p>
        )}
        {busy && isVideo && (
          <div className="export-progress">
            <div className="progress-heading">
              <span>
                {progress < 98 ? "RENDERING FRAMES" : "FINISHING VIDEO"}
              </span>
              <output>{progress}%</output>
            </div>
            <progress
              aria-label="Video export progress"
              max={100}
              value={progress}
            />
            <button className="text-btn" onClick={cancel}>
              <X size={12} /> Cancel export
            </button>
          </div>
        )}
        <button className="export-action" disabled={busy} onClick={startExport}>
          <Download size={16} />
          {busy
            ? `RENDERING${isVideo ? ` ${progress}%` : "…"}`
            : `EXPORT ${format.toUpperCase()}`}
          <ArrowUpRight size={17} />
        </button>
      </section>
    </div>
  );
}
