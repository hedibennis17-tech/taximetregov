-- TAXIMÈTRE.GOV — Supabase defence-in-depth
-- All application tables live in the public schema. RLS is enabled by default
-- so only trusted server-side connections or explicit future policies can read
-- or mutate data. No permissive client policy is introduced by this migration.

DO $$
DECLARE
  current_table record;
BEGIN
  FOR current_table IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '__drizzle_migrations'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', current_table.tablename);
  END LOOP;
END
$$;
