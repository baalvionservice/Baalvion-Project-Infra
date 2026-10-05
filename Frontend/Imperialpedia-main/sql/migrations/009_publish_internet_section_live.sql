-- 009: publish the internet section (surface web + deep web) on the LIVE database.
-- Live has all 6 internet posts as status='removed' and "deep web" attached to a deleted category (14).
-- Run in phpMyAdmin on legacy_imperialpedia. Safe to run twice. Backs up post/sub_category first.

CREATE TABLE IF NOT EXISTS bak_20261005b_post AS SELECT * FROM post;
CREATE TABLE IF NOT EXISTS bak_20261005b_sub_category AS SELECT * FROM sub_category;

-- 1. deep web belongs under "internet"
UPDATE sub_category SET cat_id = (SELECT cat_id FROM category WHERE cat_name = 'internet' LIMIT 1)
WHERE sub_cat_name = 'deep web' AND cat_id = 14;

-- 2. the three deep/dark web articles move out of "surface web" into it
UPDATE post SET sub_cat_id = (SELECT sub_cat_id FROM (SELECT sub_cat_id FROM sub_category WHERE sub_cat_name = 'deep web' LIMIT 1) d)
WHERE REPLACE(uri, ' ', '-') IN (
  'surface-web-vs-deep-web-vs-dark-web-guide',
  'tor-network-onion-routing-encryption-technical-setup-guide',
  'is-dark-web-legal-country-legal-breakdown-censorship-security-guide'
);

-- 3. publish every internet post
UPDATE post SET status = 'published'
WHERE cat_id = (SELECT cat_id FROM category WHERE cat_name = 'internet' LIMIT 1) AND status = 'removed';

-- check: expect deep web 3 published, surface web 3 published
SELECT s.sub_cat_name, p.status, COUNT(*) AS n
FROM post p JOIN sub_category s ON s.sub_cat_id = p.sub_cat_id
WHERE p.cat_id = (SELECT cat_id FROM category WHERE cat_name = 'internet' LIMIT 1)
GROUP BY s.sub_cat_name, p.status;
