-- Article bodies still linked to URLs that moved (see 005/006); point them at the real ones.
UPDATE post SET post_desc = REPLACE(post_desc, '/seo/seo/how-to-do-keyword-research', '/seo/web-seo/how-to-do-keyword-research')
WHERE post_desc LIKE '%/seo/seo/how-to-do-keyword-research%';
UPDATE post SET post_desc = REPLACE(post_desc, '/internet/surface-web/surface-web-vs-deep-web-vs-dark-web-guide', '/internet/deep-web/surface-web-vs-deep-web-vs-dark-web-guide')
WHERE post_desc LIKE '%/internet/surface-web/surface-web-vs-deep-web-vs-dark-web-guide%';
UPDATE post SET post_desc = REPLACE(post_desc, '/internet/surface-web/tor-network-onion-routing-encryption-technical-setup-guide', '/internet/deep-web/tor-network-onion-routing-encryption-technical-setup-guide')
WHERE post_desc LIKE '%/internet/surface-web/tor-network-onion-routing-encryption-technical-setup-guide%';
UPDATE post SET post_desc = REPLACE(post_desc, '/internet/surface-web/is-dark-web-legal-country-legal-breakdown-censorship-security-guide', '/internet/deep-web/is-dark-web-legal-country-legal-breakdown-censorship-security-guide')
WHERE post_desc LIKE '%/internet/surface-web/is-dark-web-legal-country-legal-breakdown-censorship-security-guide%';
