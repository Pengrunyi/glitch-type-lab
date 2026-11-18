import { useRef, useEffect, useState } from "react";
import { GlitchEngine } from "../engine/GlitchEngine";
import { newLayer } from "../store/defaults";
import type { Project, TextLayer } from "../store/types";
import {
  MousePointer2,
  Move,
  RotateCw,
  Maximize,
  Grid2X2,
  Scan,
  Minus,
  Plus,
} from "lucide-react";
type Props = {
  project: Project;
  update: (change: (p: Project) => Project, key?: string) => void;
  selected: string;
  setSelected: (s: string) => void;
  playing: boolean;
  before: boolean;
  zoom: number;
  setZoom: (n: number) => void;
  fullscreen: () => void;
  timeRef: React.MutableRefObject<number>;
};
export function ArtworkCanvas({
  project: p,
  update,
  selected,
  setSelected,
  playing,
  before,
  zoom,
  setZoom,
  fullscreen,
  timeRef,
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<GlitchEngine | null>(null);
  const state = useRef({ p, before });
  state.current = { p, before };
  const [tool, setTool] = useState("select");
  const [grid, setGrid] = useState(false);
  const [bounds, setBounds] = useState({ width: 600, height: 600 });
  const wrap = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const b = entries[0].contentRect;
      setBounds({ width: b.width, height: b.height });
    });
    if (wrap.current) obs.observe(wrap.current);
    return () => obs.disconnect();
  }, []);
  const fit = Math.min(
    (bounds.width - 100) / p.width,
    (bounds.height - 82) / p.height,
  );
  const cssW = p.width * fit * zoom,
    cssH = p.height * fit * zoom;
  useEffect(() => {
    engine.current ??= new GlitchEngine();
    let raf = 0,
      last = 0;
    const draw = (now: number) => {
      if (
        canvas.current &&
        (!playing || !document.hidden) &&
        now - last >= 65
      ) {
        last = now;
        if (playing && !document.hidden) timeRef.current += 65;
        engine.current!.render(
          canvas.current,
          state.current.p,
          timeRef.current,
          state.current.before,
        );
      }
      if (playing) raf = requestAnimationFrame(draw);
    };
    if (playing) raf = requestAnimationFrame(draw);
    else if (canvas.current)
      engine.current.render(canvas.current, p, timeRef.current, before);
    return () => cancelAnimationFrame(raf);
  }, [p, playing, before, cssW, cssH, timeRef]);
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const prevent = (e: WheelEvent) => e.preventDefault();
    c.addEventListener("wheel", prevent, { passive: false });
    return () => c.removeEventListener("wheel", prevent);
  }, []);
  function point(e: React.PointerEvent) {
    const rect = canvas.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }
  const drag = useRef<{
    x: number;
    y: number;
    layer: TextLayer;
    angle: number;
  } | null>(null);
  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    const at = point(e);
    let layer = p.layers.find((l) => l.id === selected);
    if (tool === "select") {
      const hit = [...p.layers]
        .reverse()
        .find(
          (l) =>
            l.visible &&
            !l.locked &&
            Math.abs(at.y - l.y) < ((l.size * l.scale) / p.height) * 0.65 &&
            Math.abs(at.x - l.x) <
              Math.max(
                0.1,
                ((l.text.length * l.size * l.scale) / p.width) * 0.32,
              ),
        );
      if (hit) {
        layer = hit;
        setSelected(hit.id);
      }
    }
    if (!layer || layer.locked || !layer.visible) return;
    drag.current = {
      x: at.x,
      y: at.y,
      layer: { ...layer },
      angle: Math.atan2(at.y - layer.y, at.x - layer.x),
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  }
  function move(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const at = point(e);
    update(
      (p) => ({
        ...p,
        layers: p.layers.map((l) =>
          l.id === d.layer.id
            ? {
                ...l,
                ...(tool === "rotate" || e.shiftKey
                  ? {
                      rotation:
                        d.layer.rotation +
                        ((Math.atan2(at.y - d.layer.y, at.x - d.layer.x) -
                          d.angle) *
                          180) /
                          Math.PI,
                    }
                  : { x: d.layer.x + at.x - d.x, y: d.layer.y + at.y - d.y }),
              }
            : l,
        ),
      }),
      "canvas-drag",
    );
  }
  const selectedLayer = p.layers.find((l) => l.id === selected);
  return (
    <main className="workspace">
      <div className="workspace-top">
        <div>
          <span className="live-dot" /> LIVE CANVAS{" "}
          <span className="slash">/</span>
          <span className="muted">
            {p.width} × {p.height} PX
          </span>
        </div>
        <div className="workspace-tools">
          <button
            title="Toggle editor grid"
            aria-label="Toggle editor grid"
            className={grid ? "active" : ""}
            onClick={() => setGrid(!grid)}
          >
            <Grid2X2 size={15} />
          </button>
          <button
            title="Fit canvas"
            aria-label="Fit canvas"
            onClick={() => setZoom(1)}
          >
            <Scan size={15} />
          </button>
          <button
            title="Fullscreen preview"
            aria-label="Fullscreen preview"
            onClick={fullscreen}
          >
            <Maximize size={15} />
          </button>
        </div>
      </div>
      <div className={`canvas-area ${grid ? "editor-grid" : ""}`} ref={wrap}>
        <div className="vertical-tools">
          {[
            { id: "select", icon: MousePointer2, label: "Select text" },
            { id: "move", icon: Move, label: "Move text" },
            { id: "rotate", icon: RotateCw, label: "Rotate text" },
          ].map((t) => (
            <button
              title={t.label}
              aria-label={t.label}
              className={tool === t.id ? "active" : ""}
              onClick={() => setTool(t.id)}
              key={t.id}
            >
              <t.icon size={17} />
            </button>
          ))}
        </div>
        <div
          className="artboard-position"
          style={{ width: Math.max(10, cssW), height: Math.max(10, cssH) }}
        >
          <div className="artboard-label">
            <span>ARTBOARD 01</span>
            <span>
              {p.backgroundMode === "transparent" ? "ALPHA" : "RGB / 8-BIT"}
            </span>
          </div>
          <canvas
            ref={canvas}
            width={Math.round(
              p.width * Math.min(1, devicePixelRatio * fit * zoom),
            )}
            height={Math.round(
              p.height * Math.min(1, devicePixelRatio * fit * zoom),
            )}
            className={`artboard ${p.backgroundMode === "transparent" ? "checker" : ""} ${dragging ? "dragging" : ""}`}
            aria-label="Artwork preview. Drag to move selected text; Shift-drag to rotate; scroll to scale text; Ctrl-scroll to zoom canvas."
            style={{
              width: cssW,
              height: cssH,
              cursor: tool === "rotate" ? "crosshair" : "move",
            }}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={() => {
              drag.current = null;
              setDragging(false);
            }}
            onPointerCancel={() => {
              drag.current = null;
              setDragging(false);
            }}
            onWheel={(e) => {
              if (e.ctrlKey || e.metaKey) {
                setZoom(
                  Math.max(
                    0.25,
                    Math.min(2, zoom + (e.deltaY < 0 ? 0.1 : -0.1)),
                  ),
                );
                return;
              }
              if (!selectedLayer || selectedLayer.locked) return;
              update(
                (p) => ({
                  ...p,
                  layers: p.layers.map((l) =>
                    l.id === selected
                      ? {
                          ...l,
                          scale: Math.max(
                            0.1,
                            Math.min(
                              4,
                              l.scale + (e.deltaY < 0 ? 0.03 : -0.03),
                            ),
                          ),
                        }
                      : l,
                  ),
                }),
                "wheel-scale",
              );
            }}
          />
          <span className="crop top-left" />
          <span className="crop top-right" />
          <span className="crop bottom-left" />
          <span className="crop bottom-right" />
        </div>
        <div className="canvas-hint">
          <Move size={12} /> DRAG TO MOVE <span>·</span> SHIFT + DRAG TO ROTATE{" "}
          <span>·</span> SCROLL TO SCALE
        </div>
        <div className="zoom-float">
          <button
            title="Zoom out"
            aria-label="Zoom out"
            onClick={() => setZoom(Math.max(0.25, zoom - 0.1))}
          >
            <Minus size={12} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            title="Zoom in"
            aria-label="Zoom in"
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
      <div className="canvas-caption">
        <span>
          <span className="live-dot" />
          {before
            ? "ORIGINAL TEXT"
            : playing
              ? "REAL-TIME RENDERING"
              : "FRAME PAUSED"}
        </span>
        <span>
          {p.layers.filter((l) => l.visible).length} TEXT LAYERS{" "}
          <span className="slash">/</span> CANVAS 2D
        </span>
      </div>
    </main>
  );
}
export function Thumbnail({
  project,
  word,
  time = 0,
  auxiliary = true,
}: {
  project: Project;
  word?: string;
  time?: number;
  auxiliary?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) {
      const p = word
        ? {
            ...project,
            width: 600,
            height: 220,
            layers: [
              {
                ...(project.layers[0] || newLayer(word)),
                text: word,
                x: 0.5,
                y: 0.5,
                size: 110,
                spacing: -4,
                rotation: 0,
                scale: 1,
                visible: true,
              },
            ],
            texture: "Noise",
          }
        : project;
      new GlitchEngine().render(ref.current, p, time, false, auxiliary);
    }
  }, [project, word, time, auxiliary]);
  return (
    <canvas
      ref={ref}
      width={word ? 320 : 192}
      height={word ? 120 : Math.round((192 * project.height) / project.width)}
      aria-hidden="true"
    />
  );
}
