import {
  SlidersHorizontal,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  ArrowUp,
  ArrowDown,
  Type,
  RotateCcw,
} from "lucide-react";
import type { Project, TextLayer, EffectKey } from "../store/types";
import { EFFECT_KEYS, EFFECT_NAMES } from "../store/types";
import { newLayer } from "../store/defaults";
import { Range, Section, LockButton } from "./Controls";
type Props = {
  project: Project;
  update: (
    v: Partial<Project> | ((p: Project) => Project),
    key?: string,
  ) => void;
  selected: string;
  setSelected: (id: string) => void;
  regenerate: () => void;
};
export function Inspector({
  project: p,
  update,
  selected,
  setSelected,
  regenerate,
}: Props) {
  const l = p.layers.find((l) => l.id === selected) || p.layers[0];
  function layer(v: Partial<TextLayer>, key = "") {
    if (!l || l.locked) return;
    update(
      (p) => ({
        ...p,
        layers: p.layers.map((item) =>
          item.id === l.id ? { ...item, ...v } : item,
        ),
      }),
      key,
    );
  }
  function effect(
    k: EffectKey,
    v: Partial<Project["effects"][EffectKey]>,
    key = "",
  ) {
    update(
      (p) => ({
        ...p,
        effects: { ...p.effects, [k]: { ...p.effects[k], ...v } },
      }),
      key,
    );
  }
  function reorder(id: string, dir: number) {
    update((p) => {
      const layers = [...p.layers],
        i = layers.findIndex((l) => l.id === id),
        j = i + dir;
      if (j < 0 || j >= layers.length) return p;
      [layers[i], layers[j]] = [layers[j], layers[i]];
      return { ...p, layers };
    });
  }
  const range = (
    label: string,
    key: keyof Project,
    min = 0,
    max = 100,
    step = 1,
  ) => (
    <Range
      label={label}
      value={p[key] as number}
      min={min}
      max={max}
      step={step}
      onChange={(v) => update({ [key]: v }, String(key))}
    />
  );
  return (
    <aside className="inspector">
      <div className="panel-title">
        <SlidersHorizontal size={15} />
        <h2>EFFECT INSPECTOR</h2>
        <span className="live-dot" />
      </div>
      <div className="inspector-scroll">
        <Section
          title="TEXT SETTINGS"
          extra={<span className="tiny-label">Tt</span>}
        >
          {l ? (
            <>
              <div className="field-label">
                Text content{" "}
                <LockButton
                  label="text randomization"
                  locked={p.locks.text}
                  onClick={() =>
                    update({ locks: { ...p.locks, text: !p.locks.text } })
                  }
                />
              </div>
              <textarea
                aria-label="Text content"
                value={l.text}
                disabled={l.locked}
                spellCheck={false}
                onChange={(e) => layer({ text: e.target.value }, "text")}
              />
              <div className="quick-words">
                {[
                  "ERROR",
                  "FUTURE",
                  "CHAOS",
                  "UNKNOWN",
                  "SYSTEM",
                  "DIGITAL",
                  "VOID",
                  "DANGER",
                ].map((t) => (
                  <button
                    disabled={l.locked}
                    key={t}
                    onClick={() => layer({ text: t })}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="field-label">
                Font family
                <LockButton
                  label="font randomization"
                  locked={p.locks.font}
                  onClick={() =>
                    update({ locks: { ...p.locks, font: !p.locks.font } })
                  }
                />
              </div>
              <select
                aria-label="Font family"
                disabled={l.locked}
                value={l.font}
                onChange={(e) => layer({ font: e.target.value })}
              >
                <option>Arial Black</option>
                <option>Impact</option>
                <option>monospace</option>
                <option>Georgia</option>
                <option>Arial</option>
              </select>
              <fieldset disabled={l.locked}>
                <Range
                  label="Font size"
                  min={10}
                  max={400}
                  value={l.size}
                  suffix=" px"
                  onChange={(v) => layer({ size: v }, "size")}
                />
                <div className="field-pair">
                  <label>
                    Weight
                    <select
                      aria-label="Font weight"
                      value={l.weight}
                      onChange={(e) => layer({ weight: +e.target.value })}
                    >
                      {[400, 500, 600, 700, 800, 900].map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Alignment
                    <select
                      aria-label="Text alignment"
                      value={l.align}
                      onChange={(e) =>
                        layer({ align: e.target.value as CanvasTextAlign })
                      }
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </label>
                </div>
                <Range
                  label="Letter spacing"
                  min={-20}
                  max={30}
                  value={l.spacing}
                  suffix=" px"
                  onChange={(v) => layer({ spacing: v }, "spacing")}
                />
                <details className="advanced">
                  <summary>Position & typography</summary>
                  <Range
                    label="Line height"
                    min={0.5}
                    max={2}
                    step={0.05}
                    value={l.lineHeight}
                    onChange={(v) => layer({ lineHeight: v }, "lineHeight")}
                  />
                  <Range
                    label="Rotation"
                    min={-180}
                    max={180}
                    value={l.rotation}
                    suffix="°"
                    onChange={(v) => layer({ rotation: v }, "rotation")}
                  />
                  <Range
                    label="Text scale"
                    min={0.1}
                    max={4}
                    step={0.01}
                    value={l.scale}
                    onChange={(v) => layer({ scale: v }, "scale")}
                  />
                  <Range
                    label="Opacity"
                    min={0}
                    max={1}
                    step={0.01}
                    value={l.opacity}
                    onChange={(v) => layer({ opacity: v }, "opacity")}
                  />
                  <Range
                    label="Position X"
                    min={0}
                    max={1}
                    step={0.01}
                    value={l.x}
                    onChange={(v) => layer({ x: v }, "x")}
                  />
                  <Range
                    label="Position Y"
                    min={0}
                    max={1}
                    step={0.01}
                    value={l.y}
                    onChange={(v) => layer({ y: v }, "y")}
                  />
                  <label className="effect-row">
                    Auxiliary text
                    <input
                      type="checkbox"
                      checked={l.auxiliary}
                      onChange={(e) => layer({ auxiliary: e.target.checked })}
                    />
                  </label>
                  <button
                    className="text-btn"
                    onClick={() =>
                      layer({ x: 0.5, y: 0.5, rotation: 0, scale: 1 })
                    }
                  >
                    <RotateCcw size={12} /> Center selected text
                  </button>
                </details>
              </fieldset>
            </>
          ) : (
            <p className="help">Add a text layer to start creating.</p>
          )}
        </Section>
        <Section
          title="GLITCH SETTINGS"
          extra={<span className="tiny-label magenta">FX</span>}
        >
          <Range
            label="Glitch intensity"
            value={p.intensity}
            suffix="%"
            onChange={(v) => update({ intensity: v }, "intensity")}
          />
          {EFFECT_KEYS.map((k) => (
            <div className="effect-control" key={k}>
              <div className="effect-name">
                <label>
                  <input
                    type="checkbox"
                    aria-label={`Enable ${EFFECT_NAMES[k]}`}
                    checked={p.effects[k].enabled}
                    onChange={(e) => effect(k, { enabled: e.target.checked })}
                  />
                  <span>{EFFECT_NAMES[k]}</span>
                </label>
                <LockButton
                  locked={p.effects[k].locked}
                  label={EFFECT_NAMES[k]}
                  onClick={() => effect(k, { locked: !p.effects[k].locked })}
                />
              </div>
              <Range
                label={`${EFFECT_NAMES[k]} amount`}
                value={p.effects[k].amount}
                onChange={(v) => effect(k, { amount: v }, k)}
              />
            </div>
          ))}
          {p.preset === 4 && (
            <>
              <Range
                label="ASCII cell size"
                min={4}
                max={18}
                value={p.asciiDensity}
                onChange={(v) => update({ asciiDensity: v }, "ascii")}
              />
              {range("ASCII brightness", "asciiBrightness", 10, 100)}
            </>
          )}
          <details className="advanced">
            <summary>Advanced effect controls</summary>
            {range("Slice count", "slices", 2, 80)}
            {range("Slice height", "sliceHeight", 1, 40)}
            {range("Slice width (%)", "sliceWidth", 10, 100)}
            {range("Slice randomness", "randomness")}
            {range("Wave frequency", "waveFrequency", 5, 100)}
            {range("Wave animation speed", "waveSpeed", 0, 100)}
            <label className="field-label">
              Wave direction
              <select
                aria-label="Wave direction"
                value={p.waveAxis}
                onChange={(e) =>
                  update({ waveAxis: e.target.value as Project["waveAxis"] })
                }
              >
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
              </select>
            </label>
            {range("Block size", "blockSize", 2, 80)}
            {range("Block offset", "blockOffset", 0, 150)}
            {range("Scanline opacity", "scanOpacity")}
            {range("Scanline thickness", "scanThickness", 1, 5)}
            <label className="color-field">
              Scanline color
              <input
                type="color"
                aria-label="Scanline color"
                value={p.scanColor}
                onChange={(e) =>
                  update({ scanColor: e.target.value }, "scanColor")
                }
              />
            </label>
            {range("Glow strength", "glowStrength")}
            <label className="field-label">
              Noise mode
              <select
                value={p.noiseMode}
                aria-label="Noise mode"
                onChange={(e) =>
                  update({ noiseMode: e.target.value as Project["noiseMode"] })
                }
              >
                <option value="color">Color noise</option>
                <option value="mono">Monochrome noise</option>
              </select>
            </label>
            <label className="field-label">
              Corruption mode
              <select
                value={p.corruptionMode}
                aria-label="Corruption mode"
                onChange={(e) =>
                  update({
                    corruptionMode: e.target.value as Project["corruptionMode"],
                  })
                }
              >
                <option value="mixed">
                  Replace / insert / delete / repeat
                </option>
                <option value="replace">Replace only</option>
              </select>
            </label>
            <label className="field-label">
              Character set
              <input
                aria-label="Character set"
                value={p.charset}
                onChange={(e) => update({ charset: e.target.value }, "charset")}
              />
            </label>
          </details>
        </Section>
        <Section
          title="COLOR SETTINGS"
          extra={
            <LockButton
              label="colors randomization"
              locked={p.locks.colors}
              onClick={() =>
                update({ locks: { ...p.locks, colors: !p.locks.colors } })
              }
            />
          }
        >
          <div className="color-grid">
            {(["primary", "secondary", "accent", "background"] as const).map(
              (k) => (
                <label className="color-field" key={k}>
                  <span>
                    {k === "background"
                      ? "Background"
                      : `${k.charAt(0).toUpperCase() + k.slice(1)}`}
                  </span>
                  <div>
                    <input
                      type="color"
                      aria-label={`${k} color`}
                      value={p[k]}
                      onChange={(e) => update({ [k]: e.target.value }, k)}
                    />
                    <code>{p[k].toUpperCase()}</code>
                  </div>
                </label>
              ),
            )}
          </div>
          <label className="field-label">
            Background mode
            <select
              aria-label="Background mode"
              value={p.backgroundMode}
              onChange={(e) =>
                update({
                  backgroundMode: e.target.value as Project["backgroundMode"],
                })
              }
            >
              <option value="solid">Solid color</option>
              <option value="gradient">Gradient</option>
              <option value="transparent">Transparent</option>
            </select>
          </label>
        </Section>
        <Section
          title="TEXT LAYERS"
          extra={
            <span className="count">
              {p.layers.length.toString().padStart(2, "0")}
            </span>
          }
        >
          <div className="layer-list">
            {[...p.layers].reverse().map((item) => (
              <div
                className={`layer-row ${item.id === selected ? "selected" : ""}`}
                key={item.id}
              >
                <button
                  className="layer-name"
                  title={item.text}
                  onClick={() => setSelected(item.id)}
                >
                  <Type size={14} />
                  <span>{item.text || "Empty layer"}</span>
                </button>
                <button
                  className="icon-btn"
                  title={`${item.visible ? "Hide" : "Show"} layer`}
                  aria-label={`${item.visible ? "Hide" : "Show"} ${item.text}`}
                  onClick={() =>
                    update((v) => ({
                      ...v,
                      layers: v.layers.map((l) =>
                        l.id === item.id ? { ...l, visible: !l.visible } : l,
                      ),
                    }))
                  }
                >
                  {item.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <LockButton
                  label={`layer ${item.text}`}
                  locked={item.locked}
                  onClick={() =>
                    update((v) => ({
                      ...v,
                      layers: v.layers.map((l) =>
                        l.id === item.id ? { ...l, locked: !l.locked } : l,
                      ),
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="layer-actions">
            <button
              className="text-btn"
              onClick={() => {
                const item = newLayer("NEW TEXT", 50);
                update((v) => ({ ...v, layers: [...v.layers, item] }));
                setSelected(item.id);
              }}
            >
              <Plus size={13} /> Add text
            </button>
            <div>
              <button
                className="icon-btn"
                title="Raise layer"
                aria-label="Raise layer"
                disabled={
                  !l || l.locked || p.layers.indexOf(l) === p.layers.length - 1
                }
                onClick={() => reorder(l.id, 1)}
              >
                <ArrowUp size={13} />
              </button>
              <button
                className="icon-btn"
                title="Lower layer"
                aria-label="Lower layer"
                disabled={!l || l.locked || p.layers.indexOf(l) === 0}
                onClick={() => reorder(l.id, -1)}
              >
                <ArrowDown size={13} />
              </button>
              <button
                className="icon-btn"
                title="Delete layer"
                aria-label="Delete selected layer"
                disabled={!l || l.locked}
                onClick={() => {
                  update((v) => ({
                    ...v,
                    layers: v.layers.filter((i) => i.id !== l.id),
                  }));
                  setSelected(p.layers.find((i) => i.id !== l.id)?.id || "");
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </Section>
        <Section title="RANDOM SEED">
          <div className="seed-input">
            <span>#</span>
            <input
              aria-label="Random seed"
              value={p.seed}
              onChange={(e) => update({ seed: e.target.value }, "seed")}
            />
            <button
              title="Regenerate from seed"
              aria-label="Regenerate from seed"
              onClick={regenerate}
            >
              <RotateCcw size={14} />
            </button>
          </div>
          <p className="help">
            Same seed. Same chaos. Locked settings stay yours.
          </p>
        </Section>
      </div>
      <div className="inspector-bottom">
        <span className="live-dot" /> ALL SYSTEMS OPERATIONAL
      </div>
    </aside>
  );
}
