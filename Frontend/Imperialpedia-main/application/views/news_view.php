<?php
// Helper to inject anchor IDs into <h2> tags for smooth navigation
if(!function_exists('insert_ahref_tag')){
   function insert_ahref_tag($string){ 
   $string = preg_replace('/<(\/?)h1\b/i', '<$1h2', $string);
   return preg_replace_callback('/<h2>(.*?)<\/h2>/i', function($matches) {
         $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $matches[1])));
         return '<h2 id="' . $slug . '">' . $matches[1] . '</h2>';
      }, $string);
   }
}

if(!function_exists('tag_contents')){
   function tag_contents($string, $tag_open, $tag_close){
      $result = array();
      foreach (explode($tag_open, $string) as $key => $value) {
          if(strpos($value, $tag_close) !== FALSE){
               $result[] = strip_tags(substr($value, 0, strpos($value, $tag_close)));
          }
      }
      return $result;
   }
}
?>

<!-- Page Six & NY Post Design System for News Master Category View -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Oswald:wght@500;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">

<style>
:root {
   --p6-red: #e50914;
   --p6-navy: #0f172a;
   --p6-gold: #f59e0b;
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

/* LIVE MARKET & NEWS PULSE STRIP */
.p6-market-bar {
  background: #090d16;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.p6-market-item { margin-right: 18px; }
.p6-market-item span.up { color: #10b981; }
.p6-market-item span.val { color: #ffffff; font-weight: 700; }

/* Page Hero Banner */
.p6-page-header {
   background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
   color: #ffffff;
   border-bottom: 4px solid var(--p6-gold);
   padding: 40px 0 30px 0;
   margin-bottom: 24px;
   box-shadow: 0 4px 25px rgba(0,0,0,0.15);
}

.p6-breadcrumb {
   font-family: var(--p6-font-headline);
   font-size: 0.85rem;
   letter-spacing: 1.5px;
   color: var(--p6-gold);
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
   background: var(--p6-gold);
   color: #000000;
   font-family: var(--p6-font-headline);
   font-size: 0.72rem;
   font-weight: 800;
   padding: 3px 10px;
   letter-spacing: 1.5px;
   text-transform: uppercase;
   border-radius: 2px;
}

/* AUDIO PODCAST PLAYER BAR */
.p6-audio-player-box {
  background: #1e293b;
  border-radius: 8px;
  padding: 14px 20px;
  color: #fff;
  border: 1px solid var(--p6-gold);
  margin-top: 20px;
}

.p6-audio-btn {
  background: var(--p6-gold);
  color: #000;
  border: none;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* SEARCH & QUICK CATEGORY FILTER BAR */
.p6-search-bar-wrap {
  background: #ffffff;
  border-bottom: 2px solid var(--p6-navy);
  padding: 14px 0;
  margin-bottom: 30px;
}

.p6-filter-pill {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--p6-navy);
  text-decoration: none;
  padding: 6px 14px;
  border-radius: 20px;
  background: #f1f5f9;
  margin-right: 8px;
  transition: all 0.2s ease;
}

.p6-filter-pill.active {
  background: var(--p6-navy);
  color: #ffffff;
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

.p6-sticky-col { position: sticky; top: 80px; }

.p6-widget-header {
   border-bottom: 2px solid var(--p6-navy);
   padding-bottom: 8px;
   margin-bottom: 16px;
}

.p6-widget-header h3 {
   font-family: var(--p6-font-headline);
   font-weight: 700;
   font-size: 1.15rem;
   text-transform: uppercase;
   color: var(--p6-navy);
   margin: 0;
}

/* TOC Items */
.p6-toc-list { list-style: none; padding: 0; margin: 0; }
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
}

.p6-content-box {
   background: #ffffff;
   border: 1px solid var(--p6-card-border);
   border-radius: 8px;
   padding: 36px;
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
   line-height: 1.85;
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
   text-decoration: none;
   color: inherit;
}

.p6-grid-card:hover { transform: translateY(-4px); border-color: var(--p6-gold); }
</style>

<!-- Hero Banner Header -->
<?php foreach($get_subcat_info as $sc_info){ ?>
<header class="p6-page-header">
   <div class="container-fluid px-lg-5">
      <div class="row align-items-center">
         <div class="col-lg-8">
            <div class="p6-breadcrumb">
               <span class="p6-meta-tag">NEWS DESK</span>
               <span>&rsaquo;</span>
               <span>BREAKING COVERAGE</span>
            </div>
            <h1 class="p6-main-title"><?php echo ucfirst($sc_info['sub_cat_name']); ?></h1>
            <div class="p6-meta-bar mb-3">
               <span>By <strong>Imperialpedia News Desk</strong></span>
               <span>&bull;</span>
               <span>Updated <?php echo date('F d, Y', strtotime($sc_info['added_date'])); ?></span>
               <span>&bull;</span>
               <span class="badge bg-warning text-dark text-uppercase">VERIFIED NEWS FEED</span>
            </div>
         </div>

         <div class="col-lg-4">
            <div class="p6-audio-player-box">
               <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="badge bg-warning text-dark text-uppercase fw-bold">AUDIO BRIEFING</span>
                  <span class="small text-white-50">4:15 Min</span>
               </div>
               <div class="d-flex align-items-center gap-3">
                  <button class="p6-audio-btn" onclick="alert('Playing news briefing...')"><i class="fa-solid fa-play"></i></button>
                  <div class="flex-grow-1">
                     <div class="fw-bold small">Listen to 4-Min Global News Briefing</div>
                  </div>
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
          <input type="text" class="form-control border-dark" id="newsSearchInput" onkeyup="filterNews()" placeholder="Search news headlines, tech, world reports...">
        </div>
      </div>
      <div class="col-lg-8 text-lg-end overflow-x-auto text-nowrap">
        <a href="#" class="p6-filter-pill active">ALL NEWS</a>
        <a href="#" class="p6-filter-pill">🌐 WORLD</a>
        <a href="#" class="p6-filter-pill">💻 TECH NEWS</a>
        <a href="#" class="p6-filter-pill">📈 MARKETS</a>
        <a href="#" class="p6-filter-pill">🏛️ POLICY</a>
      </div>
    </div>
  </div>
</div>

<!-- Main 3-Column Content Layout -->
<section class="pb-5">
   <div class="container-fluid px-lg-5">
      <div class="row">

         <!-- Left Sidebar: Table of Contents -->
         <div class="col-lg-3 col-md-4 mb-4">
            <div class="p6-sticky-col">
               <div class="p6-widget-box">
                  <div class="p6-widget-header">
                     <h3><i class="fa-solid fa-list-ol text-warning me-1"></i> Coverage Index</h3>
                  </div>
                  <nav class="p6-toc-list">
                     <?php 
                        foreach($get_subcat_info as $subcat_info){
                           $all_h2 = tag_contents($subcat_info['sub_cat_desc'] , "<h2>" , "</h2>");
                           $num = 1;
                           foreach($all_h2 as $val){
                              $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $val)));
                     ?>
                              <a href="#<?php echo $slug; ?>" class="p6-toc-item">
                                 <span class="badge bg-dark me-2"><?php echo sprintf("%02d", $num++); ?></span>
                                 <span><?php echo ucfirst($val); ?></span>
                              </a>
                     <?php 
                           }
                        }
                     ?>
                  </nav>
               </div>
            </div>
         </div>

         <!-- Center Column: Full Article Content -->
         <div class="col-lg-6 col-md-8 mb-4">
            <div class="p6-content-box">
               <?php 
                  foreach($get_subcat_info as $subcat_info){
                     echo insert_ahref_tag($subcat_info['sub_cat_desc']);
                  }
               ?>
            </div>
         </div>

         <!-- Right Sidebar: News Sidebar -->
         <div class="col-lg-3 col-md-12 mb-4">
            <div class="p6-sticky-col">
               <div class="p6-widget-box">
                  <div class="p6-widget-header">
                     <h3><i class="fa-solid fa-fire text-warning me-1"></i> Trending News</h3>
                  </div>
                  <?php $i = 1; foreach($post as $pst1){ ?>
                     <a href="<?php echo base_url().'news/'.str_replace(' ','-',$pst1['uri']); ?>" class="d-flex gap-2 text-decoration-none text-dark py-2 border-bottom">
                        <span class="fw-bold text-warning fs-5">0<?php echo $i++; ?></span>
                        <div class="fw-bold small"><?php echo ucfirst($pst1['post_title']);?></div>
                     </a>
                  <?php } ?>
               </div>
            </div>
         </div>

      </div>
   </div>
</section>

<!-- Bottom Grid Section (Related Articles) -->
<section class="py-5 bg-white border-top border-dark">
   <div class="container-fluid px-lg-5">
      <h3 class="fw-bold font-serif mb-4">📰 Latest Headlines &amp; Special Reports</h3>
      <div class="row g-4">
         <?php foreach($post as $pst){?>
            <div class="col-xl-3 col-lg-4 col-md-6">
               <a href="<?php echo base_url().'news/'.str_replace(' ','-',$pst['uri']); ?>" class="p6-grid-card">
                  <div class="p6-grid-body">
                     <span class="badge bg-warning text-dark w-auto me-auto mb-2">NEWS DESK</span>
                     <h4 class="fw-bold font-serif fs-6"><?php echo ucfirst($pst['post_title']);?></h4>
                     <div class="small text-muted mt-auto pt-2 border-top"><?php echo date('M d, Y', strtotime($pst['posted_date'])); ?></div>
                  </div>
               </a>
            </div>
         <?php } ?>
      </div>
   </div>
</section>

<script>
function filterNews() {
  var query = document.getElementById('newsSearchInput').value.toLowerCase();
  var items = document.querySelectorAll('.p6-toc-item');
  items.forEach(function(item) {
    if(item.innerText.toLowerCase().indexOf(query) > -1) { item.style.display = 'flex'; } else { item.style.display = 'none'; }
  });
}
</script>