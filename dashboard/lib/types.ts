export type ID = string;
export type Area = "pt" | "personal" | "school" | "general";

export interface Reminder { id: ID; text: string; at: string; area: Area; done: boolean; notified: boolean }
export interface Priority { id: ID; text: string; done: boolean }
export interface ChecklistItem { id: ID; text: string; doneDate: string | null }
export type LeadStage = "new" | "intro" | "trial" | "client" | "lost";
export interface Lead { id: ID; name: string; source: string; notes: string; stage: LeadStage; followUp: string }
export interface Client { id: ID; name: string; plan: string; nextCheckIn: string; lastContact: string }
export type ContentStatus = "idea" | "filmed" | "edited" | "scheduled" | "posted";
export interface ContentPost { id: ID; title: string; platform: string; date: string; status: ContentStatus }
export interface QuickLink { id: ID; label: string; url: string }
export type TodoPriority = "high" | "med" | "low";
export interface Todo { id: ID; text: string; due: string; priority: TodoPriority; done: boolean }
export interface Habit { id: ID; name: string; log: string[] }
export interface ImportantDate { id: ID; title: string; date: string; kind: "birthday" | "appointment" | "renewal" | "other"; yearly: boolean }
export interface Goal { id: ID; text: string; month: string; done: boolean }
export interface Subject { id: ID; name: string; notes: string }
export type AssignmentStatus = "not_started" | "in_progress" | "done";
export interface Assignment { id: ID; subjectId: ID; title: string; due: string; status: AssignmentStatus }
export interface Exam { id: ID; subjectId: ID; title: string; date: string }
export interface StudyBlock { id: ID; subjectId: ID; day: number; start: string; end: string; note: string }

export interface DB {
  reminders: Reminder[];
  priorities: Priority[];
  checklist: ChecklistItem[];
  leads: Lead[];
  clients: Client[];
  content: ContentPost[];
  links: QuickLink[];
  todos: Todo[];
  habits: Habit[];
  dates: ImportantDate[];
  goals: Goal[];
  subjects: Subject[];
  assignments: Assignment[];
  exams: Exam[];
  studyBlocks: StudyBlock[];
}
export type Collection = keyof DB;
export type Item<C extends Collection> = DB[C][number];

export const COLLECTIONS: Collection[] = [
  "reminders", "priorities", "checklist", "leads", "clients", "content", "links",
  "todos", "habits", "dates", "goals", "subjects", "assignments", "exams", "studyBlocks",
];
