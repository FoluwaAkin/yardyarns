-- Add media URLs array to posts
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS media_urls text[] NOT NULL DEFAULT '{}';

-- Storage bucket: create in Supabase dashboard
-- Name: post-media
-- Public: true
-- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp, video/mp4, video/webm, video/quicktime
-- File size limit: 50MB

-- RLS policies for post-media bucket (run in dashboard > Storage > Policies):
-- INSERT: (auth.uid()::text = (storage.foldername(name))[1])
-- SELECT: true  (public read)
-- DELETE: (auth.uid()::text = (storage.foldername(name))[1])
