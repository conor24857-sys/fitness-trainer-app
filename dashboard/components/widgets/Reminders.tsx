"use client";
import { useState } from "react";
import { useDB } from "../DataProvider";
import { AddRow, Badge, Card, Check, DeleteBtn, Empty, Input, Select, cx } from "../ui";
import type { Area } from "@/lib/types";
import { fmtDate, fmtTime, localDateTime } from "@/lib/dates";
import { AREA_LABEL } from "@/lib/today";

export function RemindersCard() {
  const { db, add, update, remove } = useDB();
  const [text, setText] = useState("");
  const [at, setAt] = useState("");
  const [area, setArea] = useState<Area>("general");
  const [showDone, setShowDone] = useState(false);
  const now = localDateTime();
  const list = db.reminders.filter((r) => showDone || !r.done).sort((a, b) => a.at.localeCompare(b.at));

  return (
    <Card
      title="Reminders"
      action={<button className="text-sm text-muted hover:text-ink" onClick={() => setShowDone(!showDone)}>{showDone ? "Hide done" : "Show done"}</button>}
    >
      {!list.length && <Empty>No reminders. Add one below; you'll get a desktop notification at that time while the dashboard is open.</Empty>}
      <ul className="space-y-2">
        {list.map((r) => {
          const late = !r.done && r.at < now;
          return (
            <li key={r.id} className="flex items-center gap-3">
              <Check checked={r.done} onChange={(v) => update("reminders", r.id, { done: v })} label={r.text} />
              <div className="min-w-0 flex-1">
                <p className={cx("truncate", r.done && "text-muted line-through", late && "text-danger")}>{r.text}</p>
                <p className={cx("text-xs", late ? "text-danger" : "text-muted")}>
                  {fmtDate(r.at)} {fmtTime(r.at)}
                </p>
              </div>
              <Badge>{AREA_LABEL[r.area]}</Badge>
              <DeleteBtn onClick={() => remove("reminders", r.id)} />
            </li>
          );
        })}
      </ul>
      <AddRow
        onSubmit={() => {
          add("reminders", { text: text.trim(), at, area, done: false, notified: false });
          setText("");
          setAt("");
        }}
        disabled={!text.trim() || !at}
      >
        <Input className="min-w-40 flex-[2]" placeholder="Remind me to…" value={text} onChange={(e) => setText(e.target.value)} />
        <Input className="w-auto flex-1" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} aria-label="When" />
        <Select value={area} onChange={(e) => setArea(e.target.value as Area)} aria-label="Area">
          {(Object.keys(AREA_LABEL) as Area[]).map((a) => <option key={a} value={a}>{AREA_LABEL[a]}</option>)}
        </Select>
      </AddRow>
    </Card>
  );
}
