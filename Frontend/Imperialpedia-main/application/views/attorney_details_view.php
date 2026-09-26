<!-- Page Six & NY Post Design System for Attorney Details View -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,600;0,700;0,800;1,700&display=swap" rel="stylesheet">

<style>
:root {
   --p6-gold: #d97706;
   --p6-gold-hover: #b45309;
   --p6-dark: #0f172a;
   --p6-gray-bg: #f8f9fa;
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
   border-bottom: 3px solid var(--p6-dark);
   padding: 32px 0 24px 0;
   margin-bottom: 32px;
}

.p6-breadcrumb {
   font-family: var(--p6-font-accent);
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
   background: var(--p6-dark);
   color: #f59e0b;
   display: inline-flex;
   align-items: center;
   justify-content: center;
   font-weight: 700;
   font-family: var(--p6-font-accent);
}

.p6-meta-tag {
   background: var(--p6-gold);
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
   box-shadow: 0 4px 20px rgba(15,23,42,0.08);
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
   border-left: 5px solid var(--p6-gold);
}

.p6-article-body h3 {
   font-family: var(--p6-font-headline) !important; font-weight: 800 !important; color: #0f172a !important; letter-spacing: -0.025em;
   font-weight: 700;
   color: #0f172a;
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
   background: #fffbe6;
   border-left: 4px solid var(--p6-gold);
   padding: 18px 24px;
   font-style: italic;
   font-size: 1.2rem;
   color: #451a03;
   margin: 28px 0;
   border-radius: 0 8px 8px 0;
}

/* Sidebar Widgets */
.p6-sidebar-widget {
   background: #ffffff;
   border: 1px solid var(--p6-card-border);
   border-top: 4px solid var(--p6-dark);
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
   color: var(--p6-gold);
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
   color: var(--p6-gold);
}

/* E-E-A-T Author Box */
.p6-eeat-box {
   background: #f8fafc;
   border: 1px solid #e2e8f0;
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
         <a href="<?php echo base_url(); ?>attorney/immigration" class="text-decoration-none text-warning">LEGAL & IMMIGRATION</a>
         <i class="fa-solid fa-chevron-right text-muted" style="font-size: 0.7rem;"></i>
         <span>LEGAL DOSSIER</span>
      </div>

      <h1 class="p6-detail-title">
         <?php echo isset($post_details['post_title']) ? htmlspecialchars($post_details['post_title']) : 'Legal & Immigration Intelligence Report'; ?>
      </h1>

      <div class="p6-author-bar flex-wrap justify-content-between">
         <div class="d-flex align-items-center gap-3">
            <div class="p6-author-avatar">
               <i class="fa-solid fa-scale-balanced"></i>
            </div>
            <div>
               <div class="d-flex align-items-center flex-wrap gap-2">
                  <span class="fw-bold text-dark">Written by <span class="text-warning fw-bold">Imperialpedia Legal Editorial Board</span></span>
                  <span class="p6-meta-tag"><i class="fa-solid fa-shield-halved me-1"></i> VERIFIED LEGAL INTEL</span>
               </div>
               <div class="text-muted small">
                  Published: <?php echo date('F j, Y'); ?> | Verified & Updated for 2026 Legal Standards
               </div>
            </div>
         </div>
         <!-- Byline Share Icons (Desktop) -->
         <div class="d-none d-md-flex align-items-center gap-2 mt-2 mt-md-0">
            <span class="text-uppercase text-muted fw-bold me-1" style="font-size: 0.75rem; letter-spacing: 1px;">Share:</span>
            <a href="https://twitter.com/intent/tweet?text=<?php echo urlencode(isset($post_details['post_title']) ? $post_details['post_title'] : 'Legal Intelligence Report'); ?>&url=<?php echo urlencode(base_url().uri_string()); ?>" target="_blank" class="btn btn-sm btn-outline-dark rounded-circle" style="width:34px; height:34px; padding:0; display:inline-flex; align-items:center; justify-content:center;" title="Share on Twitter/X">
               <i class="fa-brands fa-x-twitter"></i>
            </a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=<?php echo urlencode(base_url().uri_string()); ?>" target="_blank" class="btn btn-sm btn-outline-primary rounded-circle" style="width:34px; height:34px; padding:0; display:inline-flex; align-items:center; justify-content:center;" title="Share on Facebook">
               <i class="fa-brands fa-facebook-f"></i>
            </a>
            <a href="https://api.whatsapp.com/send?text=<?php echo urlencode((isset($post_details['post_title']) ? $post_details['post_title'] : 'Legal Intelligence Report').' '.base_url().uri_string()); ?>" target="_blank" class="btn btn-sm btn-outline-success rounded-circle" style="width:34px; height:34px; padding:0; display:inline-flex; align-items:center; justify-content:center;" title="Share on WhatsApp">
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
            <img src="<?php echo base_url().'assets/images/'.$post_details['file_name']; ?>" alt="Legal Report Featured Image" class="img-fluid">
         </div>
         <?php else: ?>
         <div class="p6-featured-img-container" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fff; min-height: 280px;">
            <div class="text-center p-4">
               <i class="fa-solid fa-scale-balanced text-warning display-3 mb-3"></i>
               <h3 class="fw-bold">Legal & Visa Cost Analysis 2026</h3>
               <p class="text-light opacity-75">Verified Financial & Immigration Advisory Dossier</p>
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
               Navigating complex legal regulatory frameworks requires precise, up-to-date information vetted by industry experts. Below is our complete reference on legal compliance, visa cost structures, and asset protection.
            </p>

            <h2>1. Legal Compliance & Regulatory Standards</h2>
            <p>
               Whether dealing with corporate structuring, international tax agreements, or cross-border residency, maintaining 100% compliance with local and international statutes is essential for protecting capital and personal assets.
            </p>

            <h2>2. Key Financial & Capital Requirements</h2>
            <p>
               Submitting immigration or corporate legal documentation involves clear baseline threshold investments. Below are key checkpoints to evaluate before initiating any legal process:
            </p>
            <ul>
               <li><strong>Minimum Capital Thresholds:</strong> Review sovereign program requirements and escrow mechanisms.</li>
               <li><strong>Due Diligence Procedures:</strong> Comprehensive background verification across financial institutions.</li>
               <li><strong>Legal Processing Timelines:</strong> Standard execution ranges from 60 to 180 days based on jurisdiction.</li>
            </ul>

            <blockquote>
               "Due diligence and precise capital documentation remain the two critical pillars of successful international legal & residency compliance."
            </blockquote>

            <h2>3. Actionable Checklist for 2026</h2>
            <p>
               Ensure all document notarizations, translations, and financial audits are performed by certified counsel to eliminate application rejections and administrative delays.
            </p>
            <?php } ?>
         </div>

         <!-- E-E-A-T Author Box -->
         <div class="p6-eeat-box">
            <div class="p6-author-avatar" style="width: 56px; height: 56px; font-size: 1.4rem;">
               <i class="fa-solid fa-user-shield"></i>
            </div>
            <div>
               <h5 class="fw-bold mb-1 text-dark">Reviewed by Legal & Immigration Analysts</h5>
               <p class="text-muted small mb-0">
                  Imperialpedia Legal Intelligence publishes expert analysis covering global visa programs, corporate law, compliance, and wealth preservation strategies. Every guide is double-checked for regulatory accuracy.
               </p>
            </div>
         </div>
      </div>

      <!-- Right Sidebar -->
      <div class="col-lg-4">
         <!-- Audio Player Widget -->
         <div class="p6-sidebar-widget" style="border-top-color: #d97706;">
            <div class="p6-sidebar-title"><i class="fa-solid fa-headphones me-2 text-warning"></i> Listen to Summary</div>
            <div class="d-flex align-items-center gap-3">
               <button class="btn btn-warning rounded-circle" style="width: 48px; height: 48px;"><i class="fa-solid fa-play text-white fs-5"></i></button>
               <div>
                  <div class="fw-bold text-dark" style="font-size: 0.9rem;">Audio Legal Digest</div>
                  <div class="text-muted small">Duration: 4 mins • AI Voice</div>
               </div>
            </div>
         </div>

         <!-- Trending Legal Guides Widget -->
         <div class="p6-sidebar-widget">
            <div class="p6-sidebar-title"><i class="fa-solid fa-fire me-2 text-danger"></i> Trending Legal Reports</div>
            
            <div class="p6-trending-item">
               <div class="p6-trending-number">01</div>
               <div>
                  <a href="<?php echo base_url(); ?>attorney/immigration" class="p6-trending-link">
                     Golden Visa Cost Breakdown 2026: Investment Thresholds Compared
                  </a>
                  <div class="text-muted small mt-1"><i class="fa-solid fa-eye me-1"></i> 24.8k Reads</div>
               </div>
            </div>

            <div class="p6-trending-item">
               <div class="p6-trending-number">02</div>
               <div>
                  <a href="<?php echo base_url(); ?>attorney/immigration" class="p6-trending-link">
                     Corporate Entity Structuring for Tax Efficiency & Asset Shielding
                  </a>
                  <div class="text-muted small mt-1"><i class="fa-solid fa-eye me-1"></i> 18.3k Reads</div>
               </div>
            </div>

            <div class="p6-trending-item">
               <div class="p6-trending-number">03</div>
               <div>
                  <a href="<?php echo base_url(); ?>attorney/immigration" class="p6-trending-link">
                     Intellectual Property & Patent Protection Framework for Founders
                  </a>
                  <div class="text-muted small mt-1"><i class="fa-solid fa-eye me-1"></i> 14.1k Reads</div>
               </div>
            </div>
         </div>

         <!-- Legal Calculator CTA -->
         <div class="p6-sidebar-widget text-center bg-dark text-white">
            <i class="fa-solid fa-calculator text-warning display-4 mb-3"></i>
            <h4 class="fw-bold text-white mb-2">Golden Visa Estimator</h4>
            <p class="text-light opacity-75 small mb-3">Calculate total application fees, tax commitments, and investment requirements instantly.</p>
            <a href="<?php echo base_url(); ?>attorney/immigration#calculator" class="btn btn-warning w-100 fw-bold">RUN CALCULATOR</a>
         </div>
      </div>
   </div>
</div>
