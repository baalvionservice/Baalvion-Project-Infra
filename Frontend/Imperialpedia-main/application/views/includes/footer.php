<!-- Global footer -->
<style>
   .p6-footer-wrap {
      background: #090d16;
      color: #94a3b8;
      font-family: 'Roboto', sans-serif;
      border-top: 4px solid var(--p6-red, #d00000);
      margin-top: 60px;
   }
   
   /* VIP Newsletter Header Banner */
   .p6-newsletter-banner {
      background: linear-gradient(135deg, #111827 0%, #1e1b4b 100%);
      border-bottom: 1px solid #1f2937;
      padding: 40px 0;
   }
   .p6-news-heading {
      font-family: 'Oswald', sans-serif;
      font-size: 2.2rem;
      font-weight: 700;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
   }
   .p6-news-sub {
      color: #94a3b8;
      font-size: 0.95rem;
   }
   .p6-news-input {
      background: #0f172a;
      border: 1px solid #334155;
      color: #ffffff;
      padding: 12px 18px;
      border-radius: 4px 0 0 4px;
      font-size: 0.95rem;
   }
   .p6-news-input:focus {
      background: #0f172a;
      border-color: #d00000;
      color: #ffffff;
      box-shadow: none;
   }
   .p6-news-btn {
      background: #d00000;
      color: #ffffff;
      font-family: 'Oswald', sans-serif;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 12px 24px;
      border: none;
      border-radius: 0 4px 4px 0;
      transition: all 0.2s ease;
   }
   .p6-news-btn:hover {
      background: #b00000;
      color: #ffffff;
   }

   /* Main Footer Broadsheet Columns */
   .p6-foot-col-title {
      font-family: 'Oswald', sans-serif;
      font-size: 1.15rem;
      font-weight: 700;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 18px;
      padding-bottom: 8px;
      border-bottom: 2px solid #1e293b;
      display: flex;
      align-items: center;
      gap: 8px;
   }
   .p6-foot-col-title::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 16px;
      background: #d00000;
   }
   .p6-foot-links {
      list-style: none;
      padding: 0;
      margin: 0;
   }
   .p6-foot-links li {
      margin-bottom: 10px;
   }
   .p6-foot-links a {
      color: #cbd5e1;
      text-decoration: none;
      font-size: 0.88rem;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
   }
   .p6-foot-links a:hover {
      color: #00cdac;
      transform: translateX(3px);
   }

   /* A-Z Directory Mesh */
   .p6-az-container {
      background: #0d1322;
      padding: 24px;
      border-radius: 8px;
      border: 1px solid #1e293b;
      margin: 30px 0;
   }
   .p6-az-title {
      font-family: 'Oswald', sans-serif;
      font-size: 0.9rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
   }
   .p6-az-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      list-style: none;
      padding: 0;
      margin: 0;
   }
   .p6-az-list a {
      display: inline-block;
      width: 32px;
      height: 32px;
      line-height: 32px;
      text-align: center;
      background: #1e293b;
      color: #f8fafc;
      font-family: 'Oswald', sans-serif;
      font-weight: 600;
      border-radius: 4px;
      text-decoration: none;
      font-size: 0.85rem;
      text-transform: uppercase;
      transition: all 0.2s ease;
   }
   .p6-az-list a:hover {
      background: #d00000;
      color: #ffffff;
   }

   /* Bottom Copyright & Disclaimer Bar */
   .p6-bottom-legal {
      background: #030712;
      border-top: 1px solid #111827;
      padding: 24px 0;
      font-size: 0.8rem;
      color: #64748b;
   }
</style>

<footer class="p6-footer-wrap">

   <!-- Newsletter VIP Banner -->
   <div class="p6-newsletter-banner">
      <div class="container-fluid px-lg-5">
         <div class="row align-items-center">
            <div class="col-lg-6 col-md-12 mb-3 mb-lg-0">
               <h2 class="p6-news-heading"><i class="fa-solid fa-paper-plane text-danger me-2"></i> Get the Imperialpedia newsletter</h2>
               <p class="p6-news-sub mb-0">New articles from the Imperialpedia editorial desk, sent to your inbox.</p>
            </div>
            <div class="col-lg-6 col-md-12">
               <?php echo form_open('subscribe', array('class' => 'row g-0')); ?>
                  <input type="hidden" name="page" id="page" value="<?php echo uri_string()?>">
                  <div class="col-8">
                     <input type="email" class="form-control p6-news-input" name="email" id="email" placeholder="Your email address" aria-label="Email address" required>
                  </div>
                  <div class="col-4">
                     <button type="submit" name="submit" value="submit" class="w-100 p6-news-btn">Subscribe</button>
                  </div>
               </form>
               <div class="form-check mt-2">
                  <input class="form-check-input" type="checkbox" name="newsletter" id="newsletter_consent" checked style="cursor:pointer;">
                  <label class="form-check-label text-muted" for="newsletter_consent" style="font-size: 0.75rem;">
                     I agree to receive Imperialpedia digital briefing updates. Read our <a href="<?php echo base_url();?>privacy-policy" class="text-danger">Privacy Policy</a>.
                  </label>
               </div>
            </div>
         </div>
      </div>
   </div>

   <!-- Broadsheet Footer Columns -->
   <div class="container-fluid px-lg-5 pt-5 pb-4">
      <div class="row g-4">
         
         <!-- Column 1: Brand & E-E-A-T Info -->
         <div class="col-lg-3 col-md-6">
            <div class="mb-3">
               <a href="<?php echo base_url(); ?>" class="text-decoration-none" aria-label="Imperialpedia home">
                  <h3 style="font-size:1.8rem; font-weight:800; color:#fff; letter-spacing:-0.5px; margin:0;">
                     IMPERIAL<span style="color:#d00000;">PEDIA</span>
                  </h3>
               </a>
            </div>
            <p style="font-size:0.85rem; line-height:1.6; color:#94a3b8;">
               Imperialpedia covers SEO updates, digital marketing, health insurance, web hosting, and immigration topics &mdash; written by researchers and industry professionals, not automated tools.
            </p>
         </div>
         <!-- Column 2: Vertical Channels -->
         <div class="col-lg-2 col-md-6 col-6">
            <h4 class="p6-foot-col-title">Channels</h4>
            <ul class="p6-foot-links">
               <li><a href="<?php echo base_url(); ?>seo/web-seo"><i class="fa-solid fa-angle-right text-danger"></i> SEO & Algorithms</a></li>
               <li><a href="<?php echo base_url(); ?>insurance/india"><i class="fa-solid fa-angle-right text-danger"></i> Insurance Guides</a></li>
               <li><a href="<?php echo base_url(); ?>marketing/content-marketing"><i class="fa-solid fa-angle-right text-danger"></i> Marketing Guides</a></li>
               <li><a href="<?php echo base_url(); ?>internet/surface-web"><i class="fa-solid fa-angle-right text-danger"></i> Web & Hosting</a></li>
            </ul>
         </div>

         <!-- Column 3: Corporate Trust -->
         <div class="col-lg-2 col-md-6 col-6">
            <h4 class="p6-foot-col-title">Corporate</h4>
            <ul class="p6-foot-links">
               <li><a href="<?php echo base_url(); ?>about">About Us</a></li>
               <li><a href="<?php echo base_url(); ?>editorial-policy">Editorial Policy</a></li>
               <li><a href="<?php echo base_url(); ?>author">Authors</a></li>
               <li><a href="<?php echo base_url(); ?>terms-use">Terms of Use</a></li>
               <li><a href="<?php echo base_url(); ?>privacy-policy">Privacy Policy</a></li>
               <li><a href="<?php echo base_url(); ?>disclaimer">Disclaimer</a></li>
               <li><a href="<?php echo base_url(); ?>careers">Careers & Hiring</a></li>
            </ul>
         </div>

         <!-- Column 5: Social Media & Channels -->
         <div class="col-lg-2 col-md-6">
            <h4 class="p6-foot-col-title">Community</h4>
            <ul class="p6-foot-links">
               <li><a href="https://twitter.com/ImperialPedia" target="_blank" rel="noopener noreferrer" aria-label="Imperialpedia Twitter/X Desk"><span class="text-info"><svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="vertical-align:-.125em"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></span> Twitter / X</a></li>
               <li><a href="https://discord.gg/Qf2spryUbJ" target="_blank" rel="noopener noreferrer" aria-label="Imperialpedia Discord Hub"><i class="fa-brands fa-discord" style="color:#5865F2;"></i> Discord Hub</a></li>
               <li><a href="https://www.youtube.com/channel/UCSh8QP5s7VFiExTK9sYZdEQ" target="_blank" rel="noopener noreferrer" aria-label="Imperialpedia YouTube Channel"><i class="fa-brands fa-youtube text-danger"></i> YouTube Press</a></li>
               <li><a href="https://www.reddit.com/user/imperialpedia" target="_blank" rel="noopener noreferrer" aria-label="Imperialpedia Reddit Desk"><i class="fa-brands fa-reddit" style="color:#FF4500;"></i> Reddit Desk</a></li>
               <li><a href="<?php echo base_url(); ?>contact"><i class="fa-solid fa-envelope text-warning"></i> Contact Editors</a></li>
            </ul>
         </div>

      </div>

      <!-- A-Z Topic Directory Mesh -->
      <div class="p6-az-container">
         <div class="p6-az-title"><i class="fa-solid fa-font me-1"></i> Imperialpedia Glossary &mdash; Browse Every Topic A-Z</div>
         <ul class="p6-az-list">
            <?php
               $CI =& get_instance();
               $CI->load->model('Term_model');
               $live_letters = $CI->Term_model->letters_with_terms();
               for($i = 'a'; $i != 'aa'; $i++){
                  $has_terms = in_array($i, $live_letters);
            ?>
               <li><a href="<?php echo $has_terms ? base_url().'terms/'.$i : '#'; ?>"<?php echo $has_terms ? '' : ' aria-disabled="true" tabindex="-1" style="pointer-events:none;opacity:.4;cursor:default"'; ?>><?php echo strtoupper($i);?></a></li>
            <?php } ?>
         </ul>
      </div>

   </div>

   <!-- Bottom Legal Footer Bar -->
   <div class="p6-bottom-legal">
      <div class="container-fluid px-lg-5">
         <div class="row align-items-center">
            <div class="col-md-7 text-center text-md-start mb-2 mb-md-0">
               &copy; <?php echo date('Y'); ?> Imperialpedia. All rights reserved.
               <div class="mt-1 text-muted" style="font-size:0.75rem;">
                  Content on Imperialpedia is for educational and informational purposes only. Terms and conditions apply.
               </div>
            </div>
            <div class="col-md-5 text-center text-md-end">
               
            </div>
         </div>
      </div>
   </div>

</footer>

<!-- Core JavaScript Dependencies (Deferred for Maximum Performance & Non-blocking Render) -->
<script src="<?php echo base_url(); ?>assets/vendor/jquery.min.js" defer></script>
<script src="<?php echo base_url()?>assets/js/main.js" defer></script>
<script src="<?php echo base_url(); ?>assets/vendor/bootstrap/bootstrap.bundle.min.js" defer></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.2.2/lazysizes.min.js" async></script>

<!-- Smooth Scroll & Interactive Scripts -->
<script>
   document.addEventListener("DOMContentLoaded", function() { 
      $('a[href*="#"]').bind('click', function(e) { 
         var target = $(this).attr("href"); 
         if (target && target.length > 1 && $(target).length) {
            e.preventDefault(); 
            $('html, body').stop().animate({ 
               scrollTop: $(target).offset().top - 70 
            }, 600); 
            return false; 
         }
      });
   });
</script>
<style>
/* Related reading: card grid built by render_related_reading() */
.p6-article-body .imp-related{margin:2.4rem 0;padding:1.25rem 1.25rem 1.35rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px}
.p6-article-body .imp-related-head{display:flex;align-items:center;gap:10px;margin:0 0 1rem !important;padding:0 !important;border:0 !important;font-size:.8rem !important;line-height:1 !important;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#475569}
.p6-article-body .imp-related-head::after{content:"";flex:1;height:1px;background:#e2e8f0}
.imp-rel-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}
.p6-article-body a.imp-rel-card{display:flex;flex-direction:column;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;text-decoration:none;color:#0f172a;box-shadow:0 1px 2px rgba(15,23,42,.04);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
.p6-article-body a.imp-rel-card:hover{transform:translateY(-3px);border-color:#cbd5e1;box-shadow:0 12px 26px rgba(15,23,42,.10)}
.imp-rel-thumb{display:block;aspect-ratio:16/9;background:#e2e8f0;overflow:hidden}
.imp-rel-thumb img{width:100%;height:100%;object-fit:cover;display:block;margin:0;transition:transform .35s ease}
.p6-article-body a.imp-rel-card:hover .imp-rel-thumb img{transform:scale(1.04)}
.imp-rel-body{display:flex;flex-direction:column;gap:7px;padding:.95rem 1rem 1.05rem;flex:1}
.imp-rel-tag{align-self:flex-start;font-size:.64rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#334155;background:#eef2f7;border-radius:999px;padding:4px 10px}
.imp-rel-title{font-size:.97rem;line-height:1.38;font-weight:700;color:#0f172a;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.imp-rel-meta{margin-top:auto;padding-top:4px;font-size:.78rem;color:#64748b;font-weight:600}
.imp-rel-meta::after{content:" \2192";color:#94a3b8;transition:margin .18s ease,color .18s ease}
.p6-article-body a.imp-rel-card:hover .imp-rel-meta::after{margin-left:4px;color:#0f172a}
/* Tables inside articles: clean on desktop, stacked cards on phones (no sideways scrolling) */
.p6-article-body .table-responsive,.p6-content-box .table-responsive{border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:1.6rem 0 !important;background:#fff}
.p6-article-body table > :not(:first-child),.p6-content-box table > :not(:first-child){border-top:0 !important}
.p6-article-body table,.p6-content-box table{border-color:#e2e8f0 !important;width:100%;margin:0 !important;border-collapse:separate;border-spacing:0;font-size:.95rem;border:0 !important;--bs-table-bg:transparent;--bs-table-striped-bg:transparent}
.p6-article-body table:not(.table-responsive table),.p6-content-box table:not(.table-responsive table){border:1px solid #e2e8f0 !important;border-radius:12px;overflow:hidden}
.p6-article-body thead,.p6-content-box thead,.p6-article-body tbody,.p6-content-box tbody,.p6-article-body tr,.p6-content-box tr{border-color:#e2e8f0 !important}
.p6-article-body thead th,.p6-content-box thead th,.p6-article-body thead td,.p6-content-box thead td{background:#f1f5f9 !important;color:#475569 !important;font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:.85rem 1rem !important;border:0 !important;border-bottom:1px solid #e2e8f0 !important;vertical-align:middle}
.p6-article-body tbody td,.p6-content-box tbody td,.p6-article-body tbody th,.p6-content-box tbody th{padding:.85rem 1rem !important;border:0 !important;border-top:1px solid #eef2f7 !important;background:#fff !important;color:#334155;vertical-align:top;line-height:1.5}
.p6-article-body tbody tr:first-child td,.p6-content-box tbody tr:first-child td{border-top:0 !important}
.p6-article-body tbody td:first-child,.p6-content-box tbody td:first-child{font-weight:700;color:#0f172a}
.p6-article-body tbody tr:hover td,.p6-content-box tbody tr:hover td{background:#f8fafc !important}
@media (max-width: 767.98px){
.p6-article-body .table-responsive,.p6-content-box .table-responsive{border:0;background:transparent;overflow:visible}
.p6-article-body table.p6-stack,.p6-content-box table.p6-stack{display:block;border:0 !important;background:transparent}
.p6-article-body table.p6-stack thead,.p6-content-box table.p6-stack thead{display:none}
.p6-article-body table.p6-stack tbody,.p6-content-box table.p6-stack tbody{display:block}
.p6-article-body table.p6-stack tr,.p6-content-box table.p6-stack tr{display:block;margin:0 0 12px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;background:#fff}
.p6-article-body table.p6-stack td,.p6-content-box table.p6-stack td{display:block;border:0 !important;border-top:1px solid #eef2f7 !important;padding:.65rem 1rem !important}
.p6-article-body table.p6-stack td:first-child,.p6-content-box table.p6-stack td:first-child{border-top:0 !important;background:#f1f5f9 !important;font-size:1rem;color:#0f172a}
.p6-article-body table.p6-stack td[data-label]:not(:first-child)::before,.p6-content-box table.p6-stack td[data-label]:not(:first-child)::before{content:attr(data-label);display:block;margin-bottom:2px;font-size:.68rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#64748b}
}
/* Back navigation on article pages */
.p6-backbar{display:inline-flex;align-items:center;gap:6px;margin:0 0 14px;padding:7px 14px 7px 10px;border:1px solid #e2e8f0;border-radius:999px;background:#fff;color:#0f172a;font-size:.85rem;font-weight:700;text-decoration:none;line-height:1}
.p6-backbar:hover{border-color:#d00000;color:#d00000}
.p6-article-body .p6-endnav{margin:2.4rem 0 0 !important;padding:1.4rem 1.4rem 1.5rem !important;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;box-sizing:border-box}
.p6-endnav h3{margin:0 0 4px !important;padding:0 !important;border:0 !important;font-size:1.2rem !important;line-height:1.3 !important;font-weight:800;color:#0f172a}
.p6-endnav .p6-end-sub{margin:0 0 1.1rem !important;font-size:.92rem !important;line-height:1.5 !important;color:#64748b}
.p6-endnav .p6-end-label{display:block;margin:0 0 .6rem;font-size:.72rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#64748b}
.p6-end-next{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-bottom:1.2rem}
.p6-article-body .p6-endnav a.p6-end-card{display:flex;gap:12px;align-items:center;padding:10px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;color:#0f172a !important;text-decoration:none !important;transition:border-color .15s ease,box-shadow .15s ease,transform .15s ease}
.p6-article-body .p6-endnav a.p6-end-card:hover{border-color:#cbd5e1;box-shadow:0 8px 20px rgba(15,23,42,.09);transform:translateY(-2px)}
.p6-end-card img{width:92px;height:58px;object-fit:cover;border-radius:8px;flex:none;background:#e2e8f0;margin:0 !important}
.p6-end-card strong{font-size:.92rem;line-height:1.35;font-weight:700;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.p6-end-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding-top:1.1rem;border-top:1px solid #e2e8f0}
.p6-article-body .p6-endnav a.p6-end-btn,.p6-article-body .p6-endnav button.p6-end-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 16px;border-radius:999px;border:1px solid #0f172a;background:#0f172a;color:#fff !important;font-weight:700;font-size:.9rem;line-height:1;text-decoration:none !important;cursor:pointer}
.p6-article-body .p6-endnav button.p6-end-btn.p6-ghost{background:#fff;color:#0f172a !important;border-color:#cbd5e1}
.p6-article-body .p6-endnav a.p6-end-btn:hover,.p6-article-body .p6-endnav button.p6-end-btn:hover{opacity:.88}
.p6-end-share{display:flex;gap:8px;margin-left:auto;align-items:center}
.p6-end-share span{font-size:.78rem;font-weight:700;color:#64748b;margin-right:2px}
.p6-article-body .p6-endnav .p6-end-share a,.p6-article-body .p6-endnav .p6-end-share button{width:38px;height:38px;border-radius:50%;border:1px solid #cbd5e1;background:#fff;color:#0f172a !important;display:inline-flex;align-items:center;justify-content:center;padding:0;cursor:pointer;text-decoration:none !important;font-size:.95rem}
.p6-article-body .p6-endnav .p6-end-share a:hover,.p6-article-body .p6-endnav .p6-end-share button:hover{background:#0f172a;color:#fff !important;border-color:#0f172a}
.p6-article-body .p6-endnav .p6-end-actions,.p6-article-body .p6-endnav .p6-end-share,.p6-article-body .p6-endnav .p6-end-next{margin-bottom:0 !important}
.p6-article-body .p6-endnav .p6-end-next{margin-bottom:1.2rem !important}
.p6-end-toast{font-size:.78rem;font-weight:700;color:#15803d}
@media (max-width: 575.98px){.p6-end-share{margin-left:0;width:100%}.p6-article-body .p6-endnav a.p6-end-btn,.p6-article-body .p6-endnav button.p6-end-btn{flex:1 1 calc(50% - 5px)}.p6-endnav h3{font-size:1.1rem !important}}
.p6-totop{position:fixed;right:14px;bottom:76px;width:46px;height:46px;border-radius:50%;border:0;background:#d00000;color:#fff;font-size:1.2rem;line-height:1;box-shadow:0 6px 18px rgba(0,0,0,.28);cursor:pointer;opacity:0;visibility:hidden;transform:translateY(8px);transition:opacity .2s,transform .2s,visibility .2s;z-index:9990}
.p6-totop.is-on{opacity:1;visibility:visible;transform:none}
@media (min-width: 768px){ .p6-totop{bottom:24px} }
.p6-article-body a.imp-rel-card,.p6-article-body a.imp-rel-card *{text-decoration:none !important}
@media (max-width: 767.98px){
h1.p6-detail-title{font-size:1.6rem !important;line-height:1.28 !important;letter-spacing:-.01em !important;margin-bottom:12px !important}
.p6-article-body .imp-related{margin:1.6rem 0;padding:1rem .9rem 1rem}
.imp-rel-grid{grid-template-columns:1fr;gap:10px}
.p6-article-body a.imp-rel-card{flex-direction:row;align-items:stretch}
.imp-rel-thumb{flex:none;width:118px;aspect-ratio:16/9;min-height:0;align-self:center;margin-left:10px;border-radius:6px}
.p6-article-body .imp-rel-thumb img{height:100% !important;width:100% !important;object-fit:cover;margin:0 !important}
.imp-rel-body{padding:.65rem .75rem;gap:4px;justify-content:center}
.imp-rel-title{font-size:.9rem;-webkit-line-clamp:3}
.imp-rel-meta{margin-top:2px;padding-top:0}
}
/* Section hub pages on phones: jump to the article list; long intro essay starts collapsed */
.p6-jumpbar{display:none}
@media (max-width: 767.98px){
.p6-jumpbar{display:block;margin:12px 16px 4px}
.p6-jumpbar a{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 16px;border-radius:10px;background:#0f172a;color:#fff !important;font-weight:700;font-size:.95rem;text-decoration:none !important}
.p6-content-box.p6-collapsed{max-height:560px;overflow:hidden;position:relative}
.p6-content-box.p6-collapsed::after{content:"";position:absolute;left:0;right:0;bottom:0;height:130px;background:linear-gradient(to bottom,rgba(255,255,255,0),#fff 85%);pointer-events:none}
.p6-readmore{display:block;width:calc(100% - 32px);margin:10px 16px 0;padding:12px;border:1px solid #d00000;border-radius:10px;background:#fff;color:#d00000;font-weight:700;font-size:.95rem;cursor:pointer}
}
/* Skip layout and paint for content far below the first screen until the reader scrolls near it. */
footer,.p6-grid-section,section.py-5.bg-white{content-visibility:auto;contain-intrinsic-size:auto 700px}
.p6-article-body > *:nth-child(n+9){content-visibility:auto;contain-intrinsic-size:auto 180px}
/* Pictures pasted from the editor carry fixed pixel sizes (e.g. 1200x675); keep their proportions at any width */
.p6-content-box img,.p6-article-body img,.hub-guide img{max-width:100% !important;height:auto !important}
/* Round avatars stay perfect circles: fixed square box, picture cropped to fill it */
img.rounded-circle,img.p6-author-avatar,img.p6-author-avatar-sm,img.author-avatar,img[class*="avatar"]{aspect-ratio:1/1;object-fit:cover;object-position:center top;flex-shrink:0}
img.rounded-circle[width="42"]{width:42px !important;height:42px !important}
img.rounded-circle[width="56"]{width:56px !important;height:56px !important}
/* "From our network" sidebar card */
.imp-network{padding:0 !important;overflow:hidden;border-radius:14px}
.imp-network-label{display:block;padding:10px 16px 8px;font-size:.66rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#64748b}
.imp-network-card{display:block;text-decoration:none !important;color:#0f172a}
.imp-network-card img{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover}
.imp-network-text{display:block;padding:14px 16px 16px;text-align:left}
.imp-network-text strong{display:block;font-size:1rem;font-weight:800;margin-bottom:4px}
.imp-network-text span{display:block;font-size:.85rem;line-height:1.5;color:#475569;margin-bottom:10px}
.imp-network-text em{font-style:normal;font-size:.85rem;font-weight:800;color:#0F2440;border-bottom:2px solid #D6A84A}
.imp-network-card:hover .imp-network-text em{color:#d00000;border-color:#d00000}
.imp-network-card:hover img{filter:brightness(1.05)}
/* "From our network": banner-format links to our own sites (wide strip, 300x250 box, 300x600 tall) */
.imp-ad{display:block;margin:1.6rem auto;max-width:100%}
.imp-ad-tag{display:block;margin:0 0 5px;font-size:.62rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#94a3b8;text-align:right}
.imp-ad .imp-ad-box{position:relative;display:flex;overflow:hidden;color:#fff !important;text-decoration:none !important;border-radius:10px;isolation:isolate;box-shadow:0 6px 18px rgba(15,23,42,.14);transition:transform .18s ease,box-shadow .18s ease}
.imp-ad .imp-ad-box:hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(15,23,42,.28);color:#fff !important}
.imp-ad-art{position:absolute;right:-6px;bottom:-14px;width:120px;height:120px;color:var(--ac);opacity:.28;z-index:-1}
.imp-ad-art svg{width:100%;height:100%}
.imp-ad-copy{display:flex;flex-direction:column;min-width:0}
.imp-ad-name{font-size:.62rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--ac)}
.imp-ad-line{font-weight:800;line-height:1.2;letter-spacing:-.01em;color:#fff}
.imp-ad-sub{color:#cbd5e1;line-height:1.45}
.imp-ad-cta{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;background:#fff;color:#0f172a;font-weight:800;border-radius:999px;white-space:nowrap}
.imp-ad-cta i{font-style:normal;transition:transform .18s ease}
.imp-ad-box:hover .imp-ad-cta i{transform:translateX(3px)}
.imp-ad-host{font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.7)}
/* horizontal strip */
.imp-ad--leader{width:100%;max-width:728px}
.imp-ad--leader .imp-ad-box{min-height:96px;align-items:center;justify-content:space-between;gap:16px;padding:14px 18px}
.imp-ad--leader .imp-ad-line{font-size:1.05rem}
.imp-ad--leader .imp-ad-sub{display:none}
.imp-ad--leader .imp-ad-cta{padding:9px 16px;font-size:.85rem}
.imp-ad--leader .imp-ad-host{display:none}
/* 300x250 box */
.imp-ad--rect{width:300px}
.imp-ad--rect .imp-ad-box{width:300px;min-height:250px;flex-direction:column;justify-content:space-between;padding:20px}
.imp-ad--rect .imp-ad-line{font-size:1.25rem;margin:6px 0 8px}
.imp-ad--rect .imp-ad-sub{font-size:.82rem}
.imp-ad--rect .imp-ad-cta{padding:9px 16px;font-size:.85rem}
.imp-ad--rect .imp-ad-host{position:absolute;right:16px;bottom:18px;font-size:.62rem}
/* 300x600 tall */
.imp-ad--sky{width:100%;max-width:300px;margin:1.2rem 0 0}
.imp-ad--sky .imp-ad-box{min-height:600px;flex-direction:column;justify-content:space-between;padding:28px 24px}
.imp-ad--sky .imp-ad-art{width:260px;height:260px;right:-30px;bottom:60px;opacity:.22}
.imp-ad--sky .imp-ad-line{font-size:1.7rem;margin:10px 0 14px;line-height:1.15}
.imp-ad--sky .imp-ad-sub{font-size:.92rem}
.imp-ad--sky .imp-ad-cta{padding:12px 22px;font-size:.95rem}
.imp-ad--sky .imp-ad-host{margin-top:12px;font-size:.7rem}
@media (max-width:767.98px){
.imp-ad--leader .imp-ad-box{min-height:100px;padding:12px 14px;gap:10px}
.imp-ad--leader .imp-ad-line{font-size:.92rem}
.imp-ad--leader .imp-ad-cta{padding:8px 12px;font-size:.78rem}
.imp-ad--sky{max-width:320px;margin-left:auto;margin-right:auto}
.imp-ad--sky .imp-ad-box{min-height:420px}
}
/* Embedded Instagram / Facebook posts (see embed_social()) */
.p6-content-box .imp-embed,.p6-article-body .imp-embed,.hub-guide .imp-embed{display:block;margin:1.6rem auto;max-width:540px;text-align:center}
.imp-embed iframe{display:block;width:100%;max-width:100%;border:1px solid #e2e8f0;border-radius:12px;background:#fff;margin:0 auto}
.imp-embed--ig iframe{height:700px}
.imp-embed--fb iframe{height:640px}
.imp-embed--fbv iframe{height:420px}
.imp-embed-link{display:inline-block;margin-top:8px;font-size:.82rem;font-weight:700;color:#475569 !important;text-decoration:none !important}
.imp-embed-link:hover{color:#d00000 !important}
@media (max-width:575.98px){.imp-embed--ig iframe{height:640px}.imp-embed--fb iframe{height:560px}}
/* Phones: short table of contents and tighter reading text on every section page */
.p6-toc-toggle{display:none}
@media (max-width: 767.98px){
.p6-toc-list.p6-toc-collapsed > a:nth-of-type(n+6){display:none !important}
.p6-toc-toggle{display:block;width:100%;margin-top:10px;padding:10px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;color:#d00000;font-weight:700;font-size:.9rem;cursor:pointer}
.p6-content-box{padding:20px 16px !important;line-height:1.7 !important;font-size:1rem !important}
.p6-content-box h2{font-size:1.35rem !important;margin-top:1.6rem !important}
.p6-content-box img{margin:14px auto !important}
}
/* One typeface site-wide (Plus Jakarta Sans, self-hosted in the header). Old rules naming other fonts resolve to it through aliases, so no per-element override is needed. */
:root{--p6-font-body:'Plus Jakarta Sans','Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;--p6-font-headline:var(--p6-font-body);--p6-font-serif:var(--p6-font-body);--p6-font-accent:var(--p6-font-body)}
body,button,input,select,textarea{font-family:var(--p6-font-body)}
.font-monospace{font-family:var(--p6-font-body) !important}
code,pre,kbd,samp{font-family:SFMono-Regular,Menlo,Consolas,monospace}
</style>
<script>
document.addEventListener('DOMContentLoaded', function(){
   document.querySelectorAll('.p6-toc-list').forEach(function(list){
      var n = list.querySelectorAll('a').length;
      if(n <= 5) return;
      list.classList.add('p6-toc-collapsed');
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'p6-toc-toggle'; btn.setAttribute('aria-expanded', 'false');
      btn.textContent = 'Show all ' + n + ' sections';
      btn.addEventListener('click', function(){
         var collapsed = list.classList.toggle('p6-toc-collapsed');
         btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
         btn.textContent = collapsed ? 'Show all ' + n + ' sections' : 'Show fewer';
      });
      list.parentNode.insertBefore(btn, list.nextSibling);
   });
});
</script>
<script>
(function(){
   var title = document.querySelector('.p6-detail-title');
   if(!title) return;
   var parts = location.pathname.split('/').filter(Boolean);
   if(parts.length < 3) return;
   var subUrl = '/' + parts.slice(0, 2).join('/');
   var crumb = title.parentNode.querySelector('.p6-breadcrumb');
   var subName = (crumb && crumb.lastElementChild ? crumb.lastElementChild.textContent.trim() : parts[1].replace(/-/g, ' '));
   subName = subName.toLowerCase().replace(/\b\w/g, function(c){ return c.toUpperCase(); });

   // 1. back link above the headline
   var back = document.createElement('a');
   back.className = 'p6-backbar'; back.href = subUrl;
   back.innerHTML = '&larr; Back to ' + subName.replace(/</g, '&lt;');
   title.parentNode.insertBefore(back, crumb || title);

   // 2. what to do when the article ends
   var body = document.querySelector('.p6-article-body');
   if(body){
      var esc = function(t){ return String(t == null ? '' : t).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
      var seen = {};
      body.querySelectorAll('a.imp-rel-card').forEach(function(a){ seen[a.getAttribute('href')] = 1; });
      var next = [];
      document.querySelectorAll('a.p6-grid-card').forEach(function(a){
         var h = a.getAttribute('href'), t = a.querySelector('.p6-card-title, h3'), im = a.querySelector('img');
         if(!h || !t || seen[h] || next.length >= 2) return;
         seen[h] = 1;
         next.push('<a class="p6-end-card" href="' + esc(h) + '">' + (im ? '<img src="' + esc(im.getAttribute('src')) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' : '') + '<strong>' + esc(t.textContent.trim()) + '</strong></a>');
      });
      var pageUrl = location.origin + location.pathname, pageTitle = document.title;
      var end = document.createElement('div');
      end.className = 'p6-endnav';
      end.innerHTML = '<h3>Found this useful?</h3><p class="p6-end-sub">Keep going with the next read, or send it to someone who needs it.</p>'
         + (next.length ? '<span class="p6-end-label">Up next</span><div class="p6-end-next">' + next.join('') + '</div>' : '')
         + '<div class="p6-end-actions">'
         + '<a class="p6-end-btn" href="' + subUrl + '">&larr; More in ' + esc(subName) + '</a>'
         + '<button type="button" class="p6-end-btn p6-ghost" id="p6EndTop">&uarr; Back to top</button>'
         + '<div class="p6-end-share"><span>Share</span>'
         + '<a href="https://api.whatsapp.com/send?text=' + encodeURIComponent(pageTitle + ' ' + pageUrl) + '" target="_blank" rel="noopener" aria-label="Share on WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>'
         + '<a href="https://twitter.com/intent/tweet?text=' + encodeURIComponent(pageTitle) + '&url=' + encodeURIComponent(pageUrl) + '" target="_blank" rel="noopener" aria-label="Share on X"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>'
         + '<a href="https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(pageUrl) + '" target="_blank" rel="noopener" aria-label="Share on LinkedIn"><i class="fa-brands fa-linkedin-in"></i></a>'
         + '<button type="button" id="p6EndCopy" aria-label="Copy link"><i class="fa-solid fa-link"></i></button><span class="p6-end-toast" id="p6EndToast"></span></div></div>';
      body.appendChild(end);
      document.getElementById('p6EndTop').addEventListener('click', function(){ window.scrollTo({top: 0, behavior: 'smooth'}); });
      document.getElementById('p6EndCopy').addEventListener('click', function(){
         var done = function(){ var t = document.getElementById('p6EndToast'); t.textContent = 'Link copied'; setTimeout(function(){ t.textContent = ''; }, 2000); };
         if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(pageUrl).then(done, done); } else { done(); }
      });
   }

   // 3. floating back-to-top once the reader is well into a long article
   var fab = document.createElement('button');
   fab.type = 'button'; fab.className = 'p6-totop'; fab.setAttribute('aria-label', 'Back to top'); fab.innerHTML = '&uarr;';
   fab.addEventListener('click', function(){ window.scrollTo({top: 0, behavior: 'smooth'}); });
   document.body.appendChild(fab);
   var tick = false;
   window.addEventListener('scroll', function(){
      if(tick) return; tick = true;
      requestAnimationFrame(function(){ fab.classList.toggle('is-on', window.scrollY > 900); tick = false; });
   }, {passive: true});
})();
</script>
<script>
document.addEventListener('DOMContentLoaded', function(){
   var firstCard = document.querySelector('a.p6-grid-card');
   var grid = firstCard ? firstCard.closest('section') : null;
   var box = document.querySelector('.p6-content-box');
   if(!grid || !box || document.querySelector('.p6-detail-title')) return;
   var n = grid.querySelectorAll('a.p6-grid-card').length;
   var heading = grid.querySelector('h2,h3');
   if(!grid.id) grid.id = 'p6-articles';
   if(n > 0){
      var bar = document.createElement('div');
      bar.className = 'p6-jumpbar';
      bar.innerHTML = '<a href="#' + grid.id + '">&darr; Jump to all ' + n + ' articles</a>';
      var anchor = document.querySelector('.p6-search-bar-wrap') || document.querySelector('header');
      if(anchor && anchor.parentNode){ anchor.parentNode.insertBefore(bar, anchor.nextSibling); }
   }
   if(window.matchMedia('(max-width: 767.98px)').matches && box.scrollHeight > 900){
      box.classList.add('p6-collapsed');
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'p6-readmore'; btn.textContent = 'Read the full guide';
      btn.addEventListener('click', function(){
         var c = box.classList.toggle('p6-collapsed');
         btn.textContent = c ? 'Read the full guide' : 'Show less';
         if(c){ box.scrollIntoView({behavior: 'smooth', block: 'start'}); }
      });
      box.parentNode.insertBefore(btn, box.nextSibling);
   }
});
</script>
<script>
document.addEventListener('DOMContentLoaded', function(){
   document.querySelectorAll('.p6-article-body table, .p6-content-box table').forEach(function(t){
      var heads = [];
      t.querySelectorAll('thead th, thead td').forEach(function(h){ heads.push(h.textContent.trim()); });
      if(!heads.length){
         var first = t.querySelector('tr');
         if(first){ first.querySelectorAll('th').forEach(function(h){ heads.push(h.textContent.trim()); }); }
      }
      if(heads.length < 2) return;
      t.classList.add('p6-stack');
      t.querySelectorAll('tbody tr').forEach(function(r){
         r.querySelectorAll('td').forEach(function(c, i){ if(heads[i]) c.setAttribute('data-label', heads[i]); });
      });
   });
});
</script>
</body>
</html>
