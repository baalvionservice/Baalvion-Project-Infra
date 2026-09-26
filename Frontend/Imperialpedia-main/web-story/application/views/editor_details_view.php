<?php
if (!function_exists('tag_contents')) {
   function tag_contents($string, $tag_open, $tag_close){
      $result = array();
      if (!empty($string)) {
         foreach (explode($tag_open, $string) as $key => $value) {
             if(strpos($value, $tag_close) !== FALSE){
                  $result[] = substr($value, 0, strpos($value, $tag_close));
             }
         }
      }
      return $result;
   }
}

if (!function_exists('get_words')) {
   function get_words($sentence, $count = 15){ 
      if (empty($sentence)) return '';
      preg_match("/(?:\w+(?:\W+|$)){0,$count}/", $sentence, $matches);
      return isset($matches[0]) ? $matches[0] : ''; 
   }
}

if (!function_exists('insert_ahref_tag')) {
   function insert_ahref_tag($string){ 
      if (empty($string)) return '';
      $pos = strpos($string, '<h2>');
      if ($pos !== FALSE) {
         $pos += 3;
         $extra= ' id="does-grammarly-have-a-lifetime-subscription?"';
         return substr($string, 0, $pos) . $extra . substr($string, $pos);
      }
      return $string;
   }
}
?>
<!-- header csss  -->
<style>.wrap{background-image:url('<?php echo base_url()?>assets/img/blue-background-cover.webp');background-repeat:no-repeat;background-size:cover}.head-info{display:flex;justify-content:space-around;width:66%}.auth-img{height:48px;width:48px;clip-path:circle(23px at center)}.opcty .sub{color:#fff;font-size:40px}.head-info li{align-self:center;padding-left:5px;color:#fff;font-size:1rem}@media only screen and (max-width:700px){.head-info{width:100%;padding-left:0;flex-wrap:wrap}.opcty .sub{font-size:30px}.auth-img{height:35px;width:35px;clip-path:circle(17px at center)}}</style>
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
<style>.cont-sec h1{padding-bottom:10px;margin-bottom:25px;margin-top:35px;border-bottom:2px solid #e0e0e0;font-weight:400;font-size:2.1111111111111rem;line-height:1.3;clear:both}.cont-sec h2{font-size:1.3rem;font-weight:500}</style>
<div class="container mt-3 mb-5">
   <div class="row">
      <div class="col-md-8 col-12 cont-sec">
            <?php foreach($post_details as $row){?>
                  <h1><?php echo ucfirst($row['post_title']);?></h1>
                  <img src="<?php echo base_url().'uploads/post/'.$row['post_img'];?>" class="img-fluid" alt="<?php echo $row['post_alt_title'] ?>">
                  <p><?php echo $row['post_desc'];?></p>
               <?php } ?>
      </div>
      <div class="col-md-4 col-12"> 
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






<!-- sections table  -->
<style>.other-imp{text-align:center;padding-bottom:10px;margin-bottom:25px;margin-top:35px;border-bottom:2px solid #e0e0e0;font-weight:400;text-transform:inherit;color:#2d2d2d;font-size:2.1111111111111rem;line-height:1.3;clear:both}.cust-cd{background:#222;color:#fff;box-shadow:0 5px 15px rgb(0 0 0 / 8%)}.hash-tag{margin-bottom:10px;font-size:13px;font-weight:300;text-decoration:none;color:#007bff}.cust-cd .card-title{font-size:18px;font-weight:bold;color:#ddd;letter-spacing:.9px;line-height:28px;text-transform:uppercase;margin:12px 0;text-overflow: ellipsis;white-space: nowrap;overflow: hidden;}.cust-cd .bottom-cd{font-size:14px;font-weight:300;line-height:24px;color:#888}.bottom-cd{display:flex;justify-content:space-between}.slick-arrow{display:none!important}@media(min-width:768px){.cust-cd .card-title{font-size:.9rem}}@media(max-width:768px){.cust-cd .card-body{padding:3px}.cust-cd .card-title{margin:4px 0;font-size:.7em;letter-spacing:.4px;line-height:20px}.cust-cd .bottom-cd{font-size:11px;line-height:20px}}</style>
<div class="container my-5">
   <h2 class="other-imp">Read other important articles</h2>
   <div class="row center-slide">
         <?php foreach($post as $pst){if($pst['post_id'] == $row['post_id']){continue;}?>
      <div class="col-md-3 col-6 p-1">
         <a href="<?php echo base_url();foreach($get_subcat_info as $subcat_info){echo 'editor/'.str_replace(' ','-',$subcat_info['sub_cat_name']);}; echo '/'.str_replace(' ','-',$pst['uri']); ?>">
            <div class="card p-0 cust-cd m-1">
               <img src="<?php echo base_url() ?>uploads/post/<?php echo $pst['post_img'];?>" class="card-img-top"  alt="<?php echo $pst['post_alt_title'];?>">
               <div class="card-body">
                  <!-- <?php if(!empty($get_subcat_list)){$i=0; foreach($get_subcat_list as $sc_list){ $tags=explode(',',$sc_list['tags']);?><a href="#" class="hash-tag">#<?php echo $tags[0]?></a><?php $i++;}}?> -->
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


 



<!-- comment form section 4 --> 
<style>.cat-btn{color:#212529;background-color:#e2e6ea;border-color:#dae0e5} 
   /* comment area css  */ 
   .be-comment-block{margin-bottom:50px!important;border:1px solid #edeff2;border-radius:2px;padding:50px 70px;border:1px solid #fff}.comments-title{font-size:16px;color:#262626;margin-bottom:15px;font-family:'Conv_helveticaneuecyr-bold'}.be-img-comment{width:60px;height:60px;float:left;margin-bottom:15px}.be-ava-comment{width:60px;height:60px;border-radius:50%}.be-comment-content{margin-left:80px}.be-comment-content span{display:inline-block;width:49%;margin-bottom:15px}.be-comment-name{font-size:13px;font-family:'Conv_helveticaneuecyr-bold'}.be-comment-content a{color:#383b43}.be-comment-content span{display:inline-block;width:49%;margin-bottom:15px}.be-comment-time{text-align:right}.be-comment-time{font-size:11px;color:#b4b7c1}.be-comment-text{font-size:13px;line-height:18px;color:#7a8192;display:block;background:#f6f6f7;border:1px solid #edeff2;padding:15px 20px 20px 20px}.form-group.fl_icon .icon{position:absolute;top:1px;left:16px;width:48px;height:48px;background:#f6f6f7;color:#b5b8c2;text-align:center;line-height:50px;-webkit-border-top-left-radius:2px;-webkit-border-bottom-left-radius:2px;-moz-border-radius-topleft:2px;-moz-border-radius-bottomleft:2px;border-top-left-radius:2px;border-bottom-left-radius:2px}.form-group .form-input{font-size:13px;line-height:50px;font-weight:400;color:#000;width:100%;height:50px;padding-left:20px;padding-right:20px;border:1px solid #edeff2;border-radius:3px}.form-group.fl_icon .form-input{padding-left:70px}.form-group textarea.form-input{height:150px}img{width:100%;background-repeat:no-repeat;background-size:cover}@media only screen and (max-width:700px){.like-com-shar-btn{font-size:.7rem;padding:.275rem .45rem}.form-group.fl_icon .form-input{padding-left:7px}.alert{padding:.3em;font-size:.93em}.be-comment-block{padding:0}}</style> 
   <?php 
   foreach($get_subcat_list as $subcat_list_val){}
   foreach($post as $pst){  $tags= explode(',',$pst['post_alt_title']);}
   ?>
<div class="container my-4 py-4" style="background: #f3f3f3;">
   <div class="category my-2 ">  
      <!-- <a href="#" type="button" class="btn btn-light cat-btn like-com-shar-btn">#</a>   -->
   </div>
   <div class="like-comm-shr my-3" style="background: #f3f3f3;">
      <div class="d-flex bd-highlight mb-3" style="justify-content: space-between;">
         <div class="mr-auto p-2 bd-highlight">
            <button type="button" class="btn btn-primary like-com-shar-btn"><i class="fas fa-thumbs-up"></i> 00</button>
            <button type="button" class="btn btn-primary like-com-shar-btn"><i class="fa-solid fa-thumbs-down"></i> 00</button>
         </div>
         <div class="p-2 bd-highlight"> 
            <p class="d-inline text-muted">Share : </p>
            <a class="btn btn-primary like-com-shar-btn" style="background-color: #3b5998;" href="https://www.facebook.com/sharer.php?u=<?php echo base_url().uri_string();?>" target="_blank" role="link"><i class="fab fa-facebook-f"></i></a> 
            <a class="btn btn-primary like-com-shar-btn" style="background-color: #55acee;" href="http:twiter.com/share?text=<?php echo ucfirst($subcat_list_val['sub_cat_name']);?>&url=<?php echo base_url().uri_string();?>&hashtags=#<?php echo $this->uri->segment(1)?>" target="_blank" role="link"><i class="fab fa-twitter"></i></a> 
            <a class="btn btn-primary like-com-shar-btn" style="background-color: #ac2bac;" href="https://www.linkedin.com/sharing/share-offsite/?url=<?php echo base_url().uri_string();?>" target="_blank" role="link"><i class="fa-brands fa-linkedin-in"></i></a> 
            <a class="btn btn-primary like-com-shar-btn" style="background-color: #25d366;" href="https://api.whatsapp.com/send?phone=&text=<?php echo urlencode($subcat_list_val['sub_cat_name']);?><?php echo base_url().uri_string();?>" target="_blank" role="link"><i class="fab fa-whatsapp"></i></a>
         </div>
      </div>
   </div>
   <hr class="featurette-divider mb-3">

   <div class="container" style="background: #f3f3f3;">
      <form class="form-block" action="<?php if($this->session->userid){ echo '/comment';}?>" method="post">
         <div class="error"><?php if($this->session->comm_msg){ echo $this->session->comm_msg; $this->session->unset_userdata('comm_msg'); }?></div>
         <div class="row">
            <div class="col-12 col-md-6 mb-3">
               <div class="form-group fl_icon">
                  <div class="icon"><i class="fa fa-user"></i></div>
                  <input class="form-input" name="name" id="name" type="text" placeholder="Your name" required>
               </div>
            </div>
            <div class="col-12 col-md-6 mb-3 fl_icon">
               <div class="form-group fl_icon">
                  <div class="icon"><i class="fa fa-envelope-o"></i></div>
                  <input class="form-input" type="email" placeholder="Your email" value="<?php if($this->session->userid){ echo $this->session->userid;}?>" readonly>
               </div>
            </div>
            <div class="col-12">
               <div class="form-group">
                  <textarea class="form-input " name="message" id="message" placeholder="Your text" required></textarea>
               </div>
            </div>
            <?php if($this->session->userid){ echo '<div class="text-center my-3"><button type="submit" name="submit" value="submit" class="btn btn-warning ml-auto mr-4" style="width:auto;">Submit Comment</button></div>';}else{echo '<div class="alert alert-warning w-100 text-center" role="alert">Login to Add Comment.</div>';}?>
         </div>
         <input type="hidden" name="page" id="page" value="<?php echo uri_string()?>">
      </form>
   </div>
   <!-- view comments  -->
   <div class="comment-area my-5">
      <div class="container">
         <div class="be-comment-block">
            <h1 class="comments-title">Comments (<?php echo count($comments)?>)</h1>
            <?php foreach($comments as $comm){?>
            <div class="be-comment">
               <div class="be-img-comment">
                  <a href="#">
                  <img src="https://bootdey.com/img/Content/avatar/avatar1.png" alt="" class="be-ava-comment">
                  </a>
               </div>
               <div class="be-comment-content">
                  <span class="be-comment-name">
                  <a href="#"><?php echo ucfirst($comm['commenter_name'])?></a>
                  </span>
                  <span class="be-comment-time">
                  <i class="fa fa-clock-o"></i>
                  <?php $compile = strtotime($comm['added_date']);$myformat1 = date('F d, Y', $compile);$myformat2 = date('h:ia', $compile); echo $myformat1.' at '.$myformat2; ?> 
                  </span>
                  <p class="be-comment-text">
                    <?php echo ucfirst($comm['comment_txt'])?>
                  </p> 
               </div>
            </div>
            <?php } ?>
         </div>
      </div>
   </div>
   </div>
</div>