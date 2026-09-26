<!-- header csss  -->
<style>.wrap{background-image:url('<?php echo base_url()?>assets/img/blue-background-cover.webp');background-repeat:no-repeat;background-size:cover}.head-info{display:flex;justify-content:space-around;width:66%}.auth-img{height:48px;width:48px;clip-path:circle(23px at center)}.opcty .sub{color:#fff;font-family:oswald,Sans-serif;font-size:40px}.head-info li{align-self:center;padding-left:5px;color:#fff;font-size:1rem}@media only screen and (max-width:700px){.head-info{width:100%;padding-left:0;flex-wrap:wrap}.opcty .sub{font-size:30px}.auth-img{height:35px;width:35px;clip-path:circle(17px at center)}}</style>
<?php foreach($get_subcat_info as $sc_info){
   $img_alt_title= explode(',',$sc_info['tags']); 
   ?>
<!-- top heading Author sections 1  -->
<section class="wrap">
   <div class="opcty">
      <div class="container py-5">
         <div class="text-center sub"><?php echo ucfirst($sc_info['sub_cat_name']); ?></div>
         <ul class="head-info mx-auto py-2">
            <li>
               <img class="img-fluid auth-img" src="<?php echo base_url()?>uploads/author/<?php echo $sc_info['author_img']?>" alt="<?php echo $img_alt_title[0]; ?>"> <?php echo ucfirst($sc_info['author_name']); ?>
            </li>
            <li>
               <i class="fas fa-calendar-alt" aria-hidden="true"></i> <?php $compile = strtotime($sc_info['added_date']);$myformat1 = date('F d, Y', $compile); echo $myformat1; ?>
            </li>
            <li>
               <i class="fas fa-tags" aria-hidden="true"></i> <?php echo ucfirst($sc_info['cat_name']);?>
            </li>
            <li>
               <i class="fas fa-comments" aria-hidden="true"></i> Comment(30)
            </li>
         </ul>
      </div>
   </div>
</section>
<?php } ?>


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
                  <li class="post-list"><a href="<?php echo base_url();foreach($get_subcat_info as $subcat_info){echo 'editor/'.str_replace(' ','-',$subcat_info['sub_cat_name']);}; echo '/'.str_replace(' ','-',$pst1['uri']); ?>"><?php echo ucfirst($pst1['post_title']);?></a></li>
               <?php } ?>
            </ul>
            </div>
         </div>
      </div>
   </div>  

</div> 
</div> 
</section>


<!-- read more  -->
<?php if(!empty($post)){?>
   <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick.css" />
<style>.cust-cd{ background: #222; color: #fff; box-shadow: 0 5px 15px rgb(0 0 0 / 8%);} .hash-tag{ margin-bottom: 10px; font-size: 13px; font-weight: 300; text-decoration: none; color: #007bff;} .cust-cd .card-title{ font-size: 18px; font-weight: bold; color: #ddd; letter-spacing: .9px; line-height: 28px; text-transform: uppercase; margin: 12px 0px;} .cust-cd .bottom-cd{ font-size: 14px; font-weight: 300; line-height: 24px; color: #888;}  .slick-arrow{ display: none !important;} @media (min-width: 768px){ .cust-cd .card-title{ font-size: 1rem;}}
@media only screen and (max-width: 600px) {
   .cust-cd .bottom-cd{
      font-size: 11px;line-height: 19px;
  }.cust-cd .card-title{margin: 5px 0px;font-size: 12px;line-height:18px;}.cust-cd .card-body{padding:6px;}
}
</style>
<div class="container my-5">
   <h2 class="other-imp">Learn about other daily use editor</h2>
   <div class="row center-slide">
      <?php  foreach($post as $res){  ?>
         <div class="col-6 col-md-4 col-lg-3"> 
            <a href="<?php echo base_url();foreach($get_subcat_info as $subcat_info){echo 'editor/'.str_replace(' ','-',$subcat_info['sub_cat_name']);}; echo '/'.str_replace(' ','-',$res['uri']); ?>">
             <div class="card p-0 cust-cd m-1"> 
               <img data-src="<?php echo base_url().'uploads/post/'.$res['post_img']; ?>" class="card-img-top lazyload rounded" alt="<?php echo $res['post_alt_title']?>">
               <div class="card-body">
                  <a href="#" class="hash-tag">#<?php echo ucfirst($this->uri->segment(2));?></a>
                  <h5 class="card-title"><?php echo ucfirst($res['post_title']);?></h5>
                  <div class="ml-3 bottom-cd">By <span style="margin-right:8px"><?php echo ucfirst($res['author_name'])?></span>|<span class="posted-dt text-uppercase" style="margin-left:8px"><?php $compile = strtotime($res['updated_date']);echo $myformat1 = date('F d, Y', $compile); ?></span><!--<span class="comm-share"><i class="fa-solid fa-message"></i></span><span class="comm-share"><i class="fa-solid fa-share-nodes"></i></span><span class="comm-share"><i class="fa-solid fa-thumbs-up"></i></span>--></div>
               </div>
            </div>
            </a>
         </div>
     <?php } ?>
   </div>
</div>



<!-- silk slider  -->
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
               slidesToShow: 3, 
               slidesToScroll: 2, 
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
               slidesToShow: 2, 
               slidesToScroll: 1
            }
   
         } 
      ] 
   }); 
</script>
<?php } ?>