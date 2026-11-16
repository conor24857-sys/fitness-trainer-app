"use client";
import { useState } from "react";
import { useDB } from "@/components/DataProvider";
import { AddRow, Badge, Button, Card, DeleteBtn, Empty, InlineInput, Input, Loading, Select, Textarea, cx } from "@/components/ui";
import { PrioritiesCard } from "@/components/widgets/Priorities";
import { ChecklistCard } from "@/components/widgets/Checklist";
import type { ContentStatus, Lead, LeadStage } from "@/lib/types";
import { addDays, fmtDate, relDay, startOfWeek } from "@/lib/dates";

const STAGES: { key: LeadStage; label: string }[] = [
  { key: "new", label: "New" },
  { key: "intro", label: "Intro call" },
  { key: "trial", label: "Trial week" },
  { key: "client", label: "Client" },
  { key: "lost", label: "Lost" },
];

export default function PTPage() {
  const { ready } = useDB();
  if (!ready) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 [&>*]:min-w-0 lg:grid-cols-3">
        <PrioritiesCard />
        <ChecklistCard editable />
        <LinksCard />
      </div>
      <Pipeline />
      <div className="grid grid-cols-1 gap-4 [&>*]:min-w-0 xl:grid-cols-2">
        <Clients />
        <Content />
      </div>
    </div>
  );
}

/* ---------- Pipeline ---------- */

function Pipeline() {
  const { db, today, add, update } = useDB();
  const [name, setName] = useState("");
  const [source, setSource] = useState("Instagram");
  const [followUp, setFollowUp] = useState(addDays(today, 1));
  const [dragId, setDragId] = useState<string | null>(null);
  const overdueCount = db.leads.filter((l) => l.followUp && l.followUp < today && l.stage !== "client" && l.stage !== "lost").length;

  return (
    <section id="pipeline" className="scroll-mt-28 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Pipeline</h2>
        {overdueCount > 0 && <Badge tone="danger">{overdueCount} past follow-up</Badge>}
      </header>
      <div className="grid gap-3 overflow-x-auto pb-1 md:grid-cols-5">
        {STAGES.map((s) => {
          const leads = db.leads.filter((l) => l.stage === s.key).sort((a, b) => (a.followUp || "9").localeCompare(b.followUp || "9"));
          return (
            <div
              key={s.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragId) update("leads", dragId, { stage: s.key }); setDragId(null); }}
              className="min-h-24 rounded-xl bg-bg/60 p-2"
            >
              <p className="mb-2 flex items-center justify-between px-1 text-sm font-semibold text-muted">
                {s.label} <span className="tabular-nums">{leads.length}</span>
              </p>
              <div className="space-y-2">
                {leads.map((l) => <LeadCard key={l.id} lead={l} onDrag={setDragId} />)}
              </div>
            </div>
          );
        })}
      </div>
      <AddRow
        label="Add lead"
        onSubmit={() => { add("leads", { name: name.trim(), source, notes: "", stage: "new", followUp }); setName(""); }}
        disabled={!name.trim()}
      >
        <Input className="min-w-40 flex-[2]" placeholder="Lead name or @handle" value={name} onChange={(e) => setName(e.target.value)} />
        <Input className="min-w-32 flex-1" placeholder="Source" value={source} onChange={(e) => setSource(e.target.value)} list="lead-sources" />
        <datalist id="lead-sources">
          {["Instagram", "TikTok", "Tally form", "Referral", "Facebook", "Website"].map((s) => <option key={s} value={s} />)}
        </datalist>
        <Input className="w-auto" type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} aria-label="Next follow-up" />
      </AddRow>
    </section>
  );
}

function LeadCard({ lead, onDrag }: { lead: Lead; onDrag: (id: string) => void }) {
  const { today, update, remove } = useDB();
  const [open, setOpen] = useState(false);
  const active = lead.stage !== "client" && lead.stage !== "lost";
  const late = active && !!lead.followUp && lead.followUp < today;
  const dueToday = active && lead.followUp === today;

  return (
    <div
      draggable
      onDragStart={() => onDrag(lead.id)}
      className={cx("rounded-lg border bg-raised p-3", late ? "border-danger bg-danger/10" : dueToday ? "border-accent" : "border-line")}
    >
      <button className="w-full text-left" onClick={() => setOpen(!open)}>
        <p className="font-medium">{lead.name}</p>
        <p className="text-xs text-muted">{lead.source}</p>
        {active && lead.followUp && (
          <p className={cx("mt-1 text-xs", late ? "font-semibold text-danger" : dueToday ? "text-accent" : "text-muted")}>
            Follow up {relDay(lead.followUp, today)}
          </p>
        )}
        {!open && lead.notes && <p className="mt-1 line-clamp-2 text-xs text-muted">{lead.notes}</p>}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          <InlineInput value={lead.name} onSave={(v) => update("leads", lead.id, { name: v })} aria-label="Name" />
          <InlineInput value={lead.source} onSave={(v) => update("leads", lead.id, { source: v })} aria-label="Source" placeholder="Source" />
          <label className="block text-xs text-muted">
            Next follow-up
            <InlineInput type="date" value={lead.followUp} onSave={(v) => update("leads", lead.id, { followUp: v })} />
          </label>
          <NotesBox value={lead.notes} onSave={(v) => update("leads", lead.id, { notes: v })} />
          <div className="flex items-center gap-2">
            <Select value={lead.stage} onChange={(e) => update("leads", lead.id, { stage: e.target.value as LeadStage })} className="flex-1" aria-label="Stage">
              {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </Select>
            <DeleteBtn onClick={() => confirm(`Delete lead ${lead.name}?`) && remove("leads", lead.id)} />
          </div>
          {active && (
            <Button variant="ghost" className="w-full" onClick={() => update("leads", lead.id, { followUp: addDays(today, 2) })}>
              Followed up · next in 2 days
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function NotesBox({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  return <Textarea rows={3} placeholder="Notes (no health or payment details)" value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v !== value && onSave(v)} />;
}

/* ---------- Clients ---------- */

function Clients() {
  const { db, today, add, update, remove } = useDB();
  const [name, setName] = useState("");
  const [plan, setPlan] = useState("");
  const list = [...db.clients].sort((a, b) => (a.nextCheckIn || "9").localeCompare(b.nextCheckIn || "9"));
  return (
    <section id="clients" className="scroll-mt-28">
      <Card title={`Clients (${list.length})`}>
        <p className="mb-3 text-xs text-muted">Name, plan and contact dates only. Don't store health data, photos or payment details here.</p>
        {!list.length && <Empty>No clients yet. Moving a lead to "Client" doesn't add them here automatically; add them below.</Empty>}
        <div className="space-y-2">
          {list.map((c) => {
            const late = !!c.nextCheckIn && c.nextCheckIn < today;
            const due = c.nextCheckIn === today;
            return (
              <div key={c.id} className={cx("flex flex-wrap items-end gap-2 rounded-lg border p-2", late ? "border-danger bg-danger/10" : due ? "border-accent" : "border-line")}>
                <label className="min-w-36 flex-[2] text-xs text-muted">
                  Name
                  <InlineInput value={c.name} onSave={(v) => update("clients", c.id, { name: v })} className={cx("text-base font-medium", late && "text-danger")} />
                </label>
                <label className="min-w-32 flex-[1.5] text-xs text-muted">
                  Plan
                  <InlineInput value={c.plan} onSave={(v) => update("clients", c.id, { plan: v })} placeholder="Plan" />
                </label>
                <label className={cx("text-xs", late ? "text-danger" : "text-muted")}>
                  Next check-in
                  <InlineInput type="date" value={c.nextCheckIn} onSave={(v) => update("clients", c.id, { nextCheckIn: v })} className={cx("block w-auto", late && "border-danger text-danger")} />
                </label>
                <label className="text-xs text-muted">
                  Last contact
                  <InlineInput type="date" value={c.lastContact} onSave={(v) => update("clients", c.id, { lastContact: v })} className="block w-auto" />
                </label>
                <Button variant="ghost" onClick={() => update("clients", c.id, { lastContact: today, nextCheckIn: addDays(today, 7) })} title="Set last contact to today and next check-in to a week from now">
                  Checked in
                </Button>
                <DeleteBtn onClick={() => confirm(`Delete client ${c.name}?`) && remove("clients", c.id)} />
              </div>
            );
          })}
        </div>
        <AddRow
          label="Add client"
          onSubmit={() => { add("clients", { name: name.trim(), plan: plan.trim(), nextCheckIn: addDays(today, 7), lastContact: today }); setName(""); setPlan(""); }}
          disabled={!name.trim()}
        >
          <Input className="flex-1" placeholder="Client name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input className="flex-1" placeholder="Plan, e.g. 12-week online" value={plan} onChange={(e) => setPlan(e.target.value)} />
        </AddRow>
      </Card>
    </section>
  );
}

/* ---------- Content ---------- */

const STATUSES: ContentStatus[] = ["idea", "filmed", "edited", "scheduled", "posted"];
const STATUS_TONE = { idea: "muted", filmed: "warn", edited: "warn", scheduled: "accent", posted: "ok" } as const;

function Content() {
  const { db, today, add, update, remove } = useDB();
  const [weekOffset, setWeekOffset] = useState(0);
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [date, setDate] = useState(today);
  const start = addDays(startOfWeek(today), weekOffset * 7);
  const end = addDays(start, 6);
  const list = db.content.filter((p) => p.date >= start && p.date <= end).sort((a, b) => a.date.localeCompare(b.date));
  const undated = db.content.filter((p) => !p.date);
  const posted = list.filter((p) => p.status === "posted").length;

  return (
    <section id="content" className="scroll-mt-28">
      <Card
        title="Content this week"
        action={
          <div className="flex items-center gap-1 text-sm">
            <Button variant="ghost" onClick={() => setWeekOffset(weekOffset - 1)} aria-label="Previous week">‹</Button>
            <button className="px-2 text-muted hover:text-ink" onClick={() => setWeekOffset(0)}>{fmtDate(start)} – {fmtDate(end)}</button>
            <Button variant="ghost" onClick={() => setWeekOffset(weekOffset + 1)} aria-label="Next week">›</Button>
          </div>
        }
      >
        <p className="mb-2 text-sm text-muted">{posted}/{list.length} posted</p>
        {!list.length && !undated.length && <Empty>No posts planned this week.</Empty>}
        <ul className="divide-y divide-line">
          {[...list, ...undated].map((p) => {
            const late = p.status !== "posted" && !!p.date && p.date < today;
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-2 py-2">
                <span className={cx("w-24 text-sm", late ? "text-danger" : "text-muted")}>{p.date ? fmtDate(p.date) : "No date"}</span>
                <span className={cx("min-w-32 flex-1", late && "text-danger")}>{p.title}</span>
                <Badge>{p.platform}</Badge>
                <Select value={p.status} onChange={(e) => update("content", p.id, { status: e.target.value as ContentStatus })} aria-label="Status"
                  className={cx(STATUS_TONE[p.status] === "ok" && "text-ok", STATUS_TONE[p.status] === "accent" && "text-accent")}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                </Select>
                <DeleteBtn onClick={() => remove("content", p.id)} />
              </li>
            );
          })}
        </ul>
        <AddRow label="Add post" onSubmit={() => { add("content", { title: title.trim(), platform, date, status: "idea" }); setTitle(""); }} disabled={!title.trim()}>
          <Input className="min-w-40 flex-[2]" placeholder="Post idea / hook" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Select value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label="Platform">
            {["Instagram", "TikTok", "YouTube", "Story", "Email"].map((p) => <option key={p}>{p}</option>)}
          </Select>
          <Input className="w-auto" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Post date" />
        </AddRow>
      </Card>
    </section>
  );
}

/* ---------- Quick links ---------- */

function LinksCard() {
  const { db, add, remove } = useDB();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [edit, setEdit] = useState(false);
  const valid = /^https:\/\//.test(url.trim());
  return (
    <Card title="Quick links" action={<button className="text-sm text-muted hover:text-ink" onClick={() => setEdit(!edit)}>{edit ? "Done" : "Edit"}</button>}>
      <div className="grid gap-2">
        {db.links.map((l) => (
          <div key={l.id} className="flex items-center gap-2">
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 flex-1 items-center justify-between rounded-lg border border-line px-3 font-medium hover:border-accent hover:text-accent">
              {l.label} <span aria-hidden>↗</span>
            </a>
            {edit && <DeleteBtn onClick={() => remove("links", l.id)} />}
          </div>
        ))}
      </div>
      {edit && (
        <AddRow onSubmit={() => { add("links", { label: label.trim(), url: url.trim() }); setLabel(""); setUrl(""); }} disabled={!label.trim() || !valid}>
          <Input className="flex-1" placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
          <Input className="flex-1" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
        </AddRow>
      )}
    </Card>
  );
}
