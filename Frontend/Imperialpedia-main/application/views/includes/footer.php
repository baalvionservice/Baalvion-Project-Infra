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
               <a href="<?php echo base_url(); ?>" class="text-decoration-none">
                  <h3 style="font-family:'Oswald',sans-serif; font-size:1.8rem; font-weight:700; color:#fff; letter-spacing:-0.5px;">
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
               <li><a href="<?php echo base_url(); ?>insurance/health-insurance"><i class="fa-solid fa-angle-right text-danger"></i> Health Insurance</a></li>
               <li><a href="<?php echo base_url(); ?>marketing/digital-marketing"><i class="fa-solid fa-angle-right text-danger"></i> Digital Marketing</a></li>
               <li><a href="<?php echo base_url(); ?>internet/web-hosting"><i class="fa-solid fa-angle-right text-danger"></i> Cloud & Hosting</a></li>
               <li><a href="<?php echo base_url(); ?>attorney/immigration"><i class="fa-solid fa-angle-right text-danger"></i> Legal & Visa</a></li>
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
               <li><a href="https://twitter.com/ImperialPedia" target="_blank" rel="noopener noreferrer" aria-label="Imperialpedia Twitter/X Desk"><i class="fa-brands fa-x-twitter text-info"></i> Twitter / X</a></li>
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
.p6-article-body .imp-related{margin:2.4rem 0;padding:1.4rem 1.4rem 1.5rem;background:#f8f9fa;border:1px solid #e2e8f0;border-top:3px solid #d00000;border-radius:10px}
.p6-article-body .imp-related-head{margin:0 0 1rem;padding:0;border:0;font-size:.78rem;line-height:1;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#d00000}
.imp-rel-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px}
.p6-article-body a.imp-rel-card{display:flex;flex-direction:column;background:#fff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;text-decoration:none;color:#111;transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease}
.p6-article-body a.imp-rel-card:hover{transform:translateY(-2px);border-color:#d00000;box-shadow:0 8px 20px rgba(0,0,0,.08)}
.imp-rel-thumb{display:block;aspect-ratio:16/9;background:#e9ecef;overflow:hidden}
.imp-rel-thumb img{width:100%;height:100%;object-fit:cover;display:block;margin:0}
.imp-rel-body{display:flex;flex-direction:column;gap:6px;padding:.85rem .95rem 1rem;flex:1}
.imp-rel-tag{font-size:.66rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#d00000}
.imp-rel-title{font-size:.95rem;line-height:1.38;font-weight:700;color:#111;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.p6-article-body a.imp-rel-card:hover .imp-rel-title{color:#d00000}
.imp-rel-meta{margin-top:auto;padding-top:4px;font-size:.76rem;color:#64748b;font-weight:600}
/* Pictures pasted from the editor carry fixed pixel sizes (e.g. 1200x675); keep their proportions at any width */
.p6-content-box img,.p6-article-body img{max-width:100% !important;height:auto !important}
/* Back navigation on article pages */
.p6-backbar{display:inline-flex;align-items:center;gap:6px;margin:0 0 14px;padding:7px 14px 7px 10px;border:1px solid #e2e8f0;border-radius:999px;background:#fff;color:#0f172a;font-size:.85rem;font-weight:700;text-decoration:none;line-height:1}
.p6-backbar:hover{border-color:#d00000;color:#d00000}
.p6-article-body .p6-endnav{display:flex;flex-wrap:wrap;gap:10px;margin:2rem 0 0 !important;padding:1.1rem 1.25rem !important;box-sizing:border-box;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;align-items:center}
.p6-article-body .p6-endnav span{flex:1 1 100%;font-size:.78rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#64748b}
.p6-article-body .p6-endnav a,.p6-article-body .p6-endnav button{flex:1 1 auto;color:#fff !important;text-decoration:none !important;text-align:center;padding:11px 16px;border-radius:8px;border:1px solid #d00000;background:#d00000;color:#fff;font-weight:700;font-size:.92rem;text-decoration:none;cursor:pointer}
.p6-article-body .p6-endnav button{background:#fff;color:#d00000 !important}
.p6-totop{position:fixed;right:14px;bottom:76px;width:46px;height:46px;border-radius:50%;border:0;background:#d00000;color:#fff;font-size:1.2rem;line-height:1;box-shadow:0 6px 18px rgba(0,0,0,.28);cursor:pointer;opacity:0;visibility:hidden;transform:translateY(8px);transition:opacity .2s,transform .2s,visibility .2s;z-index:9990}
.p6-totop.is-on{opacity:1;visibility:visible;transform:none}
@media (min-width: 768px){ .p6-totop{bottom:24px} }
.p6-article-body a.imp-rel-card,.p6-article-body a.imp-rel-card *{text-decoration:none !important}
.p6-article-body .imp-related-head{font-size:.78rem !important;line-height:1 !important;margin:0 0 .9rem !important;padding:0 !important;border:0 !important;letter-spacing:.14em !important}
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
/* Phones: short table of contents and tighter reading text on every section page */
.p6-toc-toggle{display:none}
@media (max-width: 767.98px){
.p6-toc-list.p6-toc-collapsed > a:nth-of-type(n+6){display:none !important}
.p6-toc-toggle{display:block;width:100%;margin-top:10px;padding:10px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;color:#d00000;font-weight:700;font-size:.9rem;cursor:pointer}
.p6-content-box{padding:20px 16px !important;line-height:1.7 !important;font-size:1rem !important}
.p6-content-box h2{font-size:1.35rem !important;margin-top:1.6rem !important}
.p6-content-box img{margin:14px auto !important}
}
/* One typeface site-wide (Plus Jakarta Sans). Loaded last so it wins over each page's own font rules; icons and code keep theirs. */
:root{--p6-font-body:'Plus Jakarta Sans','Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;--p6-font-headline:var(--p6-font-body);--p6-font-serif:var(--p6-font-body);--p6-font-accent:var(--p6-font-body)}
body *:not(i):not([class*="fa-"]):not(.fa):not(.fas):not(.far):not(.fab):not(code):not(pre):not(kbd):not(svg):not(svg *){font-family:'Plus Jakarta Sans','Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif !important}
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
      var end = document.createElement('div');
      end.className = 'p6-endnav';
      end.innerHTML = '<span>Finished reading?</span><a href="' + subUrl + '">&larr; More in ' + subName.replace(/</g, '&lt;') + '</a><button type="button" id="p6EndTop">&uarr; Back to top</button>';
      body.appendChild(end);
      document.getElementById('p6EndTop').addEventListener('click', function(){ window.scrollTo({top: 0, behavior: 'smooth'}); });
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
</body>
</html>
