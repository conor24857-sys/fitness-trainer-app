import { addDays } from "./dates";

/** Consecutive days ending today (or yesterday, if today isn't ticked yet). */
export function streak(log: string[], today: string) {
  const set = new Set(log);
  let day = set.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (set.has(day)) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

export function best(log: string[]) {
  const days = [...new Set(log)].sort();
  let bestRun = 0, run = 0, prev = "";
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    bestRun = Math.max(bestRun, run);
    prev = d;
  }
  return bestRun;
}
