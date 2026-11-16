"use client";
import Link from "next/link";
import { useDB } from "@/components/DataProvider";
import { Badge, Card, Check, Empty, Loading, cx } from "@/components/ui";
import { PrioritiesCard } from "@/components/widgets/Priorities";
import { ChecklistCard } from "@/components/widgets/Checklist";
import { HabitsCard } from "@/components/widgets/Habits";
import { RemindersCard } from "@/components/widgets/Reminders";
import { EmailPanel, GmailProvider, useGmail } from "@/components/widgets/EmailPanel";
import { CorePanel } from "@/components/widgets/Core";
import { TimelineCard } from "@/components/widgets/Timeline";
import { QuickAddCard } from "@/components/widgets/QuickAdd";
import { AREA_LABEL, buildAgenda, nextExam, type AgendaItem } from "@/lib/today";
import { addDays, fmtDate, relDay } from "@/lib/dates";
import type { Collection } from "@/lib/types";

export default function TodayPage() {
  const { db, ready, today } = useDB();
  if (!ready) return <Loading />;
  const agenda = buildAgenda(db, today);
  const exam = nextExam(db, today);

  const leadsDue = db.leads.filter((l) => l.followUp && l.followUp <= today && l.stage !== "client" && l.stage !== "lost").length;
  const checkIns = db.clients.filter((c) => c.nextCheckIn && c.nextCheckIn <= today).length;
  const hw = db.assignments.filter((a) => a.status !== "done" && a.due && a.due <= addDays(today, 3)).length;

  return (
    <GmailProvider>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 [&>*]:min-w-0 lg:grid-cols-12">
          <div className="lg:col-span-5"><CorePanel open={agenda.overdue.length + agenda.today.length} overdue={agenda.overdue.length} /></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-7">
            <Stat label="Overdue" value={agenda.overdue.length} tone={agenda.overdue.length ? "danger" : undefined} href="#agenda" />
            <Stat label="Due today" value={agenda.today.length} href="#agenda" />
            <MailStat />
            <Stat label="Lead follow-ups" value={leadsDue} tone={leadsDue ? "accent" : undefined} href="/pt#pipeline" />
            <Stat label="Client check-ins" value={checkIns} tone={checkIns ? "accent" : undefined} href="/pt#clients" />
            <Stat label={exam ? `${exam.subject || "Exam"}: ${exam.title}` : `Homework ≤ 3 days`} value={exam ? `${exam.days}d` : hw} href="/school" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 [&>*]:min-w-0 lg:grid-cols-12">
          <div id="agenda" className="scroll-mt-24 space-y-4 lg:col-span-5">
            {agenda.overdue.length > 0 && (
              <Card title={`Overdue · ${agenda.overdue.length}`} tone="danger">
                <AgendaList items={agenda.overdue} />
              </Card>
            )}
            <Card title={`Due today · ${agenda.today.length}`}>
              {agenda.today.length ? <AgendaList items={agenda.today} /> : <Empty>Nothing else due today.</Empty>}
            </Card>
            {agenda.soon.length > 0 && (
              <Card title="Next 3 days">
                <AgendaList items={agenda.soon} />
              </Card>
            )}
          </div>
          <div className="space-y-4 lg:col-span-4">
            <PrioritiesCard />
            <ChecklistCard />
            <TimelineCard />
            <HabitsCard />
          </div>
          <div className="space-y-4 lg:col-span-3">
            <QuickAddCard />
            <RemindersCard />
            <EmailPanel />
          </div>
        </div>
      </div>
    </GmailProvider>
  );
}

function MailStat() {
  const { s } = useGmail();
  const v = s?.connected && typeof s.unread === "number" ? s.unread : "–";
  return <Stat label={s?.connected ? "Unread email" : "Email · not connected"} value={v} tone={typeof v === "number" && v > 0 ? "hud" : undefined} href="#email" />;
}

function Stat({ label, value, tone, href }: { label: string; value: number | string; tone?: "danger" | "accent" | "hud"; href: string }) {
  const color = tone === "danger" ? "text-danger" : tone === "accent" ? "text-accent" : tone === "hud" ? "text-hud glow-text" : "text-ink";
  return (
    <Link href={href} className={cx("hud group flex flex-col justify-between rounded-xl p-4 transition hover:border-hud/50", tone === "danger" && "hud-danger")}>
      <p className={cx("font-mono text-4xl font-bold tabular-nums", color)}>{value}</p>
      <p className="mt-2 truncate font-mono text-[11px] uppercase tracking-widest text-muted group-hover:text-ink" title={label}>{label}</p>
    </Link>
  );
}

const AREA_TONE = { pt: "accent", personal: "ok", school: "warn", general: "muted" } as const;

function AgendaList({ items }: { items: AgendaItem[] }) {
  const { update, today } = useDB();
  return (
    <ul className="divide-y divide-hud/10">
      {items.map((i) => (
        <li key={i.key} className="flex items-center gap-3 py-2.5">
          {i.complete ? (
            <Check checked={false} onChange={() => update(i.complete!.collection as Collection, i.complete!.id, i.complete!.patch)} label={`Complete ${i.text}`} />
          ) : (
            <span className="h-6 w-6 shrink-0" />
          )}
          <Link href={i.href} className="min-w-0 flex-1">
            <p className={cx("truncate text-base font-medium", i.overdue && "text-danger")}>{i.text}</p>
            <p className={cx("truncate text-sm", i.overdue ? "text-danger/80" : "text-muted")}>
              {i.kind}
              {i.detail ? ` · ${i.detail}` : ""}
              {i.time ? ` · ${i.time}` : ""}
              {i.date !== today ? ` · ${i.overdue ? relDay(i.date, today) : fmtDate(i.date)}` : ""}
            </p>
          </Link>
          <Badge tone={AREA_TONE[i.area]}>{AREA_LABEL[i.area]}</Badge>
        </li>
      ))}
    </ul>
  );
}
