// Client-only calendar presentation helpers extracted from TempoApp.
// Keep this module pure so UI refactors do not change calendar mechanics.

export const CALENDAR_COLOR_PRESETS = [
  "#FF7BAC", "#B08AE0", "#70C8A0", "#A0C8E0", "#FFB870",
  "#D989A2", "#C060A0", "#7C8FE8", "#5FB8A8", "#F2A65A",
  "#CB416B", "#8E6AD8",
];

export const cleanCalendarColor = value => /^#[0-9a-f]{6}$/i.test(String(value || "")) ? String(value).toUpperCase() : "#FF7BAC";

export const EVENT_TEMPLATES = [
  { id: "meeting", label: "Meeting", emoji: "💬", title: "Meeting", minutes: 30, category: "meeting", color: "#FF7BAC", notes: "" },
  { id: "deep-work", label: "Deep Work", emoji: "🎯", title: "Deep Work", minutes: 90, category: "important", color: "#B08AE0", notes: "Protected focus block." },
  { id: "personal", label: "Personal", emoji: "🌿", title: "Personal Time", minutes: 60, category: "personal", color: "#70C8A0", notes: "" },
  { id: "exercise", label: "Exercise", emoji: "🏃", title: "Exercise", minutes: 45, category: "wellness", color: "#70C8A0", notes: "" },
  { id: "admin", label: "Admin", emoji: "🧾", title: "Admin Block", minutes: 45, category: "light", color: "#A0C8E0", notes: "Clear small tasks and follow-ups." },
];

export const calendarEventSource = (event, calendar) => event?.source === "habit" ? "habit" : (event?.source === "google" || calendar?.source === "google" ? "google" : "tempo");
export const calendarSourceLabel = source => source === "google" ? "Google" : source === "habit" ? "Habit" : "Tempo";
export const calendarSourceIcon = source => source === "google" ? "G" : source === "habit" ? "🌱" : "T";
export const calendarEventReadOnly = event => Boolean(event?.readOnly || event?.source === "google" || event?.source === "habit");
