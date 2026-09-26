<!-- subscrb containe  --> 
<style>/*****  Newsletter css ******/.newsletter-wrap{background:#00cdac;padding:35px 45px;z-index:1;position:relative}.newsletter-wrap .title{margin-bottom:0;margin-top:10px}.newsletter-wrap .title:after{display:none}.newsletter-wrap .title{font-size:48px;color:#000;margin-bottom:0;font-weight:600;}.newsletter-wrap .title span{font-weight:600;color:#fff;font-size:24px}.newsletter-wrap .news-info{position:relative}.newsletter-wrap p{font-size:18px;letter-spacing:1px;color:#fff}.news-info{margin-top:10px}.newsletter-wrap .form-control{border:0;border-radius:inherit;box-shadow:inherit;padding:34px 22px 34px 65px;font-size:16px;color:#767676}.newsletter-wrap .sigup{background:#000 none repeat scroll 0 0;border:medium none;z-index:11;color:#fff;font-size:16px;cursor:pointer;font-weight:bold;padding:0 30px;position:absolute;right:0;text-transform:uppercase;bottom:0;border-radius:0;top:0;transition:all .35s ease-in-out;-webkit-transition:all .35s ease-in-out;-moz-transition:all .35s ease-in-out;-ms-transition:all .35s ease-in-out;-o-transition:all .35s ease-in-out}.newsletter-wrap .news-info input[type="submit"]:hover{background:#000}.newsletter-wrap .form_icon{font-size:24px;position:absolute;top:50%;z-index:2;color:#e1e2e5;margin-top:-11px;line-height:0;left:25px}@media only screen and (max-width:700px){.newsletter-wrap{padding:0;padding-bottom:1.4rem!important}.newsletter-wrap .title{margin-top:5px}.newsletter-wrap .title{font-size:29px;font-weight:700}.newsletter-wrap p{font-size:14px}.news-info{margin-top:3px}.newsletter-wrap .form-control{padding:11px 1px 11px 54px;font-size:14px}.newsletter-wrap .form_icon{font-size:21px;margin-top:-9px;left:15px}.newsletter-wrap .sigup{font-size:14px;padding:0 9px}}</style>
<form action="/subscribe" method="post">
   <div class="newsletter-wrap">
      <div class="container">
         <div class="row">
            <div class="col-lg-6">
               <div class="title"> Subscribe to newsletter ALWAYS FIRST! </div>
               <p>No Spam Or Scam - Only The Hottest News About Your Beloved Trands!</p>
            </div>
            <div class="col-lg-6">
               <div class="error"><?php if($this->session->msg){ echo $this->session->msg; $this->session->unset_userdata('msg'); }?></div>
               <div class="news-info">
                  <div id="newsletter">
                     <input type="hidden" name="page" id="page" value="<?php echo uri_string()?>">            
                     <div class="input-group">
                        <input type="email" class="form-control" name="email" id="email" placeholder="Email Address">
                        <div class="form_icon"><i class="fas fa-envelope"></i></div>
                     </div>
                     <button type="submit" name="submit" value="submit" class="sigup">Submit</button>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </div>
   <style>
      @font-face {
      font-family: 'proxima-nova';
      font-weight: normal;
      font-style: normal;
      src: url('<?php echo base_url()?>assets/fonts/ProximaNova-Regular.eot');
      src: url('<?php echo base_url()?>assets/fonts/ProximaNova-Regular.eot?#iefix') format('embedded-opentype'),
      url('<?php echo base_url()?>assets/fonts/ProximaNova-Regular.woff') format('woff'),
      url('<?php echo base_url()?>assets/fonts/ProximaNova-Regular.ttf') format('truetype');
      }
      @font-face {
      font-family: 'proxima-nova';
      font-weight: bold;
      font-style: normal;
      src: url('<?php echo base_url()?>assets/fonts/ProximaNova-Bold.eot');
      src: url('<?php echo base_url()?>assets/fonts/ProximaNova-Bold.eot?#iefix') format('embedded-opentype'),
      url('<?php echo base_url()?>assets/fonts/ProximaNova-Bold.woff') format('woff'),
      url('<?php echo base_url()?>assets/fonts/ProximaNova-Bold.ttf') format('truetype');
      }
      @font-face {
      font-family: 'proxima-nova';
      font-weight: normal;
      font-style: italic;
      src: url('<?php echo base_url()?>assets/fonts/ProximaNova-RegularIt.eot');
      src: url('<?php echo base_url()?>assets/fonts/ProximaNova-RegularIt.eot?#iefix') format('embedded-opentype'),
      url('<?php echo base_url()?>assets/fonts/ProximaNova-RegularIt.woff') format('woff'),
      url('<?php echo base_url()?>assets/fonts/ProximaNova-RegularIt.ttf') format('truetype');
      }
      @font-face {
      font-family: 'proxima-nova';
      font-weight: bold;
      font-style: italic;
      src: url('<?php echo base_url()?>assets/fonts/ProximaNova-BoldIt.eot');
      src: url('<?php echo base_url()?>assets/fonts/ProximaNova-BoldIt.eot?#iefix') format('embedded-opentype'),
      url('<?php echo base_url()?>assets/fonts/ProximaNova-BoldIt.woff') format('woff'),
      url('<?php echo base_url()?>assets/fonts/ProximaNova-BoldIt.ttf') format('truetype');
      }
      .sg-newsletter {
      clear: both;
      float: left;
      display: flex;
      max-width: 640px;
      }
      .checkbox-container {
      height: 15px;
      width: 15px;
      margin-right: 10px;
      }
      .sg-newsletter input[type=checkbox] {
      width: 16px;
      height: 16px;
      margin: 0;
      }
      .sg-newsletter label[for="newsletter-consent"] {
      font-size: 18px;
      line-height: 22px;
      font-weight: normal;
      font-family: "proxima-nova", arial, helvetica, sans-serif;
      }
      .newsletter a {
      color: #aeaeae;
      text-decoration: none;
      }
   </style>
   <div class="container mt-3 mb-5">
      <div class="row">
         <div class="col-md-3 col-12"></div>
         <div class="col-md-6 col-12">
            <div class="sg-newsletter">
               <div class="checkbox-container"><input type="checkbox" name="newsletter" id="newsletter newsletter-consent" class="newsletter-consent"  checked></div>
               <label for="newsletter-consent">
               I Would Like To Receive News, Special Offers And Other Information From Imperialpedia & I Am 16 Years Old Or Older.<br><br>
               Imperialpedia will be responsible for your personal data. For more information please check our imperialpedia <a href="<?php echo base_url();?>privacy-policy">Privacy Policy</a>.</label>
            </div>
         </div>
         <div class="col-md-3 col-12"></div>
      </div>
   </div>
</form>
<!--  quote section  --> 
<!-- <style>.mask-quote{width:100%;background-image:url("<?php echo base_url();?>assets/img/spacer-quotes.png");background-position:center 0;background-repeat:no-repeat;position:relative;height:37px;z-index:9;margin-top:-89px}#ly-quote{background-image:url("<?php echo base_url();?>assets/img/triangles-gray.png");background-position:center 0;background-repeat:repeat;min-height:250px;position:relative;z-index:9}.quote-block{font-size:25px;color:#929292;margin:0 auto;clear:both;padding:45px 0 70px;display:block}.quote-arrow.quote-prev{margin-left:30%;background-position:-4px -64px}.quote-arrow{background-image:url("<?php echo base_url();?>assets/img/icons.png");background-repeat:no-repeat;width:31px;height:46px;display:inline-block;margin:6px 5% 0;float:left;z-index:5000;position:relative}.quote-block .block-head-u{text-align:center;margin-bottom:30px;margin-top:10px}.block-head-u{font-size:32px;line-height:40px;font-weight:bold;text-transform:uppercase;display:block}.fixit:after{content:" ";display:block;height:0;clear:both;overflow:hidden;visibility:hidden}.quote-arrow.quote-next{background-position:-40px -64px;float:right;margin-right:30%}.quote-arrow.quote-next:hover{background-position:-40px -112px}.quote-arrow.quote-prev:hover{background-position:-4px -112px}@media only screen and (max-width:700px){.quote-block{width:100%}.quote-arrow.quote-prev{margin-left:11%}.quote-arrow.quote-next{margin-right:11%}}.Marquee{width:97vw;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;padding:1em;color:#fff;font-weight:200;display:-webkit-box;display:-moz-box;display:-webkit-flex;display:-ms-flexbox;display:box;display:flex;-webkit-box-align:center;-moz-box-align:center;-o-box-align:center;-ms-flex-align:center;-webkit-align-items:center;align-items:center;overflow:hidden}.Marquee-content{display:-webkit-box;display:-moz-box;display:-webkit-flex;display:-ms-flexbox;display:box;display:flex;-webkit-animation:marquee 10s linear infinite running;-moz-animation:marquee 10s linear infinite running;-o-animation:marquee 10s linear infinite running;-ms-animation:marquee 10s linear infinite running;animation:marquee 10s linear infinite running}.Marquee-content:hover{-webkit-animation-play-state:paused;-moz-animation-play-state:paused;-o-animation-play-state:paused;-ms-animation-play-state:paused;animation-play-state:paused}.Marquee-tag{margin:0 .5em;padding:.5em;background:rgba(255,255,255,0.1);display:-webkit-inline-box;display:-moz-inline-box;display:-webkit-inline-flex;display:-ms-inline-flexbox;display:inline-box;display:inline-flex;flex-direction:column;-webkit-box-align:center;-moz-box-align:center;-o-box-align:center;-ms-flex-align:center;-webkit-align-items:center;align-items:center;-webkit-box-pack:center;-moz-box-pack:center;-o-box-pack:center;-ms-flex-pack:center;-webkit-justify-content:center;justify-content:center;-webkit-transition:all .2s ease;-moz-transition:all .2s ease;-o-transition:all .2s ease;-ms-transition:all .2s ease;transition:all .2s ease}.Marquee-tag:hover{background:rgb(0 0 0 / 50%);-webkit-transform:scale(1.1);-moz-transform:scale(1.1);-o-transform:scale(1.1);-ms-transform:scale(1.1);transform:scale(1.1);cursor:pointer}@-moz-keyframes marquee{0%{-webkit-transform:translateX(0);-moz-transform:translateX(0);-o-transform:translateX(0);-ms-transform:translateX(0);transform:translateX(0)}100%{-webkit-transform:translate(-50%);-moz-transform:translate(-50%);-o-transform:translate(-50%);-ms-transform:translate(-50%);transform:translate(-50%)}}@-webkit-keyframes marquee{0%{-webkit-transform:translateX(0);-moz-transform:translateX(0);-o-transform:translateX(0);-ms-transform:translateX(0);transform:translateX(0)}100%{-webkit-transform:translate(-50%);-moz-transform:translate(-50%);-o-transform:translate(-50%);-ms-transform:translate(-50%);transform:translate(-50%)}}@-o-keyframes marquee{0%{-webkit-transform:translateX(0);-moz-transform:translateX(0);-o-transform:translateX(0);-ms-transform:translateX(0);transform:translateX(0)}100%{-webkit-transform:translate(-50%);-moz-transform:translate(-50%);-o-transform:translate(-50%);-ms-transform:translate(-50%);transform:translate(-50%)}}@keyframes marquee{0%{-webkit-transform:translateX(0);-moz-transform:translateX(0);-o-transform:translateX(0);-ms-transform:translateX(0);transform:translateX(0)}100%{-webkit-transform:translate(-50%);-moz-transform:translate(-50%);-o-transform:translate(-50%);-ms-transform:translate(-50%);transform:translate(-50%)}}.Marquee-tag p{color: #fff;margin-bottom: 0.3em;}.qout-auth{color: #9d9d9d;}@media only screen and (max-width: 746px){.Marquee{width: 300vw!important;padding: .2em!important;}.Marquee-tag{margin:0 0.2em;padding:0.2em;}.Marquee-tag blockquote,.Marquee-tag{font-size:.9em;margin:0 0.5rem;}.Marquee-tag p{margin-bottom: 2px;}.qout-auth{font-size: .6em;}.quote-block{padding: 35px 0 25px;}}
</style>
<div class="mask-quote mt-4"></div>
<div id="ly-quote" style="overflow: hidden;">
   <div class="quote-block fixit">
      <a class="quote-arrow quote-prev" href="javaScript:void(0);"></a>
      <a class="quote-arrow quote-next" href="javaScript:void(0);"></a>
      <p class="block-head-u">Quotes</p>
      <div class="Marquee">
         <div class="Marquee-content">
            <?php //foreach ($quots as $quots_res){  ?>
            <div class="Marquee-tag"><?php //if(!empty($quots_res['quot_title'])){ echo $quots_res['quot_txt'];} ?><span class="qout-auth"><?php //if(!empty($quots_res['quot_by'])){ echo '-'.$quots_res['quot_by'];} ?></span></div>
            <?php //}?>  
         </div>
      </div>
   </div>
</div> -->
<!-- footer sectionas  -->
<div class="clear-fix"></div>
<div class="footer">
   <div class="container fot-cont mt-5 pt-5">
      <footer class="row">
         <div class="col-lg-5-cols col-sm-3 col-6 px-0">
            <h3 style="margin-left: 34px">Links</h3>
            <ul class="footer-link ">
               <li><a href="<?php echo base_url(); ?>">Home</a></li>
               <li>
                  <a href="#">Future X</a>
               </li>
               <li>
                  <a href="#">Software</a>
               </li>
               <li>
                  <a href="#">Forum</a>
               </li>
               <li>
                  <a href="#">Templates</a>
               </li>
            </ul>
         </div>
         <div class="col-lg-5-cols col-sm-3 col-6 px-0">
            <div class="footer-link ">
               <h3 style="margin-left: 34px">Links</h3>
               <ul class="footer-link ">
                  <li>
                     <a href="<?php echo base_url(); ?>author">Author</a>
                  </li>
                  <li>
                     <a href="<?php echo base_url(); ?>editorial-policy">Editorial Policy</a>
                  </li>
                  <li>
                     <a href="<?php echo base_url(); ?>terms-use">Terms of Use</a>
                  </li>
                  <li>
                     <a href="<?php echo base_url(); ?>careers">Careers</a>
                  </li>
                  <li>
                     <a href="<?php if(isset($this->session->userid)){ echo base_url().'logout'; }else{echo base_url().'register';} ?>"><?php if(isset($this->session->userid)){ echo 'logout'; }else{echo 'Register';} ?></a>
                  </li>
               </ul>
            </div>
         </div>
         <div class="col-lg-5-cols col-sm-3 col-6 px-0">
            <div class="footer-link ">
               <h3 style="margin-left: 34px">Other Links</h3>
               <ul class="footer-link ">
                  <li>
                     <a href="<?php echo base_url()?>privacy-policy">Privacy Policy</a>
                  </li>
                  <li>
                     <a href="<?php echo base_url(); ?>about">About Us</a>
                  </li>
                  <li>
                     <a href="<?php echo base_url(); ?>contact">Contact Us</a>
                  </li>
                  <!-- <li>
                     <a href="<?php echo base_url(); ?>advertise">Advertise</a>
                     
                     </li> -->
                  <li>
                     <a href="<?php echo base_url(); ?>disclaimer">Disclaimer</a>
                  </li>
               </ul>
            </div>
         </div>
         <div class="col-lg-5-cols col-sm-3 col-6 px-0">
            <h3 style="margin-bottom: 4px; margin-left: 34px">Social Media</h3>
            <ul class="footer-link  ficon">
               <li>
                  <a href="https://discord.gg/Qf2spryUbJ"><i class="fa-brands fa-discord"></i><span>&nbsp;Discord Channel</span></a>
               </li>
               <li>
                  <a href="https://www.youtube.com/channel/UCSh8QP5s7VFiExTK9sYZdEQ"><i class="fa-brands fa-youtube"></i><span>&nbsp;YouTube</span></a>
               </li>
               <li>
                  <a href="https://twitter.com/ImperialPedia"><i class="fab fa-twitter-square" aria-hidden="true"></i><span>&nbsp;Twitter</span></a>
               </li>
               <li>
                  <a href="https://www.reddit.com/user/imperialpedia"><i class="fa-brands fa-reddit"></i><span>&nbsp;Join Reddit</span></a>
               </li>
            </ul>
         </div>
         <!-- abc  --> 
         <style>a.char{display:block;border:solid 1px grey;text-align:center;padding:4px 4px;text-transform:uppercase;font-size:16px;font-weight:400;border-radius:6px;cursor:pointer;color:#fff;font-family:'Francois One',sans-serif}.flex-letter{background:black}ul.letter-inline{list-style:none;padding:0;display:flex;justify-content:center;flex-flow:wrap}.letter-inline li{width:2.3rem;float:left;padding:3px}@media(min-width:300px) and (max-width:426px){.letter-inline li{width:16%}}@media(min-width:426px) and (max-width:769px){.letter-inline li{width:7%}}@media(min-width:769px) and (max-width:1025px){.letter-inline li{width:5%}}*,*:before,*:after{box-sizing:border-box}a{text-decoration:none}.lettet-cont{width:89%;margin:0 auto;padding-right:10px;padding-left:10px}@media(min-width:300px) and (max-width:1025px){.lettet-cont{width:100%;margin:0 auto;padding-right:5px;padding-left:5px}}</style>
         <div class="lettet-cont mt-4 pt-3" style="border-top: 1px solid #dee2e629;">
            <div class="flex-letter">
               <ul class="letter-inline">
                  <?php for($i = 'a'; $i != 'aa'; $i++){ ?>
                  <li><a href="<?php echo base_url();?>terms/<?php echo $i; ?>" class="char"><?php echo $i;?></a></li>
                  <?php } ?>
               </ul>
            </div>
         </div>
         <div class="col-lg-5-cols col-12">
            <div class="coln logo flex text-center">
               <a href="#">
               <img src="<?php echo base_url() ?>assets/img/footer-logo.png" alt="brand logo" class="img-responsive" width="200">
               </a>
            </div>
         </div>
         <div class="coln c tline mx-auto">
            <p style="font-size: 14px; margin-bottom: 4px">
               © Imperialpedia 2022. All rights reserved. Terms and conditions apply.
            </p>
            <p style="font-size: 14px; margin-bottom: 4px">
               If you're intrested to Earn Money Online then follow us for daily inspiration.
            </p>
            <p style="font-size: 14px; margin-bottom: 4px">
               In case you want to know more about Flash Back Memories and exploring Social Media,
            </p>
            <p style="font-size: 14px; margin-bottom: 4px">
               I suggest you to check out our <a href="https://www.hertiktok.com/">Instagram Video Downloader Tool</a>.
            </p>
            <p style="font-size: 14px; margin-bottom: 4px">
               If you are interested in learning more about SEO Tools, then you should also look at our IT Administrator resource.
            </p>
         </div>
      </footer>
   </div>
</div>



<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-9NJPQWFL7W"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date()); 
  gtag('config', 'G-9NJPQWFL7W');
</script>
<!-- JS -->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script><!--jquery CDN--> 
<script src="https://kit.fontawesome.com/5d67eee1b0.js"></script><!--Font Awesome CDN--> 
<script src="<?php echo base_url()?>assets/js/main.js"></script><!---custom js --> 
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.2.2/lazysizes.min.js"></script>
<!-- toggle topics rs -->
<script>
   $(".toggle-ti").click(function() { 
      $(".toggle-ti").toggleClass("fa-chevron-right"); 
      $(".toggle-ti").toggleClass("fa-chevron-down"); 
      $(".all-top").toggle(); 
   });
   
   $(".toggle-li").click(function() { 
      $(".toggle-li").toggleClass("fa-chevron-right"); 
      $(".toggle-li").toggleClass("fa-chevron-down"); 
      $(".half-top").toggle(); 
   });
   
   $(".toggle-uli").click(function() { 
      $(".toggle-uli").toggleClass("fa-chevron-right"); 
      $(".toggle-uli").toggleClass("fa-chevron-down"); 
      $(".some-top").toggle(); 
   });
   
</script>
<!-- active class href  -->
<script>
   $(document).ready(function() { 
      $('a[href*="#"]').bind('click', function(e) { 
         var target = $(this).attr("href"); 
         if (target && target.length > 1 && $(target).length) {
            e.preventDefault(); 
            $('html, body').stop().animate({ 
               scrollTop: $(target).offset().top 
            }, 600, function() { 
               location.hash = target; 
            }); 
            return false; 
         }
      });
   
   });
   
   
   
   $(window).scroll(function() {
   
      var scrollDistance = $(window).scrollTop();
   
      $('.section-box').each(function(i) {
   
         if ($(this).position().top <= scrollDistance) {
   
            $('.topics a.active').removeClass('active');
   
            $('.topics a').eq(i).addClass('active');
   
         }
   
      });
   
   }).scroll();
   
   
   
   
   
   // for small divice  btn 
   
   $('.float-nav').click(function() {
   
      $('.main-nav, .menu-btn').toggleClass('active');
   
   });
   
</script>
</body>
</html>