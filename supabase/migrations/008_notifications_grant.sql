-- Migration 001 ran GRANT SELECT ON ALL TABLES before the notifications table
-- existed, so authenticated/anon never received the base SELECT privilege.
-- Without it, RLS policies never evaluate and every query returns 0 rows.
GRANT SELECT ON notifications TO anon, authenticated;
