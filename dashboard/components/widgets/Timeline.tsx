"use client";
import { Fragment, useEffect, useState } from "react";
import { useDB } from "../DataProvider";
import { Card, Empty, cx } from "../ui";
import { fmtTime, parseYmd, weekdayMon } from "@/lib/dates";

/** Today's timed items (reminders and study blocks) on a vertical timeline with a "now" marker. */
export function TimelineCard() {
  const { db, today } = useDB();
  const [now, setNow] = useState("");
  useEffect(() => {
    const f = () => setNow(new Date().toTimeString().slice(0, 5));
    f();
    const t = setInterval(f, 30_000);
    return () => clearInterval(t);
  }, []);
  const dow = weekdayMon(parseYmd(today));
  const subj = (id: string) => db.subjects.find((s) => s.id === id)?.name ?? "Study";
  const items = [
    ...db.reminders.filter((r) => !r.done && r.at.slice(0, 10) === today).map((r) => ({ id: r.id, time: fmtTime(r.at), end: "", text: r.text, kind: "Reminder", tone: "accent" })),
    ...db.studyBlocks.filter((b) => b.day === dow).map((b) => ({ id: b.id, time: b.start, end: b.end, text: subj(b.subjectId), kind: b.note || "Study block", tone: "warn" })),
  ].sort((a, b) => a.time.localeCompare(b.time));
  const nowIdx = items.findIndex((i) => (i.end || i.time) > now);

  return (
    <Card title="Timeline" action={<span className="font-mono text-xs text-muted">{items.length} scheduled</span>}>
      {!items.length && <Empty>No timed items today. Add a reminder with a time to see it here.</Empty>}
      <ol className="relative ml-12 border-l border-hud/25">
        {items.map((i, idx) => {
          const past = nowIdx === -1 || idx < nowIdx;
          return (
            <Fragment key={i.id}>
            {idx === nowIdx && <li className="relative pb-3 pl-4"><NowMarker now={now} /></li>}
            <li className="relative pb-4 pl-4 last:pb-0">
              <span className={cx("absolute -left-12 top-0.5 w-10 text-right font-mono text-xs tabular-nums", past ? "text-muted/60" : "text-hud")}>{i.time}</span>
              <span className={cx("absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-bg", past ? "bg-muted/50" : i.tone === "accent" ? "bg-accent shadow-[0_0_8px_var(--color-accent)]" : "bg-warn shadow-[0_0_8px_var(--color-warn)]")} />
              <p className={cx("text-[15px] font-medium", past && "text-muted line-through decoration-muted/40")}>{i.text}</p>
              <p className="text-xs text-muted">{i.kind}{i.end ? ` · until ${i.end}` : ""}</p>
            </li>
            </Fragment>
          );
        })}
        {items.length > 0 && nowIdx === -1 && <li className="relative pl-4"><NowMarker now={now} /></li>}
      </ol>
    </Card>
  );
}

function NowMarker({ now }: { now: string }) {
  return (
    <div className="relative -ml-4 flex items-center gap-2">
      <span className="absolute -left-[6px] h-3 w-3 rounded-full bg-hud shadow-[0_0_10px_var(--color-hud)] pulse-dot" />
      <span className="ml-4 h-px flex-1 bg-gradient-to-r from-hud to-transparent" />
      <span className="font-mono text-[10px] uppercase tracking-widest text-hud">Now {now}</span>
    </div>
  );
}
