"use client";
import { useEffect, useState } from "react";
import { useDB } from "../DataProvider";
import { Ring } from "../ui";
import { monthKey } from "@/lib/dates";

/** Hero panel: animated scanner rings with today's open-item count, plus progress rings. */
export function CorePanel({ open, overdue }: { open: number; overdue: number }) {
  const { db, today } = useDB();
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => setHour(new Date().getHours()), []);
  const greeting = hour === null ? "" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const check = db.checklist.length ? db.checklist.filter((c) => c.doneDate === today).length / db.checklist.length : 0;
  const habits = db.habits.length ? db.habits.filter((h) => h.log.includes(today)).length / db.habits.length : 0;
  const goalsM = db.goals.filter((g) => g.month === monthKey());
  const goals = goalsM.length ? goalsM.filter((g) => g.done).length / goalsM.length : 0;
  const ticks = Array.from({ length: 60 }, (_, i) => i);

  return (
    <section className="hud flex flex-col items-center gap-4 rounded-2xl p-5 sm:flex-row lg:flex-col xl:flex-row">
      <div className="relative h-52 w-52 shrink-0">
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
          <defs>
            <radialGradient id="coreGlow">
              <stop offset="0%" stopColor={overdue ? "rgb(255 77 94 / .35)" : "rgb(56 214 255 / .30)"} />
              <stop offset="70%" stopColor="rgb(56 214 255 / 0)" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="96" fill="url(#coreGlow)" />
          <g className="spin-slow">
            {ticks.map((i) => (
              <line key={i} x1="100" y1="6" x2="100" y2={i % 5 ? 11 : 16} stroke="var(--color-hud)" strokeOpacity={i % 5 ? 0.35 : 0.8} strokeWidth="1.2" transform={`rotate(${i * 6} 100 100)`} />
            ))}
          </g>
          <g className="spin-rev">
            <circle cx="100" cy="100" r="76" fill="none" stroke="var(--color-hud)" strokeOpacity=".55" strokeWidth="2" strokeDasharray="70 18 8 18" />
          </g>
          <g className="spin-slow">
            <circle cx="100" cy="100" r="62" fill="none" stroke="var(--color-accent)" strokeOpacity=".7" strokeWidth="1.5" strokeDasharray="4 8" />
          </g>
          <circle cx="100" cy="100" r="50" fill="rgb(4 10 19 / .85)" stroke="var(--color-hud)" strokeOpacity=".4" />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className={`font-mono text-5xl font-bold tabular-nums ${overdue ? "text-danger" : "text-ink glow-text"}`}>{open}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-hud">open today</p>
          </div>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-center gap-4 sm:items-start lg:items-center xl:items-start">
        <div className="text-center sm:text-left lg:text-center xl:text-left">
          <p className="text-2xl font-semibold">{greeting}</p>
          <p className="text-sm text-muted">{overdue ? `${overdue} overdue item${overdue > 1 ? "s" : ""} need attention.` : "Nothing overdue. Systems nominal."}</p>
        </div>
        <div className="flex gap-4">
          <Ring value={check} label="Checklist" color="var(--color-accent)" />
          <Ring value={habits} label="Habits" color="var(--color-ok)" />
          <Ring value={goals} label="Goals" />
        </div>
      </div>
    </section>
  );
}
