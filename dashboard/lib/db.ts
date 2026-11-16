import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { COLLECTIONS, type Collection, type DB } from "./types";

// All data lives in ./data/db.json on this PC. The data folder is gitignored.
export const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const id = () => crypto.randomUUID();

function seed(): DB {
  return {
    reminders: [],
    priorities: [],
    checklist: ["Post a video", "Reply to DMs", "Client check-ins", "20 min outreach"].map((text) => ({ id: id(), text, doneDate: null })),
    leads: [],
    clients: [],
    content: [],
    links: [
      { id: id(), label: "Application form (Tally)", url: "https://tally.so" },
      { id: id(), label: "PT Hub", url: "https://kearnsfitness3.mypthub.net/auth/" },
      { id: id(), label: "Instagram", url: "https://www.instagram.com/" },
      { id: id(), label: "TikTok analytics", url: "https://www.tiktok.com/tiktokstudio/analytics" },
    ],
    todos: [],
    habits: ["Gym", "Sleep 7h+", "Water 3L"].map((name) => ({ id: id(), name, log: [] })),
    dates: [],
    goals: [],
    subjects: [],
    assignments: [],
    exams: [],
    studyBlocks: [],
  };
}

let cache: DB | null = null;

export function readDB(): DB {
  if (cache) return cache;
  if (!fs.existsSync(DB_FILE)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    cache = seed();
    writeDB(cache);
    return cache;
  }
  const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as Partial<DB>;
  const base = seed();
  // Fill in any collections added in later versions without touching existing data.
  for (const c of COLLECTIONS) if (!Array.isArray(parsed[c])) (parsed as Record<string, unknown>)[c] = base[c];
  cache = parsed as DB;
  return cache;
}

function writeDB(db: DB) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE); // atomic replace so a crash never leaves a half-written file
}

const MAX_STR = 5000;
function clean(input: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!input || typeof input !== "object") return out;
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (k === "id") continue;
    if (typeof v === "string") out[k] = v.slice(0, MAX_STR);
    else if (typeof v === "number" || typeof v === "boolean" || v === null) out[k] = v;
    else if (Array.isArray(v)) out[k] = v.filter((x) => typeof x === "string").slice(0, 2000);
  }
  return out;
}

export function isCollection(c: string): c is Collection {
  return (COLLECTIONS as string[]).includes(c);
}

export function createItem(c: Collection, data: unknown) {
  const db = readDB();
  const item = { ...clean(data), id: id() };
  (db[c] as unknown[]).push(item);
  writeDB(db);
  return item;
}

export function updateItem(c: Collection, itemId: string, patch: unknown) {
  const db = readDB();
  const list = db[c] as { id: string }[];
  const i = list.findIndex((x) => x.id === itemId);
  if (i < 0) return null;
  list[i] = { ...list[i], ...clean(patch), id: itemId };
  writeDB(db);
  return list[i];
}

export function deleteItem(c: Collection, itemId: string) {
  const db = readDB();
  const list = db[c] as { id: string }[];
  const next = list.filter((x) => x.id !== itemId);
  (db as unknown as Record<string, unknown>)[c] = next;
  // Cascade: removing a subject removes its assignments, exams and study blocks.
  if (c === "subjects") {
    db.assignments = db.assignments.filter((a) => a.subjectId !== itemId);
    db.exams = db.exams.filter((a) => a.subjectId !== itemId);
    db.studyBlocks = db.studyBlocks.filter((a) => a.subjectId !== itemId);
  }
  writeDB(db);
  return next.length !== list.length;
}
