<?php
if (!function_exists('tag_contents')) {
   function tag_contents($string, $tag_open, $tag_close){
      $result = array();
      if (!empty($string)) {
         foreach (explode($tag_open, $string) as $key => $value) {
             if(strpos($value, $tag_close) !== FALSE){
                  $result[] = strip_tags(substr($value, 0, strpos($value, $tag_close)));
             }
         }
      }
      return $result;
   }
}

if (!function_exists('get_words')) {
   function get_words($sentence, $count = 7){ 
      if (empty($sentence)) return '';
      preg_match("/(?:\w+(?:\W+|$)){0,$count}/", $sentence, $matches);
      return isset($matches[0]) ? $matches[0] : ''; 
   }
}

if (!function_exists('insert_ahref_tag')) {
   function insert_ahref_tag($string){ 
      if (empty($string)) return '';
      return preg_replace_callback('/<h2>(.*?)<\/h2>/i', function($matches) {
         $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $matches[1])));
         return '<h2 id="' . $slug . '">' . $matches[1] . '</h2>';
      }, $string);
   }
}
?>

<!-- Page Six & NY Post Design System for Cookies View -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">

<style>
:root {
   --p6-red: #d00000;
   --p6-red-hover: #b00000;
   --p6-dark: #111111;
   --p6-gray-bg: #f8f9fa;
   --p6-card-border: #e2e8f0;
   --p6-font-headline: 'Google Sans', 'Roboto', Arial, sans-serif;
   --p6-font-body: 'Google Sans', 'Roboto', Arial, sans-serif;
   --p6-font-accent: 'Oswald', 'Google Sans', sans-serif;
}

body {
   background-color: #f7f7f9;
   font-family: var(--p6-font-body);
   color: #202124;
}

/* Page Hero Header */
.p6-page-header {
   background: linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%);
   color: #ffffff;
   border-bottom: 4px solid var(--p6-red);
   padding: 36px 0 28px 0;
   margin-bottom: 28px;
   box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.p6-breadcrumb {
   font-family: var(--p6-font-accent);
   font-size: 0.85rem;
   letter-spacing: 1.5px;
   color: #00f5d4;
   font-weight: 700;
   text-transform: uppercase;
   margin-bottom: 8px;
   display: flex;
   align-items: center;
   gap: 6px;
}

.p6-main-title {
   font-family: var(--p6-font-headline);
   font-weight: 700;
   font-size: 2.4rem;
   color: #ffffff;
   margin-bottom: 12px;
   line-height: 1.25;
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
   font-family: var(--p6-font-accent);
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

/* Sidebar Widgets & Containers */
.p6-widget-box {
   background: #ffffff;
   border: 1px solid var(--p6-card-border);
   border-radius: 8px;
   padding: 20px;
   margin-bottom: 24px;
   box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
   overflow: hidden;
}

.p6-widget-box img {
   max-width: 100%;
   height: auto;
   display: block;
   margin: 0 auto;
   border-radius: 6px;
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
   font-family: var(--p6-font-accent);
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

/* Table of Contents List */
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
   font-family: var(--p6-font-accent);
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

.p6-content-box p {
   margin-bottom: 20px;
}

.p6-content-box blockquote {
   font-family: var(--p6-font-headline);
   font-style: italic;
   font-size: 1.15rem;
   border-left: 4px solid var(--p6-red);
   background: #fdf5f5;
   padding: 20px 24px;
   margin: 28px 0;
   border-radius: 0 6px 6px 0;
   color: #333;
}

/* Interactive Cookie Access Generator Box */
.p6-cookie-generator-box {
   background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
   color: #ffffff;
   border-radius: 12px;
   padding: 32px 24px;
   margin: 32px 0;
   box-shadow: 0 10px 30px rgba(15, 23, 42, 0.2);
   border: 1px solid #334155;
   text-align: center;
}

.p6-cookie-title {
   font-family: var(--p6-font-headline);
   font-size: 1.5rem;
   font-weight: 700;
   color: #ffffff;
   margin-bottom: 8px;
}

.p6-cookie-sub {
   font-size: 0.92rem;
   color: #94a3b8;
   margin-bottom: 20px;
}

.p6-cookie-btn {
   background: #00f5d4;
   color: #0f172a;
   font-family: var(--p6-font-headline);
   font-weight: 700;
   font-size: 1.1rem;
   padding: 14px 32px;
   border-radius: 50px;
   border: none;
   cursor: pointer;
   transition: all 0.25s ease;
   box-shadow: 0 4px 15px rgba(0, 245, 212, 0.3);
}

.p6-cookie-btn:hover {
   background: #00d6b9;
   transform: translateY(-2px);
   box-shadow: 0 8px 25px rgba(0, 245, 212, 0.5);
}

.p6-cookie-textarea {
   width: 100%;
   background: #090d16;
   color: #00f5d4;
   border: 1px solid #334155;
   border-radius: 8px;
   padding: 14px;
   font-family: monospace;
   font-size: 0.9rem;
   margin-top: 16px;
}

/* Social List */
.p6-social-list {
   list-style: none;
   padding: 0;
   margin: 0;
}

.p6-social-item {
   display: flex;
   align-items: center;
   padding: 10px 14px;
   margin-bottom: 8px;
   border-radius: 6px;
   text-decoration: none;
   font-weight: 600;
   font-size: 0.88rem;
   color: #333;
   background: #f8f9fa;
   border: 1px solid #edf2f7;
   transition: all 0.2s ease;
}

.p6-social-item:hover {
   background: #ffffff;
   border-color: var(--p6-red);
   color: var(--p6-red);
   transform: translateX(3px);
}

.p6-social-icon {
   width: 32px;
   height: 32px;
   border-radius: 50%;
   display: inline-flex;
   align-items: center;
   justify-content: center;
   color: #fff;
   margin-right: 12px;
   font-size: 14px;
}

.p6-social-twitter { background: #1da1f2; }
.p6-social-youtube { background: #ff0000; }
.p6-social-discord { background: #5865f2; }
.p6-social-instagram { background: #e1306c; }
.p6-social-reddit { background: #ff4500; }

/* Right Mini Sidebar */
.p6-article-mini-item {
   display: flex;
   align-items: flex-start;
   padding: 14px 0;
   border-bottom: 1px solid #f1f5f9;
   text-decoration: none;
   color: inherit;
   transition: all 0.2s ease;
}

.p6-article-mini-item:last-child {
   border-bottom: none;
}

.p6-article-mini-item:hover .p6-mini-title {
   color: var(--p6-red);
}

.p6-mini-num {
   font-family: var(--p6-font-accent);
   font-weight: 700;
   font-size: 1.4rem;
   color: var(--p6-red);
   min-width: 32px;
   line-height: 1;
}

.p6-mini-title {
   font-family: var(--p6-font-headline);
   font-size: 0.95rem;
   font-weight: 700;
   line-height: 1.4;
   color: #111;
   margin: 0;
   transition: color 0.2s ease;
}

/* Bottom Grid Section */
.p6-grid-section {
   background: #ffffff;
   border-top: 2px solid var(--p6-dark);
   padding: 48px 0;
   margin-top: 40px;
}

.p6-cookie-card {
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

.p6-cookie-card:hover {
   transform: translateY(-4px);
   box-shadow: 0 12px 24px rgba(0,0,0,0.08);
   border-color: #cbd5e1;
   color: inherit;
}

.p6-cookie-card-header {
   background: linear-gradient(135deg, #0d9488 0%, #115e59 100%);
   color: #ffffff;
   padding: 24px 20px;
   text-align: center;
}

.p6-cookie-card-title {
   font-family: var(--p6-font-headline);
   font-weight: 700;
   font-size: 1.25rem;
   text-transform: capitalize;
   margin-bottom: 4px;
}

.p6-cookie-card-sub {
   font-family: var(--p6-font-accent);
   font-size: 0.8rem;
   letter-spacing: 1px;
   text-transform: uppercase;
   opacity: 0.9;
}

.p6-cookie-card-body {
   padding: 18px;
   display: flex;
   flex-direction: column;
   flex-grow: 1;
}

.p6-cookie-card-desc {
   font-size: 0.9rem;
   color: #475569;
   line-height: 1.5;
   margin-bottom: 14px;
}

.p6-cookie-card-btn {
   margin-top: auto;
   color: #0d9488;
   font-weight: 700;
   font-size: 0.85rem;
   display: flex;
   align-items: center;
   justify-content: space-between;
   border-top: 1px solid #f1f5f9;
   padding-top: 10px;
}

/* Comment & Social Share Section */
.p6-share-section {
   background: #ffffff;
   border: 1px solid var(--p6-card-border);
   border-radius: 8px;
   padding: 28px;
   margin-top: 32px;
   box-shadow: 0 4px 15px rgba(0,0,0,0.03);
}

</style>

<!-- Hero Banner Header -->
<?php foreach($get_subcat_info as $sc_info){
   $img_alt_title = explode(',',$sc_info['tags']); 
?>
<header class="p6-page-header">
   <div class="container-fluid px-lg-5">
      <div class="row align-items-center">
         <div class="col-12">
            <div class="p6-breadcrumb">
               <span class="p6-meta-tag"><?php echo strtoupper($sc_info['cat_name']); ?></span>
               <span>&rsaquo;</span>
               <span><?php echo strtoupper(str_replace('-',' ',$sc_info['sub_cat_name'])); ?> COOKIES</span>
            </div>
            <h1 class="p6-main-title"><?php echo ucfirst($sc_info['sub_cat_name']); ?> Premium Cookies (Hourly Updated)</h1>
            <div class="p6-meta-bar">
               <div class="p6-author-chip">
                  <?php if(!empty($sc_info['author_img'])){ ?>
                     <img src="<?php echo base_url()?>uploads/author/<?php echo $sc_info['author_img']?>" 
                          onerror="this.onerror=null;this.style.display='none';" 
                          class="p6-author-avatar-sm" alt="Author">
                  <?php } ?>
                  <span>By <strong><?php echo ucfirst($sc_info['author_name']); ?></strong></span>
               </div>
               <span>&bull;</span>
               <span><i class="fa-regular fa-calendar-days me-1"></i> <?php echo date('F d, Y', strtotime($sc_info['added_date'])); ?></span>
               <span>&bull;</span>
               <span><i class="fa-solid fa-shield-halved me-1"></i> 100% Working List</span>
            </div>
         </div>
      </div>
   </div>
</header>
<?php $this->load->view('includes/section_banner'); ?>
<?php } ?>

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
                  <nav class="p6-toc-list">
                     <?php 
                        foreach($get_subcat_info as $subcat_info){
                           $desc = isset($subcat_info['sub_cat_desc']) ? $subcat_info['sub_cat_desc'] : '';
                           $all_h2 = tag_contents($desc, "<h2>", "</h2>");
                           $num = 1;
                           if(!empty($all_h2)){
                              foreach($all_h2 as $val){
                                 $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $val)));
                     ?>
                                 <a href="#<?php echo $slug; ?>" class="p6-toc-item">
                                    <span class="p6-toc-num"><?php echo sprintf("%02d", $num++); ?></span>
                                    <span><?php echo ucfirst($val); ?></span>
                                 </a>
                     <?php 
                              }
                           }
                        }
                     ?>
                  </nav>
               </div>

               <!-- Community Box -->
               <div class="p6-widget-box">
                  <div class="p6-widget-header">
                     <h3><i class="fa-solid fa-users text-danger me-1"></i> Community</h3>
                  </div>
                  <ul class="p6-social-list">
                     <li>
                        <a href="https://twitter.com/ImperialPedia" target="_blank" class="p6-social-item">
                           <span class="p6-social-icon p6-social-twitter"><i class="fa-brands fa-twitter"></i></span>
                           Follow on Twitter
                        </a>
                     </li>
                     <li>
                        <a href="https://discord.gg/Qf2spryUbJ" target="_blank" class="p6-social-item">
                           <span class="p6-social-icon p6-social-discord"><i class="fa-brands fa-discord"></i></span>
                           Join Discord Server
                        </a>
                     </li>
                  </ul>
               </div>

            </div>
         </div>

         <!-- Center Column: Full Article Content & Cookie Generator Widget -->
         <div class="col-lg-6 col-md-8 mb-4">
            <div class="p6-content-box">
               <?php 
                  foreach($get_subcat_info as $subcat_info){
                     echo insert_ahref_tag($subcat_info['sub_cat_desc']);
                  }
               ?>

               <!-- Interactive Cookie Generator Card -->
               <div class="p6-cookie-generator-box" id="some_div">
                  <div class="p6-cookie-title"><i class="fa-solid fa-key me-2 text-warning"></i> Access Premium Cookies</div>
                  <div class="p6-cookie-sub">Click the button below to generate and reveal the latest active session cookies.</div>
                  
                  <button class="p6-cookie-btn" onclick="getCookies()"><i class="fa-solid fa-unlock me-2"></i> Click To Get Cookies</button>
                  
                  <textarea hidden="" rows="5" class="p6-cookie-textarea" readonly><?php foreach($get_subcat_info as $pst){ echo $pst['cookie'];}?></textarea>
               </div>

            </div>

            <!-- Social Share & Engagement Bar -->
            <div class="p6-share-section">
               <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div>
                     <span class="fw-bold me-2 text-dark">Was this helpful?</span>
                     <button class="btn btn-outline-success btn-sm rounded-pill px-3 me-1"><i class="fas fa-thumbs-up me-1"></i> Helpful</button>
                     <button class="btn btn-outline-danger btn-sm rounded-pill px-3"><i class="fa-solid fa-thumbs-down me-1"></i> Not Working</button>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                     <span class="fw-bold me-1 text-muted">Share:</span>
                     <a class="btn btn-sm text-white rounded-circle p-2" style="background: #3b5998; width: 36px; height: 36px;" href="https://www.facebook.com/sharer.php?u=<?php echo base_url().uri_string();?>" target="_blank"><i class="fab fa-facebook-f"></i></a>
                     <a class="btn btn-sm text-white rounded-circle p-2" style="background: #1da1f2; width: 36px; height: 36px;" href="http://twitter.com/share?url=<?php echo base_url().uri_string();?>" target="_blank"><i class="fab fa-twitter"></i></a>
                     <a class="btn btn-sm text-white rounded-circle p-2" style="background: #25d366; width: 36px; height: 36px;" href="https://api.whatsapp.com/send?text=<?php echo base_url().uri_string();?>" target="_blank"><i class="fab fa-whatsapp"></i></a>
                  </div>
               </div>
            </div>

         </div>

         <!-- Right Sidebar: Popular Articles & Ad Box -->
         <div class="col-lg-3 col-md-12 mb-4">
            <div class="p6-sticky-col">

               <!-- Popular Articles Widget -->
               <div class="p6-widget-box">
                  <div class="p6-widget-header">
                     <h3><i class="fa-solid fa-fire text-danger me-1"></i> Top Cookie Guides</h3>
                  </div>
                  <div class="p6-article-mini-list">
                     <?php $i = 1; foreach($post as $pst1){ ?>
                        <a href="<?php echo base_url();foreach($get_subcat_info as $subcat_info){echo 'cookies/'.str_replace(' ','-',$subcat_info['sub_cat_name']);}; echo '/'.str_replace(' ','-',$pst1['uri']); ?>" class="p6-article-mini-item">
                           <span class="p6-mini-num"><?php echo sprintf("%02d", $i++); ?></span>
                           <h4 class="p6-mini-title"><?php echo ucfirst($pst1['post_title']);?></h4>
                        </a>
                     <?php } ?>
                  </div>
               </div>

               <!-- Ad Banner Box -->
               <div class="p6-widget-box text-center p-3">
                  <span class="text-uppercase text-muted fw-bold d-block mb-2" style="font-size: 0.65rem; letter-spacing: 1px;">SPONSORED</span>
                  <a href="https://www.neverendmoney.com/" target="_blank" class="d-block">
                     <img src="<?php echo base_url()?>assets/img/banner1.jpg" class="img-fluid rounded" alt="Imperialpedia Ad">
                  </a>
               </div>

            </div>
         </div>

      </div>
   </div>
</section>

<!-- Bottom Grid Section (Other Working Cookies) -->
<section class="p6-grid-section">
   <div class="container-fluid px-lg-5">
      <div class="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom border-2 border-dark">
         <h2 style="font-family: var(--p6-font-headline); font-size: 1.75rem; font-weight: 700; margin: 0;">
            Get Other Working Cookies
         </h2>
         <span class="p6-meta-tag">100% VERIFIED LIST</span>
      </div>

      <div class="row g-4">
         <?php foreach($get_subcat_list as $gsl){ ?>
            <div class="col-xl-3 col-lg-4 col-md-6">
               <a href="<?php echo base_url().'cookies/'.$gsl['sub_cat_name'];?>" class="p6-cookie-card">
                  <?php $gsl_img = !empty($gsl['sub_cat_image']) ? 'uploads/subcategory/'.$gsl['sub_cat_image'] : (!empty($gsl['cat_image']) ? 'uploads/category/'.$gsl['cat_image'] : ''); if($gsl_img !== ''){ ?>
                  <img src="<?php echo base_url().htmlspecialchars($gsl_img); ?>" alt="<?php echo htmlspecialchars($gsl['sub_cat_name']); ?>" loading="lazy" width="400" height="200" style="width:100%;height:auto;aspect-ratio:2/1;object-fit:cover;display:block;">
                  <?php } ?>
                  <div class="p6-cookie-card-header">
                     <div class="p6-cookie-card-title"><?php echo $gsl['sub_cat_name'];?></div>
                     <div class="p6-cookie-card-sub">Session Cookies</div>
                  </div>
                  <div class="p6-cookie-card-body">
                     <p class="p6-cookie-card-desc">
                        <?php if(!empty($gsl['sub_cat_desc'])){echo get_words(strip_tags($gsl['sub_cat_desc'])).'...';}?>
                     </p>
                     <div class="p6-cookie-card-btn">
                        <span>Get Active Cookies</span>
                        <span>&rarr;</span>
                     </div>
                  </div>
               </a>
            </div>
         <?php } ?>
      </div>
   </div>
</section>

<script>
   function getCookies(){ 
      var timeLeft = 10;
      var elem = document.querySelector("#some_div button");
      var textEl = document.querySelector("#some_div textarea");
      
      var timerId = setInterval(countdown, 1000);
      
      function countdown(){
         if (timeLeft == -1){
            clearTimeout(timerId);
            elem.style.display = "none";
            textEl.hidden = false;
         } else {
            elem.innerHTML = "<i class='fa-solid fa-spinner fa-spin me-2'></i> Generating Cookies (" + timeLeft + "s)";
            timeLeft--;
         }
      }
   }  
</script>