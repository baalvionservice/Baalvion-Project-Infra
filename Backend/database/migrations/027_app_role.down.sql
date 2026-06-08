-- 027_app_role.down.sql — dev rollback only.
-- In real environments, reassign/transfer owned objects before dropping the role.
-- The role is inert until RLS policies + a service .env cutover reference it.
DROP ROLE IF EXISTS baalvion_app;
