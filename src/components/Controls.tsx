import type { ReactNode } from "react";
import { Lock, Unlock, ChevronDown } from "lucide-react";
export function Range({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="range-control">
      <span>
        <span>{label}</span>
        <output>
          {Number(value.toFixed(2))}
          {suffix}
        </output>
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={
          {
            "--progress": `${((value - min) / (max - min)) * 100}%`,
          } as React.CSSProperties
        }
        onChange={(e) => onChange(+e.target.value)}
      />
    </label>
  );
}
export function Section({
  title,
  children,
  defaultOpen = true,
  extra,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  extra?: ReactNode;
}) {
  return (
    <details className="section" open={defaultOpen}>
      <summary>
        <span>{title}</span>
        {extra}
        <ChevronDown size={13} />
      </summary>
      <div className="section-body">{children}</div>
    </details>
  );
}
export function LockButton({
  locked,
  onClick,
  label,
}: {
  locked: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      className={`icon-btn lock ${locked ? "locked" : ""}`}
      title={`${locked ? "Unlock" : "Lock"} ${label}`}
      aria-label={`${locked ? "Unlock" : "Lock"} ${label}`}
      onClick={onClick}
    >
      {locked ? <Lock size={12} /> : <Unlock size={12} />}
    </button>
  );
}
