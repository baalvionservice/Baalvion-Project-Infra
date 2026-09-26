-- 003_seo_meta.sql — unique titles/descriptions for three pages that fell back to the generic
-- "Imperialpedia Editorial & Tech Archive". Safe to re-run: inserts only when the page has no row.
SET NAMES utf8mb4;
INSERT INTO meta (page_url, meta_title, meta_desc, added_date, updated_date)
SELECT 'contact', 'Contact Imperialpedia | News Tips & Editorial Enquiries',
       'Send Imperialpedia a news tip or an editorial enquiry, and see how to pitch a story to the editorial team.', NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM meta WHERE page_url = 'contact');
INSERT INTO meta (page_url, meta_title, meta_desc, added_date, updated_date)
SELECT 'advertise', 'Advertise With Imperialpedia | Reach Readers Researching Insurance, SEO & Marketing',
       'Advertise on Imperialpedia and reach readers researching insurance, marketing, SEO and digital tools. See the options available.', NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM meta WHERE page_url = 'advertise');
INSERT INTO meta (page_url, meta_title, meta_desc, added_date, updated_date)
SELECT 'news/usa', 'US Business, Economic Regulations & Digital Commerce Guide 2026 | Imperialpedia',
       'A guide to US business, economic regulation and digital commerce, including remote business registration and low-tax states.', NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM meta WHERE page_url = 'news/usa');
