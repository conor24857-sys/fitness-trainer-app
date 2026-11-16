"use client";
import { useState, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type ButtonHTMLAttributes } from "react";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Card({ title, action, children, className, tone }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; tone?: "danger" }) {
  return (
    <section className={cx("hud rounded-2xl p-4 sm:p-5", tone === "danger" && "hud-danger", className)}>
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-2 border-b border-hud/10 pb-2">
          <h2 className={cx("flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] sm:text-sm", tone === "danger" ? "text-danger" : "text-hud")}>
            <span className={cx("h-1.5 w-1.5 rounded-full", tone === "danger" ? "bg-danger" : "bg-hud")} />
            {title}
          </h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Button({ variant = "primary", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  return (
    <button
      {...p}
      className={cx(
        "inline-flex min-h-10 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium transition disabled:opacity-40",
        variant === "primary" && "bg-accent text-black hover:bg-accent/90 hover:shadow-[0_0_16px_rgb(255_91_31/0.5)]",
        variant === "ghost" && "border border-hud/25 text-muted hover:border-hud hover:text-ink hover:shadow-[0_0_12px_rgb(56_214_255/0.25)]",
        variant === "danger" && "text-muted hover:text-danger",
        className,
      )}
    />
  );
}

export function Input({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...p}
      className={cx(
        "min-h-10 rounded-lg border border-hud/20 bg-bg/70 px-3 text-sm text-ink placeholder:text-muted/70 focus:border-hud focus:outline-none [color-scheme:dark]",
        !/(^|\s)w-/.test(className ?? "") && "w-full",
        className,
      )}
    />
  );
}

export function Textarea({ className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...p}
      className={cx("w-full rounded-lg border border-hud/20 bg-bg/70 p-3 text-sm text-ink placeholder:text-muted/70 focus:border-hud focus:outline-none", className)}
    />
  );
}

export function Select({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...p}
      className={cx("min-h-10 rounded-lg border border-hud/20 bg-bg/70 px-2 text-sm text-ink focus:border-hud focus:outline-none [color-scheme:dark]", className)}
    >
      {children}
    </select>
  );
}

export function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        "grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition",
        checked ? "border-accent bg-accent text-black shadow-[0_0_10px_rgb(255_91_31/0.5)]" : "border-hud/30 hover:border-hud",
      )}
    >
      {checked && (
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 8.5l3.2 3L13 4.5" />
        </svg>
      )}
    </button>
  );
}

export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "accent" | "danger" | "warn" | "ok" }) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center rounded px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider",
        tone === "muted" && "bg-hud/10 text-muted",
        tone === "accent" && "bg-accent/15 text-accent",
        tone === "danger" && "bg-danger/15 text-danger",
        tone === "warn" && "bg-warn/15 text-warn",
        tone === "ok" && "bg-ok/15 text-ok",
      )}
    >
      {children}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-2 text-sm text-muted">{children}</p>;
}

export function DeleteBtn({ onClick, label = "Delete" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted hover:bg-danger/10 hover:text-danger">
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4l8 8M12 4l-8 8" />
      </svg>
    </button>
  );
}

/** Small inline form row: renders children inputs and an Add button. */
export function AddRow({ onSubmit, children, label = "Add", disabled }: { onSubmit: () => void; children: ReactNode; label?: string; disabled?: boolean }) {
  return (
    <form
      className="mt-3 flex flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled) onSubmit();
      }}
    >
      {children}
      <Button type="submit" disabled={disabled}>
        {label}
      </Button>
    </form>
  );
}

/** Click-to-edit text. */
export function EditableText({ value, onSave, className, placeholder }: { value: string; onSave: (v: string) => void; className?: string; placeholder?: string }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value);
  if (editing)
    return (
      <Input
        autoFocus
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (v.trim() && v !== value) onSave(v.trim());
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            setV(value);
            setEditing(false);
          }
        }}
      />
    );
  return (
    <button type="button" onClick={() => { setV(value); setEditing(true); }} className={cx("min-w-0 text-left", className)} title="Click to edit">
      {value || <span className="text-muted">{placeholder}</span>}
    </button>
  );
}

export function Loading() {
  return <p className="p-6 font-mono text-sm uppercase tracking-widest text-hud pulse-dot">Loading systems…</p>;
}

/** Input that saves on blur / Enter. Good for table cells and dates. */
export function InlineInput({ value, onSave, className, ...p }: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  const [prev, setPrev] = useState(value);
  if (value !== prev) {
    setPrev(value);
    setV(value);
  }
  return (
    <Input
      {...p}
      value={v}
      onChange={(e) => {
        setV(e.target.value);
        if (p.type === "date" || p.type === "datetime-local") onSave(e.target.value);
      }}
      onBlur={() => v !== value && onSave(v)}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className={className}
    />
  );
}

export function SectionTitle({ id, children }: { id?: string; children: ReactNode }) {
  return <h2 id={id} className="scroll-mt-28 pt-2 font-mono text-sm uppercase tracking-[0.18em] text-hud">{children}</h2>;
}

/** Circular progress ring. value 0..1 */
export function Ring({ value, size = 84, label, sub, color = "var(--color-hud)" }: { value: number; size?: number; label: ReactNode; sub?: ReactNode; color?: string }) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value || 0));
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(56 214 255 / 0.12)" strokeWidth="6" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: "stroke-dashoffset .6s", filter: `drop-shadow(0 0 6px ${color})` }} />
        </svg>
        <span className="absolute inset-0 grid place-items-center font-mono text-lg font-semibold tabular-nums">{Math.round(v * 100)}%</span>
      </div>
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted">{label}</p>
      {sub && <p className="-mt-1 text-xs text-muted/80">{sub}</p>}
    </div>
  );
}
