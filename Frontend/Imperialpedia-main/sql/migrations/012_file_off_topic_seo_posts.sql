-- 012: three posts sat under "web seo" although they belong to Instagram SEO / YouTube SEO.
UPDATE post SET sub_cat_id = (SELECT sub_cat_id FROM sub_category WHERE sub_cat_name = 'instagram seo' LIMIT 1)
WHERE REPLACE(uri, ' ', '-') IN ('trick-and-strategy-to-rank-your-instagram-account', 'why-do-you-need-seo-on-instagram')
   OR post_title LIKE 'trick and strategy to%rank your instagram account%' OR post_title = 'why do you need seo on instagram';
UPDATE post SET sub_cat_id = (SELECT sub_cat_id FROM sub_category WHERE sub_cat_name = 'youtube seo' LIMIT 1)
WHERE post_title LIKE 'YouTube SEO Handbook: Rank #1 on YouTube%';
