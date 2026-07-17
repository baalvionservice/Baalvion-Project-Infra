-- Migration 033: Platform-wide access tiers (Marketplace Access / Global Elite Access)
-- Run once against baalvion_db after migration 032.
--
-- Modeled as two special "communities" (no NodeBB category — nodebb_cid stays NULL) reusing
-- the exact same paid-membership/checkout/fulfill machinery built for per-community paid
-- tiers (031/032). "Community" here just means "a thing a user can have paid/approved access
-- to" — the marketplace-access gate and the elite tier fit that model without inventing a
-- parallel membership system. The Next.js app's /access page checks membership status against
-- these two slugs directly (getCommunity('marketplace-access') / getCommunity('global-elite')).

SET search_path TO community, public;

INSERT INTO community.communities (slug, name, description, access_model, price_usd_cents) VALUES
    ('marketplace-access', 'Marketplace Access', 'Full access to the global marketplace: browse listings, buy and sell, regional trade nodes, escrow transactions, trade dashboard, wallet integration.', 'paid', 10000),
    ('global-elite', 'Global Elite Access', 'Everything in Marketplace Access, plus community forums, private trading channels, premium intelligence reports, verified vendor directory, early access, and VIP status.', 'paid', 25000)
ON CONFLICT (slug) DO UPDATE SET
    price_usd_cents = EXCLUDED.price_usd_cents,
    description = EXCLUDED.description;
