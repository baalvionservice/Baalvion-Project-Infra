<!-- Imperialpedia NY Post & Page Six Inspired Homepage Design (Ultimate Edition) -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Oswald:wght@500;600;700&display=swap" media="print" onload="this.media='all'">

<style>
/* --- BASE TYPOGRAPHY & COLOR SYSTEM --- */
:root {
  --p6-black: #0c0d0e;
  --p6-dark: #121418;
  --p6-red: #e50914;
  --p6-red-dark: #b80710;
  --p6-accent: #05e5b5;
  --p6-blue: #0f52ba;
  --p6-gold: #f59e0b;
  --p6-gray-bg: #f7f9fa;
  --p6-border: #e2e8f0;
  --p6-text: #1a1a1a;
  --p6-muted: #64748b;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: var(--p6-text);
  background-color: #ffffff;
}

.p6-font-serif {
  font-family: 'Playfair Display', Georgia, serif;
}

.p6-font-headline {
  font-family: 'Oswald', 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: -0.02em;
}

/* --- TOP BREAKING TICKER & MARKET PULSE BAR --- */
.p6-top-ticker {
  background: var(--p6-black);
  color: #fff;
  font-size: 0.82rem;
  padding: 8px 0;
  border-bottom: 2px solid var(--p6-red);
}

.p6-ticker-badge {
  background: var(--p6-red);
  color: #fff;
  font-weight: 800;
  text-transform: uppercase;
  font-size: 0.72rem;
  padding: 3px 8px;
  border-radius: 2px;
  letter-spacing: 0.05em;
  display: inline-block;
  margin-right: 12px;
}

.p6-ticker-item {
  color: #e2e8f0;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.p6-ticker-item:hover {
  color: var(--p6-accent);
  text-decoration: underline;
}

.p6-market-bar {
  background: #090d16;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.p6-market-item {
  margin-right: 18px;
}

.p6-market-item span.up { color: #10b981; }
.p6-market-item span.val { color: #ffffff; font-weight: 700; }

/* --- MASTHEAD BAR --- */
.p6-masthead {
  border-bottom: 1px solid var(--p6-border);
  padding: 20px 0 14px 0;
  background: #fff;
}

.p6-masthead-title {
  font-family: 'Oswald', sans-serif;
  font-size: 3rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  color: var(--p6-black);
  line-height: 1;
}

.p6-masthead-tagline {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--p6-muted);
  font-weight: 600;
}

.p6-date-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--p6-red);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* --- QUICK CATEGORY FILTER BAR --- */
.p6-filter-bar {
  background: #ffffff;
  border-bottom: 2px solid var(--p6-black);
  padding: 10px 0;
  overflow-x: auto;
  white-space: nowrap;
}

.p6-filter-pill {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--p6-black);
  text-decoration: none;
  padding: 5px 14px;
  border-radius: 20px;
  background: #f1f5f9;
  margin-right: 8px;
  transition: all 0.2s ease;
  letter-spacing: 0.03em;
}

.p6-filter-pill:hover, .p6-filter-pill.active {
  background: var(--p6-black);
  color: #ffffff;
}

.p6-filter-pill.pill-red {
  background: rgba(229, 9, 20, 0.1);
  color: var(--p6-red);
}

.p6-filter-pill.pill-red:hover {
  background: var(--p6-red);
  color: #fff;
}

/* --- ALGORITHM QUICK STATS TICKER STRIP --- */
.p6-stats-strip {
  background: #0f172a;
  color: #f8fafc;
  padding: 12px 0;
  border-bottom: 3px solid var(--p6-red);
}

.p6-stat-card {
  border-right: 1px solid rgba(255,255,255,0.1);
  padding: 4px 16px;
}

.p6-stat-card:last-child {
  border-right: none;
}

.p6-stat-label {
  font-size: 0.68rem;
  font-weight: 800;
  color: var(--p6-accent);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.p6-stat-val {
  font-size: 0.88rem;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.2;
}

/* --- CATEGORY SECTION HEADERS --- */
.p6-section-header {
  border-bottom: 3px solid var(--p6-black);
  margin-bottom: 20px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 6px;
}

.p6-section-title {
  font-family: 'Oswald', sans-serif;
  font-size: 1.45rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  color: var(--p6-black);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.p6-section-title::before {
  content: '';
  display: inline-block;
  width: 12px;
  height: 22px;
  background: var(--p6-red);
}

.p6-section-link {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--p6-red);
  text-decoration: none;
  letter-spacing: 0.05em;
}

.p6-section-link:hover {
  text-decoration: underline;
  color: var(--p6-red-dark);
}

/* --- HERO LEAD ARTICLE (NY POST STYLE) --- */
.p6-hero-card {
  text-decoration: none;
  color: inherit;
  display: block;
}

.p6-hero-img-wrap {
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  aspect-ratio: 16/9;
  background: #000;
}

.p6-hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.p6-hero-card:hover .p6-hero-img {
  transform: scale(1.03);
}

.p6-cat-badge {
  display: inline-block;
  background: var(--p6-red);
  color: #fff;
  font-weight: 800;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 3px 8px;
  margin-bottom: 8px;
  border-radius: 2px;
}

.p6-cat-badge-blue {
  background: var(--p6-blue);
}

.p6-hero-headline {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 2.2rem;
  font-weight: 900;
  line-height: 1.15;
  color: var(--p6-black);
  margin-top: 12px;
  margin-bottom: 10px;
  transition: color 0.2s;
}

.p6-hero-card:hover .p6-hero-headline {
  color: var(--p6-red);
  text-decoration: underline;
}

.p6-hero-excerpt {
  font-size: 0.95rem;
  color: #475569;
  line-height: 1.5;
  margin-bottom: 10px;
}

.p6-meta-byline {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--p6-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.p6-meta-byline span.author {
  color: var(--p6-black);
  font-weight: 700;
}

/* --- SECONDARY LEAD CARDS --- */
.p6-secondary-card {
  text-decoration: none;
  color: inherit;
  display: block;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--p6-border);
}

.p6-secondary-img-wrap {
  overflow: hidden;
  border-radius: 3px;
  aspect-ratio: 16/9;
  margin-bottom: 10px;
}

.p6-secondary-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.p6-secondary-card:hover .p6-secondary-img {
  transform: scale(1.04);
}

.p6-secondary-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--p6-black);
  margin-bottom: 6px;
}

.p6-secondary-card:hover .p6-secondary-title {
  color: var(--p6-red);
}

/* --- TRENDING SIDEBAR --- */
.p6-trending-box {
  background: var(--p6-dark);
  color: #fff;
  border-radius: 6px;
  padding: 20px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
}

.p6-trending-header {
  font-family: 'Oswald', sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #fff;
  border-bottom: 2px solid var(--p6-red);
  padding-bottom: 8px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.p6-trending-item {
  display: flex;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  text-decoration: none;
  color: inherit;
  align-items: flex-start;
}

.p6-trending-item:last-child {
  border-bottom: none;
}

.p6-trending-num {
  font-family: 'Oswald', sans-serif;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--p6-red);
  line-height: 1;
  min-width: 28px;
}

.p6-trending-title {
  font-size: 0.92rem;
  font-weight: 600;
  color: #f1f5f9;
  line-height: 1.35;
  transition: color 0.2s;
}

.p6-trending-item:hover .p6-trending-title {
  color: var(--p6-accent);
}

.p6-trending-meta {
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* --- PAGE SIX EXCLUSIVES INVESTIGATION BANNER --- */
.p6-exclusive-banner {
  background: linear-gradient(90deg, #0c0d0e 0%, #1e1b4b 50%, #0c0d0e 100%);
  color: #fff;
  padding: 32px 24px;
  border-radius: 8px;
  border: 1px solid rgba(245, 158, 11, 0.4);
  box-shadow: 0 12px 30px rgba(0,0,0,0.3);
  margin: 35px 0;
}

/* --- INTERACTIVE REVENUE CALCULATOR WIDGET --- */
.p6-calc-box {
  background: #ffffff;
  border: 2px solid var(--p6-black);
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.06);
}

.p6-calc-output {
  background: #0f172a;
  color: #05e5b5;
  font-family: 'Oswald', sans-serif;
  font-size: 2.4rem;
  font-weight: 700;
  padding: 16px;
  border-radius: 6px;
  text-align: center;
}

/* --- OPINION & COLUMNS ROW --- */
.p6-column-card {
  background: #ffffff;
  border: 1px solid var(--p6-border);
  border-radius: 6px;
  padding: 20px;
  height: 100%;
}

.p6-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--p6-red);
}

/* --- POLL WIDGET --- */
.p6-poll-box {
  background: #111827;
  color: #fff;
  border-radius: 8px;
  padding: 20px;
  border-left: 4px solid var(--p6-accent);
}

.p6-poll-btn {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  color: #fff;
  width: 100%;
  text-align: left;
  padding: 10px 14px;
  border-radius: 4px;
  font-size: 0.85rem;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.p6-poll-btn:hover {
  background: var(--p6-red);
  border-color: var(--p6-red);
}

/* --- MUST WATCH VIDEO HUB SECTION --- */
.p6-video-hub {
  background: #090a0f;
  color: #ffffff;
  padding: 40px 0;
  margin: 40px 0;
  border-top: 4px solid var(--p6-red);
  border-bottom: 4px solid var(--p6-red);
}

.p6-video-card {
  background: #151821;
  border-radius: 6px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  display: block;
  border: 1px solid rgba(255,255,255,0.08);
  transition: transform 0.3s;
}

.p6-video-card:hover {
  transform: translateY(-4px);
  border-color: var(--p6-red);
}

.p6-video-thumb {
  position: relative;
  aspect-ratio: 16/9;
  background: #000;
  overflow: hidden;
}

.p6-video-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.85;
}

.p6-play-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  background: rgba(229, 9, 20, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.4rem;
  box-shadow: 0 0 20px rgba(229, 9, 20, 0.6);
  transition: transform 0.2s;
}

.p6-video-card:hover .p6-play-btn {
  transform: translate(-50%, -50%) scale(1.15);
}

.p6-video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0,0,0,0.8);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
}

.p6-video-body {
  padding: 16px;
}

.p6-video-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.3;
  margin-bottom: 6px;
}

/* --- FEATURED GUIDEES ROW --- */
.p6-masterclass-card {
  background: #ffffff;
  border: 1px solid var(--p6-border);
  border-top: 4px solid var(--p6-red);
  border-radius: 6px;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.25s, box-shadow 0.25s;
  text-decoration: none;
  color: inherit;
}

.p6-masterclass-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.08);
  border-color: var(--p6-red);
}

.p6-masterclass-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--p6-black);
  line-height: 1.3;
  margin-bottom: 10px;
}

.p6-masterclass-desc {
  font-size: 0.85rem;
  color: var(--p6-muted);
  line-height: 1.45;
  margin-bottom: 14px;
}

/* --- TOPIC CLUSTER TAG MESH --- */
.p6-tag-mesh {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.p6-tag-item {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  background: #f1f5f9;
  color: var(--p6-black);
  padding: 6px 12px;
  border-radius: 4px;
  text-decoration: none;
  transition: background 0.2s;
}

.p6-tag-item:hover {
  background: var(--p6-red);
  color: #fff;
}

/* --- E-E-A-T TRUST & AUTHOR VERIFICATION BLOCK --- */
.p6-eeat-trust-box {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 24px;
  margin: 40px 0;
}

/* --- VIP NEWSLETTER CTA BOX --- */
.p6-newsletter-box {
  background: linear-gradient(135deg, #070d1f 0%, #172554 100%);
  color: #fff;
  border-radius: 12px;
  padding: 36px 28px;
  border: 2px solid var(--p6-accent);
  box-shadow: 0 20px 40px rgba(0,0,0,0.25);
  margin: 40px 0;
}

/* --- COMPACT HORIZONTAL ARTICLE LIST --- */
.p6-horizontal-article {
  display: flex;
  gap: 14px;
  text-decoration: none;
  color: inherit;
  padding: 12px 0;
  border-bottom: 1px solid var(--p6-border);
  align-items: center;
}

.p6-horizontal-img {
  width: 90px;
  height: 65px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
}

.p6-horizontal-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--p6-black);
  line-height: 1.25;
}

.p6-horizontal-article:hover .p6-horizontal-title {
  color: var(--p6-red);
}

/* RESPONSIVE */
@media (max-width: 991px) {
  .p6-hero-headline { font-size: 1.7rem; }
  .p6-masthead-title { font-size: 2.2rem; }
}
@media (max-width: 767px) { .p6-filter-bar { text-align: left !important; } .p6-masthead-title { font-size: 1.9rem; } }
</style>

<!-- TOP BREAKING TICKER BAR -->
<div class="p6-top-ticker">
  <div class="container d-flex align-items-center justify-content-between">
    <div class="d-flex align-items-center overflow-hidden text-nowrap">
      <span class="p6-ticker-badge">🔥 TRENDING EDITORIAL</span>
      <a href="<?php echo base_url(); ?>seo/web-seo" class="p6-ticker-item me-4">
        SEO & Google Algorithm Updates 2026: Complete Complete Guide
      </a>
      <a href="<?php echo base_url(); ?>seo/web-seo/march-2024-core-update-full-impact-report" class="p6-ticker-item me-4 d-none d-md-inline">
        March 2024 Core Update: HCP Sunset & Site Reputation Abuse Penalties
      </a>
    </div>
    <div class="d-none d-lg-block text-nowrap p6-date-badge">
      <?php echo date('l, F j, Y'); ?> | EDITORIAL ARCHIVE
    </div>
  </div>
</div>

<!-- MASTHEAD BANNER -->
<div class="p6-masthead text-center">
  <div class="container">
    <div class="p6-masthead-tagline mb-1">TECHNOLOGY, SEO &amp; DIGITAL PUBLISHING GUIDES</div>
    <a href="<?php echo base_url(); ?>" class="text-decoration-none">
      <h1 class="p6-masthead-title">IMPERIALPEDIA EDITORIAL</h1>
    </a>
    <div class="d-flex align-items-center justify-content-center gap-3 mt-2">
      
    </div>
  </div>
</div>

<!-- QUICK CATEGORY FILTER BAR -->
<div class="p6-filter-bar text-center">
  <div class="container">
    <a href="<?php echo base_url(); ?>" class="p6-filter-pill active">ALL STORIES</a>
    <a href="<?php echo base_url(); ?>seo/web-seo" class="p6-filter-pill pill-red">⚡ SEO &amp; ALGORITHMS (2026)</a>
    <a href="<?php echo base_url(); ?>seo/web-seo/high-traffic-low-competition-website-niches" class="p6-filter-pill">💰 HIGH-TRAFFIC NICHES ($1K–$10K/MO)</a>
    <a href="<?php echo base_url(); ?>seo/web-seo/youtube-seo-masterclass-rank-1-video-search" class="p6-filter-pill">▶️ YOUTUBE SEO GUIDE</a>
    <a href="<?php echo base_url(); ?>seo/web-seo" class="p6-filter-pill">🌐 GLOBAL VISAS &amp; IMMIGRATION</a>
    <a href="<?php echo base_url(); ?>seo/web-seo" class="p6-filter-pill">📈 MARKETS &amp; WEALTH</a>
  </div>
</div>

<!-- ALGORITHM QUICK-STATS TICKER STRIP -->
<div class="p6-stats-strip">
  <div class="container">
    <div class="row align-items-center text-center text-md-start">
      <div class="col-md-3 mb-2 mb-md-0">
        <a href="<?php echo base_url(); ?>seo/web-seo/march-2024-core-update-full-impact-report" class="p6-stat-card text-decoration-none d-block">
          <div class="p6-stat-label">🚨 MARCH 2024 UPDATE</div>
          <div class="p6-stat-val">HCP Sunset &amp; Reputation Abuse Penalty</div>
        </a>
      </div>
      <div class="col-md-3 mb-2 mb-md-0">
        <a href="<?php echo base_url(); ?>seo/web-seo/google-ai-overviews-zero-click-search-rules" class="p6-stat-card text-decoration-none d-block">
          <div class="p6-stat-label">🤖 MAY 2025 UPDATE</div>
          <div class="p6-stat-val">AI Overviews &amp; Zero-Click Search Rules</div>
        </a>
      </div>
      <div class="col-md-3 mb-2 mb-md-0">
        <a href="<?php echo base_url(); ?>seo/web-seo/august-2026-core-update-content-provenance-source-transparency" class="p6-stat-card text-decoration-none d-block">
          <div class="p6-stat-label">🛡️ AUGUST 2026 UPDATE</div>
          <div class="p6-stat-val">Content Provenance &amp; C2PA Verification</div>
        </a>
      </div>
      <div class="col-md-3">
        <a href="<?php echo base_url(); ?>seo/web-seo/high-traffic-low-competition-website-niches" class="p6-stat-card text-decoration-none d-block">
          <div class="p6-stat-label">💵 NICHE REVENUE TARGET</div>
          <div class="p6-stat-val">$1,000–$10,000 / Month Roadmap</div>
        </a>
      </div>
    </div>
  </div>
</div>

<!-- MAIN CONTENT GRID -->
<div class="container my-4">
  <div class="row g-4">
    
    <!-- LEFT & CENTER (COL-8): HERO & SECONDARY LEADS -->
    <div class="col-lg-8">
      
      <!-- HERO LEAD MAIN STORY -->
      <?php 
        $lead_post = !empty($latest_post[0]) ? $latest_post[0] : null;
        if($lead_post){
          $lead_cat_name = !empty($lead_post['cat_name']) ? $lead_post['cat_name'] : 'EDITORIAL';
          $lead_sub_cat = !empty($lead_post['sub_cat_name']) ? $lead_post['sub_cat_name'] : 'INSIGHTS';
          $lead_url = base_url().str_replace(' ','-',$lead_cat_name).'/'.str_replace(' ','-',$lead_sub_cat).'/'.str_replace(' ','-',$lead_post['uri']);
      ?>
      <div class="mb-4">
        <a href="<?php echo $lead_url; ?>" class="p6-hero-card">
          <div class="p6-hero-img-wrap">
            <img src="<?php echo (strpos($lead_post['post_img'], 'http') === 0) ? $lead_post['post_img'] : base_url().'uploads/post/'.$lead_post['post_img'].'?v=2'; ?>" alt="<?php echo htmlspecialchars($lead_post['post_title']); ?>" class="p6-hero-img" width="1280" height="720" fetchpriority="high" decoding="async">
          </div>
          <span class="p6-cat-badge mt-3"><?php echo strtoupper($lead_sub_cat); ?></span>
          <h2 class="p6-hero-headline"><?php echo ucfirst($lead_post['post_title']); ?></h2>
          <p class="p6-hero-excerpt">
            Read the full article from the Imperialpedia editorial desk.
          </p>
          <div class="p6-meta-byline">
            By <span class="author">Imperialpedia Editorial Desk</span> &bull; Updated <?php echo date('F d, Y', strtotime($lead_post['post_updated'])); ?>
          </div>
        </a>
      </div>
      <?php } ?>

      <hr class="my-4">

      <!-- SECONDARY LEADS GRID (2 COLUMNS) -->
      <div class="p6-section-header">
        <h3 class="p6-section-title">FEATURED ARTICLES</h3>
        <a href="<?php echo base_url(); ?>seo/web-seo" class="p6-section-link">View All SEO Guides &rarr;</a>
      </div>

      <div class="row g-3">
        <?php 
          $count = 0;
          foreach($unique_latest_posts as $ulp){
            if($lead_post && $ulp['post_title'] == $lead_post['post_title']){ continue; }
            if($count >= 4){ break; }
            $count++;
            
            $cat_name = 'FEATURED';
            $sub_cat_name = 'ARTICLE';
            foreach($cat_list as $cl){ if($cl['cat_id'] == $ulp['cat_id']){ $cat_name = $cl['cat_name']; } }
            foreach($subcat_list as $scl){ if($scl['sub_cat_id'] == $ulp['sub_cat_id']){ $sub_cat_name = $scl['sub_cat_name']; } }
            $post_url = base_url().str_replace(' ','-',$cat_name).'/'.str_replace(' ','-',$sub_cat_name).'/'.str_replace(' ','-',$ulp['uri']);
        ?>
        <div class="col-md-6">
          <a href="<?php echo $post_url; ?>" class="p6-secondary-card">
            <div class="p6-secondary-img-wrap">
              <img src="<?php echo (strpos($ulp['post_img'], 'http') === 0) ? $ulp['post_img'] : base_url().'uploads/post/'.$ulp['post_img'].'?v=2'; ?>" alt="<?php echo htmlspecialchars($ulp['post_title']); ?>" class="p6-secondary-img" width="640" height="360" loading="lazy" decoding="async">
            </div>
            <span class="p6-cat-badge p6-cat-badge-blue"><?php echo strtoupper($sub_cat_name); ?></span>
            <h4 class="p6-secondary-title"><?php echo ucfirst($ulp['post_title']); ?></h4>
            <div class="p6-meta-byline">
              Updated <?php echo date('M d, Y', strtotime($ulp['post_updated'])); ?>
            </div>
          </a>
        </div>
        <?php } ?>
      </div>

    </div>

    <!-- RIGHT COLUMN (COL-4): PAGE SIX STYLE TRENDING SIDEBAR & ADS -->
    <div class="col-lg-4">
      
      <!-- TRENDING SIDEBAR -->
      <div class="p6-trending-box mb-4">
        <div class="p6-trending-header">
          <span>🔥</span> LATEST ARTICLES
        </div>

        <?php 
          $trend_idx = 1;
          foreach(array_slice($unique_latest_posts, 0, 5) as $t_post){
            $t_sub_cat = 'MUST READ';
            foreach($subcat_list as $scl){ if($scl['sub_cat_id'] == $t_post['sub_cat_id']){ $t_sub_cat = $scl['sub_cat_name']; } }
            $t_cat = 'SEO';
            foreach($cat_list as $cl){ if($cl['cat_id'] == $t_post['cat_id']){ $t_cat = $cl['cat_name']; } }
            $t_url = base_url().str_replace(' ','-',$t_cat).'/'.str_replace(' ','-',$t_sub_cat).'/'.str_replace(' ','-',$t_post['uri']);
        ?>
        <a href="<?php echo $t_url; ?>" class="p6-trending-item">
          <div class="p6-trending-num">0<?php echo $trend_idx++; ?></div>
          <div>
            <div class="p6-trending-title"><?php echo ucfirst($t_post['post_title']); ?></div>
            <div class="p6-trending-meta"><?php echo strtoupper($t_sub_cat); ?></div>
          </div>
        </a>
        <?php } ?>
      </div>

      <!-- INTERACTIVE NICHE REVENUE CALCULATOR WIDGET -->
      <div class="p6-calc-box mb-4">
        <span class="badge bg-dark text-uppercase mb-2">INTERACTIVE TOOL</span>
        <h5 class="fw-bold mb-3 font-serif">🧮 Website Niche Revenue Calculator</h5>
        
        <div class="mb-3">
          <label class="form-label small fw-bold text-muted mb-1">MONTHLY SEARCH TRAFFIC: <span id="trafficVal" class="text-dark fw-bold">50,000</span> Visitors</label>
          <input type="range" class="form-range" id="trafficRange" aria-label="Monthly search traffic" min="5000" max="500000" step="5000" value="50000" oninput="calcRev()">
        </div>

        <div class="mb-3">
          <label class="form-label small fw-bold text-muted mb-1">NICHE RPM (EARNINGS PER 1K): <span id="rpmVal" class="text-dark fw-bold">$35</span></label>
          <input type="range" class="form-range" id="rpmRange" aria-label="Niche RPM" min="10" max="150" step="5" value="35" oninput="calcRev()">
        </div>

        <div class="p6-calc-output">
          <div class="text-white-50 small fw-bold text-uppercase" style="font-size:0.75rem;">ESTIMATED MONTHLY REVENUE</div>
          <span id="revResult">$1,750 / Mo</span>
        </div>
      </div>

      <!-- LIVE COMMUNITY POLL - Real votes saved to database -->
      <?php $poll_slug = 'homepage-algo-impact'; $this->load->view('includes/poll_widget'); ?>

      <!-- GUIDE PROMO WIDGET -->
      <div class="card border-0 bg-light p-3 mb-4 rounded-3 text-center border-start border-4 border-danger">
        <span class="badge bg-danger text-uppercase mb-2 align-self-center">NEW 2026 EDITION</span>
        <h5 class="fw-bold mb-2">SEO & Google Algorithm Guide</h5>
        <p class="small text-muted mb-3">Complete breakdown of all 12 Google Core Updates (2026) and zero-click AI search strategies.</p>
        <a href="<?php echo base_url(); ?>seo/web-seo" class="btn btn-dark btn-sm fw-bold uppercase">Explore Complete Hub &rarr;</a>
      </div>

    </div>

  </div>
</div>

<!-- TOPIC CLUSTER MESH & TAG CLOUD -->
<div class="container my-5">
  <div class="p6-section-header">
    <h3 class="p6-section-title">🏷️ TOPIC CLUSTER MESH &amp; SEARCH TAGS</h3>
  </div>

  <div class="p6-tag-mesh">
    <a href="<?php echo base_url(); ?>seo/web-seo" class="p6-tag-item">⚡ Google Core Updates</a>
    <a href="<?php echo base_url(); ?>seo/web-seo/march-2024-core-update-full-impact-report" class="p6-tag-item">🚨 Site Reputation Abuse</a>
    <a href="<?php echo base_url(); ?>seo/web-seo/high-traffic-low-competition-website-niches" class="p6-tag-item">💰 $1K–$10K/Mo Niches</a>
    <a href="<?php echo base_url(); ?>seo/web-seo/youtube-seo-masterclass-rank-1-video-search" class="p6-tag-item">▶️ YouTube Video SEO</a>
    <a href="<?php echo base_url(); ?>seo/web-seo" class="p6-tag-item">🤖 AI Overviews (SGE)</a>
    <a href="<?php echo base_url(); ?>seo/web-seo" class="p6-tag-item">🛡️ E-E-A-T Entity Graph</a>
    <a href="<?php echo base_url(); ?>seo/web-seo" class="p6-tag-item">🌐 Golden Visas 2026</a>
    <a href="<?php echo base_url(); ?>seo/web-seo" class="p6-tag-item">📜 Content Provenance C2PA</a>
    <a href="<?php echo base_url(); ?>seo/web-seo" class="p6-tag-item">📈 Zero-Click Monetization</a>
    <a href="<?php echo base_url(); ?>seo/web-seo" class="p6-tag-item">📊 Niche RPM Formulas</a>
  </div>
</div>

<!-- DEDICATED NICHE SECTION 1: SEO & GOOGLE ALGORITHM HUB -->
<div class="bg-light py-5 border-top border-bottom my-4">
  <div class="container">
    <div class="p6-section-header">
      <h3 class="p6-section-title">⚡ SEO &amp; GOOGLE ALGORITHM GUIDEES (2026)</h3>
      <a href="<?php echo base_url(); ?>seo/web-seo" class="p6-section-link">View All 12 Updates &rarr;</a>
    </div>

    <div class="row g-4">
      <div class="col-md-4">
        <a href="<?php echo base_url(); ?>seo/web-seo/march-2024-core-update-full-impact-report" class="p6-masterclass-card">
          <div>
            <span class="p6-cat-badge">2026 ALGORITHMS</span>
            <h4 class="p6-masterclass-title">SEO &amp; Google Algorithm Updates: Complete Guide (2026)</h4>
            <p class="p6-masterclass-desc">Comprehensive breakdown of all 12 major Google updates including HCP sunset, E-E-A-T, and Content Provenance.</p>
          </div>
          <div class="p6-meta-byline text-danger fw-bold">Read Guide Hub &rarr;</div>
        </a>
      </div>

      <div class="col-md-4">
        <a href="<?php echo base_url(); ?>seo/web-seo/high-traffic-low-competition-website-niches" class="p6-masterclass-card">
          <div>
            <span class="p6-cat-badge p6-cat-badge-blue">DIGITAL WEALTH</span>
            <h4 class="p6-masterclass-title">How to Pick High-Traffic, Low-Competition Website Niches ($1K–$10K/Mo)</h4>
            <p class="p6-masterclass-desc">Step-by-step keyword competition formulas, revenue math, and monetization stacking strategy for webmasters.</p>
          </div>
          <div class="p6-meta-byline text-danger fw-bold">Read Niche Blueprint &rarr;</div>
        </a>
      </div>

      <div class="col-md-4">
        <a href="<?php echo base_url(); ?>seo/web-seo/youtube-seo-masterclass-rank-1-video-search" class="p6-masterclass-card">
          <div>
            <span class="p6-cat-badge">VIDEO STRATEGY</span>
            <h4 class="p6-masterclass-title">YouTube SEO Masterclass: Rank #1 on YouTube &amp; Google Search</h4>
            <p class="p6-masterclass-desc">Audience retention triggers, CTR thumbnail formulas, video schema markup, and cross-platform authority growth.</p>
          </div>
          <div class="p6-meta-byline text-danger fw-bold">Read Video Guide &rarr;</div>
        </a>
      </div>
    </div>
  </div>
</div>

<!-- EDITORIAL HIGHLIGHTS — 6 cards (2 rows × 3) -->
<div class="container mb-5">
  <div class="p6-section-header d-flex align-items-center justify-content-between">
    <h3 class="p6-section-title mb-0">📰 IMPERIALPEDIA EDITORIAL ARCHIVE</h3>
    <a href="<?php echo base_url(); ?>search" class="btn btn-outline-dark btn-sm fw-bold" style="font-size:0.75rem; letter-spacing:0.5px;">VIEW ALL ARTICLES →</a>
  </div>

  <div class="row g-3 mt-1">
    <?php foreach(array_slice($unique_latest_posts, 2, 6) as $archive_post){ 
      $a_sub = 'EDITORIAL';
      foreach($subcat_list as $scl){ if($scl['sub_cat_id'] == $archive_post['sub_cat_id']){ $a_sub = $scl['sub_cat_name']; } }
      $a_cat = 'SEO';
      foreach($cat_list as $cl){ if($cl['cat_id'] == $archive_post['cat_id']){ $a_cat = $cl['cat_name']; } }
      $a_url = base_url().str_replace(' ','-',$a_cat).'/'.str_replace(' ','-',$a_sub).'/'.str_replace(' ','-',$archive_post['uri']);
    ?>
    <div class="col-md-6 col-lg-4">
      <a href="<?php echo $a_url; ?>" class="p6-horizontal-article">
        <img src="<?php echo base_url().'uploads/post/'.$archive_post['post_img'].'?v=2'; ?>" alt="<?php echo htmlspecialchars($archive_post['post_title']); ?>" class="p6-horizontal-img" width="90" height="65" loading="lazy" decoding="async">
        <div>
          <span class="badge bg-secondary mb-1" style="font-size:0.65rem;"><?php echo strtoupper($a_sub); ?></span>
          <div class="p6-horizontal-title"><?php echo ucfirst($archive_post['post_title']); ?></div>
        </div>
      </a>
    </div>
    <?php } ?>
  </div>

  <div class="text-center mt-4">
    <a href="<?php echo base_url(); ?>search" class="btn btn-dark px-5 py-2 fw-bold" style="font-family:'Oswald',sans-serif; letter-spacing:1px;">
      <i class="fa-solid fa-newspaper me-2"></i>EXPLORE FULL ARCHIVE
    </a>
  </div>
</div>

<script>
function calcRev() {
  var traffic = document.getElementById('trafficRange').value;
  var rpm = document.getElementById('rpmRange').value;
  document.getElementById('trafficVal').innerText = Number(traffic).toLocaleString();
  document.getElementById('rpmVal').innerText = '$' + rpm;
  var rev = (traffic / 1000) * rpm;
  document.getElementById('revResult').innerText = '$' + Number(rev).toLocaleString() + ' / Mo';
}

function votePoll(btn, resText) {
  document.getElementById('pollRes').innerText = '✅ Vote registered: (' + resText + ')';
  document.getElementById('pollRes').style.display = 'block';
}
</script>
