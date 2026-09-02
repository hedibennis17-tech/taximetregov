-- Fix explicit enum casts in the Driver Auth bootstrap functions.
-- Kept additive because the initial auth migration is already recorded.

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

  INSERT INTO public.users (id, public_id, user_type, status, email, email_verified_at, password_hash)
  VALUES (
    NEW.id,
    'DRV-' || upper(substr(replace(NEW.id::text, '-', ''), 1, 8)),
    'DRIVER'::user_type,
    CASE WHEN NEW.email_confirmed_at IS NULL THEN 'PENDING'::user_status ELSE 'ACTIVE'::user_status END,
    normalized_email,
    NEW.email_confirmed_at,
    NULL
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      email_verified_at = EXCLUDED.email_verified_at,
      status = CASE
        WHEN public.users.status = 'PENDING'::user_status AND EXCLUDED.email_verified_at IS NOT NULL THEN 'ACTIVE'::user_status
        ELSE public.users.status
      END,
      updated_at = now();

  INSERT INTO public.driver_profiles (user_id, driver_number, status, first_name, last_name, province, country, language)
  VALUES (
    NEW.id,
    'DR-' || upper(substr(replace(NEW.id::text, '-', ''), 1, 8)),
    CASE WHEN NEW.email_confirmed_at IS NULL THEN 'PENDING'::driver_status ELSE 'ACTIVE'::driver_status END,
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
        WHEN public.driver_profiles.status = 'PENDING'::driver_status AND NEW.email_confirmed_at IS NOT NULL THEN 'ACTIVE'::driver_status
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
        WHEN status = 'PENDING'::user_status AND NEW.email_confirmed_at IS NOT NULL THEN 'ACTIVE'::user_status
        ELSE status
      END,
      updated_at = now()
  WHERE id = NEW.id;

  UPDATE public.driver_profiles
  SET status = CASE
        WHEN status = 'PENDING'::driver_status AND NEW.email_confirmed_at IS NOT NULL THEN 'ACTIVE'::driver_status
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
  SET status = 'DISABLED'::user_status, deleted_at = now(), updated_at = now()
  WHERE id = OLD.id;
  UPDATE public.driver_profiles
  SET status = 'DEACTIVATED'::driver_status, deleted_at = now(), updated_at = now()
  WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$;
