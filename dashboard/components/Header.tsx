"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cx } from "./ui";
import { useStore } from "./DataProvider";

const TABS = [
  { href: "/", label: "Today" },
  { href: "/pt", label: "PT Business" },
  { href: "/personal", label: "Personal" },
  { href: "/school", label: "Brother's School" },
];

export function Header() {
  const path = usePathname();
  const { error } = useStore();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <div className="flex items-baseline gap-3">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-accent">●</span> Dashboard
          </span>
          {now && (
            <span className="text-sm text-muted">
              {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} ·{" "}
              {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <nav className="-mx-1 flex w-full gap-1 overflow-x-auto sm:w-auto" aria-label="Areas">
          {TABS.map((t) => {
            const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cx(
                  "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition sm:px-4 sm:text-base",
                  active ? "bg-accent text-black" : "text-muted hover:bg-raised hover:text-ink",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <NotifyButton />
      </div>
      {error && <div className="bg-danger/15 px-6 py-2 text-sm text-danger">Error: {error}. Is the server running?</div>}
    </header>
  );
}

function NotifyButton() {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported" | null>(null);
  useEffect(() => {
    setPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  }, []);
  if (perm !== "default") return null;
  return (
    <button
      onClick={() => Notification.requestPermission().then(setPerm)}
      className="ml-auto rounded-lg border border-accent/60 px-3 py-2 text-sm text-accent hover:bg-accent/10"
    >
      Enable desktop notifications
    </button>
  );
}
