   <!--commu & Email both sidebar css  -->
   <style>.ly-secondary{padding:24px;line-height:2}.fixit{display:inline-block}.fixit:after{content:" ";display:block;height:0;clear:both;overflow:hidden;visibility:hidden}.fixit{display:block}li:last-of-type{padding-bottom:0 !important}.ly-secondary aside{clear:both;padding-bottom:20px;margin-bottom:20px;border-bottom:1px solid #e4e4e4}.ly-secondary aside:last-of-type{margin-bottom:0;padding-bottom:0;border-bottom:0}.widget-title{font-size:25px;font-weight:400;line-height:0;color:#202124}.widget-title::after{border:1px solid #000}.widget_simpleimage img{max-width:100%;width:100%;height:auto}.widget_simpleimage p{padding-top:8px}.ly-secondary{margin-bottom:30px}.widget.evp_cdpr_social .social-links{padding:4px 0 10px}.widget.evp_cdpr_social .social-links a{display:block;width:100%;float:left;padding:2px 0 10px;color:#000;font-size:18px;line-height:18px}.widget.evp_cdpr_social .social-links a:hover{color:#db0d15}.widget_twitter-profile-tracker li{font-size:14px;line-height:17px}.widget_twitter-profile-tracker .widget-title{background-position:left center;padding-left:32px}.widget_twitter-profile-tracker li{padding-bottom:10px;margin-bottom:10px;border-bottom:1px solid #dcdcdc}.widget_twitter-profile-tracker li:last-of-type{padding-bottom:0;margin-bottom:0;border-bottom:0}.widget_twitter-profile-tracker li .avatar img{float:left;padding:0 10px 10px 0}.widget p{font-size:14px;line-height:17px}.costom-icon{color:#fff;background:silver;padding:6px;border-radius:50%;margin-right:15px;height:30px;width:30px}.border-ltr{border-bottom:1px solid #dadce0;width:40%;display:-webkit-box;display:-ms-flexbox;display:flex;margin:0;direction:ltr;margin-top:8px;padding-left:12px}.sidebar-head{padding-left:12px}.ly-secondary aside{overflow-x:hidden}.ly-secondary aside::-webkit-scrollbar{width:5px}.ly-secondary aside::-webkit-scrollbar-track{background:#f1f1f1}.ly-secondary aside::-webkit-scrollbar-thumb{background:#97e1ce}.ly-secondary aside::-webkit-scrollbar-thumb:hover{background:#555}.post-list{line-height:1.3;margin-bottom:30px}.post-lists a:hover{color:#1a73e8}.post-lists a{text-decoration:none;color:#212529;overflow:hidden;-webkit-transition:color .3s;transition:color .3s}.topics{border: 1px solid #dadce0;min-height: 50vw;}</style>

   <!-- main container  -->
<section class="light-50-bg"> 
<div class="container-fluid my-0 pivacy"> 
   <div class="row"> 
      <div class="col-md-3 d-small-none">   
          <div class="topics my-4 rounded shadow"> 
            <!-- community suport  --> 
            <div class="my-3">
               <div class="py-2 widget-title sidebar-head">Community</div>
               <span class="border-ltr"></span>
               <div class="ly-secondary widget-area" role="complementary">
                  <aside id="evp_cdpr_social-2" class="widget evp_cdpr_social">
                     <div class="social-links fixit">
                        <a href="https://twitter.com/ImperialPedia">
                        <i class="fa-brands fa-twitter costom-icon"></i> Follow us on Twitter
                        </a>
                        <a href="https://www.youtube.com/channel/UCSh8QP5s7VFiExTK9sYZdEQ">
                        <i class="fa-brands fa-youtube costom-icon"></i> Subscribe on YouTube
                        </a>
                     </div>
                     <div class="evp_sf evp_sf_fb">
                        <div class="fb-like-box fb_iframe_widget">
                           <span style="vertical-align: bottom; width: 100%; height: 130px;">  
                           <iframe src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fimperialpedia&tabs=timeline&width=340&height=500&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId=3431683380488153" style="border:none;overflow:hidden;width: 100%;height: 320px;" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
                           </span>
                        </div>
                     </div>
                  </aside>
                  <aside id="simpleimage-6" class="widget widget_simpleimage">
                     <p class="simple-image">
                        <a href="https://www.neverendmoney.com/" target="_blank"><img width="500" height="352" data-src="<?php echo base_url()?>assets/img/banner1.jpg" class="attachment-full size-full lazyload" alt="imperial pedia add" ></a>
                     </p>
                  </aside>
                  <aside id="twitter-profile-tracker-8" class="widget widget_twitter-profile-tracker " style="height: 350px;overflow: scroll;">
                     <div class="widget-title text-dark">Imperial pedia</div>
                     <a class="twitter-timeline" href="https://twitter.com/ImperialPedia?ref_src=twsrc%5Etfw">Tweets by ImperialPedia</a> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
                  </aside>
                  <aside id="evp_cdpr_social-2" class="widget evp_cdpr_social">
                     <div class="social-links fixit">
                        <div class="social-links fixit">
                           <a href="https://discord.gg/Qf2spryUbJ">
                           <i class="fa-brands fa-discord costom-icon text-center"></i>Join Our Discord Channel 
                           </a>
                           <a href="https://www.instagram.com/imperialpedia/">
                           <i class="fa-brands fa-instagram costom-icon text-center"></i>Follow on Twitter 
                           </a>
                           <a href="https://www.reddit.com/user/imperialpedia">
                           <i class="fa-brands fa-reddit costom-icon text-center"></i>Join Reddit 
                           </a>
                        </div>
                     </div>
                  </aside>
               </div>
            </div>
         </div> 
      </div> 
      <div class="col-md-6 col-12"> 
      <?php  
              foreach($get_subcat_info as $subcat_info){ 
                 echo $subcat_info['sub_cat_desc']; 
               };  
         ?>  
      </div>   
      <div class="col-md-3 d-small-none"> 
         <div class="topics my-4 rounded shadow"> 
            <div class="my-3">
               <div class="py-2 widget-title sidebar-head"><?php echo str_replace('-',' ',ucfirst($this->uri->segment(2)))?></div>
               <span class="border-ltr"></span>
               <div class="ly-secondary widget-area" role="complementary">
               <ul type="circle" class="post-lists">
                  <?php foreach($post as $pst1){ ?>
                     <li class="post-list"><a href="<?php echo base_url();foreach($get_subcat_info as $subcat_info){echo 'marketing/'.str_replace(' ','-',$subcat_info['sub_cat_name']);}; echo '/'.str_replace(' ','-',$pst1['uri']); ?>"><?php echo ucfirst($pst1['post_title']);?></a></li>
                  <?php } ?>
               </ul>
               </div>
            </div>
         </div>
      </div>  

   </div> 
</div> 
</section>




<!-- other post card   -->
<style>.card-body{height:7em;overflow:hidden}.card:hover .card__img{opacity:.75}.card{border:1px solid #fff}.cust-til{overflow:hidden;max-width:100%;height:1.2rem;content:attr(data-tag);white-space:nowrap;letter-spacing:.05rem;text-transform:uppercase;text-align:left;font-size: .775rem;font-weight:400}.cust-desc{margin-bottom:.5rem;color:#191919;-webkit-transition:color .25s;transition:color .25s;font-family:SourceSansPro,sans-serif;font-size:.825rem;font-weight:400;line-height:1.2em}@media(min-width:40em){.cust-til{font-size:.775rem}}@media(min-width:50em){.cust-desc{font-size:1rem;line-height:1.35rem}}@media only screen and (max-width:700px){.sm-p-0{padding:0 0 !important}}.full-card{background:#fff;height:100%;width:100%;position:relative}.read-more{color:#1a73e8;position:absolute;bottom:16px;left:17px}.read-more:hover{color:#2c40d0}</style>
<section class="bg-gool">
   <div class="container py-4 ">
      <h2  class="text-center">Know More About <?php echo str_replace('-',' ',ucfirst($this->uri->segment(2)))?></h2><hr>
      <div class="row">
      <?php foreach($post as $pst){?>
         <div class="col-md-3 col-6 my-2">
            <a href="<?php echo base_url();foreach($get_subcat_info as $subcat_info){echo 'marketing/'.str_replace(' ','-',$subcat_info['sub_cat_name']);}; echo '/'.str_replace(' ','-',$pst['uri']); ?>">
            <div class="full-card">
               <img data-src="<?php echo base_url() ?>uploads/post/<?php echo $pst['post_img'];?>" class="card-img-top card__img lazyload" alt="<?php echo $pst['post_alt_title'];?>">
               <div class="card-body">
                  <h5 class="card-title cust-til w-100 mb-0"><?php echo strtoupper(str_replace('-',' ',$this->uri->segment(2)));?></h5>
                  <p class="card-text cust-desc"><?php echo ucfirst($pst['post_title']).'.';?></p>
               </div>
               <span class="read-more">Learn more</span>
            </div>
            </a> 
         </div>
         <?php } ?>
      </div>
   </div>
</section>



<!-- sections table  --> 
<!-- <style>.other-imp{text-align:center;padding-bottom:10px;margin-bottom:25px;margin-top:35px;border-bottom:2px solid #e0e0e0;font-weight:400;font-family:Oswald,Helvetica,Arial,sans-serif;text-transform:inherit;color:#2d2d2d;font-size:2.1111111111111rem;line-height:1.3;clear:both}.cust-cd{background:#222;color:#fff;box-shadow:0 5px 15px rgb(0 0 0 / 8%)}.hash-tag{margin-bottom:10px;font-size:13px;font-weight:300;text-decoration:none;color:#007bff}.cust-cd .card-title{font-size:18px;font-weight:bold;color:#ddd;letter-spacing:.9px;line-height:28px;text-transform:uppercase;margin:12px 0}.cust-cd .bottom-cd{font-size:14px;font-weight:300;line-height:24px;color:#888}.bottom-cd{display:flex;justify-content:space-between}.slick-arrow{display:none !important}@media(min-width:768px){.cust-cd .card-title{font-size:1.2rem}}</style>
<div class="container my-5">
   <h2 class="other-imp">Read other important articles</h2>
   <div class="center-slide">
      <div class="card p-0 cust-cd m-1">
         <img src="<?php echo base_url() ?>assets/img/one.jpg" class="card-img-top"  alt="...">
         <div class="card-body">
            <a href="#" class="hash-tag">#theem</a>
            <h5 class="card-title">Card title Lorem, ipsum dolor Lorem ipsum.</h5>
            <div class="ml-3 bottom-cd"><span class="posted-dt text-uppercase">NOVEMBER 18, 2021</span><span class="comm-share"><i class="fa-solid fa-message"></i></span><span class="comm-share"><i class="fa-solid fa-share-nodes"></i></span><span class="comm-share"><i class="fa-solid fa-thumbs-up"></i></span></div>
         </div>
      </div>
      <div class="card p-0 cust-cd m-1">
         <img src="<?php echo base_url() ?>assets/img/one.jpg" class="card-img-top"  alt="...">
         <div class="card-body">
            <a href="#" class="hash-tag">#theem</a>
            <h5 class="card-title">Card title Lorem, ipsum dolor Lorem ipsum.</h5>
            <div class="ml-3 bottom-cd"><span class="posted-dt text-uppercase">NOVEMBER 18, 2021</span><span class="comm-share"><i class="fa-solid fa-message"></i></span><span class="comm-share"><i class="fa-solid fa-share-nodes"></i></span><span class="comm-share"><i class="fa-solid fa-thumbs-up"></i></span></div>
         </div>
      </div>
      <div class="card p-0 cust-cd m-1">
         <img src="<?php echo base_url() ?>assets/img/one.jpg" class="card-img-top"  alt="...">
         <div class="card-body">
            <a href="#" class="hash-tag">#theem</a>
            <h5 class="card-title">Card title Lorem, ipsum dolor Lorem ipsum.</h5>
            <div class="ml-3 bottom-cd"><span class="posted-dt text-uppercase">NOVEMBER 18, 2021</span><span class="comm-share"><i class="fa-solid fa-message"></i></span><span class="comm-share"><i class="fa-solid fa-share-nodes"></i></span><span class="comm-share"><i class="fa-solid fa-thumbs-up"></i></span></div>
         </div>
      </div>
      <div class="card p-0 cust-cd m-1">
         <img src="<?php echo base_url() ?>assets/img/one.jpg" class="card-img-top"  alt="...">
         <div class="card-body">
            <a href="#" class="hash-tag">#theem</a>
            <h5 class="card-title">Card title Lorem, ipsum dolor Lorem ipsum.</h5>
            <div class="ml-3 bottom-cd"><span class="posted-dt text-uppercase">NOVEMBER 18, 2021</span><span class="comm-share"><i class="fa-solid fa-message"></i></span><span class="comm-share"><i class="fa-solid fa-share-nodes"></i></span><span class="comm-share"><i class="fa-solid fa-thumbs-up"></i></span></div>
         </div>
      </div>
      <div class="card p-0 cust-cd m-1">
         <img src="<?php echo base_url() ?>assets/img/one.jpg" class="card-img-top"  alt="...">
         <div class="card-body">
            <a href="#" class="hash-tag">#theem</a>
            <h5 class="card-title">Card title Lorem, ipsum dolor Lorem ipsum.</h5>
            <div class="ml-3 bottom-cd"><span class="posted-dt text-uppercase">NOVEMBER 18, 2021</span><span class="comm-share"><i class="fa-solid fa-message"></i></span><span class="comm-share"><i class="fa-solid fa-share-nodes"></i></span><span class="comm-share"><i class="fa-solid fa-thumbs-up"></i></span></div>
         </div>
      </div>
   </div>
</div> -->


<!-- silk slider  -->
<!-- 
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script> 
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick.min.js"></script> 
<script> 
   $('.center-slide').slick({ 
      infinite: true, 
      autoplay: true, 
      speed: 1500, 
      slidesToShow: 4, 
      slidesToScroll: 4, 
      responsive: [{ 
            breakpoint: 1024, 
            settings: { 
               slidesToShow: 4, 
               slidesToScroll: 4, 
            } 
         }, 
         { 
            breakpoint: 600,

            settings: {

               slidesToShow: 2,

               slidesToScroll: 2,

            }

         },

         {

            breakpoint: 480,

            settings: {

               slidesToShow: 1,

               slidesToScroll: 1

            }

         }

      ]

   });

</script> -->