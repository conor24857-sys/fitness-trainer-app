"use client";
import { useState } from "react";
import { useDB } from "../DataProvider";
import { Button, Card, Input, Select, cx } from "../ui";
import { addDays } from "@/lib/dates";

type Kind = "reminder" | "todo" | "lead" | "homework" | "post";
const KINDS: { k: Kind; label: string; ph: string }[] = [
  { k: "reminder", label: "Reminder", ph: "Remind me to…" },
  { k: "todo", label: "To-do", ph: "Personal to-do" },
  { k: "lead", label: "Lead", ph: "Lead name or @handle" },
  { k: "homework", label: "Homework", ph: "Homework title" },
  { k: "post", label: "Post", ph: "Content idea / hook" },
];

/** One box to add anything from the Today screen. */
export function QuickAddCard() {
  const { db, today, add } = useDB();
  const [kind, setKind] = useState<Kind>("reminder");
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [flash, setFlash] = useState("");
  const meta = KINDS.find((x) => x.k === kind)!;

  const valid = !!text.trim() && (kind !== "reminder" || !!time) && (kind !== "homework" || !!subjectId);

  const submit = async () => {
    const t = text.trim();
    const d = date || today;
    if (kind === "reminder") await add("reminders", { text: t, at: `${d}T${time}`, area: "general", done: false, notified: false });
    if (kind === "todo") await add("todos", { text: t, due: date, priority: "med", done: false });
    if (kind === "lead") await add("leads", { name: t, source: "Instagram", notes: "", stage: "new", followUp: date || addDays(today, 1) });
    if (kind === "homework") await add("assignments", { title: t, subjectId, due: date, status: "not_started" });
    if (kind === "post") await add("content", { title: t, platform: "Instagram", date: d, status: "idea" });
    setText("");
    setFlash(`${meta.label} added`);
    setTimeout(() => setFlash(""), 2000);
  };

  return (
    <Card title="Quick add" action={flash && <span className="font-mono text-xs text-ok">✓ {flash}</span>}>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {KINDS.map((x) => (
          <button key={x.k} type="button" onClick={() => setKind(x.k)}
            className={cx("rounded-md border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider transition",
              kind === x.k ? "border-accent bg-accent/15 text-accent" : "border-hud/20 text-muted hover:border-hud hover:text-ink")}>
            {x.label}
          </button>
        ))}
      </div>
      <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); if (valid) submit(); }}>
        <Input placeholder={meta.ph} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {kind === "homework" && (
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} aria-label="Subject" className="flex-1">
              <option value="">{db.subjects.length ? "Subject…" : "Add subjects first"}</option>
              {db.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          )}
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto flex-1" aria-label="Date" />
          {kind === "reminder" && <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-auto" aria-label="Time" />}
          <Button type="submit" disabled={!valid}>Add</Button>
        </div>
        <p className="text-xs text-muted">
          {kind === "reminder" ? "Date defaults to today. You'll get a desktop alert at that time." : kind === "lead" ? "Follow-up defaults to tomorrow." : "Date is optional."}
        </p>
      </form>
    </Card>
  );
}
