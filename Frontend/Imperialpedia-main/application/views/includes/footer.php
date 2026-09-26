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
               <li><a href="<?php echo base_url(); ?>news/tech-news"><i class="fa-solid fa-angle-right text-danger"></i> Tech News</a></li>
               <li><a href="<?php echo base_url(); ?>insurance/health-insurance"><i class="fa-solid fa-angle-right text-danger"></i> Health Insurance</a></li>
               <li><a href="<?php echo base_url(); ?>marketing/digital-marketing"><i class="fa-solid fa-angle-right text-danger"></i> Digital Marketing</a></li>
               <li><a href="<?php echo base_url(); ?>internet/web-hosting"><i class="fa-solid fa-angle-right text-danger"></i> Cloud & Hosting</a></li>
               <li><a href="<?php echo base_url(); ?>attorney/immigration"><i class="fa-solid fa-angle-right text-danger"></i> Legal & Visa</a></li>
               <li><a href="<?php echo base_url(); ?>online-education/degrees"><i class="fa-solid fa-angle-right text-danger"></i> Degrees & ROI</a></li>
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
            <?php for($i = 'a'; $i != 'aa'; $i++){ ?>
               <li><a href="<?php echo base_url();?>terms/<?php echo $i; ?>"><?php echo strtoupper($i);?></a></li>
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
</body>
</html>