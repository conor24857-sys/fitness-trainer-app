"use client";
import { useState } from "react";
import { useDB } from "@/components/DataProvider";
import { AddRow, Badge, Card, DeleteBtn, Empty, Input, Loading, Select, Textarea, cx } from "@/components/ui";
import type { AssignmentStatus, Subject } from "@/lib/types";
import { WEEKDAYS, daysUntil, fmtDate, parseYmd, relDay, weekdayMon } from "@/lib/dates";

export default function SchoolPage() {
  const { ready } = useDB();
  if (!ready) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 [&>*]:min-w-0 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Assignments />
        </div>
        <div className="space-y-4 lg:col-span-4">
          <Exams />
        </div>
      </div>
      <Planner />
      <Subjects />
    </div>
  );
}

function SubjectSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { db } = useDB();
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Subject">
      <option value="">Subject…</option>
      {db.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
    </Select>
  );
}

const STATUS_LABEL: Record<AssignmentStatus, string> = { not_started: "Not started", in_progress: "In progress", done: "Done" };

function Assignments() {
  const { db, today, add, update, remove } = useDB();
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [due, setDue] = useState("");
  const [filter, setFilter] = useState("");
  const [showDone, setShowDone] = useState(false);
  const subj = (id: string) => db.subjects.find((s) => s.id === id)?.name ?? "—";
  const list = db.assignments
    .filter((a) => (showDone || a.status !== "done") && (!filter || a.subjectId === filter))
    .sort((a, b) => (a.status === "done" ? 1 : 0) - (b.status === "done" ? 1 : 0) || (a.due || "9").localeCompare(b.due || "9"));

  return (
    <Card
      title="Homework & assignments"
      action={
        <div className="flex items-center gap-2">
          <SubjectSelect value={filter} onChange={setFilter} />
          <button className="text-sm text-muted hover:text-ink" onClick={() => setShowDone(!showDone)}>{showDone ? "Hide done" : "Show done"}</button>
        </div>
      }
    >
      {!db.subjects.length && <Empty>Add his subjects first (bottom of the page), then add homework here.</Empty>}
      {db.subjects.length > 0 && !list.length && <Empty>Nothing outstanding.</Empty>}
      <ul className="space-y-2">
        {list.map((a) => {
          const n = a.due ? daysUntil(a.due, today) : 99;
          const open = a.status !== "done";
          const late = open && n < 0;
          const soon = open && n >= 0 && n <= 3;
          return (
            <li key={a.id} className={cx("flex flex-wrap items-center gap-3 rounded-lg border p-3", late ? "border-danger bg-danger/10" : soon ? "border-accent bg-accent/5" : "border-line")}>
              <div className="min-w-40 flex-1">
                <p className={cx("font-medium", !open && "text-muted line-through", late && "text-danger")}>{a.title}</p>
                <p className="text-sm text-muted">{subj(a.subjectId)}</p>
              </div>
              {a.due && (
                <span className={cx("text-sm", late ? "font-semibold text-danger" : soon ? "font-semibold text-accent" : "text-muted")}>
                  {open && (late || soon) ? `Due ${relDay(a.due, today)}` : fmtDate(a.due)}
                </span>
              )}
              <Select value={a.status} onChange={(e) => update("assignments", a.id, { status: e.target.value as AssignmentStatus })} aria-label="Status"
                className={cx(a.status === "done" && "text-ok", a.status === "in_progress" && "text-warn")}>
                {(Object.keys(STATUS_LABEL) as AssignmentStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </Select>
              <DeleteBtn onClick={() => remove("assignments", a.id)} />
            </li>
          );
        })}
      </ul>
      {db.subjects.length > 0 && (
        <AddRow onSubmit={() => { add("assignments", { title: title.trim(), subjectId, due, status: "not_started" }); setTitle(""); setDue(""); }} disabled={!title.trim() || !subjectId}>
          <Input className="min-w-40 flex-[2]" placeholder="e.g. Chapter 4 questions" value={title} onChange={(e) => setTitle(e.target.value)} />
          <SubjectSelect value={subjectId} onChange={setSubjectId} />
          <Input className="w-auto" type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" />
        </AddRow>
      )}
    </Card>
  );
}

function Exams() {
  const { db, today, add, remove } = useDB();
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState("");
  const upcoming = db.exams.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = db.exams.filter((e) => e.date < today);
  const subj = (id: string) => db.subjects.find((s) => s.id === id)?.name ?? "";
  return (
    <section id="exams" className="scroll-mt-28">
      <Card title="Exams & deadlines">
        {!upcoming.length && <Empty>No exams or deadlines coming up.</Empty>}
        <ul className="space-y-2">
          {upcoming.map((e) => {
            const n = daysUntil(e.date, today);
            return (
              <li key={e.id} className={cx("flex items-center gap-3 rounded-lg border p-3", n <= 3 ? "border-accent" : "border-line")}>
                <div className={cx("w-16 shrink-0 text-center", n <= 7 ? "text-accent" : "text-ink")}>
                  <p className="text-3xl font-bold tabular-nums leading-none">{n}</p>
                  <p className="text-[10px] uppercase text-muted">{n === 1 ? "day" : "days"}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{e.title}</p>
                  <p className="text-sm text-muted">{[subj(e.subjectId), fmtDate(e.date)].filter(Boolean).join(" · ")}</p>
                </div>
                <DeleteBtn onClick={() => remove("exams", e.id)} />
              </li>
            );
          })}
        </ul>
        {past.length > 0 && (
          <button className="mt-2 text-xs text-muted hover:text-ink" onClick={() => past.forEach((e) => remove("exams", e.id))}>Clear {past.length} past</button>
        )}
        <form className="mt-3 grid gap-2" onSubmit={(ev) => { ev.preventDefault(); if (title.trim() && date) { add("exams", { title: title.trim(), subjectId, date }); setTitle(""); setDate(""); } }}>
          <Input placeholder="e.g. Maths mock, Project hand-in" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="flex gap-2">
            <SubjectSelect value={subjectId} onChange={setSubjectId} />
            <Input className="flex-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
            <button type="submit" disabled={!title.trim() || !date} className="rounded-lg bg-accent px-3 text-sm font-medium text-black disabled:opacity-40">Add</button>
          </div>
        </form>
      </Card>
    </section>
  );
}

function Planner() {
  const { db, today, add, remove } = useDB();
  const [day, setDay] = useState(String(weekdayMon(parseYmd(today))));
  const [subjectId, setSubjectId] = useState("");
  const [start, setStart] = useState("17:00");
  const [end, setEnd] = useState("18:00");
  const [note, setNote] = useState("");
  const todayIdx = weekdayMon(parseYmd(today));
  const subj = (id: string) => db.subjects.find((s) => s.id === id)?.name ?? "Study";

  return (
    <section id="planner" className="scroll-mt-28">
      <Card title="Weekly study planner" action={<span className="text-sm text-muted">repeats every week</span>}>
        <div className="grid gap-2 sm:grid-cols-7">
          {WEEKDAYS.map((d, i) => {
            const blocks = db.studyBlocks.filter((b) => b.day === i).sort((a, b) => a.start.localeCompare(b.start));
            return (
              <div key={d} className={cx("min-h-28 rounded-xl border p-2", i === todayIdx ? "border-accent bg-accent/5" : "border-line bg-bg/60")}>
                <p className={cx("mb-2 text-sm font-semibold", i === todayIdx ? "text-accent" : "text-muted")}>{d}</p>
                <div className="space-y-1.5">
                  {blocks.map((b) => (
                    <div key={b.id} className="group relative rounded-md bg-raised p-2 text-sm">
                      <p className="font-medium">{subj(b.subjectId)}</p>
                      <p className="text-xs text-muted">{b.start}–{b.end}</p>
                      {b.note && <p className="text-xs text-muted">{b.note}</p>}
                      <button onClick={() => remove("studyBlocks", b.id)} className="absolute right-1 top-1 text-xs text-muted opacity-60 hover:text-danger group-hover:opacity-100" aria-label="Remove block">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {db.subjects.length > 0 ? (
          <AddRow label="Add block" onSubmit={() => { add("studyBlocks", { day: Number(day), subjectId, start, end, note: note.trim() }); setNote(""); }} disabled={!subjectId || !start || !end || end <= start}>
            <Select value={day} onChange={(e) => setDay(e.target.value)} aria-label="Day">
              {WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </Select>
            <SubjectSelect value={subjectId} onChange={setSubjectId} />
            <Input className="w-auto" type="time" value={start} onChange={(e) => setStart(e.target.value)} aria-label="Start" />
            <Input className="w-auto" type="time" value={end} onChange={(e) => setEnd(e.target.value)} aria-label="End" />
            <Input className="min-w-32 flex-1" placeholder="Focus (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          </AddRow>
        ) : (
          <Empty>Add subjects below to start planning study blocks.</Empty>
        )}
      </Card>
    </section>
  );
}

function Subjects() {
  const { db, add } = useDB();
  const [name, setName] = useState("");
  return (
    <Card title={`Subjects (${db.subjects.length})`}>
      <p className="mb-3 text-xs text-muted">Notes are free text. Grades or anything sensitive only if you choose to add them.</p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {db.subjects.map((s) => <SubjectCard key={s.id} subject={s} />)}
      </div>
      <AddRow label="Add subject" onSubmit={() => { add("subjects", { name: name.trim(), notes: "" }); setName(""); }} disabled={!name.trim()}>
        <Input className="flex-1" placeholder="e.g. Maths, English, Biology" value={name} onChange={(e) => setName(e.target.value)} />
      </AddRow>
    </Card>
  );
}

function SubjectCard({ subject }: { subject: Subject }) {
  const { db, update, remove } = useDB();
  const [notes, setNotes] = useState(subject.notes);
  const openCount = db.assignments.filter((a) => a.subjectId === subject.id && a.status !== "done").length;
  return (
    <div className="rounded-xl border border-line bg-bg/60 p-3">
      <div className="mb-2 flex items-center gap-2">
        <p className="flex-1 font-semibold">{subject.name}</p>
        {openCount > 0 && <Badge tone="accent">{openCount} open</Badge>}
        <DeleteBtn label="Delete subject" onClick={() => confirm(`Delete ${subject.name}? Its homework, exams and study blocks are removed too.`) && remove("subjects", subject.id)} />
      </div>
      <Textarea rows={4} placeholder="Notes: topics, teacher, what to revise…" value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== subject.notes && update("subjects", subject.id, { notes })} />
    </div>
  );
}
