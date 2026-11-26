-- Undo for supabase/user_data_history_setup.sql.
-- Removes the automatic history trigger and function. The history table is
-- KEPT so no saved versions are lost; drop it separately only if you are sure:
--   drop table if exists public.user_data_history;

drop trigger if exists user_data_keep_history on public.user_data;
drop function if exists public.archive_user_data_version();
