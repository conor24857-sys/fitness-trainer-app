"use client";
import { useState } from "react";
import { useDB } from "../DataProvider";
import { AddRow, Card, Check, DeleteBtn, Empty, Input, cx } from "../ui";
import { addDays, parseYmd } from "@/lib/dates";
import { best, streak } from "@/lib/habits";

export function HabitsCard({ full = false }: { full?: boolean }) {
  const { db, today, add, update, remove } = useDB();
  const [name, setName] = useState("");
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));

  const toggle = (id: string, log: string[], day: string) =>
    update("habits", id, { log: log.includes(day) ? log.filter((d) => d !== day) : [...log, day] });

  return (
    <Card title="Habits" action={full ? <span className="text-sm text-muted">last 7 days</span> : undefined}>
      {!db.habits.length && <Empty>No habits yet.</Empty>}
      <ul className="space-y-3">
        {db.habits.map((h) => {
          const s = streak(h.log, today);
          return (
            <li key={h.id} className="flex flex-wrap items-center gap-3">
              {!full && <Check checked={h.log.includes(today)} onChange={() => toggle(h.id, h.log, today)} label={h.name} />}
              <span className="min-w-24 flex-1 font-medium">{h.name}</span>
              {full && (
                <div className="flex gap-1">
                  {days.map((d) => {
                    const on = h.log.includes(d);
                    return (
                      <button
                        key={d}
                        onClick={() => toggle(h.id, h.log, d)}
                        title={d}
                        className={cx("grid h-8 w-8 place-items-center rounded-md border text-xs", on ? "border-accent bg-accent text-black" : "border-line text-muted hover:border-accent", d === today && "ring-1 ring-ink/40")}
                      >
                        {parseYmd(d).toLocaleDateString("en-GB", { weekday: "narrow" })}
                      </button>
                    );
                  })}
                </div>
              )}
              <span className={cx("w-20 text-right text-sm", s ? "text-accent" : "text-muted")}>🔥 {s} day{s === 1 ? "" : "s"}</span>
              {full && <span className="hidden w-16 text-right text-xs text-muted sm:inline">best {best(h.log)}</span>}
              {full && <DeleteBtn onClick={() => confirm(`Delete habit "${h.name}" and its history?`) && remove("habits", h.id)} />}
            </li>
          );
        })}
      </ul>
      {full && (
        <AddRow onSubmit={() => { add("habits", { name: name.trim(), log: [] }); setName(""); }} disabled={!name.trim()}>
          <Input className="flex-1" placeholder="New habit, e.g. 10k steps" value={name} onChange={(e) => setName(e.target.value)} />
        </AddRow>
      )}
    </Card>
  );
}
