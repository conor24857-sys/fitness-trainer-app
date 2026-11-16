"use client";
import { useState } from "react";
import { useDB } from "../DataProvider";
import { AddRow, Card, Check, DeleteBtn, EditableText, Input, cx } from "../ui";

/** Daily PT checklist. An item counts as done only if it was ticked today, so it resets every morning. */
export function ChecklistCard({ editable = false }: { editable?: boolean }) {
  const { db, today, add, update, remove } = useDB();
  const [text, setText] = useState("");
  const done = db.checklist.filter((c) => c.doneDate === today).length;
  const pct = db.checklist.length ? Math.round((done / db.checklist.length) * 100) : 0;
  return (
    <Card title="Daily checklist" action={<span className="text-sm text-muted">{done}/{db.checklist.length} · resets each morning</span>}>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ul className="space-y-2">
        {db.checklist.map((c) => {
          const isDone = c.doneDate === today;
          return (
            <li key={c.id} className="flex items-center gap-3">
              <Check checked={isDone} onChange={(v) => update("checklist", c.id, { doneDate: v ? today : null })} label={c.text} />
              {editable ? (
                <EditableText value={c.text} onSave={(v) => update("checklist", c.id, { text: v })} className={cx("flex-1", isDone && "text-muted line-through")} />
              ) : (
                <span className={cx("flex-1", isDone && "text-muted line-through")}>{c.text}</span>
              )}
              {editable && <DeleteBtn onClick={() => remove("checklist", c.id)} />}
            </li>
          );
        })}
      </ul>
      {editable && (
        <AddRow onSubmit={() => { add("checklist", { text: text.trim(), doneDate: null }); setText(""); }} disabled={!text.trim()}>
          <Input className="flex-1" placeholder="Add a daily task" value={text} onChange={(e) => setText(e.target.value)} />
        </AddRow>
      )}
    </Card>
  );
}
