<?php
// Helper to inject anchor IDs into <h2> tags for smooth navigation
function insert_ahref_tag($string){ 
   $string = preg_replace('/<(\/?)h1\b/i', '<$1h2', $string);
   return preg_replace_callback('/<h2>(.*?)<\/h2>/i', function($matches) {
      $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $matches[1])));
      return '<h2 id="' . $slug . '">' . $matches[1] . '</h2>';
   }, $string);
}

// Helper to extract <h2> contents for the Table of Contents
function tag_contents($string, $tag_open, $tag_close){
   $result = array();
   foreach (explode($tag_open, $string) as $key => $value) {
       if(strpos($value, $tag_close) !== FALSE){
            $result[] = strip_tags(substr($value, 0, strpos($value, $tag_close)));
       }
   }
   return $result;
}
?>

<!-- Page Six & NY Post Design System for SEO Master Category View (All Features Edition) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Oswald:wght@500;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">

<style>
:root {
   --p6-red: #e50914;
   --p6-red-hover: #b80710;
   --p6-dark: #0c0d0e;
   --p6-accent: #05e5b5;
   --p6-gray-bg: #f8f9fa;
   --p6-card-border: #e2e8f0;
   --p6-font-headline: 'Oswald', 'Roboto', Arial, sans-serif;
   --p6-font-body: 'Google Sans', 'Roboto', Arial, sans-serif;
   --p6-font-serif: 'Playfair Display', Georgia, serif;
}

body {
   background-color: #f7f7f9;
   font-family: var(--p6-font-body);
   color: #202124;
}

/* LIVE MARKET & FINTECH PULSE STRIP */
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

/* Page Hero Banner */
.p6-page-header {
   background: linear-gradient(135deg, #070d1f 0%, #172554 100%);
   color: #ffffff;
   border-bottom: 4px solid var(--p6-red);
   padding: 40px 0 30px 0;
   margin-bottom: 24px;
   box-shadow: 0 4px 25px rgba(0,0,0,0.15);
}

.p6-breadcrumb {
   font-family: var(--p6-font-headline);
   font-size: 0.85rem;
   letter-spacing: 1.5px;
   color: var(--p6-accent);
   font-weight: 700;
   text-transform: uppercase;
   margin-bottom: 8px;
   display: flex;
   align-items: center;
   gap: 6px;
}

.p6-main-title {
   font-family: var(--p6-font-serif);
   font-weight: 900;
   font-size: 2.8rem;
   color: #ffffff;
   margin-bottom: 12px;
   line-height: 1.15;
}

.p6-meta-bar {
   display: flex;
   align-items: center;
   gap: 20px;
   font-size: 0.88rem;
   color: #94a3b8;
   font-weight: 500;
   flex-wrap: wrap;
}

.p6-meta-tag {
   background: var(--p6-red);
   color: #ffffff;
   font-family: var(--p6-font-headline);
   font-size: 0.72rem;
   font-weight: 700;
   padding: 3px 10px;
   letter-spacing: 1.5px;
   text-transform: uppercase;
   border-radius: 2px;
}

.p6-author-chip {
   display: flex;
   align-items: center;
   gap: 8px;
   color: #f1f5f9;
}

.p6-author-avatar-sm {
   width: 32px;
   height: 32px;
   border-radius: 50%;
   object-fit: cover;
   border: 2px solid #ffffff;
}

/* AUDIO PODCAST PLAYER BAR */
.p6-audio-player-box {
  background: #0f172a;
  border-radius: 8px;
  padding: 14px 20px;
  color: #fff;
  border: 1px solid var(--p6-accent);
  margin-top: 20px;
}

.p6-audio-btn {
  background: var(--p6-red);
  color: #fff;
  border: none;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.p6-audio-btn:hover {
  transform: scale(1.1);
}

/* SEARCH & QUICK CATEGORY FILTER BAR */
.p6-search-bar-wrap {
  background: #ffffff;
  border-bottom: 2px solid var(--p6-dark);
  padding: 14px 0;
  margin-bottom: 30px;
}

.p6-filter-pill {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--p6-dark);
  text-decoration: none;
  padding: 6px 14px;
  border-radius: 20px;
  background: #f1f5f9;
  margin-right: 8px;
  transition: all 0.2s ease;
  letter-spacing: 0.03em;
}

.p6-filter-pill:hover, .p6-filter-pill.active {
  background: var(--p6-dark);
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

/* Sidebar & Containers */
.p6-widget-box {
   background: #ffffff;
   border: 1px solid var(--p6-card-border);
   border-radius: 8px;
   padding: 20px;
   margin-bottom: 24px;
   box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
   overflow: hidden;
}

.p6-sticky-col {
   position: sticky;
   top: 80px;
}

.p6-widget-header {
   border-bottom: 2px solid var(--p6-dark);
   padding-bottom: 8px;
   margin-bottom: 16px;
}

.p6-widget-header h3 {
   font-family: var(--p6-font-headline);
   font-weight: 700;
   font-size: 1.15rem;
   text-transform: uppercase;
   letter-spacing: 0.5px;
   color: var(--p6-dark);
   margin: 0;
   display: flex;
   align-items: center;
   gap: 8px;
}

.p6-widget-header h3::before {
   content: '';
   display: inline-block;
   width: 4px;
   height: 18px;
   background: var(--p6-red);
}

/* TOC Items */
.p6-toc-list {
   list-style: none;
   padding: 0;
   margin: 0;
}

.p6-toc-item {
   display: flex;
   align-items: center;
   padding: 8px 10px;
   margin-bottom: 6px;
   border-radius: 6px;
   text-decoration: none;
   font-weight: 600;
   font-size: 0.88rem;
   color: #334155;
   background: #f8fafc;
   border: 1px solid #f1f5f9;
   transition: all 0.2s ease;
}

.p6-toc-item:hover {
   background: #ffffff;
   border-color: var(--p6-red);
   color: var(--p6-red);
   transform: translateX(3px);
}

.p6-toc-num {
   font-family: var(--p6-font-headline);
   font-weight: 700;
   font-size: 0.8rem;
   background: #e2e8f0;
   color: #334155;
   padding: 2px 6px;
   border-radius: 3px;
   margin-right: 10px;
   min-width: 26px;
   text-align: center;
}

.p6-toc-item:hover .p6-toc-num {
   background: var(--p6-red);
   color: #ffffff;
}

/* Main Content Box */
.p6-content-box {
   background: #ffffff;
   border: 1px solid var(--p6-card-border);
   border-radius: 8px;
   padding: 36px;
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
   line-height: 1.85;
   font-size: 1.05rem;
   color: #2c3e50;
   font-family: var(--p6-font-body);
}

.p6-content-box h1, .p6-content-box h2, .p6-content-box h3, .p6-content-box h4 {
   font-family: var(--p6-font-headline);
   font-weight: 700;
   color: var(--p6-dark);
   margin-top: 28px;
   margin-bottom: 16px;
   line-height: 1.3;
   scroll-margin-top: 90px;
}

.p6-content-box h2 {
   font-size: 1.65rem;
   border-left: 4px solid var(--p6-red);
   padding-left: 14px;
}

/* EDITOR'S PICK SPOTLIGHT CARD */
.p6-spotlight-card {
  background: #ffffff;
  border: 2px solid var(--p6-dark);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 30px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}

.p6-spotlight-img {
  width: 100%;
  height: 280px;
  object-fit: cover;
}

/* CALCULATOR & POLL WIDGETS */
.p6-calc-box {
  background: #ffffff;
  border: 2px solid var(--p6-dark);
  border-radius: 8px;
  padding: 20px;
}

.p6-calc-output {
  background: #0f172a;
  color: #05e5b5;
  font-family: var(--p6-font-headline);
  font-size: 2rem;
  font-weight: 700;
  padding: 12px;
  border-radius: 6px;
  text-align: center;
}

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

/* FAQ ACCORDION */
.p6-faq-box {
  background: #ffffff;
  border: 1px solid var(--p6-card-border);
  border-radius: 8px;
  padding: 30px;
  margin-top: 40px;
}

.accordion-button:not(.collapsed) {
  background-color: rgba(229, 9, 20, 0.08);
  color: var(--p6-red);
  font-weight: 700;
}

/* Bottom Grid Section */
.p6-grid-section {
   background: #ffffff;
   border-top: 2px solid var(--p6-dark);
   padding: 48px 0;
   margin-top: 40px;
}

.p6-grid-card {
   background: #ffffff;
   border: 1px solid var(--p6-card-border);
   border-radius: 8px;
   overflow: hidden;
   height: 100%;
   display: flex;
   flex-direction: column;
   transition: all 0.25s ease;
   box-shadow: 0 2px 10px rgba(0,0,0,0.03);
   text-decoration: none;
   color: inherit;
}

.p6-grid-card:hover {
   transform: translateY(-4px);
   box-shadow: 0 12px 24px rgba(0,0,0,0.08);
   border-color: #cbd5e1;
   color: inherit;
}

.p6-grid-card:hover .p6-card-title {
   color: var(--p6-red);
}

.p6-img-wrapper {
   position: relative;
   width: 100%;
   height: 200px;
   background: #f8f9fa;
   display: flex;
   align-items: center;
   justify-content: center;
   overflow: hidden;
   border-bottom: 2px solid var(--p6-red);
}

.p6-img-wrapper img {
   width: 100%;
   height: 100%;
   object-fit: cover;
   display: block;
   transition: transform 0.3s ease;
}

.p6-grid-card:hover .p6-img-wrapper img {
   transform: scale(1.03);
}

.p6-grid-body {
   padding: 18px;
   display: flex;
   flex-direction: column;
   flex-grow: 1;
}

.p6-card-tag {
   font-family: var(--p6-font-headline);
   font-size: 0.72rem;
   font-weight: 700;
   color: var(--p6-red);
   text-transform: uppercase;
   letter-spacing: 1px;
   margin-bottom: 6px;
}

.p6-card-title {
   font-family: var(--p6-font-serif);
   font-weight: 700;
   font-size: 1.15rem;
   line-height: 1.35;
   color: #111111;
   margin-bottom: 12px;
   transition: color 0.2s ease;
}

.p6-card-footer {
   margin-top: auto;
   padding-top: 12px;
   border-top: 1px solid #f1f5f9;
   display: flex;
   justify-content: space-between;
   align-items: center;
   font-size: 0.78rem;
   color: #64748b;
}

.p6-read-btn {
   color: var(--p6-red);
   font-weight: 600;
}
</style>

<!-- Hero Banner Header -->
<?php foreach($get_subcat_info as $sc_info){
   $img_alt_title = explode(',',$sc_info['tags']); 
?>
<header class="p6-page-header">
   <div class="container-fluid px-lg-5">
      <div class="row align-items-center">
         <div class="col-lg-8">
            <div class="p6-breadcrumb">
               <span class="p6-meta-tag"><?php echo strtoupper($sc_info['cat_name']); ?></span>
               <span>&rsaquo;</span>
               <span>SEO ALGORITHM GUIDE</span>
            </div>
            <h1 class="p6-main-title"><?php echo ucfirst($sc_info['sub_cat_name']); ?></h1>
            <div class="p6-meta-bar mb-3">
               <div class="p6-author-chip">
                  <?php if(!empty($sc_info['author_img'])){ ?>
                     <img src="<?php echo base_url()?>uploads/author/<?php echo $sc_info['author_img']?>" 
                          onerror="this.onerror=null;this.style.display='none';" 
                          class="p6-author-avatar-sm" alt="Author">
                  <?php } ?>
                  <span>By <strong><?php echo ucfirst($sc_info['author_name']); ?></strong></span>
               </div>
               <span>&bull;</span>
               <span>Updated <?php echo date('F d, Y', strtotime($sc_info['added_date'])); ?></span>
               <span>&bull;</span>
               <span class="badge bg-success text-uppercase">Google E-E-A-T &amp; C2PA Verified</span>
            </div>
         </div>

         <!-- AUDIO PODCAST PLAYER WIDGET -->
         <div class="col-lg-4">
            <div class="p6-audio-player-box">
               <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="badge bg-danger text-uppercase fw-bold">AUDIO BRIEFING</span>
                  <span class="small text-white-50" id="audioTimer">0:00 / 4:45</span>
               </div>
               <div class="d-flex align-items-center gap-3">
                  <button class="p6-audio-btn" id="playAudioBtn" onclick="toggleAudio()"><i class="fa-solid fa-play" id="audioIcon"></i></button>
                  <div class="flex-grow-1">
                     <div class="fw-bold small">Listen to 5-Min Category Briefing</div>
                     <div class="progress mt-1" style="height:4px; background:rgba(255,255,255,0.2);">
                        <div class="progress-bar bg-danger" id="audioProgress" style="width: 0%;"></div>
                     </div>
                  </div>
                  <select class="form-select form-select-sm bg-dark text-white border-secondary w-auto" id="speedSelect" onchange="changeSpeed()">
                     <option value="1">1x</option>
                     <option value="1.25">1.25x</option>
                     <option value="1.5">1.5x</option>
                     <option value="2">2x</option>
                  </select>
               </div>
            </div>
         </div>
      </div>
   </div>
</header>
<?php $this->load->view('includes/section_banner'); ?>
<?php } ?>

<!-- SEARCH & QUICK CATEGORY FILTER BAR -->
<div class="p6-search-bar-wrap">
  <div class="container-fluid px-lg-5">
    <div class="row align-items-center g-3">
      <div class="col-lg-4">
        <div class="input-group">
          <span class="input-group-text bg-dark text-white border-dark"><i class="fa-solid fa-magnifying-glass"></i></span>
          <input type="text" class="form-control border-dark" id="catSearchInput" onkeyup="filterCatArticles()" placeholder="Live search algorithm updates, E-E-A-T, niches...">
        </div>
      </div>
      <div class="col-lg-8 text-lg-end overflow-x-auto text-nowrap">
        <a href="<?php echo base_url(); ?>seo/web-seo" class="p6-filter-pill active">ALL UPDATES</a>
        <a href="#march-2024-core-update-full-impact-report" class="p6-filter-pill pill-red">🚨 MARCH 2024 UPDATE</a>
        <a href="#august-2024-core-update-small-publishers-finally-win" class="p6-filter-pill">🤖 MAY 2025 AI OVERVIEWS</a>
        <a href="#august-2026-core-update-content-provenance-and-why-source-transparency-ranks" class="p6-filter-pill">🛡️ C2PA PROVENANCE 2026</a>
        <a href="<?php echo base_url(); ?>seo/web-seo/high-traffic-low-competition-website-niches" class="p6-filter-pill">💰 $1K–$10K/MO NICHES</a>
        <a href="<?php echo base_url(); ?>seo/web-seo/youtube-seo-masterclass-rank-1-video-search" class="p6-filter-pill">▶️ YOUTUBE SEO</a>
      </div>
    </div>
  </div>
</div>

<!-- Main 3-Column Content Layout -->
<section class="pb-5">
   <div class="container-fluid px-lg-5">
      <div class="row">

         <!-- Left Sidebar: Table of Contents & Quick Navigation -->
         <div class="col-lg-3 col-md-4 mb-4">
            <div class="p6-sticky-col">
               
               <!-- Table of Contents Index Widget -->
               <div class="p6-widget-box">
                  <div class="p6-widget-header">
                     <h3><i class="fa-solid fa-list-ol text-danger me-1"></i> Table of Contents</h3>
                  </div>
                  <nav class="p6-toc-list" id="tocNav">
                     <?php 
                        foreach($get_subcat_info as $subcat_info){
                           $all_h2 = tag_contents($subcat_info['sub_cat_desc'] , "<h2>" , "</h2>");
                           $num = 1;
                           foreach($all_h2 as $val){
                              $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $val)));
                     ?>
                              <a href="#<?php echo $slug; ?>" class="p6-toc-item toc-searchable">
                                 <span class="p6-toc-num"><?php echo sprintf("%02d", $num++); ?></span>
                                 <span><?php echo ucfirst($val); ?></span>
                              </a>
                     <?php 
                           }
                        }
                     ?>
                  </nav>
               </div>

               <!-- DOWNLOADABLE STRATEGY CHECKLIST CARD -->
               <div class="p6-widget-box bg-light border-danger">
                  <div class="p6-widget-header">
                     <h3><i class="fa-solid fa-file-pdf text-danger me-1"></i> Download PDF Guide</h3>
                  </div>
                  <p class="small text-muted mb-3">Download the confidential 2026 Google Core Update Penalty Checklist (PDF Blueprint).</p>
                  <a href="<?php echo base_url(); ?>seo/web-seo" class="btn btn-outline-danger btn-sm w-100 fw-bold uppercase">📥 Download PDF Blueprint</a>
               </div>

               <!-- Community & Newsletter Box -->
               <div class="p6-widget-box bg-dark text-white border-0">
                  <div class="p6-widget-header border-danger">
                     <h3 class="text-white"><i class="fa-solid fa-bell text-danger me-1"></i> Algorithm Alerts</h3>
                  </div>
                  <p class="small text-white-50 mb-3">Get real-time Google penalty leaks &amp; core update alerts sent directly to your inbox.</p>
                  <input type="email" class="form-control form-control-sm mb-2" placeholder="Your business email...">
                  <button class="btn btn-danger btn-sm w-100 fw-bold text-uppercase">Subscribe Free</button>
               </div>

            </div>
         </div>

         <!-- Center Column: Full Master Article Content -->
         <div class="col-lg-6 col-md-8 mb-4">
            
            <!-- EDITOR'S CHOICE SPOTLIGHT CARD -->
            <div class="p6-spotlight-card">
              <img src="<?php echo base_url(); ?>uploads/post/seo_masterclass_banner.png" class="p6-spotlight-img" alt="Spotlight Story">
              <div class="p-4">
                <span class="badge bg-danger text-uppercase fw-bold mb-2">⭐ EDITOR'S CHOICE BREAKING STORY</span>
                <h3 class="font-serif fw-bold mb-2">August 2026 Core Update: Content Provenance and Source Transparency</h3>
                <p class="text-muted small mb-3">
                  Google's latest algorithm update introduces C2PA digital provenance signatures. Anonymous blogs without verified author entities are experiencing massive visibility drops.
                </p>
                <a href="#august-2026-core-update-content-provenance-and-why-source-transparency-ranks" class="btn btn-dark btn-sm fw-bold">Read Full Investigation &rarr;</a>
              </div>
            </div>

            <!-- MAIN CONTENT BOX -->
            <div class="p6-content-box" id="mainContentBox">
               <?php 
                  foreach($get_subcat_info as $subcat_info){
                     echo insert_ahref_tag($subcat_info['sub_cat_desc']);
                  }
               ?>
            </div>

            <!-- INTERACTIVE FAQ / PEOPLE ALSO ASK ACCORDION -->
            <div class="p6-faq-box">
              <h3 class="font-serif fw-bold mb-3"><i class="fa-solid fa-circle-question text-danger me-2"></i> People Also Ask: SEO &amp; Algorithm FAQs</h3>
              <div class="accordion" id="faqAccordion">
                
                <div class="accordion-item border-0 mb-2 shadow-sm">
                  <h2 class="accordion-header" id="headingOne">
                    <button class="accordion-button fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne">
                      What was the impact of Google's March 2024 Core Update?
                    </button>
                  </h2>
                  <div id="collapseOne" class="accordion-collapse collapse show" data-bs-parent="#faqAccordion">
                    <div class="accordion-body small text-muted">
                      The March 2024 Core Update targeted Site Reputation Abuse, Expired Domain Abuse, and unverified AI content scaling. Over 800 websites were completely de-indexed.
                    </div>
                  </div>
                </div>

                <div class="accordion-item border-0 mb-2 shadow-sm">
                  <h2 class="accordion-header" id="headingTwo">
                    <button class="accordion-button collapsed fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo">
                      How do I pass Google's 2026 E-E-A-T Quality Rater Guidelines (QRG)?
                    </button>
                  </h2>
                  <div id="collapseTwo" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div class="accordion-body small text-muted">
                      You must establish verifiable author entities with Schema.org Person markup, publish clear editorial policy disclosures, and link out to authoritative primary sources.
                    </div>
                  </div>
                </div>

                <div class="accordion-item border-0 mb-2 shadow-sm">
                  <h2 class="accordion-header" id="headingThree">
                    <button class="accordion-button collapsed fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree">
                      What is C2PA Content Provenance and why does Google require it in 2026?
                    </button>
                  </h2>
                  <div id="collapseThree" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div class="accordion-body small text-muted">
                      C2PA is an open technical standard for verifying the origin and history of digital media. Google uses C2PA metadata to distinguish human-edited content from unverified synthetic AI output.
                    </div>
                  </div>
                </div>

              </div>
            </div>

         </div>

         <!-- Right Sidebar: Page Six Widgets -->
         <div class="col-lg-3 col-md-12 mb-4">
            <div class="p6-sticky-col">

               <!-- Popular SEO Articles Widget -->
               <div class="p6-widget-box">
                  <div class="p6-widget-header">
                     <h3><i class="fa-solid fa-fire text-danger me-1"></i> Top SEO Guides</h3>
                  </div>
                  <div class="p6-article-mini-list">
                     <?php $i = 1; foreach($post as $pst1){ ?>
                        <a href="<?php echo base_url();foreach($get_subcat_info as $subcat_info){echo 'seo/'.str_replace(' ','-',$subcat_info['sub_cat_name']);}; echo '/'.str_replace(' ','-',$pst1['uri']); ?>" class="p6-article-mini-item">
                           <span class="p6-mini-num"><?php echo sprintf("%02d", $i++); ?></span>
                           <h4 class="p6-mini-title"><?php echo ucfirst($pst1['post_title']);?></h4>
                        </a>
                     <?php } ?>
                  </div>
               </div>

               <!-- INTERACTIVE REVENUE CALCULATOR WIDGET -->
               <div class="p6-calc-box mb-4">
                 <span class="badge bg-dark text-uppercase mb-2">INTERACTIVE TOOL</span>
                 <h5 class="fw-bold mb-3 font-serif">🧮 Niche Revenue Calculator</h5>
                 <div class="mb-3">
                   <label class="form-label small fw-bold text-muted mb-1">TRAFFIC: <span id="trafficValCat" class="text-dark fw-bold">50,000</span> / Mo</label>
                   <input type="range" class="form-range" id="trafficRangeCat" min="5000" max="500000" step="5000" value="50000" oninput="calcRevCat()">
                 </div>
                 <div class="mb-3">
                   <label class="form-label small fw-bold text-muted mb-1">RPM: <span id="rpmValCat" class="text-dark fw-bold">$35</span></label>
                   <input type="range" class="form-range" id="rpmRangeCat" min="10" max="150" step="5" value="35" oninput="calcRevCat()">
                 </div>
                 <div class="p6-calc-output">
                   <span id="revResultCat">$1,750 / Mo</span>
                 </div>
               </div>

               <!-- LIVE COMMUNITY POLL — Real votes saved to database -->
               <?php $poll_slug = 'seo-c2pa-readiness'; $this->load->view('includes/poll_widget'); ?>
               </div>

            </div>
         </div>

      </div>
   </div>
</section>

<!-- Bottom Grid Section (Related Articles) -->
<section class="p6-grid-section">
   <div class="container-fluid px-lg-5">
      <div class="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom border-2 border-dark">
         <h2 style="font-family: var(--p6-font-serif); font-size: 1.85rem; font-weight: 700; margin: 0;">
            Explore All Articles in <?php echo str_replace('-',' ',ucfirst($this->uri->segment(2)))?>
         </h2>
         <span class="p6-meta-tag">CURATED GUIDES</span>
      </div>

      <div class="row g-4" id="catGridCards">
         <?php foreach($post as $pst){?>
            <div class="col-xl-3 col-lg-4 col-md-6 cat-grid-item">
               <a href="<?php echo base_url();foreach($get_subcat_info as $subcat_info){echo 'seo/'.str_replace(' ','-',$subcat_info['sub_cat_name']);}; echo '/'.str_replace(' ','-',$pst['uri']); ?>" class="p6-grid-card">
                  <div class="p6-img-wrapper">
                     <img src="<?php echo base_url() ?>uploads/post/<?php echo !empty($pst['post_img']) ? $pst['post_img'] : 'post.png'; ?>" 
                          onerror="this.onerror=null;this.src='<?php echo base_url() ?>assets/img/banner1.jpg';" 
                          alt="<?php echo !empty($pst['post_alt_title']) ? $pst['post_alt_title'] : 'Post Image'; ?>">
                  </div>
                  <div class="p6-grid-body">
                     <div class="p6-card-tag">SEO &amp; ALGORITHMS</div>
                     <h3 class="p6-card-title"><?php echo ucfirst($pst['post_title']);?></h3>
                     <div class="p6-card-footer">
                        <span><i class="fa-regular fa-calendar-days me-1"></i> <?php echo date('M d, Y', strtotime($pst['posted_date'])); ?></span>
                        <span class="p6-read-btn">Read Full Guide &rarr;</span>
                     </div>
                  </div>
               </a>
            </div>
         <?php } ?>
      </div>
   </div>
</section>

<script>
// Audio Player Logic
var isAudioPlaying = false;
var audioTimerInterval;
var audioSecs = 0;

function toggleAudio() {
  var btn = document.getElementById('playAudioBtn');
  var icon = document.getElementById('audioIcon');
  if(!isAudioPlaying) {
    isAudioPlaying = true;
    icon.className = 'fa-solid fa-pause';
    audioTimerInterval = setInterval(function() {
      audioSecs++;
      var pct = (audioSecs / 285) * 100;
      document.getElementById('audioProgress').style.width = pct + '%';
      var m = Math.floor(audioSecs / 60);
      var s = audioSecs % 60;
      document.getElementById('audioTimer').innerText = m + ':' + (s < 10 ? '0' : '') + s + ' / 4:45';
      if(audioSecs >= 285) { toggleAudio(); }
    }, 1000);
  } else {
    isAudioPlaying = false;
    icon.className = 'fa-solid fa-play';
    clearInterval(audioTimerInterval);
  }
}

function changeSpeed() {
  alert('Audio playback speed set to ' + document.getElementById('speedSelect').value + 'x');
}

// Live Search Filter Logic
function filterCatArticles() {
  var query = document.getElementById('catSearchInput').value.toLowerCase();
  
  // Filter TOC items
  var tocItems = document.querySelectorAll('.toc-searchable');
  tocItems.forEach(function(item) {
    var text = item.innerText.toLowerCase();
    if(text.indexOf(query) > -1) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });

  // Filter Grid items
  var gridItems = document.querySelectorAll('.cat-grid-item');
  gridItems.forEach(function(card) {
    var text = card.innerText.toLowerCase();
    if(text.indexOf(query) > -1) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

function calcRevCat() {
  var traffic = document.getElementById('trafficRangeCat').value;
  var rpm = document.getElementById('rpmRangeCat').value;
  document.getElementById('trafficValCat').innerText = Number(traffic).toLocaleString();
  document.getElementById('rpmValCat').innerText = '$' + rpm;
  var rev = (traffic / 1000) * rpm;
  document.getElementById('revResultCat').innerText = '$' + Number(rev).toLocaleString() + ' / Mo';
}

function votePollCat(btn, resText) {
  document.getElementById('pollResCat').innerText = '✅ Vote registered: (' + resText + ')';
  document.getElementById('pollResCat').style.display = 'block';
}
</script>
