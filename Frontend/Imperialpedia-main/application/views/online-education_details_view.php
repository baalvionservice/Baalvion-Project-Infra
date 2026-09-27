<!-- Page Six & NY Post Design System for Online Education Details View -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,600;0,700;0,800;1,700&display=swap" rel="stylesheet">

<style>
:root {
   --p6-amber: #d97706;
   --p6-amber-hover: #b45309;
   --p6-dark: #1e1b4b;
   --p6-gray-bg: #f8fafc;
   --p6-card-border: #cbd5e1;
   --p6-font-headline: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
   --p6-font-body: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
   --p6-font-accent: 'Plus Jakarta Sans', 'Inter', sans-serif;
}

body {
   background-color: #f8fafc;
   font-family: var(--p6-font-body);
   color: #1e293b;
}

/* Article Hero Header */
.p6-detail-header {
   background: #ffffff;
   border-bottom: 3px solid var(--p6-amber);
   padding: 32px 0 24px 0;
   margin-bottom: 32px;
}

.p6-breadcrumb {
   font-family: var(--p6-font-accent);
   font-size: 0.85rem;
   letter-spacing: 1.5px;
   color: var(--p6-amber);
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
   background: var(--p6-amber);
   color: #ffffff;
   display: inline-flex;
   align-items: center;
   justify-content: center;
   font-weight: 700;
   font-family: var(--p6-font-accent);
}

.p6-meta-tag {
   background: var(--p6-amber);
   color: #ffffff;
   font-family: var(--p6-font-accent);
   font-size: 0.72rem;
   font-weight: 700;
   padding: 3px 10px;
   letter-spacing: 1.5px;
   text-transform: uppercase;
   border-radius: 2px;
}

/* Featured Hero Image */
.p6-featured-img-container {
   border-radius: 12px;
   overflow: hidden;
   box-shadow: 0 4px 20px rgba(217,119,6,0.08);
   margin-bottom: 28px;
   border: 1px solid var(--p6-card-border);
   background: #ffffff;
   padding: 16px;
   display: flex;
   align-items: center;
   justify-content: center;
}

.p6-featured-img-container img {
   max-height: 420px;
   object-fit: cover;
   width: 100%;
   border-radius: 8px;
}

/* Article Content Body */
.p6-article-body {
   font-size: 1.15rem;
   line-height: 1.85;
   color: #334155;
}

.p6-article-body h2 {
   font-family: var(--p6-font-headline) !important; font-weight: 800 !important; color: #0f172a !important; letter-spacing: -0.025em;
   font-weight: 700;
   color: var(--p6-dark);
   font-size: 1.8rem;
   margin-top: 36px;
   margin-bottom: 18px;
   padding-left: 14px;
   border-left: 5px solid var(--p6-amber);
}

.p6-article-body h3 {
   font-family: var(--p6-font-headline) !important; font-weight: 800 !important; color: #0f172a !important; letter-spacing: -0.025em;
   font-weight: 700;
   color: #1e1b4b;
   font-size: 1.4rem;
   margin-top: 28px;
   margin-bottom: 14px;
}

.p6-article-body p {
   margin-bottom: 22px;
}

.p6-article-body ul, .p6-article-body ol {
   margin-bottom: 24px;
   padding-left: 28px;
}

.p6-article-body li {
   margin-bottom: 8px;
}

.p6-article-body blockquote {
   background: #fef3c7;
   border-left: 4px solid var(--p6-amber);
   padding: 18px 24px;
   font-style: italic;
   font-size: 1.2rem;
   color: #78350f;
   margin: 28px 0;
   border-radius: 0 8px 8px 0;
}

/* Sidebar Widgets */
.p6-sidebar-widget {
   background: #ffffff;
   border: 1px solid var(--p6-card-border);
   border-top: 4px solid var(--p6-amber);
   border-radius: 8px;
   padding: 24px;
   margin-bottom: 28px;
   box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}

.p6-sidebar-title {
   font-family: var(--p6-font-accent);
   font-size: 1.25rem;
   font-weight: 700;
   text-transform: uppercase;
   letter-spacing: 1px;
   color: var(--p6-dark);
   border-bottom: 2px solid #f1f5f9;
   padding-bottom: 10px;
   margin-bottom: 18px;
}

.p6-trending-number {
   font-family: var(--p6-font-accent);
   font-size: 1.8rem;
   font-weight: 700;
   color: var(--p6-amber);
   line-height: 1;
   min-width: 32px;
}

.p6-trending-item {
   display: flex;
   gap: 12px;
   align-items: flex-start;
   padding: 12px 0;
   border-bottom: 1px solid #f1f5f9;
}

.p6-trending-item:last-child {
   border-bottom: none;
}

.p6-trending-link {
   color: var(--p6-dark);
   text-decoration: none;
   font-weight: 600;
   font-size: 0.95rem;
   line-height: 1.35;
   transition: color 0.2s;
}

.p6-trending-link:hover {
   color: var(--p6-amber);
}

/* E-E-A-T Author Box */
.p6-eeat-box {
   background: #fffbe6;
   border: 1px solid #fef3c7;
   border-radius: 12px;
   padding: 24px;
   margin: 40px 0;
   display: flex;
   gap: 20px;
   align-items: center;
}
</style>

<div class="p6-detail-header">
   <div class="container">
      <div class="p6-breadcrumb">
         <a href="<?php echo base_url(); ?>" class="text-decoration-none text-muted">HOME</a>
         <i class="fa-solid fa-chevron-right text-muted" style="font-size: 0.7rem;"></i>
         <a href="<?php echo base_url(); ?>online-education/degrees" class="text-decoration-none text-warning">ONLINE EDUCATION</a>
         <i class="fa-solid fa-chevron-right text-muted" style="font-size: 0.7rem;"></i>
         <span>DEGREE GUIDE</span>
      </div>

      <h1 class="p6-detail-title">
         <?php echo isset($post_details['post_title']) ? htmlspecialchars($post_details['post_title']) : 'Online Education & Higher Learning Report'; ?>
      </h1>

      <div class="p6-author-bar flex-wrap justify-content-between">
         <div class="d-flex align-items-center gap-3">
            <div class="p6-author-avatar">
               <i class="fa-solid fa-graduation-cap"></i>
            </div>
            <div>
               <div class="d-flex align-items-center flex-wrap gap-2">
                  <span class="fw-bold text-dark">Written by <span class="text-warning fw-bold">Imperialpedia Academic Board</span></span>
                  <span class="p6-meta-tag"><i class="fa-solid fa-certificate me-1"></i> ACCREDITED EDU REPORT</span>
               </div>
               <div class="text-muted small">
                  Published: <?php echo date('F j, Y'); ?> | Verified for 2026 University Standards
               </div>
            </div>
         </div>
         <!-- Byline Share Icons (Desktop) -->
         <div class="d-none d-md-flex align-items-center gap-2 mt-2 mt-md-0">
            <span class="text-uppercase text-muted fw-bold me-1" style="font-size: 0.75rem; letter-spacing: 1px;">Share:</span>
            <a href="https://twitter.com/intent/tweet?text=<?php echo urlencode(isset($post_details['post_title']) ? $post_details['post_title'] : 'Online Education Guide'); ?>&url=<?php echo urlencode(base_url().uri_string()); ?>" target="_blank" class="btn btn-sm btn-outline-dark rounded-circle" style="width:34px; height:34px; padding:0; display:inline-flex; align-items:center; justify-content:center;" title="Share on Twitter/X">
               <i class="fa-brands fa-x-twitter"></i>
            </a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=<?php echo urlencode(base_url().uri_string()); ?>" target="_blank" class="btn btn-sm btn-outline-primary rounded-circle" style="width:34px; height:34px; padding:0; display:inline-flex; align-items:center; justify-content:center;" title="Share on Facebook">
               <i class="fa-brands fa-facebook-f"></i>
            </a>
            <a href="https://api.whatsapp.com/send?text=<?php echo urlencode((isset($post_details['post_title']) ? $post_details['post_title'] : 'Online Education Guide').' '.base_url().uri_string()); ?>" target="_blank" class="btn btn-sm btn-outline-success rounded-circle" style="width:34px; height:34px; padding:0; display:inline-flex; align-items:center; justify-content:center;" title="Share on WhatsApp">
               <i class="fa-brands fa-whatsapp"></i>
            </a>
         </div>
      </div>
   </div>
</div>

<div class="container mb-5">
   <div class="row">
      <!-- Main Content Column -->
      <div class="col-lg-8">
         <?php if(!empty($post_details['file_name'])): ?>
         <div class="p6-featured-img-container">
            <img src="<?php echo base_url().'assets/images/'.$post_details['file_name']; ?>" alt="Education Report Featured Image" class="img-fluid">
         </div>
         <?php else: ?>
         <div class="p6-featured-img-container" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #fff; min-height: 280px;">
            <div class="text-center p-4">
               <i class="fa-solid fa-graduation-cap text-warning display-3 mb-3"></i>
               <h3 class="fw-bold">2026 Online Degree & Certification ROI Report</h3>
               <p class="text-light opacity-75">Verified Salary Multiplier & Tuition Benchmark Guide</p>
            </div>
         </div>
         <?php endif; ?>

         <div class="p6-article-body bg-white p-4 p-md-5 rounded border shadow-sm">
            <?php 
            if(!empty($post_details['post_desc'])){
               echo $post_details['post_desc'];
            } else {
            ?>
            <p class="lead fw-bold text-dark mb-4">
               Online higher education has revolutionized career advancement, allowing professionals to unlock 40%+ salary bumps without taking time off work. Below is our benchmark breakdown.
            </p>

            <h2>1. Accreditation & Degree Recognition</h2>
            <p>
               The single most critical factor when evaluating an online degree is institutional accreditation (AACSB, ABET, or regional accreditation bodies). Unaccredited programs yield zero enterprise market value.
            </p>

            <h2>2. Financial Return on Investment (ROI)</h2>
            <p>
               Compare total tuition costs against average post-graduation compensation increases to calculate your exact payback period:
            </p>
            <ul>
               <li><strong>Top Online MBAs:</strong> Payback period averages 1.4 years with salary multipliers of 1.65x.</li>
               <li><strong>Computer Science & AI Degrees:</strong> Average starting tech compensation ranges from $115,000 to $185,000.</li>
               <li><strong>Executive Certificates:</strong> High-impact skills certification in under 6 months.</li>
            </ul>

            <blockquote>
               "An accredited online degree combined with hands-on portfolio projects delivers maximum ROI for tech and business executives in 2026."
            </blockquote>

            <h2>3. Recommended Action Steps</h2>
            <p>
               Audit course curriculum, verify alumni outcomes on LinkedIn, and confirm employer tuition assistance programs prior to enrollment.
            </p>
            <?php } ?>
         </div>

         <!-- E-E-A-T Author Box -->
         <div class="p6-eeat-box">
            <div class="p6-author-avatar" style="width: 56px; height: 56px; font-size: 1.4rem;">
               <i class="fa-solid fa-award"></i>
            </div>
            <div>
               <h5 class="fw-bold mb-1 text-dark">Reviewed by Educational Analysts</h5>
               <p class="text-muted small mb-0">
                  Imperialpedia Education Intelligence evaluates top online degree programs, certification platforms, and career outcome data. All reports are verified for accreditation accuracy.
               </p>
            </div>
         </div>
      </div>

      <!-- Right Sidebar -->
      <div class="col-lg-4">
         <!-- Audio Player Widget -->
         <div class="p6-sidebar-widget" style="border-top-color: #d97706;">
            <div class="p6-sidebar-title"><i class="fa-solid fa-headphones me-2 text-warning"></i> Audio Summary</div>
            <div class="d-flex align-items-center gap-3">
               <button class="btn btn-warning text-white rounded-circle" style="width: 48px; height: 48px;"><i class="fa-solid fa-play fs-5"></i></button>
               <div>
                  <div class="fw-bold text-dark" style="font-size: 0.9rem;">Degree ROI Podcast</div>
                  <div class="text-muted small">Duration: 5 mins • AI Voice</div>
               </div>
            </div>
         </div>

         <!-- Trending Degree Guides Widget -->
         <div class="p6-sidebar-widget">
            <div class="p6-sidebar-title"><i class="fa-solid fa-fire me-2 text-danger"></i> Top Degree Benchmarks</div>
            
            <div class="p6-trending-item">
               <div class="p6-trending-number">01</div>
               <div>
                  <a href="<?php echo base_url(); ?>online-education/degrees" class="p6-trending-link">
                     Top 10 Online MBAs with Under 2-Year ROI Payback (2026 Rankings)
                  </a>
                  <div class="text-muted small mt-1"><i class="fa-solid fa-eye me-1"></i> 31.2k Reads</div>
               </div>
            </div>

            <div class="p6-trending-item">
               <div class="p6-trending-number">02</div>
               <div>
                  <a href="<?php echo base_url(); ?>online-education/degrees" class="p6-trending-link">
                     Online MS in Artificial Intelligence: Harvard vs UIUC vs Georgia Tech
                  </a>
                  <div class="text-muted small mt-1"><i class="fa-solid fa-eye me-1"></i> 22.9k Reads</div>
               </div>
            </div>

            <div class="p6-trending-item">
               <div class="p6-trending-number">03</div>
               <div>
                  <a href="<?php echo base_url(); ?>online-education/degrees" class="p6-trending-link">
                     How to Get Employer-Funded Tuition Assistance for Advanced Degrees
                  </a>
                  <div class="text-muted small mt-1"><i class="fa-solid fa-eye me-1"></i> 17.4k Reads</div>
               </div>
            </div>
         </div>

         <!-- Education Calculator CTA -->
         <div class="p6-sidebar-widget text-center bg-dark text-white">
            <i class="fa-solid fa-calculator text-warning display-4 mb-3"></i>
            <h4 class="fw-bold text-white mb-2">Degree ROI Calculator</h4>
            <p class="text-light opacity-75 small mb-3">Input tuition cost and expected salary bump to calculate your exact payback timeline.</p>
            <a href="<?php echo base_url(); ?>online-education/degrees#calculator" class="btn btn-warning w-100 fw-bold text-white">RUN ROI CALCULATOR</a>
         </div>
      </div>
   </div>
</div>
