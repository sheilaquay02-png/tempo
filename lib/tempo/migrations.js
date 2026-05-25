// Explicit data migration boundary. This keeps migration behavior discoverable
// without changing the current TempoApp load/save mechanics.
import {
  DATA_MIGRATION_VERSION,
  reviveEvents,
  normalizeTasks,
  sanitizeTempoSettingsForMigration,
  normalizeMemoryJournalForState,
} from "./core.js";

export const CURRENT_TEMPO_DATA_VERSION = DATA_MIGRATION_VERSION;

export function migrateTempoDataShape(data = {}) {
  const settings = sanitizeTempoSettingsForMigration(data.settings || {});
  return {
    events: reviveEvents(data.events || []),
    tasks: normalizeTasks(data.tasks || []),
    settings: {
      ...settings,
      journal: normalizeMemoryJournalForState(settings.journal || {}),
      dataMigrationVersion: CURRENT_TEMPO_DATA_VERSION,
      migratedAt: settings.migratedAt || new Date().toISOString(),
    },
  };
}

export function needsTempoDataMigration(settings = {}) {
  return Number(settings?.dataMigrationVersion || 0) < CURRENT_TEMPO_DATA_VERSION;
}
