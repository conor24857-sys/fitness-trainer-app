"use client";
import Link from "next/link";
import { useDB } from "@/components/DataProvider";
import { Badge, Card, Check, Empty, Loading, cx } from "@/components/ui";
import { PrioritiesCard } from "@/components/widgets/Priorities";
import { ChecklistCard } from "@/components/widgets/Checklist";
import { HabitsCard } from "@/components/widgets/Habits";
import { RemindersCard } from "@/components/widgets/Reminders";
import { EmailPanel } from "@/components/widgets/EmailPanel";
import { AREA_LABEL, buildAgenda, nextExam, type AgendaItem } from "@/lib/today";
import { fmtDate, relDay } from "@/lib/dates";
import type { Collection } from "@/lib/types";

export default function TodayPage() {
  const { db, ready, today } = useDB();
  if (!ready) return <Loading />;
  const agenda = buildAgenda(db, today);
  const exam = nextExam(db, today);

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-5">
        <Stats overdue={agenda.overdue.length} today={agenda.today.length} exam={exam} />
        {agenda.overdue.length > 0 && (
          <Card title={<span className="text-danger">Overdue ({agenda.overdue.length})</span>} tone="danger">
            <AgendaList items={agenda.overdue} />
          </Card>
        )}
        <Card title="Due today">
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
        <HabitsCard />
      </div>
      <div className="space-y-4 lg:col-span-3">
        <RemindersCard />
        <EmailPanel />
      </div>
    </div>
  );
}

function Stats({ overdue, today, exam }: { overdue: number; today: number; exam?: ReturnType<typeof nextExam> }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Stat label="Overdue" value={overdue} danger={overdue > 0} />
      <Stat label="Due today" value={today} />
      <Stat label={exam ? `${exam.subject || "Exam"}` : "Next exam"} value={exam ? `${exam.days}d` : "–"} hint={exam?.title} />
    </div>
  );
}

function Stat({ label, value, danger, hint }: { label: string; value: number | string; danger?: boolean; hint?: string }) {
  return (
    <div className={cx("rounded-2xl border bg-surface p-4", danger ? "border-danger/50" : "border-line")} title={hint}>
      <p className={cx("text-3xl font-bold tabular-nums", danger ? "text-danger" : "text-ink")}>{value}</p>
      <p className="truncate text-sm text-muted">{label}</p>
    </div>
  );
}

const AREA_TONE = { pt: "accent", personal: "ok", school: "warn", general: "muted" } as const;

function AgendaList({ items }: { items: AgendaItem[] }) {
  const { update, today } = useDB();
  return (
    <ul className="divide-y divide-line">
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
