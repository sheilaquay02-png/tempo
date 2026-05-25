// Small habit helpers used by tests and future reminder refactors.
// Existing UI behavior is preserved; these helpers mirror current completion
// semantics instead of changing the TempoApp component.

export function habitTargetCount(habit = {}) {
  return Math.max(1, Number(habit.targetCount || habit.target || 1) || 1);
}

export function habitCompletionCount(completion = {}) {
  return Math.max(0, Number(completion?.count || (completion?.completedAt ? 1 : 0)) || 0);
}

export function habitCompletionForDate(completions = [], habitId, date) {
  return (Array.isArray(completions) ? completions : []).find(item => item?.habitId === habitId && item?.date === date) || null;
}

export function habitIsCompleteForDate(habit = {}, completions = [], date) {
  const completion = habitCompletionForDate(completions, habit.id, date);
  return habitCompletionCount(completion) >= habitTargetCount(habit);
}

export function incrementHabitCompletion(habit = {}, completions = [], date, now = new Date()) {
  const target = habitTargetCount(habit);
  const list = Array.isArray(completions) ? completions : [];
  const existing = habitCompletionForDate(list, habit.id, date);
  const nextCount = Math.min(target, habitCompletionCount(existing) + 1);
  const next = {
    ...(existing || { id: `${habit.id}:${date}`, habitId: habit.id, date, createdAt: now.toISOString() }),
    count: nextCount,
    completedAt: nextCount >= target ? (existing?.completedAt || now.toISOString()) : (existing?.completedAt || null),
    updatedAt: now.toISOString(),
  };
  return existing ? list.map(item => item === existing || item.id === existing.id ? next : item) : [...list, next];
}
