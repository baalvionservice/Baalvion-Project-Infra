-- Native forum: boards are rows in community.communities; topics, posts and reports live here, not in NodeBB.
ALTER TABLE community.communities
  ADD COLUMN IF NOT EXISTS forum_group varchar(80),
  ADD COLUMN IF NOT EXISTS forum_sort integer NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS icon varchar(24);

CREATE TABLE IF NOT EXISTS community.forum_topics (
  id serial PRIMARY KEY,
  community_id uuid NOT NULL REFERENCES community.communities(id) ON DELETE CASCADE,
  author_user_id varchar(64) NOT NULL,
  author_name varchar(120) NOT NULL,
  title varchar(255) NOT NULL,
  thread_type varchar(20) NOT NULL DEFAULT 'discussion',
  is_answered boolean NOT NULL DEFAULT false,
  accepted_pid integer,
  is_pinned boolean NOT NULL DEFAULT false,
  is_locked boolean NOT NULL DEFAULT false,
  views integer NOT NULL DEFAULT 0,
  post_count integer NOT NULL DEFAULT 1,
  last_post_at timestamptz NOT NULL DEFAULT now(),
  last_post_by varchar(120),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS forum_topics_board_idx ON community.forum_topics (community_id, is_pinned DESC, last_post_at DESC);

CREATE TABLE IF NOT EXISTS community.forum_posts (
  id serial PRIMARY KEY,
  topic_id integer NOT NULL REFERENCES community.forum_topics(id) ON DELETE CASCADE,
  author_user_id varchar(64) NOT NULL,
  author_name varchar(120) NOT NULL,
  content text NOT NULL,
  edited_at timestamptz,
  removed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS forum_posts_topic_idx ON community.forum_posts (topic_id, id);

CREATE TABLE IF NOT EXISTS community.forum_flags (
  id serial PRIMARY KEY,
  post_id integer NOT NULL REFERENCES community.forum_posts(id) ON DELETE CASCADE,
  reporter_user_id varchar(64) NOT NULL,
  reason varchar(1000) NOT NULL,
  state varchar(12) NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, reporter_user_id)
);

-- Boards. The five existing communities keep their access rules; the new ones are open to any signed-in member.
UPDATE community.communities SET forum_group='Community', forum_sort=201, icon='chat' WHERE slug='general';
UPDATE community.communities SET forum_group='Making Money & Courses', forum_sort=301, icon='udemy' WHERE slug='education';
UPDATE community.communities SET forum_group='Making Money & Courses', forum_sort=302, icon='exchange' WHERE slug='trading-markets';
UPDATE community.communities SET forum_group='Making Money & Courses', forum_sort=303, icon='users' WHERE slug='investors-founders';
UPDATE community.communities SET forum_group='Privacy & Security', forum_sort=401, icon='shield' WHERE slug='cybersecurity';

INSERT INTO community.communities (id, slug, name, description, access_model, is_active, forum_group, forum_sort, icon, is_platform_tier, created_at, updated_at) VALUES
 (gen_random_uuid(),'announcements','Announcements','News from the Hell Road team: launches, changes and house rules.','free',true,'Home',101,'megaphone',false,now(),now()),
 (gen_random_uuid(),'comments-feedback','Comments & Feedback','Tell us what works and what does not. We read every post.','free',true,'Home',102,'chat',false,now(),now()),
 (gen_random_uuid(),'technical-support','Technical Support','Trouble with your account, payments or the site? Ask here.','free',true,'Home',103,'shield',false,now(),now()),
 (gen_random_uuid(),'introductions','Introductions','New here? Say hello and tell us what you are looking for.','free',true,'Community',202,'smile',false,now(),now()),
 (gen_random_uuid(),'international','International','Talk in your own language, from any country.','free',true,'Community',203,'globe',false,now(),now()),
 (gen_random_uuid(),'tech-finance-news','Technology & Finance News','What is happening in tech, markets and money, and what it means.','free',true,'Community',204,'newspaper',false,now(),now()),
 (gen_random_uuid(),'humour','Humour','Memes, jokes and light relief.','free',true,'Community',205,'smile',false,now(),now()),
 (gen_random_uuid(),'earning-ideas','Earning Ideas','Side income, small business and ways to earn, shared by people who tried them.','free',true,'Making Money & Courses',304,'cash',false,now(),now()),
 (gen_random_uuid(),'freelance','Hire a Freelancer','Offer your skills or find someone to do the work.','free',true,'Making Money & Courses',305,'freelancer',false,now(),now()),
 (gen_random_uuid(),'cryptocurrency','Cryptocurrency','Coins, wallets, exchanges and safe ways to pay.','free',true,'Making Money & Courses',306,'bitcoin',false,now(),now()),
 (gen_random_uuid(),'selling-online','Selling Online','Marketplaces, stores and shipping for small sellers.','free',true,'Making Money & Courses',307,'cash',false,now(),now()),
 (gen_random_uuid(),'creators','Creators & Video','Channels, content and growing an audience.','free',true,'Making Money & Courses',308,'youtube',false,now(),now()),
 (gen_random_uuid(),'courses','Courses & Learning','Share and review courses, books and study plans.','free',true,'Making Money & Courses',309,'udemy',false,now(),now()),
 (gen_random_uuid(),'privacy-tools','Privacy Tools','VPNs, browsers and everyday privacy settings.','free',true,'Privacy & Security',402,'eye-off',false,now(),now()),
 (gen_random_uuid(),'security-guides','Security Guides','Guides for keeping accounts and devices safe.','free',true,'Privacy & Security',403,'lock',false,now(),now()),
 (gen_random_uuid(),'hosting-servers','Hosting & Servers','VPS, hosting and running your own services.','free',true,'Privacy & Security',404,'server',false,now(),now()),
 (gen_random_uuid(),'gaming','Gaming','Games, platforms and playing together.','free',true,'Gaming',501,'gamepad',false,now(),now()),
 (gen_random_uuid(),'game-trading','Game Trading','Buying, selling and swapping games and items.','free',true,'Gaming',502,'exchange',false,now(),now()),
 (gen_random_uuid(),'shooters-esports','Shooters & Esports','Competitive play, teams and tournaments.','free',true,'Gaming',503,'crosshair',false,now(),now())
ON CONFLICT (slug) DO NOTHING;
