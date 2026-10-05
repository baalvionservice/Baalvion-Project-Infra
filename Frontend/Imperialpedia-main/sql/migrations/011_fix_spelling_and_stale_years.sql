-- 011: brand spelling and stale "2021/2022" years in the cookies guides. URLs are untouched (links use lowercase slugs).
UPDATE post SET
  post_title = REPLACE(REPLACE(post_title, 'Grammerly', 'Grammarly'), 'Envanto', 'Envato'),
  post_alt_title = REPLACE(REPLACE(post_alt_title, 'Grammerly', 'Grammarly'), 'Envanto', 'Envato'),
  post_desc = REPLACE(REPLACE(post_desc, 'Grammerly', 'Grammarly'), 'Envanto', 'Envato')
WHERE post_title LIKE '%Grammerly%' OR post_title LIKE '%Envanto%' OR post_alt_title LIKE '%Grammerly%' OR post_alt_title LIKE '%Envanto%'
   OR post_desc LIKE '%Grammerly%' OR post_desc LIKE '%Envanto%';

UPDATE sub_category SET
  sub_cat_desc = REPLACE(REPLACE(sub_cat_desc, 'Grammerly', 'Grammarly'), 'Envanto', 'Envato')
WHERE sub_cat_desc LIKE '%Grammerly%' OR sub_cat_desc LIKE '%Envanto%';

-- Cookies guides only: year in headings and sentences (not inside links or file names) -> 2026.
UPDATE sub_category SET
  sub_cat_desc = REGEXP_REPLACE(sub_cat_desc, '(?<![0-9A-Za-z/_.=-])(2021|2022)(?![0-9A-Za-z])', '2026')
WHERE cat_id = (SELECT cat_id FROM category WHERE cat_name = 'cookies' LIMIT 1)
  AND sub_cat_desc REGEXP '(2021|2022)';

UPDATE meta SET
  meta_title = REGEXP_REPLACE(REPLACE(meta_title, 'Grammerly', 'Grammarly'), '(?<![0-9A-Za-z/_.=-])(2021|2022)(?![0-9A-Za-z])', '2026'),
  meta_desc = REGEXP_REPLACE(REPLACE(meta_desc, 'Grammerly', 'Grammarly'), '(?<![0-9A-Za-z/_.=-])(2021|2022)(?![0-9A-Za-z])', '2026')
WHERE page_url LIKE 'cookies/%' OR page_url LIKE '%rammerly%';

-- Cookies page titles carried a fixed "(June 2026)"; bring them to the current month and fix the QuillBot spelling.
UPDATE meta SET
  meta_title = REPLACE(REPLACE(meta_title, '(June 2026)', '(October 2026)'), 'Quillbot', 'QuillBot'),
  meta_desc = REPLACE(REPLACE(meta_desc, 'June 2026', 'October 2026'), 'Quillbot', 'QuillBot')
WHERE page_url LIKE 'cookies/%';
