-- The driver_presences table was introduced after the global public-RLS migration.
-- Enable RLS explicitly so the driver_read_own_presence policy is enforced.
ALTER TABLE public.driver_presences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_presences FORCE ROW LEVEL SECURITY;
