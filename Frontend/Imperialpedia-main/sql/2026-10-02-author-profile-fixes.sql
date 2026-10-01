-- Author profile corrections (2026-10-02). Run against u945162271_imperial_pedia.
UPDATE author SET
  credentials = '5+ Yrs Experience',
  bio = 'Tamanna Shaikh is a Senior SEO Specialist & Algorithmic Growth Analyst at Imperialpedia with 5+ years of professional experience, writing about technical SEO, search ranking factors and Google algorithm updates.'
WHERE slug = 'tamanna-shaikh';

UPDATE author SET
  topics = 'Web SEO, YouTube SEO, Instagram SEO',
  bio = 'Allen Krewzz is a Senior SEO Specialist & Algorithmic Growth Analyst at Imperialpedia with 6+ years of professional experience, writing about web SEO, keyword research, and YouTube and Instagram search optimisation.'
WHERE slug = 'allen-krewzz';

-- Tamanna's photo is stored as uploads/author/alex-vance-1789982569.png (another person's name).
-- On the server, rename the file first, then run the UPDATE below:
--   mv uploads/author/alex-vance-1789982569.png uploads/author/tamanna-shaikh.png
-- UPDATE author SET avatar = 'uploads/author/tamanna-shaikh.png' WHERE slug = 'tamanna-shaikh';
