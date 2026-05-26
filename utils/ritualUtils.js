import {
  DEFAULT_RITUALS,
  RITUAL_REMINDER_PRESETS,
} from "../constants/tempoConstants.js";
import {
  TODAY,
  dateKey,
  dayStart,
  uid,
} from "../lib/tempo/core.js";
import { validTimeString } from "./dateUtils.js";

export function normalizeRitualReminder(reminder) {
  if (reminder === null) return { type: "none", minutesBefore: null };
  if (typeof reminder === "number") return reminder < 0 ? { type: "none", minutesBefore: null } : { type: "minutes", minutesBefore: reminder };
  if (!reminder) return { type: "at", minutesBefore: 0 };
  const type = reminder.type || reminder.mode || reminder.id || "at";
  if (type === "none") return { type: "none", minutesBefore: null };
  if (type === "at") return { type: "at", minutesBefore: 0 };
  const minutes = Number(reminder.minutesBefore ?? reminder.minutes ?? reminder.offsetMinutes ?? reminder.value ?? 15);
  return { type: type === "custom" ? "custom" : "minutes", minutesBefore: Math.max(0, Number.isFinite(minutes) ? minutes : 15) };
}

export function ritualReminderPresetId(reminder) {
  const r = normalizeRitualReminder(reminder);
  if (r.type === "none") return "none";
  if (r.minutesBefore === 0) return "at";
  const match = RITUAL_REMINDER_PRESETS.find(p => p.minutesBefore === r.minutesBefore && !["custom", "none", "at"].includes(p.id));
  return match?.id || "custom";
}

export function normalizeRitualStep(step, index = 0) {
  if (typeof step === "string") return { id: `step-${index + 1}`, text: step.trim() || `Step ${index + 1}` };
  return {
    id: String(step?.id || `step-${index + 1}`).trim() || `step-${index + 1}`,
    text: String(step?.text || step?.label || `Step ${index + 1}`).trim() || `Step ${index + 1}`,
  };
}

export function normalizeRitual(ritual, index = 0) {
  const now = new Date().toISOString();
  const fallback = DEFAULT_RITUALS[index % DEFAULT_RITUALS.length] || DEFAULT_RITUALS[0];
  const repeatDays = Array.isArray(ritual?.repeatDays) ? ritual.repeatDays.map(Number).filter(d => d >= 0 && d <= 6) : (fallback?.repeatDays || [1,2,3,4,5]);
  const rawSteps = Array.isArray(ritual?.steps) && ritual.steps.length ? ritual.steps : (fallback?.steps || []);
  return {
    id: String(ritual?.id || `ritual-${uid()}`),
    name: String(ritual?.name || fallback?.name || "New Ritual").trim() || "New Ritual",
    templateId: ritual?.templateId ? String(ritual.templateId) : (fallback?.templateId ? String(fallback.templateId) : null),
    emoji: String(ritual?.emoji || fallback?.emoji || "🕯️").trim() || "🕯️",
    category: String(ritual?.category || fallback?.category || "personal"),
    steps: rawSteps.map(normalizeRitualStep),
    estimatedMinutes: Math.max(1, Math.min(360, Number(ritual?.estimatedMinutes || ritual?.duration || fallback?.estimatedMinutes || 15))),
    scheduledTime: validTimeString(ritual?.scheduledTime || ritual?.time || fallback?.scheduledTime || "08:30", "08:30"),
    repeatDays: repeatDays.length ? [...new Set(repeatDays)].sort((a,b) => a-b) : [1,2,3,4,5],
    reminder: normalizeRitualReminder(ritual?.reminder ?? fallback?.reminder),
    color: /^#[0-9a-f]{6}$/i.test(String(ritual?.color || "")) ? ritual.color : (fallback?.color || "#FF7BAC"),
    archived: Boolean(ritual?.archived),
    deletedAt: ritual?.deletedAt || null,
    createdAt: ritual?.createdAt || now,
    updatedAt: ritual?.updatedAt || ritual?.createdAt || now,
  };
}

export function ritualNameWithCopySuffix(name, rituals = []) {
  const base = String(name || "New Ritual").trim() || "New Ritual";
  const names = new Set(normalizeRituals(rituals).map(r => String(r.name || "").trim().toLowerCase()).filter(Boolean));
  if (!names.has(base.toLowerCase())) return base;
  let i = 2;
  while (names.has(`${base} ${i}`.toLowerCase())) i += 1;
  return `${base} ${i}`;
}

export function ritualFromTemplate(template, rituals = []) {
  const now = new Date().toISOString();
  return normalizeRitual({
    id: `ritual-${template.id}-${uid()}`,
    templateId: template.id,
    name: ritualNameWithCopySuffix(template.name, rituals),
    emoji: template.emoji,
    category: template.category,
    steps: (template.steps || []).map((text, i) => ({ id: `step-${i + 1}-${uid()}`, text })),
    estimatedMinutes: template.estimatedMinutes,
    scheduledTime: template.scheduledTime,
    repeatDays: template.repeatDays,
    reminder: template.reminder,
    color: template.color,
    archived: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  });
}

export function normalizeRituals(value) {
  const source = Array.isArray(value) ? value : DEFAULT_RITUALS;
  const seen = new Set();
  return source.map(normalizeRitual).filter(r => {
    if (!r.id || seen.has(r.id)) return false;
    seen.add(r.id);
    return !r.deletedAt;
  });
}

export function normalizeRitualCompletion(completion) {
  const now = new Date().toISOString();
  return {
    id: String(completion?.id || `${completion?.ritualId || "ritual"}:${completion?.date || dateKey(TODAY)}`),
    ritualId: String(completion?.ritualId || ""),
    date: String(completion?.date || dateKey(TODAY)),
    completedSteps: Array.isArray(completion?.completedSteps) ? completion.completedSteps.map(String) : [],
    completedAt: completion?.completedAt || null,
    skippedAt: completion?.skippedAt || null,
    note: String(completion?.note || ""),
    createdAt: completion?.createdAt || now,
    updatedAt: completion?.updatedAt || completion?.createdAt || now,
  };
}

export function normalizeRitualCompletions(value) {
  const source = Array.isArray(value) ? value : [];
  const map = new Map();
  source.map(normalizeRitualCompletion).filter(c => c.ritualId && c.date).forEach(c => {
    const prev = map.get(c.id);
    if (!prev || new Date(c.updatedAt || 0) >= new Date(prev.updatedAt || 0)) map.set(c.id, c);
  });
  return [...map.values()];
}

export function ritualRunsOnDate(ritual, date = TODAY) {
  if (!ritual || ritual.archived || ritual.deletedAt) return false;
  const repeatDays = Array.isArray(ritual.repeatDays) ? ritual.repeatDays.map(Number) : [];
  return repeatDays.includes(dayStart(date).getDay());
}

export function ritualCompletionFor(completions, ritualId, date = TODAY) {
  const key = dateKey(date);
  return (Array.isArray(completions) ? completions : []).find(c => c.ritualId === ritualId && c.date === key) || null;
}

export function ritualProgress(ritual, completions, date = TODAY) {
  const completion = ritualCompletionFor(completions, ritual.id, date);
  const total = Math.max(1, ritual.steps?.length || 0);
  const done = completion?.skippedAt ? 0 : (completion?.completedSteps || []).filter(id => ritual.steps.some(s => s.id === id)).length;
  return { completion, done, total, percent: Math.min(100, Math.round(done / total * 100)), completed: Boolean(completion?.completedAt), skipped: Boolean(completion?.skippedAt) };
}
