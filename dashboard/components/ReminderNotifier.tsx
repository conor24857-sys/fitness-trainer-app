"use client";
import { useEffect, useRef, useState } from "react";
import { useStore } from "./DataProvider";
import { localDateTime } from "@/lib/dates";

// Checks reminders every 20 seconds while the dashboard is open in a browser tab.
// Fires a Windows desktop notification (via the browser) and an in-page banner.
export function ReminderNotifier() {
  const { db, update } = useStore();
  const [banner, setBanner] = useState<string[]>([]);
  const dbRef = useRef(db);
  dbRef.current = db;

  useEffect(() => {
    const check = () => {
      const d = dbRef.current;
      if (!d) return;
      const now = localDateTime();
      const dayAgo = localDateTime(new Date(Date.now() - 86400000));
      for (const r of d.reminders) {
        if (r.done || r.notified || !r.at || r.at > now) continue;
        update("reminders", r.id, { notified: true });
        if (r.at < dayAgo) continue; // stale: mark but don't pop up
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("Reminder", { body: r.text, tag: r.id, requireInteraction: true });
        }
        setBanner((b) => [...b, r.text]);
      }
    };
    check();
    const t = setInterval(check, 20_000);
    return () => clearInterval(t);
  }, [update]);

  if (!banner.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-30 flex max-w-sm flex-col gap-2" role="status">
      {banner.map((text, i) => (
        <div key={i} className="flex items-start gap-3 rounded-xl border border-accent bg-raised p-4 shadow-2xl">
          <span className="text-accent">⏰</span>
          <p className="flex-1 text-sm">{text}</p>
          <button className="text-muted hover:text-ink" onClick={() => setBanner((b) => b.filter((_, j) => j !== i))} aria-label="Dismiss">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
