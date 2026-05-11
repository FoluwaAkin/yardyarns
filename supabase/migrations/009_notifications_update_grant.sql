-- Migration 001 granted UPDATE ON ALL TABLES before the notifications table
-- existed. Migration 008 fixed SELECT but missed UPDATE, so markAllRead()
-- silently fails because authenticated role has no UPDATE privilege.
GRANT UPDATE ON notifications TO authenticated;
