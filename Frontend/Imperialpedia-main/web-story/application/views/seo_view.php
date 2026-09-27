<?php
// insert ahref before and after h2 tag 
function insert_ahref_tag($string){ 
      $pos = strpos($string, '<h2>') + 3;   //4 is length of <h2>
      $extra= ' id="does-grammarly-have-a-lifetime-subscription?"'; //what you want to add
      $ress = substr($string, 0, $pos) . $extra . substr($string, $pos);
      return $ress;
}

// get all h2 in content
function tag_contents($string, $tag_open, $tag_close){
   foreach (explode($tag_open, $string) as $key => $value) {
       if(strpos($value, $tag_close) !== FALSE){
            $result[] = substr($value, 0, strpos($value, $tag_close));;
       }
   }
   return $result;
}
?>

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
<!-- descriptions & POST sections 2 -->
<style>.cont-sec h1{padding-bottom:10px;margin-bottom:25px;margin-top:35px;border-bottom:2px solid #e0e0e0;font-weight:400;font-family:Oswald,Helvetica,Arial,sans-serif;font-size:2.1111111111111rem;line-height:1.3;clear:both}.cont-sec h2{font-size:1.3rem;font-weight:500}</style>
<div class="container mt-3 mb-5">
   <div class="row">
      <div class="col-md-8 col-12 cont-sec">
           <?php foreach($get_subcat_info as $subcat_info){echo insert_ahref_tag($subcat_info['sub_cat_desc']);};?> 
      </div>
      <div class="col-md-4 col-12">
         <div class="topics my-4 rounded shadow"> <!--topics sections-->
               <div class="my-3">
                  <div class="py-2 widget-title sidebar-head"><?php echo str_replace('-',' ',ucfirst($this->uri->segment(2)))?></div>
                  <span class="border-ltr"></span>
                  <div class="ly-secondary widget-area" role="complementary">
                  <ul type="circle" class="post-lists">
                     <?php 
                        $all_h2= tag_contents($subcat_info['sub_cat_desc'] , "<h2>" , "</h2>");
                        foreach($all_h2 as $val){?>
                           <li class="post-list"><a href="#<?php echo strtolower(str_replace(' ','-',$val))?>"><?php echo ucfirst($val);?></a></li>
                     <?php }?>
                  </ul>
                  </div>
               </div>
            </div>
            <div class="topics my-4 rounded shadow">  <!--community sections-->
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
   </div>
</div>






<!-- other post card   -->
<style>.card-body{height:7em;overflow:hidden}.card:hover .card__img{opacity:.75}.card{border:1px solid #fff}.cust-til{overflow:hidden;max-width:100%;height:1.2rem;content:attr(data-tag);white-space:nowrap;letter-spacing:.05rem;text-transform:uppercase;text-align:left;font-size: .775rem;font-weight:400}.cust-desc{margin-bottom:.5rem;color:#191919;-webkit-transition:color .25s;transition:color .25s;font-family:SourceSansPro,sans-serif;font-size:.825rem;font-weight:400;line-height:1.2em}@media(min-width:40em){.cust-til{font-size:.775rem}}@media(min-width:50em){.cust-desc{font-size:1rem;line-height:1.35rem}}@media only screen and (max-width:700px){.sm-p-0{padding:0 0 !important}}.full-card{background:#fff;height:100%;width:100%;position:relative}.read-more{color:#1a73e8;position:absolute;bottom:16px;left:17px}.read-more:hover{color:#2c40d0}</style>
<section class="bg-gool">
   <div class="container py-4 ">
      <h2  class="text-center">Know More About <?php echo str_replace('-',' ',ucfirst($this->uri->segment(2)))?></h2><hr>
      <div class="row">
      <?php foreach($post as $pst){?>
         <div class="col-md-3 col-6 my-2">
            <a href="<?php echo base_url();foreach($get_subcat_info as $subcat_info){echo 'seo/'.str_replace(' ','-',$subcat_info['sub_cat_name']);}; echo '/'.str_replace(' ','-',$pst['uri']); ?>">
            <div class="full-card">
               <img data-src="<?php echo base_url() ?>uploads/post/<?php echo $pst['post_img'];?>" class="card-img-top card__img lazyload" alt="<?php echo $pst['post_alt_title'];?>">
               <div class="card-body">
                  <h5 class="card-title cust-til w-100 mb-0"><?php echo strtoupper(str_replace('-',' ',$this->uri->segment(2)));?></h5>
                  <p class="card-text cust-desc"><?php echo strtoupper($pst['post_title'])   ;?></p>
               </div>
               <span class="read-more">Learn more</span>
            </div>
            </a> 
         </div>
         <?php } ?>
      </div>
   </div>
</section>

