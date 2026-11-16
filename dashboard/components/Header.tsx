"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cx } from "./ui";
import { useStore } from "./DataProvider";
import { buildAgenda } from "@/lib/today";
import type { Area } from "@/lib/types";

const I = {
  today: <path d="M4 5h16v15H4zM4 9h16M9 3v4M15 3v4" />,
  pt: <path d="M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12" />,
  personal: <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" />,
  school: <path d="M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5" />,
};

const TABS: { href: string; label: string; icon: ReactNode; area?: Area }[] = [
  { href: "/", label: "Today", icon: I.today },
  { href: "/pt", label: "PT Business", icon: I.pt, area: "pt" },
  { href: "/personal", label: "Personal", icon: I.personal, area: "personal" },
  { href: "/school", label: "Brother's School", icon: I.school, area: "school" },
];

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0">
        <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="none" stroke="var(--color-hud)" strokeWidth="1.5" opacity=".8" />
        <polygon points="20,9 30,14.5 30,25.5 20,31 10,25.5 10,14.5" fill="rgb(56 214 255 / .08)" stroke="var(--color-hud)" strokeWidth="1" opacity=".6" className="spin-slow" />
        <circle cx="20" cy="20" r="4.5" fill="var(--color-accent)" style={{ filter: "drop-shadow(0 0 6px var(--color-accent))" }} />
      </svg>
      <div className="leading-tight">
        <p className="font-mono text-sm font-bold tracking-[0.25em] text-ink glow-text">COMMAND</p>
        <p className="font-mono text-[10px] tracking-[0.3em] text-hud">CENTRE · LOCAL</p>
      </div>
    </div>
  );
}

function useAlerts() {
  const { db, today } = useStore();
  const counts: Partial<Record<Area | "all", number>> = {};
  if (db) {
    const a = buildAgenda(db, today);
    counts.all = a.overdue.length;
    for (const i of a.overdue) counts[i.area] = (counts[i.area] ?? 0) + 1;
  }
  return counts;
}

/** Sidebar on desktop, top tabs on phone. Wraps every page. */
export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { error } = useStore();
  const alerts = useAlerts();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <div className="lg:flex">
      <aside className="hud sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 rounded-none border-y-0 border-l-0 p-5 lg:flex">
        <Logo />
        <nav className="flex flex-col gap-1" aria-label="Areas">
          {TABS.map((t) => {
            const n = t.area ? alerts[t.area] : alerts.all;
            return (
              <Link key={t.href} href={t.href}
                className={cx("group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-[15px] transition",
                  active(t.href) ? "border-hud/40 bg-hud/10 text-ink shadow-[inset_3px_0_0_var(--color-accent),0_0_16px_rgb(56_214_255/0.12)]" : "border-transparent text-muted hover:border-hud/20 hover:bg-hud/5 hover:text-ink")}>
                <svg viewBox="0 0 24 24" className={cx("h-5 w-5", active(t.href) ? "text-hud" : "text-muted group-hover:text-hud")} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{t.icon}</svg>
                <span className="flex-1">{t.label}</span>
                {!!n && <span className="rounded bg-danger/20 px-1.5 font-mono text-xs text-danger">{n}</span>}
              </Link>
            );
          })}
        </nav>
        <SystemStatus />
      </aside>

      <div className="min-w-0 flex-1">
        <TopBar />
        <nav className="flex gap-1 overflow-x-auto border-b border-hud/15 px-4 pb-2 lg:hidden" aria-label="Areas">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href}
              className={cx("whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium",
                active(t.href) ? "border-accent bg-accent text-black" : "border-hud/20 text-muted")}>
              {t.label}
            </Link>
          ))}
        </nav>
        {error && <div className="bg-danger/15 px-6 py-2 text-sm text-danger">Error: {error}. Is the server running?</div>}
        <main className="mx-auto max-w-[1600px] overflow-x-hidden px-4 pb-12 pt-4 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

function TopBar() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <header className="sticky top-0 z-20 border-b border-hud/15 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3 sm:px-6">
        <div className="lg:hidden"><Logo /></div>
        <div className="ml-auto flex items-center gap-4 lg:ml-0">
          {now && (
            <>
              <span className="font-mono text-2xl font-semibold tabular-nums text-ink glow-text sm:text-3xl">
                {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                <span className="text-base text-hud sm:text-lg">:{String(now.getSeconds()).padStart(2, "0")}</span>
              </span>
              <span className="hidden font-mono text-xs uppercase leading-tight tracking-widest text-muted sm:block">
                {now.toLocaleDateString("en-GB", { weekday: "long" })}
                <br />
                <span className="text-hud">{now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
              </span>
            </>
          )}
        </div>
        <div className="ml-auto hidden lg:block"><NotifyButton /></div>
      </div>
      <div className="px-4 pb-2 lg:hidden"><NotifyButton /></div>
    </header>
  );
}

function SystemStatus() {
  const [perm, setPerm] = useState<string>("…");
  const [lan, setLan] = useState(false);
  useEffect(() => {
    setPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
    setLan(!["127.0.0.1", "localhost", "[::1]"].includes(location.hostname));
  }, []);
  const Row = ({ k, v, ok }: { k: string; v: string; ok: boolean }) => (
    <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider">
      <span className="text-muted">{k}</span>
      <span className={cx("flex items-center gap-1.5", ok ? "text-ok" : "text-warn")}>
        <span className={cx("h-1.5 w-1.5 rounded-full pulse-dot", ok ? "bg-ok" : "bg-warn")} />{v}
      </span>
    </div>
  );
  return (
    <div className="mt-auto space-y-2 rounded-xl border border-hud/15 bg-bg/50 p-3">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.25em] text-hud">System status</p>
      <Row k="Server" v="Online" ok />
      <Row k="Network" v={lan ? "LAN mode" : "This PC only"} ok={!lan} />
      <Row k="Alerts" v={perm === "granted" ? "On" : "Off"} ok={perm === "granted"} />
      <Row k="Data" v="Local file" ok />
    </div>
  );
}

function NotifyButton() {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported" | null>(null);
  useEffect(() => {
    setPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  }, []);
  if (perm !== "default") return null;
  return (
    <button onClick={() => Notification.requestPermission().then(setPerm)}
      className="rounded-lg border border-accent/60 px-3 py-2 font-mono text-xs uppercase tracking-wider text-accent hover:bg-accent/10">
      Enable desktop alerts
    </button>
  );
}
