"use client";
import { useState } from "react";
import { useDB } from "../DataProvider";
import { AddRow, Card, Check, DeleteBtn, EditableText, Empty, Input, cx } from "../ui";

export function PrioritiesCard() {
  const { db, add, update, remove } = useDB();
  const [text, setText] = useState("");
  const list = db.priorities;
  return (
    <Card title="Top 3 priorities" action={<span className="text-sm text-muted">{list.filter((p) => p.done).length}/{list.length}</span>}>
      {!list.length && <Empty>What are the three things that move the business today?</Empty>}
      <ol className="space-y-2">
        {list.map((p, i) => (
          <li key={p.id} className="flex items-center gap-3">
            <span className="w-5 text-lg font-bold text-accent">{i + 1}</span>
            <Check checked={p.done} onChange={(v) => update("priorities", p.id, { done: v })} label={p.text} />
            <EditableText value={p.text} onSave={(v) => update("priorities", p.id, { text: v })} className={cx("flex-1 text-base", p.done && "text-muted line-through")} />
            <DeleteBtn onClick={() => remove("priorities", p.id)} />
          </li>
        ))}
      </ol>
      {list.length < 3 && (
        <AddRow onSubmit={() => { add("priorities", { text: text.trim(), done: false }); setText(""); }} disabled={!text.trim()}>
          <Input className="flex-1" placeholder="Add a priority" value={text} onChange={(e) => setText(e.target.value)} />
        </AddRow>
      )}
    </Card>
  );
}
