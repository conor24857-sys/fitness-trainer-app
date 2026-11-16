// All dates are local-time strings: "YYYY-MM-DD" for days, "YYYY-MM-DDTHH:mm" for times.
const pad = (n: number) => String(n).padStart(2, "0");

export function ymd(d: Date = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function localDateTime(d: Date = new Date()) {
  return `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function parseYmd(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
export function addDays(s: string, n: number) {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
}
/** Whole days from today to date (negative = past). */
export function daysUntil(s: string, today = ymd()) {
  return Math.round((parseYmd(s).getTime() - parseYmd(today).getTime()) / 86400000);
}
export function isOverdue(s: string | undefined, today = ymd()) {
  return !!s && s < today;
}
export function isToday(s: string | undefined, today = ymd()) {
  return !!s && s.slice(0, 10) === today;
}
export function monthKey(d: Date = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
/** Monday-based weekday: 0 = Mon ... 6 = Sun */
export function weekdayMon(d: Date = new Date()) {
  return (d.getDay() + 6) % 7;
}
export function startOfWeek(today = ymd()) {
  return addDays(today, -weekdayMon(parseYmd(today)));
}
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function fmtDate(s: string) {
  if (!s) return "";
  const d = parseYmd(s.slice(0, 10));
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}
export function fmtTime(s: string) {
  return s.length > 10 ? s.slice(11, 16) : "";
}
export function relDay(s: string, today = ymd()) {
  const n = daysUntil(s, today);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  return n < 0 ? `${-n} days overdue` : `in ${n} days`;
}
/** Next occurrence of a yearly date (birthdays, renewals) on/after today. */
export function nextYearly(s: string, today = ymd()) {
  const md = s.slice(5);
  const y = Number(today.slice(0, 4));
  const thisYear = `${y}-${md}`;
  return thisYear >= today ? thisYear : `${y + 1}-${md}`;
}
