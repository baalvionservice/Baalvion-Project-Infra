-- Platform user ids are numeric (auth.users.id is BIGINT). The forum, chat and direct-message tables
-- were created with UUID user columns before the models moved to STRING(64); sequelize.sync({ alter:false })
-- never alters existing tables, so those writes failed for real users. Idempotent: only touches uuid columns.
BEGIN;
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT table_name, column_name FROM information_schema.columns
     WHERE table_schema = 'community' AND data_type = 'uuid'
       AND (table_name, column_name) IN (
         ('community_chat_messages','user_id'),
         ('community_invites','invited_by_user_id'),
         ('community_join_requests','reviewed_by_user_id'),
         ('community_join_requests','user_id'),
         ('community_memberships','user_id'),
         ('community_moderation_logs','actor_user_id'),
         ('community_moderation_logs','target_user_id'),
         ('community_threads','author_user_id'),
         ('direct_conversations','user_a_id'),
         ('direct_conversations','user_b_id'),
         ('direct_messages','sender_id'))
  LOOP
    EXECUTE format('ALTER TABLE community.%I ALTER COLUMN %I TYPE varchar(64) USING %I::text', r.table_name, r.column_name, r.column_name);
    RAISE NOTICE 'converted %.%', r.table_name, r.column_name;
  END LOOP;
END $$;
COMMIT;
