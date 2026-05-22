// Tempo data schema reference for the next refactor phase.
// This file is intentionally documentation-only for now.
// Keep the running app logic inside components/TempoApp.jsx until the next component-level split is tested.

export const SCHEMA_NOTES = {
  Event: {
    shape: "{ id, title, start, end, calendar, category, fixed, color, notes, recurrence, allDay }",
    notes: "start/end are Date objects in memory and serialized when persisted.",
  },
  Task: {
    shape: "{ id, title, duration, category, scope, done, priority, dayKey, weekKey, monthKey, recurrence }",
    notes: "Day/week/month tasks are period-strict and should retain their period keys.",
  },
  MemoryEntry: {
    shape: "{ mood, activities, note, gratitude, photos, tags, backgroundId, highlights, blocks, updatedAt }",
    notes: "Persisted encrypted in settings.journal. Photos should store metadata/paths, not base64.",
  },
  MemoryPhoto: {
    shape: "{ id, storagePath, thumbStoragePath, bucket, caption, name, createdAt }",
    notes: "Signed URLs are generated for display and should not be saved as source of truth.",
  },
  MemoryBlock: {
    shape: "{ id, type, text, photoIds, caption, sticker, stickerAsset, size }",
    notes: "Scrapbook blocks are ordered content blocks in each Memory Entry.",
  },
  UserSettings: {
    shape: "{ fontSize, darkMode, theme, workStart, workEnd, notifs, pushEnabled, notificationPreferences, timezone, categories, templates, journalActivities, memoryTags }",
    notes: "User-scoped. Do not hydrate across accounts. notificationPreferences controls event/task/ritual/habit and scheduled lifestyle reminders.",
  },
};
