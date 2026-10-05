-- "deep web" pointed at cat_id 14, a category that no longer exists, so it never showed.
-- Put it under "internet" and file the three deep/dark web articles there
-- (they were sitting under "surface web").
UPDATE sub_category SET cat_id = (SELECT cat_id FROM category WHERE cat_name = 'internet' LIMIT 1)
WHERE sub_cat_name = 'deep web';

UPDATE post SET sub_cat_id = (SELECT sub_cat_id FROM (SELECT sub_cat_id FROM sub_category WHERE sub_cat_name = 'deep web' LIMIT 1) d)
WHERE uri IN (
  'surface-web-vs-deep-web-vs-dark-web-guide',
  'is-dark-web-legal-country-legal-breakdown-censorship-security-guide',
  'tor-network-onion-routing-encryption-technical-setup-guide'
);
