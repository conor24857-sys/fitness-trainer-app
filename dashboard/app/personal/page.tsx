"use client";
import { useState } from "react";
import { useDB } from "@/components/DataProvider";
import { AddRow, Badge, Card, Check, DeleteBtn, EditableText, Empty, Input, Loading, Select, cx } from "@/components/ui";
import { HabitsCard } from "@/components/widgets/Habits";
import type { ImportantDate, TodoPriority } from "@/lib/types";
import { daysUntil, fmtDate, monthKey, nextYearly, relDay } from "@/lib/dates";

export default function PersonalPage() {
  const { ready } = useDB();
  if (!ready) return <Loading />;
  return (
    <div className="grid grid-cols-1 gap-4 [&>*]:min-w-0 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-7">
        <Todos />
        <HabitsCard full />
      </div>
      <div className="space-y-4 lg:col-span-5">
        <Goals />
        <Dates />
      </div>
    </div>
  );
}

const PRIO_ORDER: Record<TodoPriority, number> = { high: 0, med: 1, low: 2 };
const PRIO_TONE = { high: "danger", med: "warn", low: "muted" } as const;

function Todos() {
  const { db, today, add, update, remove } = useDB();
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("med");
  const [showDone, setShowDone] = useState(false);
  const open = db.todos
    .filter((t) => !t.done)
    .sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999") || PRIO_ORDER[a.priority] - PRIO_ORDER[b.priority]);
  const done = db.todos.filter((t) => t.done);

  return (
    <Card title={`To-do (${open.length})`} action={<button className="text-sm text-muted hover:text-ink" onClick={() => setShowDone(!showDone)}>{showDone ? "Hide" : "Show"} done ({done.length})</button>}>
      {!open.length && <Empty>All clear.</Empty>}
      <ul className="divide-y divide-hud/10">
        {[...open, ...(showDone ? done : [])].map((t) => {
          const late = !t.done && !!t.due && t.due < today;
          return (
            <li key={t.id} className="flex items-center gap-3 py-2">
              <Check checked={t.done} onChange={(v) => update("todos", t.id, { done: v })} label={t.text} />
              <EditableText value={t.text} onSave={(v) => update("todos", t.id, { text: v })} className={cx("flex-1 text-base", t.done && "text-muted line-through", late && "text-danger")} />
              {t.due && <span className={cx("hidden text-sm sm:inline", late ? "font-medium text-danger" : t.due === today ? "text-accent" : "text-muted")}>{late || t.due === today ? relDay(t.due, today) : fmtDate(t.due)}</span>}
              <button onClick={() => update("todos", t.id, { priority: t.priority === "high" ? "low" : t.priority === "low" ? "med" : "high" })} title="Change priority">
                <Badge tone={PRIO_TONE[t.priority]}>{t.priority}</Badge>
              </button>
              <DeleteBtn onClick={() => remove("todos", t.id)} />
            </li>
          );
        })}
      </ul>
      <AddRow onSubmit={() => { add("todos", { text: text.trim(), due, priority, done: false }); setText(""); setDue(""); }} disabled={!text.trim()}>
        <Input className="min-w-40 flex-[2]" placeholder="Add a to-do" value={text} onChange={(e) => setText(e.target.value)} />
        <Input className="w-auto" type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" />
        <Select value={priority} onChange={(e) => setPriority(e.target.value as TodoPriority)} aria-label="Priority">
          <option value="high">High</option>
          <option value="med">Medium</option>
          <option value="low">Low</option>
        </Select>
      </AddRow>
    </Card>
  );
}

function Goals() {
  const { db, add, update, remove } = useDB();
  const [text, setText] = useState("");
  const [month, setMonth] = useState(monthKey());
  const list = db.goals.filter((g) => g.month === month);
  const done = list.filter((g) => g.done).length;
  const label = new Date(month + "-01T00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const shift = (n: number) => {
    const d = new Date(month + "-01T00:00");
    d.setMonth(d.getMonth() + n);
    setMonth(monthKey(d));
  };
  return (
    <Card
      title="Goals this month"
      action={
        <div className="flex items-center gap-2 text-sm">
          <button className="px-2 text-muted hover:text-ink" onClick={() => shift(-1)} aria-label="Previous month">‹</button>
          <span className="text-muted">{label}</span>
          <button className="px-2 text-muted hover:text-ink" onClick={() => shift(1)} aria-label="Next month">›</button>
        </div>
      }
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-hud/10">
          <div className="h-full bg-accent transition-all" style={{ width: `${list.length ? (done / list.length) * 100 : 0}%` }} />
        </div>
        <span className="text-sm tabular-nums text-muted">{done}/{list.length}</span>
      </div>
      {!list.length && <Empty>No goals for {label}.</Empty>}
      <ul className="space-y-2">
        {list.map((g) => (
          <li key={g.id} className="flex items-center gap-3">
            <Check checked={g.done} onChange={(v) => update("goals", g.id, { done: v })} label={g.text} />
            <EditableText value={g.text} onSave={(v) => update("goals", g.id, { text: v })} className={cx("flex-1", g.done && "text-muted line-through")} />
            <DeleteBtn onClick={() => remove("goals", g.id)} />
          </li>
        ))}
      </ul>
      <AddRow onSubmit={() => { add("goals", { text: text.trim(), month, done: false }); setText(""); }} disabled={!text.trim()}>
        <Input className="flex-1" placeholder="Add a goal" value={text} onChange={(e) => setText(e.target.value)} />
      </AddRow>
    </Card>
  );
}

const KINDS: ImportantDate["kind"][] = ["birthday", "appointment", "renewal", "other"];

function Dates() {
  const { db, today, add, remove } = useDB();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [kind, setKind] = useState<ImportantDate["kind"]>("birthday");
  const list = db.dates
    .map((d) => ({ ...d, when: d.yearly ? nextYearly(d.date, today) : d.date }))
    .filter((d) => d.when >= today)
    .sort((a, b) => a.when.localeCompare(b.when));
  const past = db.dates.filter((d) => !d.yearly && d.date < today);

  return (
    <section id="dates" className="scroll-mt-28">
      <Card title="Important dates">
        <p className="mb-2 text-xs text-muted">Birthdays, appointments, renewals. No bank details or passwords.</p>
        {!list.length && <Empty>Nothing coming up.</Empty>}
        <ul className="divide-y divide-hud/10">
          {list.map((d) => {
            const n = daysUntil(d.when, today);
            return (
              <li key={d.id} className="flex items-center gap-3 py-2">
                <div className={cx("w-14 shrink-0 text-center", n <= 7 ? "text-accent" : "text-muted")}>
                  <p className="text-xl font-bold tabular-nums">{n}</p>
                  <p className="text-[10px] uppercase">{n === 1 ? "day" : "days"}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{d.title}</p>
                  <p className="text-sm text-muted">{fmtDate(d.when)}{d.yearly ? " · yearly" : ""}</p>
                </div>
                <Badge>{d.kind}</Badge>
                <DeleteBtn onClick={() => remove("dates", d.id)} />
              </li>
            );
          })}
        </ul>
        {past.length > 0 && (
          <details className="mt-2 text-sm text-muted">
            <summary className="cursor-pointer">Past ({past.length})</summary>
            <ul className="mt-1 space-y-1">
              {past.map((d) => (
                <li key={d.id} className="flex items-center gap-2">
                  <span className="flex-1">{d.title} · {fmtDate(d.date)}</span>
                  <DeleteBtn onClick={() => remove("dates", d.id)} />
                </li>
              ))}
            </ul>
          </details>
        )}
        <AddRow
          onSubmit={() => { add("dates", { title: title.trim(), date, kind, yearly: kind === "birthday" || kind === "renewal" }); setTitle(""); setDate(""); }}
          disabled={!title.trim() || !date}
        >
          <Input className="min-w-36 flex-[2]" placeholder="e.g. Mum's birthday" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input className="w-auto" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
          <Select value={kind} onChange={(e) => setKind(e.target.value as ImportantDate["kind"])} aria-label="Type">
            {KINDS.map((k) => <option key={k} value={k}>{k[0].toUpperCase() + k.slice(1)}</option>)}
          </Select>
        </AddRow>
        <p className="mt-2 text-xs text-muted">Birthdays and renewals repeat every year automatically.</p>
      </Card>
    </section>
  );
}
