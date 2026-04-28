-- ============================================================
-- Admin flag + policies
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Admins can read all tenancies (existing policy only allows own)
CREATE POLICY "tenancies_admin_read" ON tenancies
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admins can update any tenancy (to verify/reject)
CREATE POLICY "tenancies_admin_update" ON tenancies
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ============================================================
-- Storage policies for tenancy-agreements bucket
-- Run AFTER creating the bucket in the Supabase dashboard
-- ============================================================

-- Owners can upload to their own folder
CREATE POLICY "tenancy_agreements_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tenancy-agreements'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Owners can read their own files
CREATE POLICY "tenancy_agreements_owner_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'tenancy-agreements'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can read all files (needed to generate signed URLs)
CREATE POLICY "tenancy_agreements_admin_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'tenancy-agreements'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
