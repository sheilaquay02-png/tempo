import {
  TODAY,
  dateRangeKeys,
  fmtDate,
  monthKey,
  weekDays,
  weekStart,
} from "../lib/tempo/core.js";

export function getTodayDate() {
  return TODAY;
}

export function formatDate(date) {
  return fmtDate(date);
}

export function getMonthKey(date) {
  return monthKey(date);
}

export function dateKeySetForLast(days, endDate = TODAY) {
  return new Set(dateRangeKeys(days - 1, 0).map(String));
}

export function weekDatesFor(date = TODAY) {
  return weekDays(weekStart(date));
}

export function validTimeString(value, fallback = "00:00") {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallback;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return fallback;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function timeStringToMinutes(value) {
  const [h, m] = validTimeString(value).split(":").map(Number);
  return Math.max(0, Math.min(24 * 60, h * 60 + m));
}

export function hourLabel(hour) {
  const h = Math.max(0, Math.min(23, Number(hour) || 0));
  const display = h % 12 || 12;
  return `${display}${h < 12 ? "am" : "pm"}`;
}
