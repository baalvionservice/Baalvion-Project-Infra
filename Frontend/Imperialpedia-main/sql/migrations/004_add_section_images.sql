-- 004_add_section_images.sql — image for each category and sub-category (admin upload + public banner).
-- Run once. Column names differ on purpose: get_subcat_details() does SELECT * over a join of both tables.
ALTER TABLE `category` ADD COLUMN `cat_image` varchar(255) NOT NULL DEFAULT '';
ALTER TABLE `sub_category` ADD COLUMN `sub_cat_image` varchar(255) NOT NULL DEFAULT '';
