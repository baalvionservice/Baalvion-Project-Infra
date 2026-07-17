-- Rollback 033: remove the platform-wide access tier rows (and anyone's membership in them)
SET search_path TO community, public;
DELETE FROM community.community_memberships WHERE community_id IN (
    SELECT id FROM community.communities WHERE slug IN ('marketplace-access', 'global-elite')
);
DELETE FROM community.communities WHERE slug IN ('marketplace-access', 'global-elite');
