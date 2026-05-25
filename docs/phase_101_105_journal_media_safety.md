# Phase 101–105 Journal Media Safety Notes

This phase improves how Tempo handles Journal photos without changing the user-facing journal mechanics.

## Save/delete order

Tempo continues to follow the safer order:

1. Prepare/compress selected images locally.
2. Upload pending photos.
3. Save the memory entry.
4. Delete removed photos only after the memory save succeeds.
5. If deletion fails, queue paths for retry instead of forgetting them.

## Cleanup queue

The cleanup queue is stored locally per Tempo user key. It is used only for failed storage cleanup attempts, such as:

- removed photo deletion failed after a successful memory save
- newly uploaded photo rollback failed after a memory save error

Queued paths are deduped, retried later, and removed after successful deletion.

## No SQL changes

This phase does not require a new Supabase table. The existing private `memory-images` storage bucket is still used.
