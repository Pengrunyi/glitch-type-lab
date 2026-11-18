import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Shuffle,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import type { Project } from "../store/types";
import { PRESETS, applyPreset, PALETTES } from "../store/defaults";
import { EFFECT_KEYS, EFFECT_NAMES } from "../store/types";
import { Thumbnail } from "./ArtworkCanvas";
import { Section } from "./Controls";
export function StyleLibrary({
  project: p,
  update,
  chaos,
  recent,
}: {
  project: Project;
  update: (
    v: Partial<Project> | ((p: Project) => Project),
    key?: string,
  ) => void;
  chaos: () => void;
  recent: Project[];
}) {
  const [tab, setTab] = useState("Presets");
  const previews = useMemo(
    () => PRESETS.map((_, i) => applyPreset({ ...p, seed: "PREVIEW" }, i)),
    [p.layers, p.background],
  );
  return (
    <aside className="library">
      <div className="panel-title">
        <Sparkles size={15} />
        <h2>STYLE LIBRARY</h2>
        <span className="count">06</span>
      </div>
      <div className="library-tabs">
        {["Presets", "Effects"].map((t) => (
          <button
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
            key={t}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="library-scroll">
        {tab === "Presets" ? (
          <div className="preset-list">
            {PRESETS.map((preset, i) => (
              <button
                key={preset.name}
                className={`preset ${p.preset === i ? "selected" : ""}`}
                onClick={() => update((v) => applyPreset(v, i))}
              >
                <div className="preset-art">
                  <Thumbnail project={previews[i]} word={preset.word} />
                  <span className="preset-number">0{i + 1}</span>
                  {p.preset === i && (
                    <span className="selected-check">
                      <Check size={11} />
                    </span>
                  )}
                </div>
                <div className="preset-description">
                  <span>{preset.name}</span>
                  <ArrowUpRight size={12} />
                </div>
                <small>{preset.tag}</small>
              </button>
            ))}
          </div>
        ) : (
          <div className="effect-library">
            {EFFECT_KEYS.map((k) => (
              <label className="effect-row" key={k}>
                <span>{EFFECT_NAMES[k]}</span>
                <input
                  type="checkbox"
                  checked={p.effects[k].enabled}
                  onChange={(e) =>
                    update((v) => ({
                      ...v,
                      effects: {
                        ...v.effects,
                        [k]: { ...v.effects[k], enabled: e.target.checked },
                      },
                    }))
                  }
                />
              </label>
            ))}
          </div>
        )}
        <Section title="COLOR PALETTES">
          <div className="palette-list">
            {PALETTES.map((palette) => (
              <button
                key={palette.name}
                title={palette.name}
                onClick={() =>
                  update({
                    primary: palette.colors[0],
                    secondary: palette.colors[1],
                    accent: palette.colors[2],
                  })
                }
              >
                <span>{palette.name}</span>
                <span className="swatches">
                  {palette.colors.map((c) => (
                    <i key={c} style={{ background: c }} />
                  ))}
                </span>
              </button>
            ))}
          </div>
        </Section>
        <Section title="TEXTURES" defaultOpen={false}>
          <div className="texture-list">
            {[
              "None",
              "Grid",
              "Noise",
              "Dots",
              "Crosshatch",
              "Scanlines",
              "Static",
            ].map((t) => (
              <button
                className={p.texture === t ? "selected" : ""}
                key={t}
                onClick={() => update({ texture: t })}
              >
                {t}
              </button>
            ))}
          </div>
        </Section>
        <Section title="RECENT GENERATIONS" defaultOpen={false}>
          {recent.length ? (
            <div className="recent-list">
              {recent.map((item, i) => (
                <button
                  title={`Restore ${item.seed}`}
                  onClick={() => update(item)}
                  key={`${item.seed}-${i}`}
                >
                  <Thumbnail project={item} />
                  <span>{item.seed}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="help">
              Your next random generation starts the collection.
            </p>
          )}
        </Section>
      </div>
      <div className="library-bottom">
        <button className="chaos-button" onClick={chaos}>
          <Shuffle size={16} /> RANDOM CHAOS <ArrowUpRight size={15} />
        </button>
        <p>BREAK THE RULES. MAKE SOMETHING.</p>
      </div>
      <div className="library-version">
        GLITCH ENGINE{" "}
        <span>
          V.1.0 <ChevronDown size={10} />
        </span>
      </div>
    </aside>
  );
}
