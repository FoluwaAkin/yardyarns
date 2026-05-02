-- SECURITY DEFINER function so the admin can link reviews across the RLS boundary.
-- Called by verifyTenancy() after setting verification_status = 'verified'.
CREATE OR REPLACE FUNCTION link_reviews_to_tenancy(
  p_tenancy_id uuid,
  p_user_id    uuid,
  p_unit_id    uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE reviews
  SET tenancy_id = p_tenancy_id
  WHERE user_id   = p_user_id
    AND unit_id   = p_unit_id
    AND tenancy_id IS NULL;
END;
$$;

-- One-time retroactive fix: link existing unlinked reviews to any verified tenancy
-- for the same user+unit. Run once in the Supabase SQL editor.
-- (Safe to run multiple times — only touches rows where tenancy_id IS NULL.)
UPDATE reviews r
SET tenancy_id = t.id
FROM tenancies t
WHERE t.user_id              = r.user_id
  AND t.unit_id              = r.unit_id
  AND t.verification_status  = 'verified'
  AND r.tenancy_id           IS NULL;
