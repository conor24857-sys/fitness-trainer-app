"use client";
import { useState, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type ButtonHTMLAttributes } from "react";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Card({ title, action, children, className, tone }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; tone?: "danger" }) {
  return (
    <section className={cx("rounded-2xl border bg-surface p-4 sm:p-5", tone === "danger" ? "border-danger/50" : "border-line", className)}>
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold tracking-tight text-ink sm:text-lg">{title}</h2>
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
        variant === "primary" && "bg-accent text-black hover:bg-accent/90",
        variant === "ghost" && "border border-line text-muted hover:border-accent hover:text-ink",
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
        "min-h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none [color-scheme:dark]",
        className,
      )}
    />
  );
}

export function Textarea({ className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...p}
      className={cx("w-full rounded-lg border border-line bg-bg p-3 text-sm text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none", className)}
    />
  );
}

export function Select({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...p}
      className={cx("min-h-10 rounded-lg border border-line bg-bg px-2 text-sm text-ink focus:border-accent focus:outline-none [color-scheme:dark]", className)}
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
        checked ? "border-accent bg-accent text-black" : "border-line hover:border-accent",
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
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
        tone === "muted" && "bg-line text-muted",
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
  return <p className="p-6 text-muted">Loading…</p>;
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
  return <h2 id={id} className="scroll-mt-28 pt-2 text-lg font-semibold text-muted">{children}</h2>;
}
