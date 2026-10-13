-- Migration 036: Exclusive Member tier ($3000), above VIP Access. Same "paid community" model as 033/034.
SET search_path TO community, public;

INSERT INTO community.communities (slug, name, description, access_model, price_usd_cents, is_platform_tier) VALUES
    ('exclusive-member', 'Exclusive Member', 'Everything in VIP Access, plus the Exclusive Member badge, first invitations to new Elite parties and events, and a priority line to the Hell Road team.', 'paid', 300000, true)
ON CONFLICT (slug) DO UPDATE SET
    price_usd_cents = EXCLUDED.price_usd_cents,
    description = EXCLUDED.description,
    is_platform_tier = true;
