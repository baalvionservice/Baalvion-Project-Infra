<!-- Page Six & NY Post Design System for Editor View -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">

<style>
/* Page Six & NY Post Editorial Styles with Original Google Sans / Roboto Fonts */
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

/* Editorial Top Header */
.p6-page-header {
   background: #ffffff;
   border-bottom: 2px solid var(--p6-dark);
   padding: 24px 0 20px 0;
   margin-bottom: 28px;
   box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}

.p6-breadcrumb {
   font-family: var(--p6-font-accent);
   font-size: 0.85rem;
   letter-spacing: 1.5px;
   color: var(--p6-red);
   font-weight: 700;
   text-transform: uppercase;
   margin-bottom: 6px;
   display: flex;
   align-items: center;
   gap: 6px;
}

.p6-main-title {
   font-family: var(--p6-font-headline);
   font-weight: 700;
   font-size: 2.35rem;
   color: var(--p6-dark);
   margin-bottom: 8px;
   line-height: 1.25;
}

.p6-meta-bar {
   display: flex;
   align-items: center;
   gap: 16px;
   font-size: 0.85rem;
   color: #64748b;
   font-weight: 500;
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

/* Sidebar & Card Boxes */
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

/* Section Header Bar (NY Post Style) */
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

/* Social Badges */
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

/* Main Article Content Container */
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

.p6-content-box img {
   max-width: 100%;
   height: auto;
   border-radius: 8px;
   margin: 20px 0;
   box-shadow: 0 4px 15px rgba(0,0,0,0.06);
   display: block;
}

/* Right Sidebar Article Items */
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

/* Perfect Infographic & Image Container */
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
   object-fit: contain;
   object-position: center;
   display: block;
   padding: 8px;
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
   font-family: var(--p6-font-accent);
   font-size: 0.72rem;
   font-weight: 700;
   color: var(--p6-red);
   text-transform: uppercase;
   letter-spacing: 1px;
   margin-bottom: 6px;
}

.p6-card-title {
   font-family: var(--p6-font-headline);
   font-weight: 700;
   font-size: 1.05rem;
   line-height: 1.4;
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

<!-- Top Editorial Title Header -->
<header class="p6-page-header">
   <div class="container-fluid px-lg-5">
      <div class="row align-items-center">
         <div class="col-12">
            <div class="p6-breadcrumb">
               <span class="p6-meta-tag">EDITOR</span>
               <span>&rsaquo;</span>
               <span><?php echo strtoupper(str_replace('-',' ',$this->uri->segment(2))); ?></span>
            </div>
            <h1 class="p6-main-title"><?php echo ucfirst(str_replace('-',' ',$this->uri->segment(2))); ?> Software Guide</h1>
            <div class="p6-meta-bar">
               <span><i class="fa-regular fa-clock me-1"></i> Updated Sept 2026</span>
               <span>&bull;</span>
               <span><i class="fa-regular fa-file-lines me-1"></i> Imperialpedia Software & Editing Guide</span>
            </div>
         </div>
      </div>
   </div>
</header>
<?php $this->load->view('includes/section_banner'); ?>

<!-- Main Container 3-Column Layout -->
<section class="pb-5">
   <div class="container-fluid px-lg-5">
      <div class="row">

         <!-- Left Sidebar: Community & Social (Page Six Style) -->
         <div class="col-lg-3 col-md-4 mb-4">
            <div class="p6-sticky-col">

               <!-- Community Social Box -->
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
                        <a href="https://www.youtube.com/channel/UCSh8QP5s7VFiExTK9sYZdEQ" target="_blank" class="p6-social-item">
                           <span class="p6-social-icon p6-social-youtube"><i class="fa-brands fa-youtube"></i></span>
                           Subscribe YouTube
                        </a>
                     </li>
                     <li>
                        <a href="https://discord.gg/Qf2spryUbJ" target="_blank" class="p6-social-item">
                           <span class="p6-social-icon p6-social-discord"><i class="fa-brands fa-discord"></i></span>
                           Join Discord Server
                        </a>
                     </li>
                     <li>
                        <a href="https://www.instagram.com/imperialpedia/" target="_blank" class="p6-social-item">
                           <span class="p6-social-icon p6-social-instagram"><i class="fa-brands fa-instagram"></i></span>
                           Follow Instagram
                        </a>
                     </li>
                     <li>
                        <a href="https://www.reddit.com/user/imperialpedia" target="_blank" class="p6-social-item">
                           <span class="p6-social-icon p6-social-reddit"><i class="fa-brands fa-reddit"></i></span>
                           Join Reddit
                        </a>
                     </li>
                  </ul>
               </div>

               <!-- Ad Promo Box -->
               <div class="p6-widget-box text-center p-3">
                  <span class="text-uppercase text-muted fw-bold d-block mb-2" style="font-size: 0.65rem; letter-spacing: 1px;">ADVERTISEMENT</span>
                  <a href="https://www.neverendmoney.com/" target="_blank" class="d-block">
                     <img src="<?php echo base_url()?>assets/img/banner1.jpg" class="img-fluid rounded" alt="Imperialpedia Ad">
                  </a>
               </div>

            </div>
         </div>

         <!-- Center Column: Article Description Content -->
         <div class="col-lg-6 col-md-8 mb-4">
            <div class="p6-content-box">
               <?php  
                  foreach($get_subcat_info as $subcat_info){ 
                     echo preg_replace('/<(\/?)h1\b/i', '<$1h2', $subcat_info['sub_cat_desc']); 
                  };  
               ?>
            </div>
         </div>

         <!-- Right Sidebar: Subcategory Posts List (NY Post Style) -->
         <div class="col-lg-3 col-md-12 mb-4">
            <div class="p6-sticky-col">
               <div class="p6-widget-box">
                  <div class="p6-widget-header">
                     <h3><i class="fa-solid fa-fire text-danger me-1"></i> Popular Articles</h3>
                  </div>
                  <div class="p6-article-mini-list">
                     <?php $i = 1; foreach($post as $pst1){ ?>
                        <a href="<?php echo base_url();foreach($get_subcat_info as $subcat_info){echo 'editor/'.str_replace(' ','-',$subcat_info['sub_cat_name']);}; echo '/'.str_replace(' ','-',$pst1['uri']); ?>" class="p6-article-mini-item">
                           <span class="p6-mini-num"><?php echo sprintf("%02d", $i++); ?></span>
                           <h4 class="p6-mini-title"><?php echo ucfirst($pst1['post_title']);?></h4>
                        </a>
                     <?php } ?>
                  </div>
               </div>
            </div>
         </div>

      </div>
   </div>
</section>

<!-- Bottom Grid Section (NY Post Editorial Cards) -->
<section class="p6-grid-section">
   <div class="container-fluid px-lg-5">
      <div class="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom border-2 border-dark">
         <h2 style="font-family: var(--p6-font-headline); font-size: 1.75rem; font-weight: 700; margin: 0;">
            Explore More in <?php echo str_replace('-',' ',ucfirst($this->uri->segment(2)))?> Editor
         </h2>
         <span class="p6-meta-tag">CURATED STORIES</span>
      </div>

      <div class="row g-4">
         <?php foreach($post as $pst){?>
            <div class="col-xl-3 col-lg-4 col-md-6">
               <a href="<?php echo base_url();foreach($get_subcat_info as $subcat_info){echo 'editor/'.str_replace(' ','-',$subcat_info['sub_cat_name']);}; echo '/'.str_replace(' ','-',$pst['uri']); ?>" class="p6-grid-card">
                  <div class="p6-img-wrapper">
                     <img src="<?php echo base_url() ?>uploads/post/<?php echo !empty($pst['post_img']) ? $pst['post_img'] : 'post.png'; ?>" 
                          onerror="this.onerror=null;this.src='<?php echo base_url() ?>assets/img/banner1.jpg';" 
                          alt="<?php echo !empty($pst['post_alt_title']) ? $pst['post_alt_title'] : 'Post Image'; ?>">
                  </div>
                  <div class="p6-grid-body">
                     <div class="p6-card-tag"><?php echo strtoupper(str_replace('-',' ',$this->uri->segment(2)));?> EDITOR</div>
                     <h3 class="p6-card-title"><?php echo ucfirst($pst['post_title']);?></h3>
                     <div class="p6-card-footer">
                        <span><i class="fa-regular fa-calendar-days me-1"></i> <?php echo date('M d, Y', strtotime(!empty($pst['updated_date']) ? $pst['updated_date'] : $pst['posted_date'])); ?></span>
                        <span class="p6-read-btn">Read Article &rsaquo;</span>
                     </div>
                  </div>
               </a>
            </div>
         <?php } ?>
      </div>
   </div>
</section>