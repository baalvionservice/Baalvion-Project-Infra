-- Migration 034: VIP Access tier ($1000) — third platform-wide access tier, above Marketplace
-- Access ($100) and Global Elite Access ($250). Same "paid community" model as 033.
-- Run once against baalvion_db after migration 033.

SET search_path TO community, public;

INSERT INTO community.communities (slug, name, description, access_model, price_usd_cents) VALUES
    ('vip-access', 'VIP Access', 'Everything in Global Elite Access, plus VIP-only trading rooms, dedicated account priority, the highest-tier vendor network, and first access to every future feature.', 'paid', 100000)
ON CONFLICT (slug) DO UPDATE SET
    price_usd_cents = EXCLUDED.price_usd_cents,
    description = EXCLUDED.description;

-- Elite's description previously said "VIP status" — that now belongs to this separate,
-- higher tier, so tighten Elite's copy to avoid implying it already includes VIP.
UPDATE community.communities
SET description = 'Everything in Marketplace Access, plus community forums, private trading channels, premium intelligence reports, verified vendor directory, and early marketplace access.'
WHERE slug = 'global-elite';
