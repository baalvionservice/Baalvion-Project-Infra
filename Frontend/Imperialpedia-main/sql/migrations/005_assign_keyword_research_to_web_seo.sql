-- The "seo" sub-category row (id 100) points at cat_id 0, so its one post
-- had no valid category/sub-category URL. File it under "web seo".
UPDATE post SET sub_cat_id = (SELECT sub_cat_id FROM sub_category WHERE sub_cat_name = 'web seo' AND cat_id = 18 LIMIT 1)
WHERE uri = 'how-to-do-keyword-research';
