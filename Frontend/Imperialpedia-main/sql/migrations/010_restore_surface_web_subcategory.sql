-- 010: the "surface web" sub-category row was deleted from live on 2026-10-02 (kept in bak_20261002_subcat_surfaceweb),
-- leaving its three posts attached to a missing sub-category. Put the row back.
INSERT INTO sub_category
SELECT * FROM bak_20261002_subcat_surfaceweb b
WHERE b.sub_cat_id = 83 AND NOT EXISTS (SELECT 1 FROM sub_category s WHERE s.sub_cat_id = 83);
SELECT sub_cat_id, cat_id, sub_cat_name FROM sub_category WHERE cat_id = (SELECT cat_id FROM category WHERE cat_name='internet' LIMIT 1);
