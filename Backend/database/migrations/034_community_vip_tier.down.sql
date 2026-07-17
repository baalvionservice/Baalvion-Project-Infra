-- Rollback 034: remove the VIP tier (and anyone's membership in it)
SET search_path TO community, public;
DELETE FROM community.community_memberships WHERE community_id IN (
    SELECT id FROM community.communities WHERE slug = 'vip-access'
);
DELETE FROM community.communities WHERE slug = 'vip-access';
