// Journal/memory boundary for the future TempoApp split.
// This module intentionally reuses the existing core implementation to avoid
// changing memory encryption, photo storage, or saved entry behavior.
export {
  MEMORY_STORAGE_BUCKET,
  MEMORY_SIGNED_URL_SECONDS,
  MEMORY_IMAGE_LIMIT_PER_ENTRY,
  MEMORY_MAX_ORIGINAL_BYTES,
  MEMORY_MAX_IMAGE_EDGE,
  MEMORY_THUMB_IMAGE_EDGE,
  MEMORY_ENCRYPTION_VERSION,
  normalizeMemoryEntry,
  sanitizeMemoryPhotoForStorage,
  sanitizeMemoryEntryForStorage,
  sanitizeMemoryJournalForStorage,
  normalizeMemoryJournalForState,
  isEncryptedMemoryJournal,
  deriveMemoryCryptoKey,
  encryptMemoryJournalForStorage,
  decryptMemoryJournalFromStorage,
  saveJournalLocal,
  loadJournalLocal,
  memoryPhotoSrc,
  memoryEntryCover,
  memoryTagLabel,
  prepareJournalPhotosFromFiles,
} from "../core.js";
