-- Add eagle personality avatar to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar text
  CHECK (avatar IN ('happy', 'sad', 'curious', 'excited', 'angry'))
  DEFAULT 'happy';
