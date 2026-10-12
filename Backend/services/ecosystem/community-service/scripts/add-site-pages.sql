-- Staff-written page content and SEO. sync({ alter: false }) creates this on boot; the same shape for applying by hand. Safe to re-run.
CREATE TABLE IF NOT EXISTS community.site_pages (
  slug varchar(160) PRIMARY KEY, title varchar(160), seo_title varchar(160), seo_description varchar(320),
  intro text, body text, benefits jsonb NOT NULL DEFAULT '[]', faqs jsonb NOT NULL DEFAULT '[]', image varchar(600),
  noindex boolean NOT NULL DEFAULT false, updated_by varchar(64),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
