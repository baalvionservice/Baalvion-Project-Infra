-- ============================================================
-- Imperialpedia: SEO & Google Algorithm Updates 2024-2026
-- URL: /seo/web-seo  (sub_cat_id = 108, cat_id = 18)
-- ============================================================
-- HOW TO RUN:
--   docker exec -i imperial_db mysql -u root -prootpassword \
--     u945162271_imperial_pedia < sql/seo_web_seo_content.sql
-- ============================================================

SET NAMES utf8mb4;
SET SQL_MODE = '';
SET time_zone = '+00:00';

-- ============================================================
-- 1. UPDATE the existing 'web seo' sub-category hub page
--    sub_cat_id = 108 (confirmed in live DB)
-- ============================================================

UPDATE `sub_category` SET
  `sub_cat_desc` = '<h1>SEO &amp; Google Algorithm Updates: Complete 3-Year Guide (2024–2026)</h1>

<p>Search Engine Optimization (SEO) has never been more volatile than it is right now. Between March 2024 and September 2026, Google unleashed more than <strong>27 confirmed algorithm updates</strong> — fundamentally reshaping how websites earn rankings, traffic, and trust. This is your definitive, year-by-year breakdown of every major change, what it targeted, who it hurt, who it rewarded, and exactly what you must do to survive and thrive in today\'s search landscape.</p>

<blockquote>SEO is not about gaming the algorithm. It\'s about understanding what Google is trying to reward — and then being exactly that. — Imperialpedia Editorial Team</blockquote>

<h2>What is SEO and Why Does It Keep Changing?</h2>

<p>Search Engine Optimization (SEO) is the practice of improving a website\'s visibility in organic (non-paid) search engine results. Google — which commands over 91% of global search traffic — continuously updates its ranking algorithms to deliver more accurate, helpful, and trustworthy results to users.</p>

<p>Google makes thousands of small changes each year and several <strong>major "core" updates</strong> that can dramatically shift search rankings across industries. Understanding these updates is not optional — it is the foundation of any sustainable content or digital marketing strategy.</p>

<h2>The 3 Core Pillars Google Judges You On (E-E-A-T)</h2>

<p>Since the December 2022 update, Google expanded its quality evaluator guidelines to include a new "E" — making it <strong>E-E-A-T: Experience, Expertise, Authoritativeness, and Trustworthiness</strong>. All major updates from 2024 onward reinforce these pillars.</p>

<table>
  <thead>
    <tr><th>Pillar</th><th>What It Means</th><th>How to Demonstrate It</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Experience</strong></td><td>First-hand, real-world experience with the topic</td><td>Author bios, case studies, original data, photos</td></tr>
    <tr><td><strong>Expertise</strong></td><td>Deep subject-matter knowledge</td><td>In-depth content, citations, credentials</td></tr>
    <tr><td><strong>Authoritativeness</strong></td><td>Recognition from other credible sources</td><td>Backlinks from respected sites, mentions, awards</td></tr>
    <tr><td><strong>Trustworthiness</strong></td><td>Honest, accurate, transparent content</td><td>Sources cited, corrections policy, clear authorship</td></tr>
  </tbody>
</table>

<h2>2024 Google Algorithm Updates — Full Breakdown</h2>

<p>2024 was arguably the most disruptive year in Google\'s history, marked by the aggressive rollout of <strong>AI Overviews</strong> (formerly Search Generative Experience), the landmark Helpful Content consolidation, and a relentless crackdown on scaled AI-generated content.</p>

<h2>March 2024 Core Update (March 5 – April 19, 2024)</h2>

<p>The <strong>March 2024 Core Update</strong> was one of the longest and most impactful in Google\'s history — running for 45 days. It explicitly targeted the same type of low-quality, unoriginal, and "parasite SEO" content that had been gaining traction since late 2023.</p>

<p><strong>Key targets:</strong></p>
<ul>
  <li>Scaled AI-generated content with no human editorial oversight</li>
  <li>"Parasite SEO" — thin content hosted on high-authority domains</li>
  <li>Sites mass-producing content for topics they had no business covering</li>
  <li>Expired domain abuse (buying aged domains and filling with new content)</li>
</ul>

<p><strong>Impact:</strong> Sites in the health, finance, and news verticals were most affected. Several large publishers lost 50–90% of their organic traffic. Google confirmed it was targeting 40% of low-quality search results.</p>

<p><strong>Recovery strategy:</strong> Audit your content for originality. Remove or consolidate thin articles. Ensure every page reflects genuine expertise and serves real reader needs.</p>

<h2>AI Overviews (SGE) Global Launch — May 2024</h2>

<p>Google officially launched <strong>AI Overviews</strong> in the United States in May 2024, expanding to 100+ countries by October 2024. AI-generated summaries now appear above traditional organic results, often displacing the #1 ranked page entirely.</p>

<table>
  <thead>
    <tr><th>Query Type</th><th>AI Overview Rate</th><th>Estimated CTR Impact</th></tr>
  </thead>
  <tbody>
    <tr><td>Informational (How-to, What is)</td><td>~78%</td><td>-35% to -64%</td></tr>
    <tr><td>Commercial (Best X, Reviews)</td><td>~45%</td><td>-20% to -40%</td></tr>
    <tr><td>Navigational</td><td>~12%</td><td>-5% to -15%</td></tr>
    <tr><td>Transactional (Buy X, Price)</td><td>~8%</td><td>-2% to -8%</td></tr>
  </tbody>
</table>

<h2>August 2024 Core Update (August 15 – September 3, 2024)</h2>

<p>Directly responded to criticism from independent site creators. Google acknowledged this update would "improve our ability to connect people with a range of high-quality sites." Small, independently operated blogs with strong topical authority and real audience engagement saw significant gains. Sites with excessive display advertising and high bounce rates were penalised.</p>

<p><strong>New:</strong> Google published a 23-question self-assessment framework for content creators — the most detailed quality guidance it had ever released publicly.</p>

<h2>November 2024 Core Update (November 11 – December 5, 2024)</h2>

<p>Tightened spam and AI-content policies. Google\'s SpamBrain system was upgraded to version 4.0, with focus on link spam networks, cloaking, and hacked spam. Hundreds of Private Blog Networks (PBNs) were algorithmically deindexed. Sites with unnaturally fast link acquisition velocities saw significant ranking drops.</p>

<h2>2025 Google Algorithm Updates — Full Breakdown</h2>

<p>2025 marked Google\'s transition into its "AI-first" search era, bringing unprecedented volatility with some verticals experiencing ranking swings not seen since the Panda/Penguin era of 2011–2012.</p>

<h2>February 2025 Core Update (February 3 – February 27, 2025)</h2>

<p>Heavily focused on <strong>user satisfaction signals</strong>. Google\'s internal "satisfaction score" — combining engagement signals like long clicks, task completion, and return visits — was given significantly more weight. Pages that kept users on-site and answered questions completely were rewarded. "Pogosticking" (user clicks result → immediately returns to SERP) became a measurable negative signal.</p>

<h2>March 2025 Spam Update (March 17 – March 26, 2025)</h2>

<p>Targeted <strong>topical authority manipulation</strong> — sites that had recently pivoted to cover trending topics far outside their established niche. A personal finance blog suddenly publishing hundreds of AI-generated articles about cryptocurrency meme coins was hit hard. A long-established cryptocurrency news site covering the same topics was unaffected.</p>

<h2>June 2025 Core Update — "The Expertise Update" (June 2 – June 30, 2025)</h2>

<p>Perhaps the most significant update of 2025. Google began cross-referencing author bylines against the Knowledge Graph at scale. Authors with verified Wikipedia pages, LinkedIn profiles, book publications, or academic credentials saw their articles rank significantly higher. Content freshness was heavily weighted in fast-moving topics — articles older than 6 months without updates were downgraded in AI, finance, and health niches.</p>

<h2>September 2025 Helpful Content Expansion (September 8 – September 22, 2025)</h2>

<p>Google expanded its Helpful Content System to operate at the <strong>section level</strong> — a single "unhelpful" section within an otherwise strong article could suppress the entire page\'s rankings. Generic introductions, boilerplate disclaimer sections, and FAQ fluff that repeated body content were penalised.</p>

<h2>November 2025 Link Quality Update</h2>

<p>Introduced <strong>"Link Relevance Decay"</strong> — links from domains that had shifted their topical focus were algorithmically devalued. A link from a tech blog that had pivoted to celebrity gossip was now worth significantly less, even if domain authority remained nominally high. PBNs saw continued devaluation approaching near-zero link equity.</p>

<h2>2026 Google Algorithm Updates — Full Breakdown (Year-to-Date)</h2>

<p>2026 is the year of <strong>AI integration, multimodal search, and query intent granularity</strong>. Google\'s Gemini-powered search infrastructure is now deeply embedded in ranking decisions, and "good content" has expanded dramatically beyond text.</p>

<h2>January 2026 Core Update (January 13 – February 1, 2026)</h2>

<p>The first update to explicitly reward <strong>multimodal content</strong> — pages combining well-written text, original images, diagrams, video, and interactive tools. Sites with only text-based content in competitive niches began losing ground to competitors offering richer, multi-format experiences.</p>

<h2>March 2026 Spam Update — "Zero Tolerance AI" (March 3 – March 12, 2026)</h2>

<p>Google\'s harshest spam action in history. Thousands of sites using AI to generate content at scale without meaningful human review received manual actions and were deindexed. Google\'s new policy: AI-assisted content is acceptable IF it meets quality standards and meaningful human editorial review is evident. Publishing 100+ AI articles per day without oversight = spam violation.</p>

<h2>May 2026 Core Update — "User Intent 3.0" (May 6 – May 28, 2026)</h2>

<p>Expanded Google\'s query intent classification from 4 categories to a granular <strong>12-category taxonomy</strong>. Pages whose content tone and format did not match the true intent of their ranking queries were reassigned to lower positions — regardless of backlinks or E-E-A-T score.</p>

<h2>August 2026 Core Update (August 11 – September 3, 2026)</h2>

<p>Introduced <strong>content provenance</strong> as a significant ranking signal — evaluating the traceable origin, editorial history, and source transparency of published content. Sites that break news, publish original research, or conduct primary interviews saw significant ranking improvements. Always cite primary sources, show visible update timestamps, and link authors to verifiable credentials.</p>

<h2>The Complete Timeline: Every Major Update 2024–2026</h2>

<table>
  <thead>
    <tr><th>Date</th><th>Update Name</th><th>Primary Focus</th><th>Impact Level</th></tr>
  </thead>
  <tbody>
    <tr><td>Mar–Apr 2024</td><td>March 2024 Core</td><td>AI content, parasite SEO, expired domains</td><td>★★★★★ Extreme</td></tr>
    <tr><td>May 2024</td><td>AI Overviews Launch</td><td>Structural SERP change, zero-click results</td><td>★★★★ Very High</td></tr>
    <tr><td>Aug–Sep 2024</td><td>August 2024 Core</td><td>Small sites, UX signals, helpful content</td><td>★★★ High</td></tr>
    <tr><td>Nov–Dec 2024</td><td>November 2024 Core</td><td>Spam, link networks, cloaking</td><td>★★★ High</td></tr>
    <tr><td>Feb 2025</td><td>February 2025 Core</td><td>User satisfaction, dwell time, task completion</td><td>★★★ High</td></tr>
    <tr><td>Mar 2025</td><td>March 2025 Spam</td><td>Topical authority manipulation</td><td>★★ Medium</td></tr>
    <tr><td>Jun 2025</td><td>June 2025 Core ("Expertise Update")</td><td>Author credibility, YMYL, content freshness</td><td>★★★★★ Extreme</td></tr>
    <tr><td>Sep 2025</td><td>Helpful Content Expansion</td><td>Section-level quality, fluff removal</td><td>★★★ High</td></tr>
    <tr><td>Nov 2025</td><td>Link Quality Update</td><td>Link relevance decay, PBN devaluation</td><td>★★★ High</td></tr>
    <tr><td>Jan–Feb 2026</td><td>January 2026 Core</td><td>Multimodal content, rich media signals</td><td>★★★ High</td></tr>
    <tr><td>Mar 2026</td><td>March 2026 Spam ("Zero Tolerance AI")</td><td>Scaled AI content deindexing</td><td>★★★★★ Extreme</td></tr>
    <tr><td>May–Jun 2026</td><td>May 2026 Core ("User Intent 3.0")</td><td>12-category intent taxonomy</td><td>★★★★ Very High</td></tr>
    <tr><td>Aug–Sep 2026</td><td>August 2026 Core</td><td>Content provenance, source transparency</td><td>★★★★ Very High</td></tr>
  </tbody>
</table>

<h2>The 2026 SEO Survival Checklist</h2>

<p>Based on everything Google has communicated through its 2024–2026 updates, here is the non-negotiable framework for ranking today:</p>

<p><strong>1. Author Identity and Credentials</strong> — Every article must have a named author with a complete author profile page linking to external verification (LinkedIn, publications, credentials).</p>

<p><strong>2. Content Provenance</strong> — Always cite primary sources. Show "Originally Published" and "Last Updated" dates. Maintain visible update history for reference articles.</p>

<p><strong>3. Multimodal Content</strong> — Add original images, diagrams, video, or interactive tools. Use descriptive, keyword-rich alt text. Implement Schema markup for all content types.</p>

<p><strong>4. User Intent Alignment</strong> — Map every page to one of Google\'s 12 intent categories. Ensure the tone, format, and content structure match that intent exactly.</p>

<p><strong>5. Topical Authority</strong> — Build content clusters. A single strong article is less effective than 20 interlinked articles forming a comprehensive topic cluster. Internal linking must be strategic and contextual.</p>

<p><strong>6. Technical SEO Fundamentals</strong> — Core Web Vitals: LCP &lt; 2.5s, INP &lt; 200ms, CLS &lt; 0.1. Mobile-first indexing is non-negotiable. Structured data is mandatory for AI citation.</p>

<p><strong>7. AI Content Compliance</strong> — If you use AI tools, implement mandatory human editorial review. Do not publish AI output directly. Fact-check all AI-generated claims.</p>

<h2>Key Takeaway: SEO in 2026</h2>

<p>The era of SEO as a trick or a hack is definitively over. What Google has systematically built over the past three years is a search engine that increasingly mirrors how educated humans evaluate information quality — by checking who wrote it, whether it\'s grounded in real experience, whether it serves the reader\'s actual need, and whether it can be trusted. The sites that have thrived through every update from 2024 to 2026 were built by real experts, for real readers, with real purpose. That is the only durable SEO strategy that exists today.</p>',
  `author_name` = 'Imperialpedia Editorial Team',
  `tags` = 'seo, google algorithm updates, core update 2024, core update 2025, core update 2026, helpful content, E-E-A-T, AI overviews, web seo, google algorithm 2024 2025 2026',
  `updated_date` = '2026-09-19 12:00:00'
WHERE `sub_cat_id` = 108;


-- ============================================================
-- 2. UPDATE the meta entry for /seo/web-seo
-- ============================================================

UPDATE `meta` SET
  `meta_title` = 'SEO &amp; Google Algorithm Updates 2024, 2025, 2026 — Complete 3-Year Guide | Imperialpedia',
  `meta_desc`  = 'Every major Google algorithm update from 2024 to 2026 explained in full detail — March 2024 Core, AI Overviews, June 2025 Expertise Update, May 2026 User Intent 3.0, August 2026 Provenance Update and more. Includes impact tables, winner/loser analysis, and the complete 2026 SEO checklist.',
  `updated_date` = '2026-09-19 12:00:00'
WHERE `page_url` = 'seo/web-seo';


-- ============================================================
-- 3. INSERT new article posts under sub_cat_id = 108
--    Using high post_id range (5001+) to avoid collisions
--    uri uses spaces (the model strips hyphens in display but
--    the routing converts dashes back to spaces for lookup)
-- ============================================================

-- POST: March 2024 Core Update
INSERT INTO `post`
  (`post_id`, `cat_id`, `sub_cat_id`, `post_title`, `uri`,
   `post_img`, `post_alt_title`, `post_desc`, `posted_date`, `post_updated`)
VALUES (5001, 18, 108,
  'March 2024 Core Update: The Full Impact Report',
  'march 2024 core update full impact report',
  'post.png', 'Google March 2024 Core Update Impact Analysis',
  '<h1>March 2024 Core Update: The Full Impact Report</h1>
<p>The <strong>March 2024 Core Update</strong> ran for 45 days (March 5 – April 19, 2024) and was Google\'s most sweeping algorithmic action in years. It explicitly targeted scaled AI content, parasite SEO, and expired domain abuse at unprecedented scale — resulting in some of the largest single-site traffic drops ever recorded.</p>
<h2>What Changed</h2>
<p>Google targeted four specific behaviour patterns: mass AI content publishing without editorial oversight, thin pages hosted on authoritative parent domains (parasite SEO), buying expired aged domains and populating them with new content, and site reputation abuse — where trusted sites published content on behalf of third-party publishers purely for SEO value without maintaining their own editorial standards.</p>
<h2>Who Was Affected Most</h2>
<p>Health, finance, and consumer review sites were hit hardest. Several large media outlets reported 40–70% drops in organic search visibility within the first two weeks of rollout. In contrast, niche, independent publishers with genuine expertise, first-hand experience content, and strong editorial practices largely recovered or improved their rankings. This bifurcation — experts up, aggregators down — became the defining narrative of 2024 SEO.</p>
<h2>Parasite SEO Crackdown</h2>
<p>Parasite SEO — publishing optimised content on a high-authority host domain to rank for competitive terms — was specifically named by Google in its communications around this update. Coupon pages, job listing aggregators, and AI-generated "best of" articles hosted on major news sites were particularly affected. Several prominent news publishers removed thousands of such pages proactively in the weeks following the update.</p>
<h2>Recovery Strategy</h2>
<p>Conduct a full content audit using Google Search Console data. Identify pages with impressions but near-zero clicks (CTR below 0.5%) as recovery candidates. Remove or noindex pages that provide no original value. Consolidate thin articles covering the same topic into a single comprehensive guide. Update author information across all remaining pages to include real credentials and verifiable identities. Pages that recovered fastest were those that could demonstrate clear, first-hand expertise on the topics they covered.</p>',
  '2024-03-05 00:00:00', '2026-09-19 12:00:00');

-- POST: AI Overviews 2024
INSERT INTO `post`
  (`post_id`, `cat_id`, `sub_cat_id`, `post_title`, `uri`,
   `post_img`, `post_alt_title`, `post_desc`, `posted_date`, `post_updated`)
VALUES (5002, 18, 108,
  'Google AI Overviews 2024: What It Means for Your SEO Traffic',
  'google ai overviews 2024 seo traffic impact',
  'post.png', 'Google AI Overviews SGE Traffic Impact SEO 2024',
  '<h1>Google AI Overviews 2024: What It Means for Your SEO Traffic</h1>
<p>Google\'s <strong>AI Overviews</strong> (formerly Search Generative Experience, or SGE) launched globally in May 2024, placing AI-generated summaries above organic results for an estimated 20% of all queries at launch, climbing to 40%+ by year-end. For many informational queries, traditional blue-link results moved entirely below the fold.</p>
<h2>The Traffic Impact by Query Type</h2>
<p>Informational queries — "how-to," "what is," "why does," "explain" — saw the steepest click-through rate declines, ranging from 35% to 64% depending on query specificity. The more complete the AI Overview answer, the sharper the CTR drop. Commercial and transactional queries were far less affected as AI Overviews rarely appeared for purchase-intent searches. Local service queries (plumbers near me, restaurants open now) were almost entirely unaffected.</p>
<h2>The Citation Opportunity Inside AI Overviews</h2>
<p>Being cited inside an AI Overview generates significant brand impressions even without direct clicks. Independent research showed that pages cited in AI Overviews experienced 20–35% increases in branded search volume — users who saw the citation later searched directly for the site. Structured data markup (FAQPage, HowTo, Article schema) dramatically increased citation probability. Pages with clear, concise, well-sourced factual answers to specific questions were cited most often. Conversational, list-based, and numbered-step content formats performed best for citation.</p>
<h2>Adapting Your SEO Strategy for an AI-First SERP</h2>
<p>Diversify traffic sources aggressively — AI Overviews are a structural shift, not a temporary change. Build email lists and social communities as zero-click search rises. Focus content investment on commercial and transactional intent queries where AI Overviews appear rarely. Optimise for AI citation by structuring content with direct, fact-dense answers immediately following H2/H3 headings. Add FAQ sections at the end of articles covering common follow-up questions — these are heavily mined by Google\'s AI for citation material.</p>',
  '2024-05-14 00:00:00', '2026-09-19 12:00:00');

-- POST: August 2024 Core Update
INSERT INTO `post`
  (`post_id`, `cat_id`, `sub_cat_id`, `post_title`, `uri`,
   `post_img`, `post_alt_title`, `post_desc`, `posted_date`, `post_updated`)
VALUES (5003, 18, 108,
  'August 2024 Core Update: Small Publishers Finally Win',
  'august 2024 core update small publishers win',
  'post.png', 'Google August 2024 Core Update Small Sites UX Signals',
  '<h1>August 2024 Core Update: Small Publishers Finally Win</h1>
<p>Google responded to months of sustained criticism from independent content creators with the <strong>August 2024 Core Update</strong> (August 15 – September 3, 2024), explicitly designed to surface more content from small, genuinely helpful independent sites that had been "undervalued" by previous updates. For the first time, Google acknowledged in its official communications that small creators had been unfairly affected and that this update would directly address the imbalance.</p>
<h2>Google\'s 23-Question Self-Assessment Framework</h2>
<p>Alongside the August 2024 update, Google published the most detailed content quality guidance it had ever released publicly — a 23-question self-assessment framework. Key questions included: Does the content provide original information, reporting, research, or analysis? Does the headline avoid being exaggerated or shocking? Would you be comfortable explaining your content creation process to a Google employee? Is the content written by or for humans — or primarily for search engines? Does the article provide substantial value beyond what other pages on the same topic provide?</p>
<h2>User Experience Signals Given Higher Weight</h2>
<p>The August update placed significantly higher weight on behavioural signals: time-on-page, scroll depth, return visits, and task completion rates. Sites with cluttered ad layouts that forced readers to hunt for content were penalised regardless of content quality. Pages that answered questions completely — leaving users with no reason to return to the search results — saw the strongest gains. Sites that broke content into unnecessary paginated series purely to maximise pageviews were penalised.</p>
<h2>Who Won and Who Lost</h2>
<p>Winners: Niche blogs run by genuine enthusiasts and practitioners with deep topical expertise. Regional news publishers covering local stories not covered by national outlets. Sites that had consistently published at human scale (2–5 articles per week) rather than machine scale. Losers: Content farms with high publication velocity and low editorial standards. Sites that had relied on ad-heavy layouts. Pages with high bounce rates caused by misleading titles or poor content-to-ad ratios.</p>',
  '2024-08-15 00:00:00', '2026-09-19 12:00:00');

-- POST: E-E-A-T Guide
INSERT INTO `post`
  (`post_id`, `cat_id`, `sub_cat_id`, `post_title`, `uri`,
   `post_img`, `post_alt_title`, `post_desc`, `posted_date`, `post_updated`)
VALUES (5004, 18, 108,
  'E-E-A-T in 2025–2026: The Complete Implementation Guide',
  'e-e-a-t 2025 2026 complete implementation guide',
  'post.png', 'E-E-A-T Experience Expertise Authoritativeness Trust SEO Guide 2025 2026',
  '<h1>E-E-A-T in 2025–2026: The Complete Implementation Guide</h1>
<p>Google\'s E-E-A-T framework — <strong>Experience, Expertise, Authoritativeness, and Trustworthiness</strong> — is the most important conceptual framework in modern SEO. Every major update from 2024 to 2026 has reinforced one or more of these four pillars. This guide tells you exactly how to implement each pillar with concrete, actionable steps.</p>
<h2>Experience: Demonstrating First-Hand Knowledge</h2>
<p>The "Experience" pillar added in December 2022 rewards content that demonstrates real, lived, hands-on experience. Tactics that work: include original photographs from actual product use (not stock photos), share case studies with real data from your own tests and experiments, write author bios that describe specific relevant personal experience (not generic credentials), and include specific details that only someone who has actually done the thing would know — processing times, edge cases, personal mistakes made and lessons learned. Generic advice can be written without experience; specific, nuanced, experiential detail cannot.</p>
<h2>Expertise: Demonstrating Deep Domain Knowledge</h2>
<p>Expertise is demonstrated through depth, accuracy, and precision — not breadth. A 2,500-word article that goes deep on one specific aspect of a topic outranks a 500-word article attempting to cover everything. Cite primary sources (peer-reviewed studies, official documentation, expert interviews) rather than citing other blogs that cite other blogs. Show your methodology when sharing data or conclusions. Use domain-specific terminology correctly. Avoid errors of omission — an expert would not leave out important nuances or caveats that a generalist might miss.</p>
<h2>Authoritativeness: Building External Recognition</h2>
<p>You cannot claim authority — it must be granted by others. Build authoritativeness through: earning editorial mentions in established publications, being cited by other credible experts in your field, building a recognisable brand specifically associated with your topic area, winning or being nominated for industry recognition, being quoted in mainstream media on your topic, and having other experts reference or build on your work. Guest posting on irrelevant sites does not build authoritativeness — only genuine peer recognition does.</p>
<h2>Trustworthiness: The Foundation of Everything</h2>
<p>Google\'s Quality Rater Guidelines state that trustworthiness is the most important E-E-A-T pillar, especially for YMYL topics. Essential trust signals: clear ownership and named editorial team, visible corrections and complaints policy, HTTPS security certificate, accurate and up-to-date contact information, consistency between on-page content and external descriptions of your site, no deceptive design patterns or hidden subscription traps, and citing sources for factual claims with links to the original. For YMYL sites: medical disclaimers reviewed by qualified professionals, legal disclaimers reviewed by attorneys, financial disclosures as required by law.</p>',
  '2025-01-15 00:00:00', '2026-09-19 12:00:00');

-- POST: June 2025 Expertise Update
INSERT INTO `post`
  (`post_id`, `cat_id`, `sub_cat_id`, `post_title`, `uri`,
   `post_img`, `post_alt_title`, `post_desc`, `posted_date`, `post_updated`)
VALUES (5005, 18, 108,
  'June 2025 Core Update: How Author Credibility Now Determines Rankings',
  'june 2025 core update author credibility determines rankings',
  'post.png', 'Google June 2025 Core Update Author Entity Score Knowledge Graph',
  '<h1>June 2025 Core Update: How Author Credibility Now Determines Rankings</h1>
<p>The <strong>June 2025 Core Update</strong> (June 2 – June 30, 2025) — informally called "The Expertise Update" by the SEO community — was the most significant ranking factor shift of 2025. Google began cross-referencing author bylines against the Knowledge Graph and other external authority signals at unprecedented scale. For the first time, who wrote the content became a direct, measurable ranking input — not just a quality evaluator guideline recommendation.</p>
<h2>Understanding the Author Entity Score</h2>
<p>Google\'s systems now evaluate authors as knowledge graph entities, not just names on a page. An author who has a Wikipedia entry, a verified LinkedIn profile with traceable employment history, published books (indexed in Google Books), academic papers (indexed in Google Scholar), or frequent citations in established media receives a measurably higher entity score. This score feeds directly into ranking calculations for articles attributed to that author — and by extension, to the overall authority of the publishing site. Anonymous bylines, pen names without verification, and authors with no external footprint were downgraded across the board.</p>
<h2>Implementing Author Entity Building</h2>
<p>Step 1: Create detailed author profile pages on your site for every contributor. Include full name, professional bio, areas of expertise, headshot, and links to external profiles. Step 2: Ensure all articles are bylined with the author\'s full name — not "Staff Writer" or "Editorial Team." Step 3: Build the author\'s external entity signals: contribute to their Wikipedia page if notable, maintain an active LinkedIn profile with their publications listed, ensure their name appears in Google News sources if applicable. Step 4: For health, finance, and legal content, require contributor credentials to be listed explicitly (e.g., "Dr. Jane Smith, MD, FACP" not just "Jane Smith").</p>
<h2>Content Freshness as a Ranking Signal in Fast-Moving Niches</h2>
<p>The June 2025 update heavily downgraded content older than 6 months that had not been reviewed or updated in fast-moving topic areas — specifically AI technology, financial markets, health policy, and regulatory changes. Implement a content refresh calendar. Set editorial reminders to review time-sensitive articles at least quarterly. When updating, make substantive improvements — adding new data, updated statistics, and revised recommendations — not cosmetic date changes. Google can distinguish genuine updates from date-only changes.</p>',
  '2025-06-02 00:00:00', '2026-09-19 12:00:00');

-- POST: AI Content Policy 2025-2026
INSERT INTO `post`
  (`post_id`, `cat_id`, `sub_cat_id`, `post_title`, `uri`,
   `post_img`, `post_alt_title`, `post_desc`, `posted_date`, `post_updated`)
VALUES (5006, 18, 108,
  'Google AI Content Policy 2025–2026: What Is and Is Not Allowed',
  'google ai content policy 2025 2026 what is allowed',
  'post.png', 'Google AI Generated Content Policy Rules SEO 2025 2026',
  '<h1>Google AI Content Policy 2025–2026: What Is and Is Not Allowed</h1>
<p>Google has never outright banned AI-generated content — but the <strong>March 2026 Spam Update</strong> established the clearest line in the sand to date on where the boundary lies between helpful AI-assisted content and spam. This article breaks down exactly what Google\'s current policy permits, what crosses the line, and how to build a compliant AI content workflow.</p>
<h2>Google\'s Official Position</h2>
<p>Google\'s position, consistently stated since 2023 and reaffirmed in 2026: "Content is content, regardless of how it is produced. Our systems are designed to reward content that is helpful, reliable, and people-first — not content that was produced in a particular way." This means AI-generated content is not categorically penalised. The question is always whether the content meets Google\'s quality standards — and increasingly, whether human expertise and judgment are demonstrably present.</p>
<h2>What Is Classified as Spam Under the March 2026 Policy</h2>
<p>Publishing AI-generated content at scale (estimated threshold: 100+ substantially similar articles per day) without human editorial review constitutes spam under Google\'s updated definition. Using AI to spin, paraphrase, or rewrite competitor content is a duplicate content violation. Publishing AI-generated medical, legal, or financial advice without review by credentialed professionals violates YMYL quality standards. Using AI to generate fake reviews, testimonials, or synthetic user-generated content is grounds for a manual action. Cloaking AI-generated content (showing different content to Googlebot vs. users) remains a severe violation that triggers immediate deindexing.</p>
<h2>The Safe AI Content Workflow</h2>
<p>Use AI for research, outlining, and initial drafting — not for final publication. Have a subject matter expert who has real experience with the topic review and substantively edit every AI-assisted article. Add original examples, proprietary data, expert quotes, and personal insights that the AI could not generate. Fact-check every claim before publishing — AI systems hallucinate incorrect facts with confidence. If your editorial policy requires it, add an appropriate disclosure. Document your editorial review process internally so you can demonstrate compliance if you receive a manual review request.</p>',
  '2026-03-03 00:00:00', '2026-09-19 12:00:00');

-- POST: Link Building 2025-2026
INSERT INTO `post`
  (`post_id`, `cat_id`, `sub_cat_id`, `post_title`, `uri`,
   `post_img`, `post_alt_title`, `post_desc`, `posted_date`, `post_updated`)
VALUES (5007, 18, 108,
  'Link Building in 2025–2026: What Still Works After Google Updates',
  'link building 2025 2026 what still works google updates',
  'post.png', 'Link Building Strategies 2025 2026 Google Algorithm Proof',
  '<h1>Link Building in 2025–2026: What Still Works After Google Updates</h1>
<p>The <strong>November 2025 Link Quality Update</strong> introduced "Link Relevance Decay" — algorithmically devaluing links from domains that had shifted their topical focus. Combined with years of accumulated spam crackdowns, the link building landscape of 2026 looks radically different from even five years ago. This guide covers what actually earns ranking power in today\'s environment.</p>
<h2>What Google Values in Backlinks Today</h2>
<p>The fundamental value equation for backlinks in 2026: Editorially placed + topically relevant + from a credible domain = maximum value. A single link from a respected, topically aligned publication that placed the link because your content genuinely deserved it outweighs hundreds of links from low-quality directories or off-topic sites. Google\'s SpamBrain system now detects link patterns with sufficient accuracy that most manipulative link building creates more risk than reward.</p>
<h2>Strategies That Genuinely Work in 2026</h2>
<p><strong>Digital PR and Original Research:</strong> Create genuinely newsworthy content — original surveys, proprietary datasets, unique research — and pitch it to journalists and editors in your industry. A single piece of credible original data can earn hundreds of editorial links from outlets that would never accept a guest post. This is the highest-ROI link building activity in 2026. <strong>Expert Contribution:</strong> Contribute expert quotes and commentary for roundup articles, journalist queries (HARO-type services), and expert compilation pieces in your niche. These earn contextually relevant links while also building author entity signals. <strong>Resource Creation:</strong> Build genuinely useful tools, templates, calculators, or comprehensive reference resources that other sites in your niche naturally want to link to as a reference. <strong>Unlinked Brand Mentions:</strong> Monitor for mentions of your brand or unique research that don\'t include a link, and reach out politely to request attribution.</p>
<h2>What to Actively Avoid</h2>
<p>Guest posts on sites outside your topical niche now carry negative signals in many cases due to link relevance decay. Reciprocal link exchanges are detectable and devalued. Private blog networks are algorithmically identified and provide negligible or negative equity. Paid link insertion services that place links in existing old content on aged sites are a high-risk, declining-value strategy. Any tactic that creates links at artificial velocity — gaining 500 links in a week from new sites — triggers SpamBrain flags regardless of individual link quality.</p>',
  '2025-11-10 00:00:00', '2026-09-19 12:00:00');

-- POST: Technical SEO 2026
INSERT INTO `post`
  (`post_id`, `cat_id`, `sub_cat_id`, `post_title`, `uri`,
   `post_img`, `post_alt_title`, `post_desc`, `posted_date`, `post_updated`)
VALUES (5008, 18, 108,
  'Technical SEO in 2026: Core Web Vitals, Schema & Multimodal Optimization',
  'technical seo 2026 core web vitals schema multimodal',
  'post.png', 'Technical SEO 2026 Core Web Vitals INP LCP CLS Schema Markup',
  '<h1>Technical SEO in 2026: Core Web Vitals, Schema &amp; Multimodal Optimization</h1>
<p>Technical SEO is the non-negotiable foundation beneath all content and link building efforts. The <strong>January 2026 Core Update</strong> introduced new multimodal signals that make technical optimisation more complex — and more important — than ever. This guide covers the exact thresholds, implementation requirements, and priority actions for 2026.</p>
<h2>Core Web Vitals: 2026 Thresholds and Measurement</h2>
<p>Google\'s Core Web Vitals are measured across three dimensions: <strong>LCP (Largest Contentful Paint)</strong> — the time until the largest visible element is fully loaded — must be under 2.5 seconds for a "Good" rating. <strong>INP (Interaction to Next Paint)</strong> — which replaced FID in March 2024 — measures responsiveness to all user interactions and must be under 200ms for "Good". <strong>CLS (Cumulative Layout Shift)</strong> — measuring visual stability — must be under 0.1. The most common CLS culprits in 2026 are: images without declared dimensions, dynamically injected ad units, and lazy-loaded content that shifts the layout. Measure real-user Core Web Vitals in Google Search Console under "Core Web Vitals" — the lab data in PageSpeed Insights is useful but the real-user CrUX data is what Google actually uses for ranking.</p>
<h2>Schema Markup for AI Overview Citation</h2>
<p>Structured data has become a critical lever for being cited in AI Overviews. Priority schemas for 2026: <strong>Article</strong> with author (linked to sameAs external profiles), datePublished, and dateModified. <strong>FAQPage</strong> for Q&amp;A sections. <strong>HowTo</strong> for step-by-step processes. <strong>VideoObject</strong> with transcript for any embedded video. <strong>ImageObject</strong> for key infographics. <strong>BreadcrumbList</strong> for all pages. <strong>Organization</strong> with contactPoint, sameAs (social profiles), and logo. Implement all schema using JSON-LD in the document &lt;head&gt; — do not use Microdata or RDFa.</p>
<h2>Multimodal Optimization After January 2026</h2>
<p>Google now evaluates the richness of a page\'s media alongside its text. For images: use descriptive, keyword-relevant alt text that describes what the image shows and why it is relevant. Declare width and height attributes on all &lt;img&gt; tags to prevent CLS. Use WebP format (30–40% smaller than JPEG at equivalent quality). Name files meaningfully — "google-march-2024-core-update-traffic-impact.webp" is infinitely better than "screenshot-3.webp". For video: include a full transcript as visible page text. Add VideoObject schema. Host on YouTube and embed — this adds Google\'s own platform confidence signal. For interactive tools or calculators: ensure the tool output is accessible to crawlers (not locked behind JavaScript that blocks rendering), or provide a static equivalent alongside the interactive version.</p>',
  '2026-01-13 00:00:00', '2026-09-19 12:00:00');

-- POST: May 2026 User Intent 3.0
INSERT INTO `post`
  (`post_id`, `cat_id`, `sub_cat_id`, `post_title`, `uri`,
   `post_img`, `post_alt_title`, `post_desc`, `posted_date`, `post_updated`)
VALUES (5009, 18, 108,
  'May 2026 Core Update — User Intent 3.0: The 12-Category Query Framework',
  'may 2026 core update user intent 3.0 12 category framework',
  'post.png', 'Google May 2026 Core Update User Intent 12 Categories Taxonomy',
  '<h1>May 2026 Core Update — User Intent 3.0: The 12-Category Query Framework</h1>
<p>The <strong>May 2026 Core Update</strong> (May 6 – May 28, 2026) represented the most sophisticated overhaul of Google\'s query intent classification in its history. The classical four-category model (informational, navigational, commercial, transactional) that has guided SEO strategy for over a decade was expanded into a 12-category taxonomy that enables Google to match user intent with far greater precision.</p>
<h2>Why Intent Classification Matters More Than Ever</h2>
<p>Every piece of content you publish implicitly serves a specific query intent. When your content\'s format, tone, and depth do not match the true intent of the queries it ranks for, Google now algorithmically reassigns it to a lower position — regardless of how strong its E-E-A-T score is or how many backlinks it has accumulated. The May 2026 update made this misalignment penalty measurably stronger than in any previous update.</p>
<h2>The 12 User Intent Categories</h2>
<p>Google\'s expanded taxonomy distinguishes: (1) Informational — broad learning; (2) Informational — specific how-to; (3) Informational — definitional; (4) Research — comparative analysis; (5) Research — evaluative (reviews and ratings); (6) Commercial — product/service discovery; (7) Commercial — vendor comparison; (8) Transactional — direct purchase/signup; (9) Transactional — local service; (10) Navigational — specific brand; (11) Navigational — specific feature or tool; (12) Personal — advice, opinion, or community discussion. Each category carries different expectations for content depth, format, authority signals, and CTA placement.</p>
<h2>Practical Application for Content Creators</h2>
<p>For each target keyword cluster, determine which of the 12 categories the query truly belongs to. Then audit your existing content against that determination: Does your content format match? (Comparison queries expect tables; how-to queries expect numbered steps; definitional queries expect concise, direct answers). Does your tone match? (Research queries expect neutral analysis; personal advice queries expect first-person perspective and empathy). Does your CTA placement match? (Commercial discovery content should present options broadly; transactional content should present a single clear next action). Pages that had been targeting broad informational queries but written in a transactional style with aggressive affiliate links throughout saw the sharpest ranking corrections in May 2026.</p>',
  '2026-05-06 00:00:00', '2026-09-19 12:00:00');

-- POST: Content Strategy 2026
INSERT INTO `post`
  (`post_id`, `cat_id`, `sub_cat_id`, `post_title`, `uri`,
   `post_img`, `post_alt_title`, `post_desc`, `posted_date`, `post_updated`)
VALUES (5010, 18, 108,
  'Content Strategy for 2026: Building Topical Authority That Survives Every Update',
  'content strategy 2026 topical authority survives google updates',
  'post.png', 'Content Strategy Topical Authority Clusters SEO 2026',
  '<h1>Content Strategy for 2026: Building Topical Authority That Survives Every Update</h1>
<p>The most consistent finding across every major Google update from 2024 to 2026 is that <strong>topical authority protects rankings</strong>. Sites with deep, comprehensive coverage of a specific niche consistently outperform broader sites publishing thin coverage across many topics — and they recover from algorithm updates faster. This guide covers how to build genuine topical authority that no algorithm change can easily disrupt.</p>
<h2>What Topical Authority Actually Is</h2>
<p>Topical authority is the degree to which Google\'s systems and real users recognise your site as a credible, comprehensive, go-to source on a given topic area. It is built through: the breadth of subtopics you cover within your niche (covering every relevant question a reader might have), the depth of treatment on each subtopic (going further than any competitor on specifics), the quality and interconnectedness of your internal linking (showing Google how your content relates), and the consistency of your editorial focus over time (not pivoting to unrelated topics chasing trends).</p>
<h2>Building Content Clusters for Topical Authority</h2>
<p>The content cluster model has become the standard approach. Structure: one <strong>Pillar Page</strong> of 3,000–8,000 words covering the main topic comprehensively, linking to all related cluster pages. Multiple <strong>Cluster Pages</strong> of 1,000–2,500 words each covering specific subtopics in depth, linking back to the pillar and to each other where contextually relevant. A strong internal linking architecture is as important as the content itself — Google uses it as a topical map of your site\'s expertise.</p>
<h2>The Content Audit Framework</h2>
<p>Quarterly content audits are non-negotiable in 2026. Categorise every page: <strong>Keep and Update</strong> (strong traffic and engagement, review quarterly), <strong>Improve</strong> (has potential but underperforming — identify why and fix it), <strong>Consolidate</strong> (merge with a related stronger page using 301 redirects), or <strong>Remove</strong> (no traffic, no links, no salvageable value — delete and 404 or 301 redirect). Sites that implemented aggressive content pruning — sometimes removing 30–50% of their total page count — saw consistent recovery after every major 2024–2026 update. More good content always beats more total content.</p>
<h2>Publishing Cadence and Velocity</h2>
<p>Consistency matters more than volume. Publishing two deeply researched, well-sourced, expert-reviewed articles per week consistently outperforms publishing twenty shallow articles per day. Google\'s spam systems now treat sudden publishing velocity spikes — especially when not accompanied by corresponding increases in quality signals and link acquisition — as a potential spam indicator. Build at a sustainable pace that allows genuine editorial care for every piece published.</p>',
  '2026-01-20 00:00:00', '2026-09-19 12:00:00');

-- POST: August 2026 Content Provenance
INSERT INTO `post`
  (`post_id`, `cat_id`, `sub_cat_id`, `post_title`, `uri`,
   `post_img`, `post_alt_title`, `post_desc`, `posted_date`, `post_updated`)
VALUES (5011, 18, 108,
  'August 2026 Core Update: Content Provenance and Why Source Transparency Ranks',
  'august 2026 core update content provenance source transparency ranks',
  'post.png', 'Google August 2026 Core Update Content Provenance Original Reporting',
  '<h1>August 2026 Core Update: Content Provenance and Why Source Transparency Ranks</h1>
<p>The <strong>August 2026 Core Update</strong> (August 11 – September 3, 2026) introduced content provenance as a significant ranking signal — evaluating the traceable origin, editorial history, and source transparency of published content. This is Google\'s most direct response yet to the proliferation of unverifiable AI-generated content and represents a fundamental new dimension of ranking evaluation.</p>
<h2>What Content Provenance Means in Practice</h2>
<p>Content provenance refers to the traceable lineage of a piece of content — who wrote it, when, with what source material, how it has evolved over time, and whether the claims within it can be verified against primary sources. Google\'s systems now attempt to evaluate: Was this the original source for this information, or was it aggregated or paraphrased from elsewhere? How has this content been updated and refined over time? Can the factual claims in this content be traced to verifiable primary sources? Is the author a real, accountable person who can be held responsible for the content\'s accuracy?</p>
<h2>Original Reporting Gets a Major Boost</h2>
<p>Sites that break news, publish original survey research, conduct primary interviews with experts, or produce proprietary data analysis saw significant ranking improvements in the August 2026 update. Google\'s systems now attempt to identify "original reporting" — content where a site was the primary source for information that was subsequently cited, quoted, or referenced by other publications. Being the origin of cited information dramatically strengthens provenance signals. This creates a virtuous cycle: original content earns citations, which Google interprets as authority, which boosts rankings for future original content.</p>
<h2>Building Provenance Signals Into Your Editorial Process</h2>
<p>Always cite primary sources with direct links — research papers, official government data, company statements, regulatory filings — not secondary summaries of those sources. Add visible "Originally Published" and "Last Updated" timestamps on every article. For major reference articles, maintain a visible changelog documenting what was changed and why. Conduct and publish original surveys, audits, or data analysis that makes your content a citable primary source. Create named expert interview content — quotes attributed to named, verifiable experts are a strong provenance signal. Ensure your "About" and author pages establish the editorial accountability chain clearly.</p>',
  '2026-08-11 00:00:00', '2026-09-19 12:00:00');

-- POST: SEO Predictions 2027
INSERT INTO `post`
  (`post_id`, `cat_id`, `sub_cat_id`, `post_title`, `uri`,
   `post_img`, `post_alt_title`, `post_desc`, `posted_date`, `post_updated`)
VALUES (5012, 18, 108,
  'SEO in 2027: 4 Predictions Based on Google''s Algorithmic Direction',
  'seo 2027 predictions google algorithmic direction future',
  'post.png', 'SEO Predictions 2027 Future Google Algorithm AI Entities',
  '<h1>SEO in 2027: 4 Predictions Based on Google\'s Algorithmic Direction</h1>
<p>After studying the clear and consistent direction of 13 major Google algorithm updates across 2024, 2025, and 2026, four strong predictions emerge about where search is heading in 2027 and beyond. These are not speculation — they are extrapolations of trends that are already measurable and accelerating.</p>
<h2>Prediction 1: Entity-Based Search Will Dominate Keyword-Based SEO</h2>
<p>Google is accelerating its transition from keyword matching to entity recognition. By 2027, ranking for competitive queries will increasingly depend on whether Google\'s Knowledge Graph recognises your site, your authors, your brand, and your subject matter as established, connected entities — not just on keyword placement and density. The June 2025 Author Entity Score was an early implementation of this direction. In 2027, entity signals will extend to organisations, products, topics, and locations. Building entity associations now (Wikipedia entries, Wikidata records, consistent structured data with sameAs markup pointing to authoritative external profiles) will pay compounding dividends throughout 2027 and beyond.</p>
<h2>Prediction 2: Agentic AI Will Create New Search Behaviour Patterns</h2>
<p>AI agents that autonomously browse the web on behalf of users (Google\'s Project Mariner, and similar agentic systems) will become mainstream consumer products by mid-2027. These agents will prefer sites with clear structured data, machine-readable content formats, and authoritative factual claims — because they need to reliably extract and synthesise information, not just read engaging prose. Sites that structure their content for both human readers and AI agent comprehension will see new traffic streams that do not originate from traditional search. Investing in structured data, clear factual formatting, and API accessibility now positions sites well for this emerging traffic source.</p>
<h2>Prediction 3: Video SEO Will Become Non-Optional in Most Niches</h2>
<p>Google\'s multimodal signals, introduced in the January 2026 Core Update, are the precursor to a world where video content is indexed, evaluated, and ranked as comprehensively as text. By 2027, in most competitive niches, publishing companion video content for your highest-value articles will likely become a competitive necessity rather than an enhancement. Sites that have already built YouTube channels aligned with their content strategy will have a substantial head start. Start building video content now — even simple screen recordings or talking-head explanations — so you have a content library and channel authority by the time video signals become definitively decisive.</p>
<h2>Prediction 4: First-Party Data Will Become the Ultimate SEO Moat</h2>
<p>As zero-click search continues to grow and AI Overviews capture an increasing proportion of informational query clicks, the most valuable outcome from SEO will increasingly be driving first-party data collection — email newsletter subscribers, app installs, community members, registered platform users — rather than anonymous pageviews. Sites with strong owned audiences will be substantially insulated from algorithmic volatility in ways that purely traffic-dependent ad-supported sites cannot be. The publishers who thrive in 2027 will be those who used SEO traffic in 2024–2026 to build lasting, owned relationships with readers — not just to serve programmatic ads to anonymous visitors. Start building your email list, community, and membership offerings now. Your future SEO strategy depends on it.</p>',
  '2026-09-19 12:00:00', '2026-09-19 12:00:00');


-- ============================================================
-- 4. INSERT meta entries for new individual posts
--    URL pattern: seo/web-seo/{uri with spaces → dashes}
-- ============================================================

INSERT INTO `meta` (`page_url`, `meta_title`, `meta_desc`, `added_date`, `updated_date`) VALUES
('seo/web-seo/march-2024-core-update-full-impact-report',
 'March 2024 Core Update: Full Impact Report | Imperialpedia',
 'Complete analysis of Google\'s March 2024 Core Update (45 days, March 5–April 19). Who was affected, why AI content and parasite SEO were targeted, and step-by-step recovery strategy.',
 '2026-09-19 12:00:00', '2026-09-19 12:00:00'),

('seo/web-seo/google-ai-overviews-2024-seo-traffic-impact',
 'Google AI Overviews 2024: SEO Traffic Impact Explained | Imperialpedia',
 'How Google\'s AI Overviews changed click-through rates across all query types, how to get cited in AI Overviews, and how to adapt your SEO strategy for a zero-click search era.',
 '2026-09-19 12:00:00', '2026-09-19 12:00:00'),

('seo/web-seo/august-2024-core-update-small-publishers-win',
 'August 2024 Core Update: Small Publishers Win | Imperialpedia',
 'The August 2024 Core Update reversed fortunes for small independent publishers. Google\'s 23-question self-assessment framework explained, with the UX signals that now determine rankings.',
 '2026-09-19 12:00:00', '2026-09-19 12:00:00'),

('seo/web-seo/e-e-a-t-2025-2026-complete-implementation-guide',
 'E-E-A-T 2025–2026: Complete Implementation Guide | Imperialpedia',
 'The definitive step-by-step guide to implementing all four pillars of Google\'s E-E-A-T framework — Experience, Expertise, Authoritativeness, and Trustworthiness — with specific, actionable tactics.',
 '2026-09-19 12:00:00', '2026-09-19 12:00:00'),

('seo/web-seo/june-2025-core-update-author-credibility-determines-rankings',
 'June 2025 Core Update: Author Credibility Determines Rankings | Imperialpedia',
 'How the June 2025 Core Update made author Entity Scores a direct ranking input. What the Author Entity Score measures, how to build it, and how to implement content freshness cycles.',
 '2026-09-19 12:00:00', '2026-09-19 12:00:00'),

('seo/web-seo/google-ai-content-policy-2025-2026-what-is-allowed',
 'Google AI Content Policy 2025–2026: What\'s Allowed | Imperialpedia',
 'Exactly what Google\'s AI content policy allows and prohibits after the March 2026 Zero Tolerance AI Spam Update. Includes the compliant AI content editorial workflow for 2026.',
 '2026-09-19 12:00:00', '2026-09-19 12:00:00'),

('seo/web-seo/link-building-2025-2026-what-still-works-google-updates',
 'Link Building in 2025–2026: What Still Works | Imperialpedia',
 'After the November 2025 Link Quality Update introduced Link Relevance Decay, which link building tactics still generate real ranking power? Complete guide to earning algorithm-proof links.',
 '2026-09-19 12:00:00', '2026-09-19 12:00:00'),

('seo/web-seo/technical-seo-2026-core-web-vitals-schema-multimodal',
 'Technical SEO 2026: Core Web Vitals, Schema & Multimodal | Imperialpedia',
 'The complete 2026 technical SEO guide: INP, LCP, CLS thresholds; Schema markup for AI Overview citation; and multimodal content optimisation requirements after the January 2026 Core Update.',
 '2026-09-19 12:00:00', '2026-09-19 12:00:00'),

('seo/web-seo/may-2026-core-update-user-intent-3.0-12-category-framework',
 'May 2026 Core Update — User Intent 3.0: 12 Categories | Imperialpedia',
 'Google\'s May 2026 Core Update expanded query intent from 4 to 12 categories. Full taxonomy explained with practical content strategy guidance for each intent type.',
 '2026-09-19 12:00:00', '2026-09-19 12:00:00'),

('seo/web-seo/content-strategy-2026-topical-authority-survives-google-updates',
 'Content Strategy 2026: Topical Authority That Survives Updates | Imperialpedia',
 'How to build Google-proof topical authority in 2026. Content cluster architecture, the quarterly content audit framework, publishing cadence strategy, and why depth beats breadth.',
 '2026-09-19 12:00:00', '2026-09-19 12:00:00'),

('seo/web-seo/august-2026-core-update-content-provenance-source-transparency-ranks',
 'August 2026 Core Update: Content Provenance & Source Transparency | Imperialpedia',
 'Google\'s August 2026 Core Update rewards content provenance — traceable, transparent, originally-sourced content. What provenance signals are and exactly how to build them into your editorial process.',
 '2026-09-19 12:00:00', '2026-09-19 12:00:00'),

('seo/web-seo/seo-2027-predictions-google-algorithmic-direction-future',
 'SEO in 2027: 4 Predictions Based on Google\'s Direction | Imperialpedia',
 'Four evidence-based SEO predictions for 2027: entity-based search dominance, agentic AI browsing, mandatory video SEO, and first-party data as the ultimate ranking moat.',
 '2026-09-19 12:00:00', '2026-09-19 12:00:00');


-- ============================================================
-- Verify everything was inserted correctly:
--   SELECT sub_cat_id, sub_cat_name, CHAR_LENGTH(sub_cat_desc)
--     FROM sub_category WHERE sub_cat_id = 108;
--   SELECT post_id, post_title FROM post WHERE sub_cat_id = 108
--     ORDER BY post_id;
--   SELECT page_url FROM meta WHERE page_url LIKE 'seo/web-seo%'
--     ORDER BY page_url;
-- ============================================================
