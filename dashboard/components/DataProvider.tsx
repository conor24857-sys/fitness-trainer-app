"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Collection, DB, Item } from "@/lib/types";
import { ymd } from "@/lib/dates";

interface Store {
  db: DB | null;
  error: string | null;
  today: string;
  add: <C extends Collection>(c: C, data: Omit<Item<C>, "id">) => Promise<void>;
  update: <C extends Collection>(c: C, id: string, patch: Partial<Item<C>>) => Promise<void>;
  remove: (c: Collection, id: string) => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

async function api(path: string, method = "GET", body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${method} ${path} failed (${res.status})`);
  return res.json();
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState(ymd());

  const load = useCallback(() => {
    api("/api/db").then(setDb).catch((e) => setError(String(e.message)));
  }, []);

  useEffect(() => {
    load();
    // Roll over at midnight (daily checklist resets, "today" moves) and pick up changes from other tabs.
    const t = setInterval(() => {
      const now = ymd();
      setToday((prev) => (prev !== now ? now : prev));
    }, 30_000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const add = useCallback<Store["add"]>(async (c, data) => {
    try {
      const item = await api(`/api/db/${c}`, "POST", data);
      setDb((d) => (d ? { ...d, [c]: [...d[c], item] } : d));
    } catch (e) {
      setError(String((e as Error).message));
    }
  }, [load]);

  const update = useCallback<Store["update"]>(async (c, id, patch) => {
    setDb((d) => (d ? { ...d, [c]: (d[c] as { id: string }[]).map((x) => (x.id === id ? { ...x, ...patch } : x)) } : d));
    try {
      await api(`/api/db/${c}/${id}`, "PATCH", patch);
    } catch (e) {
      setError(String((e as Error).message));
      load();
    }
  }, [load]);

  const remove = useCallback<Store["remove"]>(async (c, id) => {
    setDb((d) => (d ? { ...d, [c]: (d[c] as { id: string }[]).filter((x) => x.id !== id) } : d));
    try {
      await api(`/api/db/${c}/${id}`, "DELETE");
      if (c === "subjects") load();
    } catch (e) {
      setError(String((e as Error).message));
      load();
    }
  }, [load]);

  return <Ctx.Provider value={{ db, error, today, add, update, remove }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside DataProvider");
  return s;
}

/** Returns the db once loaded; components render a loader until then. */
export function useDB() {
  const s = useStore();
  return { ...s, db: s.db as DB, ready: !!s.db };
}
