import type { Area, DB } from "./types";
import { addDays, daysUntil, nextYearly, weekdayMon, parseYmd, fmtTime } from "./dates";

export interface AgendaItem {
  key: string;
  area: Area;
  kind: string;
  text: string;
  detail?: string;
  date: string; // YYYY-MM-DD
  time?: string;
  overdue: boolean;
  /** Present when the item can be ticked off from the Today view. */
  complete?: { collection: string; id: string; patch: Record<string, unknown> };
  href: string;
}

/** Everything due today or overdue (and the next 3 days for school work and important dates). */
export function buildAgenda(db: DB, today: string): { overdue: AgendaItem[]; today: AgendaItem[]; soon: AgendaItem[] } {
  const items: AgendaItem[] = [];
  const soonLimit = addDays(today, 3);
  const subj = (id: string) => db.subjects.find((s) => s.id === id)?.name ?? "";

  for (const r of db.reminders) {
    if (r.done || !r.at) continue;
    const d = r.at.slice(0, 10);
    if (d > today) continue;
    items.push({ key: "r" + r.id, area: r.area, kind: "Reminder", text: r.text, date: d, time: fmtTime(r.at), overdue: d < today, href: "/",
      complete: { collection: "reminders", id: r.id, patch: { done: true } } });
  }
  for (const l of db.leads) {
    if (!l.followUp || l.stage === "client" || l.stage === "lost" || l.followUp > today) continue;
    items.push({ key: "l" + l.id, area: "pt", kind: "Lead follow-up", text: l.name, detail: l.source, date: l.followUp, overdue: l.followUp < today, href: "/pt#pipeline" });
  }
  for (const c of db.clients) {
    if (!c.nextCheckIn || c.nextCheckIn > today) continue;
    items.push({ key: "c" + c.id, area: "pt", kind: "Client check-in", text: c.name, detail: c.plan, date: c.nextCheckIn, overdue: c.nextCheckIn < today, href: "/pt#clients",
      complete: { collection: "clients", id: c.id, patch: { lastContact: today, nextCheckIn: addDays(today, 7) } } });
  }
  for (const p of db.content) {
    if (!p.date || p.status === "posted" || p.date > today) continue;
    items.push({ key: "p" + p.id, area: "pt", kind: "Content", text: p.title, detail: `${p.platform} · ${p.status}`, date: p.date, overdue: p.date < today, href: "/pt#content",
      complete: { collection: "content", id: p.id, patch: { status: "posted" } } });
  }
  for (const t of db.todos) {
    if (t.done || !t.due || t.due > today) continue;
    items.push({ key: "t" + t.id, area: "personal", kind: "To-do", text: t.text, detail: t.priority === "high" ? "High priority" : undefined, date: t.due, overdue: t.due < today, href: "/personal",
      complete: { collection: "todos", id: t.id, patch: { done: true } } });
  }
  for (const d of db.dates) {
    const when = d.yearly ? nextYearly(d.date, today) : d.date;
    if (when < today || when > soonLimit) continue;
    items.push({ key: "d" + d.id, area: "personal", kind: d.kind[0].toUpperCase() + d.kind.slice(1), text: d.title, date: when, overdue: false, href: "/personal#dates" });
  }
  for (const a of db.assignments) {
    if (a.status === "done" || !a.due || a.due > soonLimit) continue;
    items.push({ key: "a" + a.id, area: "school", kind: "Homework", text: a.title, detail: subj(a.subjectId), date: a.due, overdue: a.due < today, href: "/school",
      complete: { collection: "assignments", id: a.id, patch: { status: "done" } } });
  }
  for (const e of db.exams) {
    if (!e.date || e.date < today || e.date > soonLimit) continue;
    items.push({ key: "e" + e.id, area: "school", kind: "Exam", text: e.title, detail: subj(e.subjectId), date: e.date, overdue: false, href: "/school#exams" });
  }
  const dow = weekdayMon(parseYmd(today));
  for (const b of db.studyBlocks) {
    if (b.day !== dow) continue;
    items.push({ key: "s" + b.id, area: "school", kind: "Study block", text: subj(b.subjectId) || "Study", detail: b.note, date: today, time: b.start, overdue: false, href: "/school#planner" });
  }

  const sort = (a: AgendaItem, b: AgendaItem) => a.date.localeCompare(b.date) || (a.time ?? "99").localeCompare(b.time ?? "99");
  return {
    overdue: items.filter((i) => i.overdue).sort(sort),
    today: items.filter((i) => !i.overdue && i.date === today).sort(sort),
    soon: items.filter((i) => !i.overdue && i.date > today).sort(sort),
  };
}

export const AREA_LABEL: Record<Area, string> = { pt: "PT", personal: "Personal", school: "School", general: "General" };

export function nextExam(db: DB, today: string) {
  return db.exams
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({ ...e, days: daysUntil(e.date, today), subject: db.subjects.find((s) => s.id === e.subjectId)?.name ?? "" }))[0];
}
