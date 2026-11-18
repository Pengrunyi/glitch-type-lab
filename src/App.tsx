import { useRef, useState, useEffect, useCallback } from "react";
import {
  Zap,
  RotateCcw,
  Shuffle,
  Download,
  Undo2,
  Redo2,
  Pause,
  Play,
  Columns2,
  ChevronDown,
  Save,
  FolderOpen,
  Maximize,
  X,
  Settings2,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import { useProject } from "./hooks/useProject";
import { StyleLibrary } from "./components/StyleLibrary";
import { Inspector } from "./components/Inspector";
import { ArtworkCanvas } from "./components/ArtworkCanvas";
import { ExportDialog } from "./components/ExportDialog";
import { randomize } from "./engine/random";
import { initialProject } from "./store/defaults";
import { validateProject } from "./store/projectFile";
import type { Project } from "./store/types";
import { saveProject } from "./engine/ExportEngine";
export default function App() {
  const { project: p, update, undo, redo, canUndo, canRedo } = useProject();
  const [selected, setSelected] = useState(p.layers[0].id);
  const [playing, setPlaying] = useState(
    () => !matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [before, setBefore] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [full, setFull] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [recent, setRecent] = useState<Project[]>([]);
  const [toast, setToast] = useState("");
  const [mobilePane, setMobilePane] = useState("canvas");
  const [ratio, setRatio] = useState("1:1");
  const timeRef = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const lastPlaying = useRef(playing);
  const notify = useCallback((s: string) => {
    setToast(s);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 3500);
  }, []);
  function chaos() {
    const seed = `${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    update((v) => randomize(v, seed));
    timeRef.current = 0;
    setRecent((v) => [randomize(p, seed), ...v].slice(0, 8));
    notify(`CHAOS GENERATED / SEED ${seed}`);
  }
  function regenerate() {
    update((v) => randomize(v, v.seed));
    timeRef.current = 0;
    notify(`REGENERATED / SEED ${p.seed}`);
  }
  function openExport() {
    lastPlaying.current = playing;
    setPlaying(false);
    setExportOpen(true);
  }
  function closeExport() {
    setExportOpen(false);
    setPlaying(lastPlaying.current);
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const editing = (e.target as HTMLElement).matches(
        "input,textarea,select",
      );
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveProject(p);
        notify("PROJECT SAVED / JSON");
      } else if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "z" &&
        !editing
      ) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.key === "Escape") {
        setFull(false);
        if (exportOpen) closeExport();
      } else if (e.code === "Space" && !editing && !exportOpen) {
        e.preventDefault();
        setPlaying((v) => !v);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [p, undo, redo, notify, exportOpen]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function changeRatio(r: string) {
    setRatio(r);
    if (r === "custom") return;
    const [a, b] = r.split(":").map(Number);
    const width = r === "9:16" ? 900 : 1200;
    update({ width, height: Math.round((width * b) / a) });
    setZoom(1);
  }
  return (
    <div className={`app ${full ? "fullscreen" : ""} mobile-${mobilePane}`}>
      <svg width="0" height="0" className="svg-defs" aria-hidden="true">
        <defs>
          <filter id="logo-shift">
            <feOffset in="SourceGraphic" dx="2" dy="0" result="shift" />
            <feBlend in="SourceGraphic" in2="shift" mode="screen" />
          </filter>
        </defs>
      </svg>
      <header className="header">
        <div className="brand">
          <span className="brand-icon">
            <Zap size={25} fill="currentColor" />
          </span>
          <h1>
            GLITCH<span>TYPE</span>
            <i>®</i>
          </h1>
          <span className="brand-divider" />
          <span className="lab-title">
            DIGITAL
            <br />
            CHAOS LAB
          </span>
        </div>
        <div className="project-title">
          <span className="muted">PROJECT / </span>
          <input
            aria-label="Project name"
            value={p.name}
            onChange={(e) => update({ name: e.target.value }, "name")}
          />
          <span className="project-dot" />
        </div>
        <nav className="header-actions">
          <button
            className="icon-btn file-open"
            title="Open project JSON"
            aria-label="Open project"
            onClick={() => file.current?.click()}
          >
            <FolderOpen size={15} />
          </button>
          <button
            className="icon-btn file-save"
            title="Save project · Ctrl+S"
            aria-label="Save project"
            onClick={() => {
              saveProject(p);
              notify("PROJECT SAVED / JSON");
            }}
          >
            <Save size={15} />
          </button>
          <span className="action-divider" />
          <button
            onClick={() => {
              const fresh = initialProject();
              update(fresh);
              setSelected(fresh.layers[0].id);
              timeRef.current = 0;
              setRatio("1:1");
              setZoom(1);
              notify("WORKSPACE RESET");
            }}
          >
            <RotateCcw size={14} />
            <span>RESET</span>
          </button>
          <button onClick={chaos}>
            <Shuffle size={14} />
            <span>RANDOM</span>
          </button>
          <button className="primary-button" onClick={openExport}>
            <Download size={14} />
            <span>EXPORT</span>
            <ArrowUpRight size={14} />
          </button>
        </nav>
      </header>
      <input
        ref={file}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            if (f.size > 2000000) throw new Error();
            const data = JSON.parse(await f.text());
            if (data.version !== 1 || !validateProject(data.project))
              throw new Error();
            update(data.project);
            setSelected(data.project.layers[0]?.id || "");
            setRatio("custom");
            timeRef.current = 0;
            notify("PROJECT LOADED");
          } catch {
            notify("Invalid project file. Use a GLITCH TYPE V1 JSON export.");
          }
          e.target.value = "";
        }}
      />
      <div className="mobile-nav">
        <button
          className={mobilePane === "styles" ? "active" : ""}
          onClick={() => setMobilePane("styles")}
        >
          <BookOpen size={14} />
          Styles
        </button>
        <button
          className={mobilePane === "canvas" ? "active" : ""}
          onClick={() => setMobilePane("canvas")}
        >
          <Maximize size={14} />
          Canvas
        </button>
        <button
          className={mobilePane === "inspector" ? "active" : ""}
          onClick={() => setMobilePane("inspector")}
        >
          <Settings2 size={14} />
          Inspector
        </button>
      </div>
      <div className="main-layout">
        <StyleLibrary
          project={p}
          update={update}
          chaos={chaos}
          recent={recent}
        />
        <div className="center-column">
          <div className="work-heading">
            <div>
              <span className="eyebrow">EXPERIMENTAL TYPOGRAPHY ENGINE</span>
              <h2>
                Corrupt the ordinary<span>.</span>
              </h2>
            </div>
            <span className="edition">
              EST. 2026
              <br />
              BUILD / 001
            </span>
          </div>
          <ArtworkCanvas
            project={p}
            update={update}
            selected={selected}
            setSelected={setSelected}
            playing={playing}
            before={before}
            zoom={zoom}
            setZoom={setZoom}
            fullscreen={() => setFull(!full)}
            timeRef={timeRef}
          />
          <div className="bottom-toolbar">
            <div className="history-controls">
              <button
                title="Undo · Ctrl+Z"
                aria-label="Undo"
                disabled={!canUndo}
                onClick={undo}
              >
                <Undo2 size={16} />
              </button>
              <button
                title="Redo · Ctrl+Shift+Z"
                aria-label="Redo"
                disabled={!canRedo}
                onClick={redo}
              >
                <Redo2 size={16} />
              </button>
            </div>
            <span className="action-divider" />
            <button className="toolbar-random" onClick={chaos}>
              <Shuffle size={14} />
              <span>RANDOMIZE</span>
            </button>
            <div className="playback-controls">
              <button
                className={playing ? "play active" : "play"}
                title="Play or pause · Space"
                aria-label={playing ? "Pause animation" : "Play animation"}
                onClick={() => setPlaying(!playing)}
              >
                {playing ? (
                  <Pause size={14} fill="currentColor" />
                ) : (
                  <Play size={14} fill="currentColor" />
                )}
              </button>
              <button
                className={before ? "compare active" : "compare"}
                onClick={() => setBefore(!before)}
                aria-pressed={before}
                title="Compare original text"
              >
                <Columns2 size={14} />
                <span>{before ? "BEFORE" : "AFTER"}</span>
              </button>
            </div>
            <span className="action-divider" />
            <label className="ratio-control">
              <select
                aria-label="Canvas ratio"
                value={ratio}
                onChange={(e) => changeRatio(e.target.value)}
              >
                {["1:1", "4:5", "3:4", "16:9", "9:16"].map((r) => (
                  <option key={r}>{r}</option>
                ))}
                <option value="custom">Custom</option>
              </select>
              <ChevronDown size={12} />
            </label>
          </div>
          {ratio === "custom" && (
            <div className="custom-dimensions">
              <label>
                WIDTH
                <input
                  type="number"
                  aria-label="Custom width"
                  min={200}
                  max={2400}
                  value={p.width}
                  onChange={(e) =>
                    update(
                      { width: Math.min(2400, Math.max(200, +e.target.value)) },
                      "width",
                    )
                  }
                />
              </label>
              <span>×</span>
              <label>
                HEIGHT
                <input
                  type="number"
                  aria-label="Custom height"
                  min={200}
                  max={2400}
                  value={p.height}
                  onChange={(e) =>
                    update(
                      {
                        height: Math.min(2400, Math.max(200, +e.target.value)),
                      },
                      "height",
                    )
                  }
                />
              </label>
              <span>PX</span>
            </div>
          )}
        </div>
        <Inspector
          project={p}
          update={update}
          selected={selected}
          setSelected={setSelected}
          regenerate={regenerate}
        />
      </div>
      <footer className="statusbar">
        <span>
          <span className="live-dot" /> LOCAL PROCESSING. INFINITE
          POSSIBILITIES.
        </span>
        <span>
          NO AI. JUST ALGORITHMS.<span className="slash">/</span>
          <button
            onClick={() => {
              setPlaying(false);
              notify("REDUCED MOTION / ANIMATION PAUSED");
            }}
          >
            REDUCE MOTION
          </button>
        </span>
      </footer>
      {full && (
        <button className="exit-fullscreen" onClick={() => setFull(false)}>
          <X size={16} /> EXIT PREVIEW <kbd>ESC</kbd>
        </button>
      )}
      {exportOpen && (
        <ExportDialog
          project={p}
          time={timeRef.current}
          close={closeExport}
          notify={notify}
        />
      )}
      <div className={`toast ${toast ? "visible" : ""}`} role="status">
        {toast}
      </div>
    </div>
  );
}
