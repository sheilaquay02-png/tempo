// Sync data boundary for the future TempoApp split.
// Keep these as re-exports for now so behavior remains identical while tests can
// target the sync layer without importing the entire UI component.
export {
  mergeTempoData,
  mergeRecordsById,
  mergeDeletedRecords,
  normalizeDeletedRecordsForMerge,
  pruneDeletedRecords,
  normalizeSyncConflictLog,
  syncDatasetCounts,
  reviveEvents,
  normalizeTasks,
} from "../core.js";
