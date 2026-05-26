import {
  DEFAULT_MEAL_BREAKS,
  DEFAULT_PLANNING_RULES,
  PLANNING_MODES,
} from "../constants/tempoConstants";
import { timeStringToMinutes, validTimeString } from "./dateUtils";

export function normalizePlanningRules(value) {
  const source = value && typeof value === "object" ? value : {};
  const clamp = (v, min, max, fb) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fb;
  };
  return {
    bufferMinutes: clamp(source.bufferMinutes, 0, 60, DEFAULT_PLANNING_RULES.bufferMinutes),
    maxPlanMinutes: clamp(source.maxPlanMinutes, 30, 720, DEFAULT_PLANNING_RULES.maxPlanMinutes),
    maxDeepWorkBlocks: clamp(source.maxDeepWorkBlocks, 0, 12, DEFAULT_PLANNING_RULES.maxDeepWorkBlocks),
    afterMealBufferMinutes: clamp(source.afterMealBufferMinutes, 0, 90, DEFAULT_PLANNING_RULES.afterMealBufferMinutes),
  };
}

export function normalizePlanningMode(mode) {
  return PLANNING_MODES.some(m => m.id === mode) ? mode : "normal";
}

export function planningModeForEnergy(energy) {
  if (energy === "low") return "light";
  if (energy === "high") return "productive";
  return "normal";
}

export function planningModeMeta(mode) {
  return PLANNING_MODES.find(m => m.id === normalizePlanningMode(mode)) || PLANNING_MODES[1];
}

export function applyPlanningModeToRules(baseRules, mode, energy) {
  const base = normalizePlanningRules(baseRules);
  const meta = planningModeMeta(mode);
  const energyBuffer = energy === "low" ? 10 : 0;
  const energyCapacityTrim = energy === "low" ? 30 : 0;
  const energyCapacityBonus = energy === "high" && meta.id === "productive" ? 30 : 0;
  return normalizePlanningRules({
    ...base,
    bufferMinutes: Math.min(60, base.bufferMinutes + (meta.bufferBonus || 0) + energyBuffer),
    maxPlanMinutes: Math.min(base.maxPlanMinutes, meta.maxPlanMinutes) - energyCapacityTrim + energyCapacityBonus,
    maxDeepWorkBlocks: Math.min(base.maxDeepWorkBlocks, meta.maxDeepWorkBlocks),
  });
}

export function normalizeMealBreaks(value) {
  const source = Array.isArray(value) && value.length ? value : DEFAULT_MEAL_BREAKS;
  const defaults = new Map(DEFAULT_MEAL_BREAKS.map(item => [item.id, item]));
  return source.map((item, index) => {
    const fallback = defaults.get(item?.id) || DEFAULT_MEAL_BREAKS[index] || { id: `meal-${index}`, label: "Meal", start: "12:00", end: "13:00", enabled: true };
    const start = validTimeString(item?.start, fallback.start);
    const end = validTimeString(item?.end, fallback.end);
    return {
      id: item?.id || fallback.id || `meal-${index}`,
      label: item?.label || fallback.label || "Meal",
      start,
      end: timeStringToMinutes(end) > timeStringToMinutes(start) ? end : fallback.end,
      enabled: item?.enabled !== false,
    };
  });
}
