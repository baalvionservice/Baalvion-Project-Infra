-- Platform-wide access tiers (marketplace-access/global-elite/vip-access) are modeled as
-- communities for shared membership/billing plumbing, but they are NOT discussion forums.
-- nodebb_cid can't distinguish them from real forums right now (NodeBB isn't deployed yet,
-- so every community — forum or tier — currently has nodebb_cid NULL). Add an explicit
-- column instead of relying on that coincidence.
ALTER TABLE community.communities
    ADD COLUMN IF NOT EXISTS is_platform_tier BOOLEAN NOT NULL DEFAULT false;

UPDATE community.communities
SET is_platform_tier = true
WHERE slug IN ('marketplace-access', 'global-elite', 'vip-access');
