-- Government users are activated exclusively by the protected application route
-- after Supabase Auth reports an AAL2 MFA session.

CREATE OR REPLACE FUNCTION public.sync_driver_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(NEW.raw_user_meta_data ->> 'account_scope', 'DRIVER') = 'GOVERNMENT' THEN
    RETURN NEW;
  END IF;

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

  IF coalesce(OLD.raw_user_meta_data ->> 'account_scope', 'DRIVER') <> 'GOVERNMENT' THEN
    UPDATE public.driver_profiles
    SET status = 'DEACTIVATED'::driver_status, deleted_at = now(), updated_at = now()
    WHERE user_id = OLD.id;
  END IF;

  RETURN OLD;
END;
$$;
