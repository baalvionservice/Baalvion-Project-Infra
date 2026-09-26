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

<!-- Page Six & NY Post Design System for Attorney/Legal Master Category View -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Oswald:wght@500;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">

<style>
:root {
   --p6-blue: #1e3a8a;
   --p6-navy: #0f172a;
   --p6-accent: #60a5fa;
   --p6-gold: #f59e0b;
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

/* LIVE MARKET & LEGAL PULSE STRIP */
.p6-market-bar {
  background: #1e3a8a;
  color: #bfdbfe;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.p6-market-item { margin-right: 18px; }
.p6-market-item span.val { color: #ffffff; font-weight: 700; }

/* Page Hero Banner */
.p6-page-header {
   background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
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
   color: #bfdbfe;
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
  background: rgba(0,0,0,0.25);
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
  border-bottom: 2px solid var(--p6-blue);
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
  background: #eff6ff;
  margin-right: 8px;
  transition: all 0.2s ease;
}

.p6-filter-pill.active {
  background: var(--p6-blue);
  color: #ffffff;
}

/* CALCULATOR BOX */
.p6-calc-box {
  background: #ffffff;
  border: 2px solid var(--p6-blue);
  border-radius: 8px;
  padding: 20px;
}

.p6-calc-output {
  background: #1e3a8a;
  color: #bfdbfe;
  font-family: var(--p6-font-headline);
  font-size: 2rem;
  font-weight: 700;
  padding: 12px;
  border-radius: 6px;
  text-align: center;
}

.p6-widget-box {
   background: #ffffff;
   border: 1px solid var(--p6-card-border);
   border-radius: 8px;
   padding: 20px;
   margin-bottom: 24px;
}

.p6-sticky-col { position: sticky; top: 80px; }

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

.p6-grid-card:hover { transform: translateY(-4px); border-color: var(--p6-blue); }
</style>

<!-- Hero Banner Header -->
<?php foreach($get_subcat_info as $sc_info){ ?>
<header class="p6-page-header">
   <div class="container-fluid px-lg-5">
      <div class="row align-items-center">
         <div class="col-lg-8">
            <div class="p6-breadcrumb">
               <span class="p6-meta-tag">LEGAL &amp; VISA DESK</span>
               <span>&rsaquo;</span>
               <span>GLOBAL MOBILITY &amp; LAW</span>
            </div>
            <h1 class="p6-main-title"><?php echo ucfirst($sc_info['sub_cat_name']); ?></h1>
            <div class="p6-meta-bar mb-3">
               <span>By <strong>Imperialpedia Legal Desk</strong></span>
               <span>&bull;</span>
               <span>Updated <?php echo date('F d, Y', strtotime($sc_info['added_date'])); ?></span>
               <span>&bull;</span>
               <span class="badge bg-warning text-dark text-uppercase">VERIFIED LEGAL COUNSEL</span>
            </div>
         </div>

         <div class="col-lg-4">
            <div class="p6-audio-player-box">
               <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="badge bg-warning text-dark text-uppercase fw-bold">AUDIO BRIEFING</span>
                  <span class="small text-white-50">4:30 Min</span>
               </div>
               <div class="d-flex align-items-center gap-3">
                  <button class="p6-audio-btn" onclick="alert('Playing legal & visa briefing...')"><i class="fa-solid fa-play"></i></button>
                  <div class="flex-grow-1">
                     <div class="fw-bold small">Listen to 4-Min Visa &amp; Legal Briefing</div>
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
          <span class="input-group-text bg-primary text-white border-primary" style="background:var(--p6-blue)"><i class="fa-solid fa-magnifying-glass"></i></span>
          <input type="text" class="form-control" id="lawSearchInput" onkeyup="filterLaw()" placeholder="Search Golden Visas, citizenship, tax residency...">
        </div>
      </div>
      <div class="col-lg-8 text-lg-end overflow-x-auto text-nowrap">
        <a href="#" class="p6-filter-pill active">ALL LEGAL GUIDES</a>
        <a href="#" class="p6-filter-pill">🌐 GOLDEN VISAS</a>
        <a href="#" class="p6-filter-pill">🛂 SECOND CITIZENSHIP</a>
        <a href="#" class="p6-filter-pill">⚖️ TAX RESIDENCY</a>
        <a href="#" class="p6-filter-pill">🏛️ LAW FIRM INDEX</a>
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
                  <div class="p6-widget-header border-bottom border-primary border-2 mb-3 pb-2">
                     <h4 class="fw-bold mb-0" style="color:var(--p6-blue)"><i class="fa-solid fa-scale-balanced me-1"></i> Legal Index</h4>
                  </div>
                  <nav class="p6-toc-list">
                     <?php 
                        foreach($get_subcat_info as $subcat_info){
                           $all_h2 = tag_contents($subcat_info['sub_cat_desc'] , "<h2>" , "</h2>");
                           $num = 1;
                           foreach($all_h2 as $val){
                              $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $val)));
                     ?>
                              <a href="#<?php echo $slug; ?>" class="d-flex align-items-center p-2 mb-1 rounded text-decoration-none text-dark bg-light p6-law-item">
                                 <span class="badge text-white me-2" style="background:var(--p6-blue)"><?php echo sprintf("%02d", $num++); ?></span>
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

         <!-- Right Sidebar: Calculator & Widgets -->
         <div class="col-lg-3 col-md-12 mb-4">
            <div class="p6-sticky-col">
               <!-- INTERACTIVE GOLDEN VISA CALCULATOR -->
               <div class="p6-calc-box mb-4">
                 <span class="badge text-white text-uppercase mb-2" style="background:var(--p6-blue)">INTERACTIVE TOOL</span>
                 <h5 class="fw-bold mb-3 font-serif">🌐 Golden Visa Cost Estimator</h5>
                 <div class="mb-3">
                   <label class="form-label small fw-bold text-muted mb-1">FAMILY MEMBERS: <span id="famVal" class="text-dark fw-bold">3 Persons</span></label>
                   <input type="range" class="form-range" id="famRange" min="1" max="8" step="1" value="3" oninput="calcLaw()">
                 </div>
                 <div class="p6-calc-output">
                   <span id="lawResult">€540,000 Total Est.</span>
                 </div>
               </div>

               <div class="p6-widget-box">
                  <div class="p6-widget-header border-bottom border-primary border-2 mb-3 pb-2">
                     <h4 class="fw-bold mb-0" style="color:var(--p6-blue)"><i class="fa-solid fa-gavel me-1"></i> Top Legal Guides</h4>
                  </div>
                  <?php $i = 1; foreach($post as $pst1){ ?>
                     <a href="<?php echo base_url().'attorney/'.str_replace(' ','-',$pst1['uri']); ?>" class="d-flex gap-2 text-decoration-none text-dark py-2 border-bottom">
                        <span class="fw-bold fs-5" style="color:var(--p6-blue)">0<?php echo $i++; ?></span>
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
<section class="py-5 bg-white border-top border-primary border-2">
   <div class="container-fluid px-lg-5">
      <h3 class="fw-bold font-serif mb-4">🏛️ Imperialpedia Global Mobility &amp; Legal Blueprints</h3>
      <div class="row g-4">
         <?php foreach($post as $pst){?>
            <div class="col-xl-3 col-lg-4 col-md-6">
               <a href="<?php echo base_url().'attorney/'.str_replace(' ','-',$pst['uri']); ?>" class="p6-grid-card">
                  <div class="p6-grid-body">
                     <span class="badge text-white w-auto me-auto mb-2" style="background:var(--p6-blue)">LEGAL DESK</span>
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
function filterLaw() {
  var query = document.getElementById('lawSearchInput').value.toLowerCase();
  var items = document.querySelectorAll('.p6-law-item');
  items.forEach(function(item) {
    if(item.innerText.toLowerCase().indexOf(query) > -1) { item.style.display = 'flex'; } else { item.style.display = 'none'; }
  });
}

function calcLaw() {
  var fam = document.getElementById('famRange').value;
  document.getElementById('famVal').innerText = fam + ' Persons';
  var est = 500000 + (fam * 15000);
  document.getElementById('lawResult').innerText = '€' + Number(est).toLocaleString() + ' Total Est.';
}
</script>