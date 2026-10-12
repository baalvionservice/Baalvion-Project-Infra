-- Self-declared gender (optional), Elite party free invitations, and member-submitted events.
-- sync({ alter: false }) never alters an existing table, so this is applied by hand. Safe to re-run.
ALTER TABLE community.member_profiles ADD COLUMN IF NOT EXISTS gender varchar(12);
ALTER TABLE community.elite_host_applications ADD COLUMN IF NOT EXISTS ladies_free boolean NOT NULL DEFAULT false;
ALTER TABLE community.elite_host_guests ADD COLUMN IF NOT EXISTS free_invite boolean NOT NULL DEFAULT false;
ALTER TABLE community.club_events ADD COLUMN IF NOT EXISTS submitted_by varchar(64);
ALTER TABLE community.club_events ADD COLUMN IF NOT EXISTS ticket_price_text varchar(60);
ALTER TYPE community.enum_club_events_status ADD VALUE IF NOT EXISTS 'pending_review';
ALTER TYPE community.enum_club_events_status ADD VALUE IF NOT EXISTS 'rejected';
