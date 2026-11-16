"use client";
import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, Empty, cx } from "../ui";

interface Msg { id: string; subject: string; from: string; date: number; unread: boolean }
interface State { configured: boolean; connected: boolean; unread?: number; messages?: Msg[]; message?: string; error?: string }

const senderName = (from: string) => from.replace(/<.*>/, "").replace(/"/g, "").trim() || from;

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for plain-http LAN mode where the Clipboard API is unavailable.
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

/** Read-only Gmail: unread count and the 10 latest inbox messages. */
export function EmailPanel() {
  const [s, setS] = useState<State | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/gmail/messages", { cache: "no-store" });
      setS(await r.json());
    } catch (e) {
      setS({ configured: true, connected: true, error: String(e) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("gmail_error")) {
      setUrlError(p.get("gmail_error"));
      window.history.replaceState(null, "", "/");
    }
    load();
    const t = setInterval(load, 5 * 60_000);
    return () => clearInterval(t);
  }, [load]);

  const copy = async (id: string) => {
    setCopied("…" + id);
    const r = await fetch(`/api/gmail/message/${id}`);
    const j = await r.json();
    if (j.text) {
      await copyText(`Help me draft a reply to this email.\n\n---\n${j.text}`);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 2500);
    } else {
      setCopied(null);
      alert(j.error || "Could not load email");
    }
  };

  const disconnect = async () => {
    if (!confirm("Disconnect Gmail? This deletes the local token and revokes access.")) return;
    await fetch("/api/gmail/disconnect", { method: "POST" });
    load();
  };

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          Email {s?.connected && typeof s.unread === "number" && <Badge tone={s.unread ? "accent" : "muted"}>{s.unread} unread</Badge>}
        </span>
      }
      action={s?.connected && !s.error ? <button onClick={load} className="text-sm text-muted hover:text-ink" disabled={loading}>{loading ? "…" : "Refresh"}</button> : undefined}
    >
      {urlError && <p className="mb-2 text-sm text-danger">Gmail sign-in failed: {urlError}</p>}
      {!s && <Empty>Loading…</Empty>}
      {s && !s.configured && (
        <div className="space-y-2 text-sm text-muted">
          <p>Gmail isn't set up yet.</p>
          <p>Create a Google OAuth client (Desktop app), put the ID and secret in <code className="text-ink">dashboard/.env.local</code>, then restart. Steps are in the README.</p>
        </div>
      )}
      {s && s.configured && !s.connected && (
        <div className="space-y-3 text-sm">
          {s.message && s.message !== "Not connected" && <p className="text-warn">{s.message}</p>}
          <p className="text-muted">Read-only access. The dashboard can see subjects and senders; it can't send, delete or label anything.</p>
          <a href="/api/gmail/auth" className="inline-flex min-h-10 items-center rounded-lg bg-accent px-4 font-medium text-black hover:bg-accent/90">Connect Gmail</a>
        </div>
      )}
      {s?.connected && s.error && <p className="text-sm text-danger">{s.error}</p>}
      {s?.connected && s.messages && (
        <>
          {!s.messages.length && <Empty>Inbox is empty.</Empty>}
          <ul className="divide-y divide-line">
            {s.messages.map((m) => (
              <li key={m.id} className="py-2">
                <div className="flex items-baseline gap-2">
                  <p className={cx("min-w-0 flex-1 truncate text-sm", m.unread ? "font-semibold text-ink" : "text-muted")}>{senderName(m.from)}</p>
                  <span className="shrink-0 text-xs text-muted">
                    {new Date(m.date).toLocaleDateString("en-GB") === new Date().toLocaleDateString("en-GB")
                      ? new Date(m.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                      : new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className={cx("min-w-0 flex-1 truncate text-sm", m.unread ? "text-ink" : "text-muted")}>
                    {m.unread && <span className="mr-1 text-accent">●</span>}
                    {m.subject}
                  </p>
                  <button onClick={() => copy(m.id)} className="shrink-0 rounded-md border border-line px-2 py-1 text-xs text-muted hover:border-accent hover:text-accent" title="Copy email for a reply draft">
                    {copied === m.id ? "Copied ✓" : copied === "…" + m.id ? "…" : "Copy for reply"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between">
            <a href="https://mail.google.com/" target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline">Open Gmail ↗</a>
            <Button variant="danger" onClick={disconnect} className="text-xs">Disconnect</Button>
          </div>
        </>
      )}
    </Card>
  );
}
