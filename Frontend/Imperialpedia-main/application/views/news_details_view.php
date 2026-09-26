<!-- Page Six & NY Post Design System for News Details View -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,600;0,700;0,800;1,700&display=swap" rel="stylesheet">

<style>
:root {
   --p6-red: #d00000;
   --p6-red-hover: #b00000;
   --p6-dark: #111111;
   --p6-gray-bg: #f8f9fa;
   --p6-card-border: #e2e8f0;
   --p6-font-headline: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
   --p6-font-body: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
   --p6-font-accent: 'Plus Jakarta Sans', 'Inter', sans-serif;
}

body {
   background-color: #f7f7f9;
   font-family: var(--p6-font-body);
   color: #202124;
}

/* Article Hero Header */
.p6-detail-header {
   background: #ffffff;
   border-bottom: 2px solid var(--p6-dark);
   padding: 32px 0 24px 0;
   margin-bottom: 32px;
}

.p6-breadcrumb {
   font-family: var(--p6-font-accent);
   font-size: 0.85rem;
   letter-spacing: 1.5px;
   color: var(--p6-red);
   font-weight: 700;
   text-transform: uppercase;
   margin-bottom: 8px;
   display: flex;
   align-items: center;
   gap: 6px;
}

.p6-detail-title {
   font-family: var(--p6-font-headline) !important; font-weight: 800 !important; color: #0f172a !important; letter-spacing: -0.025em;
   font-weight: 700;
   font-size: 2.6rem;
   color: var(--p6-dark);
   margin-bottom: 16px;
   line-height: 1.25;
}

.p6-author-bar {
   display: flex;
   align-items: center;
   gap: 16px;
   font-size: 0.88rem;
   color: #475569;
   border-top: 1px solid #f1f5f9;
   padding-top: 14px;
   margin-top: 14px;
}

.p6-author-avatar {
   width: 42px;
   height: 42px;
   border-radius: 50%;
   background: var(--p6-red);
   color: #fff;
   display: inline-flex;
   align-items: center;
   justify-content: center;
   font-weight: 700;
   font-family: var(--p6-font-accent);
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

/* Featured Hero Image Container (Clean White Framing) */
.p6-featured-img-container {
   border-radius: 12px;
   overflow: hidden;
   box-shadow: 0 4px 20px rgba(0,0,0,0.05);
   margin-bottom: 28px;
   border: 1px solid var(--p6-card-border);
   background: #ffffff;
   padding: 16px;
   display: flex;
   align-items: center;
   justify-content: center;
   max-height: 480px;
}

.p6-featured-img-container img {
   max-width: 100%;
   max-height: 440px;
   width: auto;
   height: auto;
   object-fit: contain;
   border-radius: 8px;
   display: block;
   margin: 0 auto;
}

/* Article Body Typography */
.p6-article-body {
   background: #ffffff;
   border: 1px solid var(--p6-card-border);
   border-radius: 10px;
   padding: 40px;
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
   line-height: 1.9;
   font-size: 1.1rem;
   color: #1e293b;
   font-family: var(--p6-font-body);
}

.p6-article-body h1, .p6-article-body h2, .p6-article-body h3, .p6-article-body h4 {
   font-family: var(--p6-font-headline) !important; font-weight: 800 !important; color: #0f172a !important; letter-spacing: -0.025em;
   font-weight: 700;
   color: var(--p6-dark);
   margin-top: 32px;
   margin-bottom: 18px;
   line-height: 1.3;
}

.p6-article-body h2 {
   font-size: 1.75rem;
   border-left: 4px solid var(--p6-red);
   padding-left: 14px;
}

.p6-article-body p {
   margin-bottom: 22px;
}

.p6-article-body blockquote {
   font-family: var(--p6-font-headline) !important; font-weight: 800 !important; color: #0f172a !important; letter-spacing: -0.025em;
   font-style: italic;
   font-size: 1.2rem;
   border-left: 4px solid var(--p6-red);
   background: #fdf5f5;
   padding: 24px 28px;
   margin: 32px 0;
   border-radius: 0 8px 8px 0;
   color: #334155;
}

/* Sidebar Widgets */
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

/* Mini Article Items */
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
   font-family: var(--p6-font-headline) !important; font-weight: 800 !important; color: #0f172a !important; letter-spacing: -0.025em;
   font-size: 0.95rem;
   font-weight: 700;
   line-height: 1.4;
   color: #111;
   margin: 0;
   transition: color 0.2s ease;
}

/* Bottom Grid Cards */
.p6-grid-section {
   background: #ffffff;
   border-top: 2px solid var(--p6-dark);
   padding: 48px 0;
   margin-top: 48px;
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
   font-family: var(--p6-font-headline) !important; font-weight: 800 !important; color: #0f172a !important; letter-spacing: -0.025em;
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

<?php foreach($post_details as $row){ ?>
<!-- Article Top Header -->
<header class="p6-detail-header">
   <div class="container-fluid px-lg-5">
      <div class="row">
         <div class="col-lg-9">
            <div class="p6-breadcrumb">
               <span class="p6-meta-tag">NEWS</span>
               <span>&rsaquo;</span>
               <span><?php echo strtoupper(str_replace('-',' ',$this->uri->segment(2))); ?></span>
            </div>
            <h1 class="p6-detail-title"><?php echo ucfirst($row['post_title']);?></h1>
            <div class="p6-author-bar flex-wrap justify-content-between">
               <div class="d-flex align-items-center gap-3">
                  <div class="p6-author-avatar">IP</div>
                  <div>
                     <div class="d-flex align-items-center flex-wrap gap-2">
                        <strong class="text-dark">Imperialpedia News Desk</strong>
                        <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1" style="font-size:0.75rem;">
                           <i class="fa-solid fa-circle-check me-1"></i> Fact-Checked
                        </span>
                     </div>
                     <span class="text-muted" style="font-size:0.8rem;"><i class="fa-regular fa-calendar me-1"></i> Posted on <?php echo date('F d, Y', strtotime(!empty($row['posted_date']) ? $row['posted_date'] : 'now')); ?> &bull; 5 min read</span>
                  </div>
               </div>
               <!-- Byline Share Icons (Desktop) -->
               <div class="d-none d-md-flex align-items-center gap-2 mt-2 mt-md-0">
                  <span class="text-uppercase text-muted fw-bold me-1" style="font-size: 0.75rem; letter-spacing: 1px;">Share:</span>
                  <a href="https://twitter.com/intent/tweet?text=<?php echo urlencode($row['post_title']); ?>&url=<?php echo urlencode(base_url().uri_string()); ?>" target="_blank" class="btn btn-sm btn-outline-dark rounded-circle" style="width:34px; height:34px; padding:0; display:inline-flex; align-items:center; justify-content:center;" title="Share on Twitter/X">
                     <i class="fa-brands fa-x-twitter"></i>
                  </a>
                  <a href="https://www.facebook.com/sharer/sharer.php?u=<?php echo urlencode(base_url().uri_string()); ?>" target="_blank" class="btn btn-sm btn-outline-primary rounded-circle" style="width:34px; height:34px; padding:0; display:inline-flex; align-items:center; justify-content:center;" title="Share on Facebook">
                     <i class="fa-brands fa-facebook-f"></i>
                  </a>
                  <a href="https://api.whatsapp.com/send?text=<?php echo urlencode($row['post_title'].' '.base_url().uri_string()); ?>" target="_blank" class="btn btn-sm btn-outline-success rounded-circle" style="width:34px; height:34px; padding:0; display:inline-flex; align-items:center; justify-content:center;" title="Share on WhatsApp">
                     <i class="fa-brands fa-whatsapp"></i>
                  </a>
               </div>
            </div>
         </div>
      </div>
   </div>
</header>

<!-- Main Article Body & Sidebars -->
<section class="pb-5">
   <div class="container-fluid px-lg-5">
      <div class="row">

         <!-- Left Sidebar: Community & Social Links -->
         <div class="col-lg-3 col-md-4 mb-4">
            <div class="p6-sticky-col">
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

         <!-- Center Column: Featured Image & Article Body -->
         <div class="col-lg-6 col-md-8 mb-4">
            <!-- Featured Hero Image -->
            <div class="p6-featured-img-container mb-1">
               <img src="<?php echo base_url().'uploads/post/'.$row['post_img'].'?v=2';?>" fetchpriority="high" decoding="async"
                    onerror="this.onerror=null;this.src='<?php echo base_url() ?>assets/img/banner1.jpg';" 
                    alt="<?php echo !empty($row['post_alt_title']) ? $row['post_alt_title'] : 'Article Featured Image'; ?>">
            </div>
            <span class="p6-img-caption mb-4"><i class="fa-solid fa-camera me-1 text-danger"></i> Photo Credit: Imperialpedia News Archive &bull; <?php echo !empty($row['post_alt_title']) ? $row['post_alt_title'] : 'News Feature'; ?></span>

            <!-- Page Six & NY Post Signature Inline Story Recommendation ("SEE ALSO") -->
            <?php if(!empty($post) && count($post) > 0){ $rec = $post[0]; ?>
               <div class="p6-see-also-box">
                  <span class="p6-see-also-label"><i class="fa-solid fa-bolt me-1"></i> SEE ALSO</span>
                  <a href="<?php echo base_url();foreach($get_subcat_info as $subcat_info){echo 'news/'.str_replace(' ','-',$subcat_info['sub_cat_name']);}; echo '/'.str_replace(' ','-',$rec['uri']); ?>" class="p6-see-also-link">
                     <?php echo ucfirst($rec['post_title']); ?> &rarr;
                  </a>
               </div>
            <?php } ?>

            <!-- Article Body -->
            <article class="p6-article-body">
               <?php echo $row['post_desc'];?>
            </article>

            <!-- Author Bio Card (Page Six & NY Post Standard) -->
            <div class="p6-widget-box mt-4 p-4 d-flex align-items-center gap-3 bg-light border-0 shadow-sm" style="border-radius:12px;">
               <div class="p6-author-avatar flex-shrink-0" style="width:56px; height:56px; font-size:1.2rem;">IP</div>
               <div>
                  <h4 class="h6 mb-1 fw-bold text-dark">Written by Imperialpedia News Desk</h4>
                  <p class="small text-muted mb-0">Our news team brings real-time breaking reporting, tech innovation, market movements, and expert editorial coverage.</p>
               </div>
            </div>

            <?php $this->load->view('includes/comments_view'); ?>
         </div>

         <!-- Right Sidebar: Trending Posts -->
         <div class="col-lg-3 col-md-12 mb-4">
            <div class="p6-sticky-col">
               <div class="p6-widget-box">
                  <div class="p6-widget-header">
                     <h3><i class="fa-solid fa-fire text-danger me-1"></i> More Stories</h3>
                  </div>
                  <div class="p6-article-mini-list">
                     <?php $i = 1; foreach($post as $pst1){ if($pst1['post_id'] == $row['post_id']) continue; ?>
                        <a href="<?php echo base_url();foreach($get_subcat_info as $subcat_info){echo 'news/'.str_replace(' ','-',$subcat_info['sub_cat_name']);}; echo '/'.str_replace(' ','-',$pst1['uri']); ?>" class="p6-article-mini-item">
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
<?php }; ?>

<!-- Bottom Grid: Related Articles -->
<section class="p6-grid-section">
   <div class="container-fluid px-lg-5">
      <div class="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom border-2 border-dark">
         <h2 style="font-family: var(--p6-font-headline) !important; font-weight: 800 !important; color: #0f172a !important; letter-spacing: -0.025em; font-size: 1.75rem; font-weight: 700; margin: 0;">
            More Articles in <?php echo str_replace('-',' ',ucfirst($this->uri->segment(2)))?> News
         </h2>
         <span class="p6-meta-tag">CURATED STORIES</span>
      </div>

      <div class="row g-4">
         <?php foreach($post as $pst){ if(isset($row) && $pst['post_id'] == $row['post_id']) continue;?>
            <div class="col-xl-3 col-lg-4 col-md-6">
               <a href="<?php echo base_url();foreach($get_subcat_info as $subcat_info){echo 'news/'.str_replace(' ','-',$subcat_info['sub_cat_name']);}; echo '/'.str_replace(' ','-',$pst['uri']); ?>" class="p6-grid-card">
                  <div class="p6-img-wrapper">
                     <img src="<?php echo base_url() ?>uploads/post/<?php echo !empty($pst['post_img']) ? $pst['post_img'] : 'post.png'; ?>" 
                          onerror="this.onerror=null;this.src='<?php echo base_url() ?>assets/img/banner1.jpg';" 
                          alt="<?php echo !empty($pst['post_alt_title']) ? $pst['post_alt_title'] : 'Post Image'; ?>">
                  </div>
                  <div class="p6-grid-body">
                     <div class="p6-card-tag"><?php echo strtoupper(str_replace('-',' ',$this->uri->segment(2)));?> NEWS</div>
                     <h3 class="p6-card-title"><?php echo ucfirst($pst['post_title']);?></h3>
                     <div class="p6-card-footer">
                        <span><i class="fa-regular fa-calendar-days me-1"></i> <?php echo date('M d, Y', strtotime(!empty($pst['posted_date']) ? $pst['posted_date'] : 'now')); ?></span>
                        <span class="p6-read-btn">Read Article &rsaquo;</span>
                     </div>
                  </div>
               </a>
            </div>
         <?php } ?>
      </div>
   </div>
</section>