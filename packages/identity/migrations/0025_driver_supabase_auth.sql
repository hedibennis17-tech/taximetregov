-- TAXIMÈTRE.GOV — Driver Supabase Auth integration
-- This migration links Supabase Auth identities to the existing application
-- identity model. It grants driver-level access only to the authenticated
-- driver's own records and never exposes provider credentials.

CREATE OR REPLACE FUNCTION public.handle_driver_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_email text;
  first_name_value varchar(100);
  last_name_value varchar(100);
  province_value varchar(10);
  language_value language;
BEGIN
  normalized_email := lower(trim(NEW.email));
  first_name_value := left(coalesce(nullif(trim(NEW.raw_user_meta_data ->> 'first_name'), ''), 'Chauffeur'), 100);
  last_name_value := left(coalesce(nullif(trim(NEW.raw_user_meta_data ->> 'last_name'), ''), 'Nouveau'), 100);
  province_value := upper(left(coalesce(nullif(trim(NEW.raw_user_meta_data ->> 'province'), ''), 'QC'), 10));
  language_value := CASE
    WHEN lower(NEW.raw_user_meta_data ->> 'language') = 'en' THEN 'en'::language
    ELSE 'fr'::language
  END;

  INSERT INTO public.users (
    id, public_id, user_type, status, email, email_verified_at, password_hash
  ) VALUES (
    NEW.id,
    'DRV-' || upper(substr(replace(NEW.id::text, '-', ''), 1, 8)),
    'DRIVER',
    CASE WHEN NEW.email_confirmed_at IS NULL THEN 'PENDING' ELSE 'ACTIVE' END,
    normalized_email,
    NEW.email_confirmed_at,
    NULL
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      email_verified_at = EXCLUDED.email_verified_at,
      status = CASE
        WHEN public.users.status = 'PENDING' AND EXCLUDED.email_verified_at IS NOT NULL THEN 'ACTIVE'::user_status
        ELSE public.users.status
      END,
      updated_at = now();

  INSERT INTO public.driver_profiles (
    user_id, driver_number, status, first_name, last_name, province, country, language
  ) VALUES (
    NEW.id,
    'DR-' || upper(substr(replace(NEW.id::text, '-', ''), 1, 8)),
    CASE WHEN NEW.email_confirmed_at IS NULL THEN 'PENDING' ELSE 'ACTIVE' END,
    first_name_value,
    last_name_value,
    province_value,
    'CA',
    language_value
  )
  ON CONFLICT (user_id) DO UPDATE
  SET first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      province = EXCLUDED.province,
      language = EXCLUDED.language,
      status = CASE
        WHEN public.driver_profiles.status = 'PENDING' AND NEW.email_confirmed_at IS NOT NULL THEN 'ACTIVE'::driver_status
        ELSE public.driver_profiles.status
      END,
      updated_at = now();

  INSERT INTO public.user_roles (user_id, role_id)
  SELECT NEW.id, roles.id
  FROM public.roles
  WHERE roles.name = 'DRIVER'
  ON CONFLICT (user_id, role_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_driver_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET email = lower(trim(NEW.email)),
      email_verified_at = NEW.email_confirmed_at,
      status = CASE
        WHEN status = 'PENDING' AND NEW.email_confirmed_at IS NOT NULL THEN 'ACTIVE'::user_status
        ELSE status
      END,
      updated_at = now()
  WHERE id = NEW.id;

  UPDATE public.driver_profiles
  SET status = CASE
        WHEN status = 'PENDING' AND NEW.email_confirmed_at IS NOT NULL THEN 'ACTIVE'::driver_status
        ELSE status
      END,
      updated_at = now()
  WHERE user_id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.deactivate_driver_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET status = 'DISABLED', deleted_at = now(), updated_at = now()
  WHERE id = OLD.id;
  UPDATE public.driver_profiles
  SET status = 'DEACTIVATED', deleted_at = now(), updated_at = now()
  WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_driver_auth_user_created ON auth.users;
CREATE TRIGGER on_driver_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_driver_auth_user();

DROP TRIGGER IF EXISTS on_driver_auth_user_updated ON auth.users;
CREATE TRIGGER on_driver_auth_user_updated
AFTER UPDATE OF email, email_confirmed_at ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.sync_driver_auth_user();

DROP TRIGGER IF EXISTS on_driver_auth_user_deleted ON auth.users;
CREATE TRIGGER on_driver_auth_user_deleted
AFTER DELETE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.deactivate_driver_auth_user();

DROP POLICY IF EXISTS driver_read_own_user ON public.users;
CREATE POLICY driver_read_own_user ON public.users
FOR SELECT TO authenticated
USING (id = auth.uid() AND user_type = 'DRIVER' AND deleted_at IS NULL);

DROP POLICY IF EXISTS driver_read_own_profile ON public.driver_profiles;
CREATE POLICY driver_read_own_profile ON public.driver_profiles
FOR SELECT TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS driver_read_own_presence ON public.driver_presences;
CREATE POLICY driver_read_own_presence ON public.driver_presences
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.driver_profiles
    WHERE driver_profiles.id = driver_presences.driver_id
      AND driver_profiles.user_id = auth.uid()
      AND driver_profiles.deleted_at IS NULL
  )
);

DROP POLICY IF EXISTS driver_read_own_activities ON public.driver_activities;
CREATE POLICY driver_read_own_activities ON public.driver_activities
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.driver_profiles
    WHERE driver_profiles.id = driver_activities.driver_id
      AND driver_profiles.user_id = auth.uid()
      AND driver_profiles.deleted_at IS NULL
  )
);

DROP POLICY IF EXISTS driver_read_own_provider_accounts ON public.driver_provider_accounts;
CREATE POLICY driver_read_own_provider_accounts ON public.driver_provider_accounts
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.driver_profiles
    WHERE driver_profiles.id = driver_provider_accounts.driver_id
      AND driver_profiles.user_id = auth.uid()
      AND driver_profiles.deleted_at IS NULL
  )
);

DROP POLICY IF EXISTS driver_read_active_providers ON public.providers;
CREATE POLICY driver_read_active_providers ON public.providers
FOR SELECT TO authenticated
USING (provider_status = 'ACTIVE');

CREATE OR REPLACE FUNCTION public.set_my_driver_presence(
  requested_status driver_presence_status,
  requested_location_label varchar DEFAULT NULL
)
RETURNS public.driver_presences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_driver_id uuid;
  result_row public.driver_presences;
BEGIN
  SELECT id INTO current_driver_id
  FROM public.driver_profiles
  WHERE user_id = auth.uid()
    AND status = 'ACTIVE'
    AND deleted_at IS NULL;

  IF current_driver_id IS NULL THEN
    RAISE EXCEPTION 'Compte chauffeur actif requis';
  END IF;

  INSERT INTO public.driver_presences (
    driver_id, status, location_label, last_online_at, last_offline_at, updated_at
  ) VALUES (
    current_driver_id,
    requested_status,
    nullif(trim(requested_location_label), ''),
    CASE WHEN requested_status = 'ONLINE' THEN now() ELSE NULL END,
    CASE WHEN requested_status = 'OFFLINE' THEN now() ELSE NULL END,
    now()
  )
  ON CONFLICT (driver_id) DO UPDATE
  SET status = EXCLUDED.status,
      location_label = EXCLUDED.location_label,
      last_online_at = CASE WHEN EXCLUDED.status = 'ONLINE' THEN now() ELSE driver_presences.last_online_at END,
      last_offline_at = CASE WHEN EXCLUDED.status = 'OFFLINE' THEN now() ELSE driver_presences.last_offline_at END,
      updated_at = now()
  RETURNING * INTO result_row;

  RETURN result_row;
END;
$$;

REVOKE ALL ON FUNCTION public.set_my_driver_presence(driver_presence_status, varchar) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_my_driver_presence(driver_presence_status, varchar) TO authenticated;
