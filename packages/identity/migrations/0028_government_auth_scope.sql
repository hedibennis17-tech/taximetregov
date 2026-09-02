-- Government Auth scope and authorization helpers.
-- Government invitations are provisioned only by the protected server route;
-- they must never create a driver profile through the public Auth trigger.

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
  IF coalesce(NEW.raw_user_meta_data ->> 'account_scope', 'DRIVER') = 'GOVERNMENT' THEN
    RETURN NEW;
  END IF;

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
  SELECT NEW.id, roles.id FROM public.roles WHERE roles.name = 'DRIVER'
  ON CONFLICT (user_id, role_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_active_government_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.user_roles ur ON ur.user_id = u.id AND ur.revoked_at IS NULL
    JOIN public.roles r ON r.id = ur.role_id
    WHERE u.id = auth.uid()
      AND u.user_type = 'GOVERNMENT'::user_type
      AND u.status = 'ACTIVE'::user_status
      AND u.deleted_at IS NULL
      AND r.name IN ('SUPER_ADMIN', 'GOV_ADMIN', 'GOV_AUDITOR', 'GOV_INSPECTOR', 'GOV_TAX_OFFICER')
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_government_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_government_user() TO authenticated;

DROP POLICY IF EXISTS government_read_own_user ON public.users;
CREATE POLICY government_read_own_user ON public.users
FOR SELECT TO authenticated
USING (id = auth.uid() AND user_type = 'GOVERNMENT'::user_type AND deleted_at IS NULL);

DROP POLICY IF EXISTS government_read_own_roles ON public.user_roles;
CREATE POLICY government_read_own_roles ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid() AND revoked_at IS NULL);

DROP POLICY IF EXISTS government_read_roles ON public.roles;
CREATE POLICY government_read_roles ON public.roles
FOR SELECT TO authenticated
USING (public.is_active_government_user());
