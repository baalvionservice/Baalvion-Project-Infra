-- Editorial articles. The programmatic pages answer "who funds companies like mine"; these answer
-- what the data cannot — how a filing works, what it proves and what it does not.
SET search_path TO insiders, public;

CREATE TABLE IF NOT EXISTS articles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  summary      TEXT NOT NULL,
  body         TEXT NOT NULL,           -- markdown-ish: ## headings, paragraphs, - bullets
  topic        TEXT,
  reading_mins INTEGER,
  published_at TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS articles_published_idx ON articles (published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS articles_topic_idx ON articles (topic);

DROP TRIGGER IF EXISTS articles_updated_at ON articles;
CREATE TRIGGER articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
