-- ============================================================
-- Email Notifications: store email in profiles for lookup
-- Removes the need for SUPABASE_SERVICE_ROLE_KEY in Next.js
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- Backfill existing users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Keep email in sync when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    new.id,
    COALESCE(
      NULLIF(TRIM(new.raw_user_meta_data->>'username'), ''),
      SPLIT_PART(new.email, '@', 1)
    ),
    new.email
  );
  RETURN new;
END;
$$;

-- Keep email in sync when a user updates their email address
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE sync_profile_email();

-- SECURITY DEFINER helper: lets authenticated server actions look up any
-- user's email without requiring SUPABASE_SERVICE_ROLE_KEY in Next.js
CREATE OR REPLACE FUNCTION get_notification_email(p_user_id uuid)
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT email FROM public.profiles WHERE id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION get_notification_email TO authenticated;
