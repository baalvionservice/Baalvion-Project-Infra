<!-- <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick.css" /> -->
<link rel="stylesheet" href="<?php echo base_url()?>assets/fonts/cabin-semi-bold.woff2">
<link rel="stylesheet" href="<?php echo base_url()?>assets/fonts/SourceSansPro-regular.woff2">
<style>
   @media only screen and (max-width: 700px) {
   .sm-w-100{
   width: 100% !important;
   }
   .ly-secondary{
   padding: 0px;
   }
   }
</style>
<div class="container mt-3 mb-5">
   <div class="row">
      <div class="col-md-8 col-12 cont-sec">
         <!-- container sections  -->
         <?php foreach($post_details as $row){?>
            <h1><?php echo ucfirst($row['post_title']);?></h1>
            <img src="<?php echo base_url().'uploads/post/'.$row['post_img'];?>" class="img-fluid" alt="<?php echo $row['post_alt_title'] ?>">
             <p><?php echo $row['post_desc'];?></p>
         <?php } ?>
      </div>
      <div class="col-md-4 col-12 ">
         <!-- for big divice  -->
         <div class="topics my-4">
            <!-- community suport  -->
            <style>@font-face{font-family:'proxima-nova';font-weight:normal;font-style:normal;src:url('webfonts/ProximaNova-Regular.eot');src:url('webfonts/ProximaNova-Regular.eot?#iefix') format('embedded-opentype'),url('webfonts/ProximaNova-Regular.woff') format('woff'),url('webfonts/ProximaNova-Regular.ttf') format('truetype')}@font-face{font-family:'proxima-nova';font-weight:bold;font-style:normal;src:url('webfonts/ProximaNova-Bold.eot');src:url('webfonts/ProximaNova-Bold.eot?#iefix') format('embedded-opentype'),url('webfonts/ProximaNova-Bold.woff') format('woff'),url('webfonts/ProximaNova-Bold.ttf') format('truetype')}@font-face{font-family:'proxima-nova';font-weight:normal;font-style:italic;src:url('webfonts/ProximaNova-RegularIt.eot');src:url('webfonts/ProximaNova-RegularIt.eot?#iefix') format('embedded-opentype'),url('webfonts/ProximaNova-RegularIt.woff') format('woff'),url('webfonts/ProximaNova-RegularIt.ttf') format('truetype')}@font-face{font-family:'proxima-nova';font-weight:bold;font-style:italic;src:url('webfonts/ProximaNova-BoldIt.eot');src:url('webfonts/ProximaNova-BoldIt.eot?#iefix') format('embedded-opentype'),url('webfonts/ProximaNova-BoldIt.woff') format('woff'),url('webfonts/ProximaNova-BoldIt.ttf') format('truetype')}.ly-secondary{padding:24px;background-color:#f3f3f3;line-height:0}.fixit{display:inline-block}.fixit:after{content:" ";display:block;height:0;clear:both;overflow:hidden;visibility:hidden}.fixit{display:block}li:last-of-type{padding-bottom:0!important}.ly-secondary aside{clear:both;padding-bottom:20px;margin-bottom:20px;border-bottom:1px solid #e4e4e4}.ly-secondary aside:last-of-type{margin-bottom:0;padding-bottom:0;border-bottom:0}.widget-title{font-size:25px;line-height:2.5em; margin-bottom:12px;border-radius:5px;width:100%;color:#ffffff}.widget_simpleimage img{max-width:100%;width:100%;height:auto}.widget_simpleimage p{padding-top:8px}.ly-secondary{margin-bottom:30px}.widget.evp_cdpr_social .social-links{padding:4px 0 10px}.widget.evp_cdpr_social .social-links a{display:block;width:100%;float:left;padding:2px 0 10px;color:#000;font-size:18px;line-height:18px}.widget.evp_cdpr_social .social-links a:hover{color:#db0d15}.widget_twitter-profile-tracker li{font-size:14px;line-height:17px}.widget_twitter-profile-tracker .widget-title{background-position:left center;padding-left:32px}.widget_twitter-profile-tracker li{padding-bottom:10px;margin-bottom:10px;border-bottom:1px solid #dcdcdc}.widget_twitter-profile-tracker li:last-of-type{padding-bottom:0;margin-bottom:0;border-bottom:0}.widget_twitter-profile-tracker li .avatar img{float:left;padding:0 10px 10px 0}.widget p{font-size:14px;line-height:17px}.sidebar-head{margin-bottom:0;text-transform:uppercase;background-color:#06917b;text-align:center}.costom-icon{color:#fff;background:#c0c0c0;padding:6px;border-radius:50%;margin-right:15px;height:30px;width:30px;}</style>
            <div class="my-5">
               <div class="py-2 widget-title sidebar-head">Community</div>
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
                        <a href="#" target="_blank"><img width="500" height="352" src="<?php echo base_url()?>assets/img/banner1.jpg" class="attachment-full size-full" alt="" ></a>
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
                           <i class="fa-brands fa-instagram costom-icon text-center"></i>Follow on Instagram
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
   </div>
</div> 
<!-- sections table  -->
<style>.other-imp{text-align:center;padding-bottom:10px;margin-bottom:25px;margin-top:35px;border-bottom:2px solid #e0e0e0;font-weight:400;font-family:Oswald,Helvetica,Arial,sans-serif;text-transform:inherit;color:#2d2d2d;font-size:2.1111111111111rem;line-height:1.3;clear:both}.cust-cd{background:#222;color:#fff;box-shadow:0 5px 15px rgb(0 0 0 / 8%)}.hash-tag{margin-bottom:10px;font-size:13px;font-weight:300;text-decoration:none;color:#007bff}.cust-cd .card-title{font-size:18px;font-weight:bold;color:#ddd;letter-spacing:.9px;line-height:28px;text-transform:uppercase;margin:12px 0;text-overflow: ellipsis;white-space: nowrap;overflow: hidden;}.cust-cd .bottom-cd{font-size:14px;font-weight:300;line-height:24px;color:#888}.bottom-cd{display:flex;justify-content:space-between}.slick-arrow{display:none!important}@media(min-width:768px){.cust-cd .card-title{font-size:.9rem}}@media(max-width:768px){.cust-cd .card-body{padding:3px}.cust-cd .card-title{margin:4px 0;font-size:.7em;letter-spacing:.4px;line-height:20px}.cust-cd .bottom-cd{font-size:11px;line-height:20px}}</style>
<div class="container my-5">
   <h2 class="other-imp">Read other important articles</h2>
   <div class="row center-slide">
         <?php foreach($post as $pst){if($pst['post_id'] == $row['post_id']){continue;}?>
      <div class="col-md-3 col-6 p-1">
         <a href="<?php echo base_url();foreach($get_subcat_info as $subcat_info){echo 'marketing/'.str_replace(' ','-',$subcat_info['sub_cat_name']);}; echo '/'.str_replace(' ','-',$pst['uri']); ?>">
            <div class="card p-0 cust-cd m-1">
               <img src="<?php echo base_url() ?>uploads/post/<?php echo $pst['post_img'];?>" class="card-img-top"  alt="<?php echo $pst['post_alt_title'];?>">
               <div class="card-body">
                  <!-- <?php //if(!empty($get_subcat_list)){$i=0; foreach($get_subcat_list as $sc_list){ $tags=explode(',',$sc_list['tags']);?><a href="#" class="hash-tag">#<?php //echo $tags[0]?></a><?php// $i++;}}?> -->
                  <h5 class="card-title"><?php echo strtoupper($pst['post_title']);?></h5>
                  <div class="ml-3 bottom-cd"><span class="posted-dt text-uppercase"> 
                     <?php $compile = strtotime($pst['post_updated']);echo $myformat1 = date('F d, Y', $compile); ?>
                  </span><span class="comm-share"><i class="fa-solid fa-message"></i></span><span class="comm-share"><i class="fa-solid fa-share-nodes"></i></span><span class="comm-share"><i class="fa-solid fa-thumbs-up"></i></span></div>
               </div>
            </div>
         </a>
      </div>
         <?php } ?>
   </div>
</div>