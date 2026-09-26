<!-- Page Six & NY Post Design System for Cookies / Productivity Tools Details View -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,600;0,700;0,800;1,700&display=swap" rel="stylesheet">

<style>
:root {
   --p6-cyan: #0891b2;
   --p6-cyan-hover: #0e7490;
   --p6-dark: #0f172a;
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
   border-bottom: 3px solid var(--p6-cyan);
   padding: 32px 0 24px 0;
   margin-bottom: 32px;
}

.p6-breadcrumb {
   font-family: var(--p6-font-accent);
   font-size: 0.85rem;
   letter-spacing: 1.5px;
   color: var(--p6-cyan);
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
   background: var(--p6-cyan);
   color: #ffffff;
   display: inline-flex;
   align-items: center;
   justify-content: center;
   font-weight: 700;
   font-family: var(--p6-font-accent);
}

.p6-meta-tag {
   background: var(--p6-cyan);
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
   box-shadow: 0 4px 20px rgba(8,145,178,0.08);
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
   border-left: 5px solid var(--p6-cyan);
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
   background: #ecfeff;
   border-left: 4px solid var(--p6-cyan);
   padding: 18px 24px;
   font-style: italic;
   font-size: 1.2rem;
   color: #164e63;
   margin: 28px 0;
   border-radius: 0 8px 8px 0;
}

/* Sidebar Widgets */
.p6-sidebar-widget {
   background: #ffffff;
   border: 1px solid var(--p6-card-border);
   border-top: 4px solid var(--p6-cyan);
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
   color: var(--p6-cyan);
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
   color: var(--p6-cyan);
}

/* E-E-A-T Author Box */
.p6-eeat-box {
   background: #ecfeff;
   border: 1px solid #cffaff;
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
         <a href="<?php echo base_url(); ?>cookies/canva" class="text-decoration-none text-info">PRODUCTIVITY & MEDIA TOOLS</a>
         <i class="fa-solid fa-chevron-right text-muted" style="font-size: 0.7rem;"></i>
         <span>TOOL MASTERCLASS</span>
      </div>

      <h1 class="p6-detail-title">
         <?php echo isset($post_details['post_title']) ? htmlspecialchars($post_details['post_title']) : 'Productivity & Digital Media Tool Benchmark'; ?>
      </h1>

      <div class="p6-author-bar flex-wrap justify-content-between">
         <div class="d-flex align-items-center gap-3">
            <div class="p6-author-avatar">
               <i class="fa-solid fa-sliders"></i>
            </div>
            <div>
               <div class="d-flex align-items-center flex-wrap gap-2">
                  <span class="fw-bold text-dark">Written by <span class="text-info fw-bold">Imperialpedia Software Engineering Lab</span></span>
                  <span class="p6-meta-tag"><i class="fa-solid fa-microchip me-1"></i> VERIFIED WORKFLOW</span>
               </div>
               <div class="text-muted small">
                  Published: <?php echo date('F j, Y'); ?> | Tested & Verified for 2026 Workflows
               </div>
            </div>
         </div>
         <!-- Byline Share Icons (Desktop) -->
         <div class="d-none d-md-flex align-items-center gap-2 mt-2 mt-md-0">
            <span class="text-uppercase text-muted fw-bold me-1" style="font-size: 0.75rem; letter-spacing: 1px;">Share:</span>
            <a href="https://twitter.com/intent/tweet?text=<?php echo urlencode(isset($post_details['post_title']) ? $post_details['post_title'] : 'Software Tool Benchmark'); ?>&url=<?php echo urlencode(base_url().uri_string()); ?>" target="_blank" class="btn btn-sm btn-outline-dark rounded-circle" style="width:34px; height:34px; padding:0; display:inline-flex; align-items:center; justify-content:center;" title="Share on Twitter/X">
               <i class="fa-brands fa-x-twitter"></i>
            </a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=<?php echo urlencode(base_url().uri_string()); ?>" target="_blank" class="btn btn-sm btn-outline-primary rounded-circle" style="width:34px; height:34px; padding:0; display:inline-flex; align-items:center; justify-content:center;" title="Share on Facebook">
               <i class="fa-brands fa-facebook-f"></i>
            </a>
            <a href="https://api.whatsapp.com/send?text=<?php echo urlencode((isset($post_details['post_title']) ? $post_details['post_title'] : 'Software Tool Benchmark').' '.base_url().uri_string()); ?>" target="_blank" class="btn btn-sm btn-outline-success rounded-circle" style="width:34px; height:34px; padding:0; display:inline-flex; align-items:center; justify-content:center;" title="Share on WhatsApp">
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
            <img src="<?php echo base_url().'assets/images/'.$post_details['file_name']; ?>" alt="Productivity Report Image" class="img-fluid">
         </div>
         <?php else: ?>
         <div class="p6-featured-img-container" style="background: linear-gradient(135deg, #0f172a 0%, #164e63 100%); color: #fff; min-height: 280px;">
            <div class="text-center p-4">
               <i class="fa-solid fa-cubes text-info display-3 mb-3"></i>
               <h3 class="fw-bold">2026 SaaS & Digital Media Tool Masterclass</h3>
               <p class="text-light opacity-75">Verified Performance Benchmark & Workflow Optimization Guide</p>
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
               Optimizing digital media production workflows requires choosing the right software ecosystem, understanding licensing constraints, and configuring automated batch tools.
            </p>

            <h2>1. Workflow Efficiency & Performance</h2>
            <p>
               Modern digital publishing demands tools that deliver sub-second output rendering, real-time collaboration, and flexible export formats across web and mobile platforms.
            </p>

            <h2>2. Key Benchmarks & Asset Optimization</h2>
            <ul>
               <li><strong>Batch Processing Speed:</strong> Generate dozens of graphics or audio renders in seconds.</li>
               <li><strong>Export Formats:</strong> Prefer WebP and SVG formats to maximize page load speeds.</li>
               <li><strong>License Verification:</strong> Maintain clear commercial usage licenses for all external digital assets.</li>
            </ul>

            <blockquote>
               "Standardizing asset creation through verified SaaS workflows reduces production overhead while increasing publishing velocity."
            </blockquote>

            <h2>3. Recommended Action Steps</h2>
            <p>
               Audit software licensing, train team members on brand kits, and automate redundant media tasks to maximize operational ROI in 2026.
            </p>
            <?php } ?>
         </div>

         <!-- E-E-A-T Author Box -->
         <div class="p6-eeat-box">
            <div class="p6-author-avatar" style="width: 56px; height: 56px; font-size: 1.4rem;">
               <i class="fa-solid fa-code-compare"></i>
            </div>
            <div>
               <h5 class="fw-bold mb-1 text-dark">Reviewed by Software & Media Engineering Lead</h5>
               <p class="text-muted small mb-0">
                  Imperialpedia Productivity Lab conducts empirical benchmark testing across SaaS platforms, design tools, and media rendering pipelines to provide unbiased technical evaluations.
               </p>
            </div>
         </div>
      </div>

      <!-- Right Sidebar -->
      <div class="col-lg-4">
         <!-- Audio Summary Widget -->
         <div class="p6-sidebar-widget" style="border-top-color: #0891b2;">
            <div class="p6-sidebar-title"><i class="fa-solid fa-headphones me-2 text-info"></i> Audio Summary</div>
            <div class="d-flex align-items-center gap-3">
               <button class="btn btn-info text-white rounded-circle" style="width: 48px; height: 48px;"><i class="fa-solid fa-play fs-5"></i></button>
               <div>
                  <div class="fw-bold text-dark" style="font-size: 0.9rem;">SaaS Benchmark Digest</div>
                  <div class="text-muted small">Duration: 4 mins • AI Voice</div>
               </div>
            </div>
         </div>

         <!-- Trending Tools Guides Widget -->
         <div class="p6-sidebar-widget">
            <div class="p6-sidebar-title"><i class="fa-solid fa-fire me-2 text-danger"></i> Trending SaaS Guides</div>
            
            <div class="p6-trending-item">
               <div class="p6-trending-number">01</div>
               <div>
                  <a href="<?php echo base_url(); ?>cookies/canva" class="p6-trending-link">
                     Canva Pro Brand Kit Masterclass: Advanced Batch Creation (2026)
                  </a>
                  <div class="text-muted small mt-1"><i class="fa-solid fa-eye me-1"></i> 28.7k Reads</div>
               </div>
            </div>

            <div class="p6-trending-item">
               <div class="p6-trending-number">02</div>
               <div>
                  <a href="<?php echo base_url(); ?>cookies/grammerly" class="p6-trending-link">
                     Grammarly Premium vs ProWriter: AI Tone & Plagiarism Benchmark
                  </a>
                  <div class="text-muted small mt-1"><i class="fa-solid fa-eye me-1"></i> 21.4k Reads</div>
               </div>
            </div>

            <div class="p6-trending-item">
               <div class="p6-trending-number">03</div>
               <div>
                  <a href="<?php echo base_url(); ?>cookies/envanto" class="p6-trending-link">
                     Envato Elements Licensing Masterclass: Commercial Usage Rights
                  </a>
                  <div class="text-muted small mt-1"><i class="fa-solid fa-eye me-1"></i> 19.8k Reads</div>
               </div>
            </div>
         </div>

         <!-- SaaS Tool CTA -->
         <div class="p6-sidebar-widget text-center bg-dark text-white">
            <i class="fa-solid fa-laptop-code text-info display-4 mb-3"></i>
            <h4 class="fw-bold text-white mb-2">SaaS Tool Finder</h4>
            <p class="text-light opacity-75 small mb-3">Filter verified software tools by feature set, pricing tier, and API capabilities.</p>
            <a href="<?php echo base_url(); ?>cookies/canva" class="btn btn-info w-100 fw-bold text-white">EXPLORE DIRECTORY</a>
         </div>
      </div>
   </div>
</div>
