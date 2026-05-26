import { DEFAULT_HABITS, HABIT_REMINDER_PRESETS } from "../constants/tempoConstants.js";
import { addDaysSafe, dateKey, dayStart, TODAY, uid } from "../lib/tempo/core.js";
import { validTimeString } from "./dateUtils.js";

export function habitRepeatDaysFromFrequency(frequency, repeatDays) {
  if (Array.isArray(repeatDays) && repeatDays.length) return [...new Set(repeatDays.map(Number).filter(d => d >= 0 && d <= 6))].sort((a,b) => a-b);
  if (frequency === "weekdays") return [1,2,3,4,5];
  if (frequency === "weekends") return [0,6];
  return [0,1,2,3,4,5,6];
}

export function normalizeHabitReminder(reminder) {
  if (reminder === null) return { type: "none", time: "" };
  if (typeof reminder === "string") {
    const preset = HABIT_REMINDER_PRESETS.find(p => p.id === reminder);
    if (preset) return { type: preset.id, time: preset.time };
    return /^\d{2}:\d{2}$/.test(reminder) ? { type: "custom", time: reminder } : { type: "none", time: "" };
  }
  if (!reminder) return { type: "none", time: "" };
  const type = reminder.type || reminder.mode || reminder.id || "none";
  if (type === "none") return { type: "none", time: "" };
  const preset = HABIT_REMINDER_PRESETS.find(p => p.id === type);
  return { type: preset ? preset.id : "custom", time: validTimeString(reminder.time || preset?.time || "09:00", preset?.time || "09:00") };
}

export function habitReminderPresetId(reminder) {
  const r = normalizeHabitReminder(reminder);
  if (r.type === "none") return "none";
  if (["morning", "afternoon", "evening"].includes(r.type)) return r.type;
  return "custom";
}

export function normalizeHabit(habit, index = 0) {
  const now = new Date().toISOString();
  const fallback = DEFAULT_HABITS[index % DEFAULT_HABITS.length] || DEFAULT_HABITS[0];
  const frequency = ["daily", "weekdays", "weekends", "custom"].includes(habit?.frequency) ? habit.frequency : (fallback?.frequency || "daily");
  const repeatDays = habitRepeatDaysFromFrequency(frequency, habit?.repeatDays ?? fallback?.repeatDays);
  const target = Math.max(1, Math.min(20, Number(habit?.targetCount || habit?.target || fallback?.targetCount || 1)));
  return {
    id: String(habit?.id || `habit-${uid()}`),
    name: String(habit?.name || fallback?.name || "New Habit").trim() || "New Habit",
    templateId: habit?.templateId ? String(habit.templateId) : (fallback?.templateId ? String(fallback.templateId) : null),
    emoji: String(habit?.emoji || fallback?.emoji || "🌱").trim() || "🌱",
    category: String(habit?.category || fallback?.category || "personal"),
    frequency,
    repeatDays: repeatDays.length ? repeatDays : [0,1,2,3,4,5,6],
    targetCount: target,
    unit: String(habit?.unit || fallback?.unit || (target > 1 ? "times" : "check-in")).trim() || "check-in",
    reminder: normalizeHabitReminder(habit?.reminder ?? fallback?.reminder),
    archived: Boolean(habit?.archived),
    deletedAt: habit?.deletedAt || null,
    createdAt: habit?.createdAt || now,
    updatedAt: habit?.updatedAt || habit?.createdAt || now,
  };
}

export function normalizeHabits(value) {
  const source = Array.isArray(value) ? value : DEFAULT_HABITS;
  const seen = new Set();
  return source.map(normalizeHabit).filter(h => {
    if (!h.id || seen.has(h.id)) return false;
    seen.add(h.id);
    return !h.deletedAt;
  });
}

export function habitNameWithCopySuffix(name, habits = []) {
  const base = String(name || "New Habit").trim() || "New Habit";
  const names = new Set(normalizeHabits(habits).map(h => String(h.name || "").trim().toLowerCase()).filter(Boolean));
  if (!names.has(base.toLowerCase())) return base;
  let i = 2;
  while (names.has(`${base} ${i}`.toLowerCase())) i += 1;
  return `${base} ${i}`;
}

export function habitFromTemplate(template, habits = []) {
  const now = new Date().toISOString();
  return normalizeHabit({
    id: `habit-${template.id}-${uid()}`,
    templateId: template.id,
    name: habitNameWithCopySuffix(template.name, habits),
    emoji: template.emoji,
    category: template.category,
    frequency: template.frequency,
    repeatDays: template.repeatDays,
    targetCount: template.targetCount,
    unit: template.unit,
    reminder: template.reminder,
    archived: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  });
}

export function normalizeHabitCompletion(completion) {
  const now = new Date().toISOString();
  const count = Math.max(0, Math.min(999, Number(completion?.count || (completion?.completedAt ? 1 : 0)) || 0));
  return {
    id: String(completion?.id || `${completion?.habitId || "habit"}:${completion?.date || dateKey(TODAY)}`),
    habitId: String(completion?.habitId || ""),
    date: String(completion?.date || dateKey(TODAY)),
    count,
    completedAt: completion?.completedAt || (count > 0 ? now : null),
    note: String(completion?.note || ""),
    createdAt: completion?.createdAt || now,
    updatedAt: completion?.updatedAt || completion?.createdAt || now,
  };
}

export function normalizeHabitCompletions(value) {
  const source = Array.isArray(value) ? value : [];
  const map = new Map();
  source.map(normalizeHabitCompletion).filter(c => c.habitId && c.date).forEach(c => {
    const prev = map.get(c.id);
    if (!prev || new Date(c.updatedAt || 0) >= new Date(prev.updatedAt || 0)) map.set(c.id, c);
  });
  return [...map.values()];
}

export function habitRunsOnDate(habit, date = TODAY) {
  if (!habit || habit.archived || habit.deletedAt) return false;
  const days = Array.isArray(habit.repeatDays) ? habit.repeatDays.map(Number) : [0,1,2,3,4,5,6];
  return days.includes(dayStart(date).getDay());
}

export function habitCompletionFor(completions, habitId, date = TODAY) {
  const key = dateKey(date);
  return (Array.isArray(completions) ? completions : []).find(c => c.habitId === habitId && c.date === key) || null;
}

export function habitProgress(habit, completions, date = TODAY) {
  const completion = habitCompletionFor(completions, habit.id, date);
  const target = Math.max(1, Number(habit.targetCount || 1));
  const count = Math.max(0, Number(completion?.count || 0));
  const completed = count >= target;
  return { completion, count, target, percent: Math.min(100, Math.round(count / target * 100)), completed };
}

export function habitStreak(habit, completions, fromDate = TODAY) {
  const all = normalizeHabitCompletions(completions);
  let streak = 0;
  let cursor = dayStart(fromDate);
  for (let i = 0; i < 370; i++) {
    if (!habitRunsOnDate(habit, cursor)) { cursor = addDaysSafe(cursor, -1); continue; }
    const progress = habitProgress(habit, all, cursor);
    if (!progress.completed) break;
    streak += 1;
    cursor = addDaysSafe(cursor, -1);
  }
  return streak;
}
