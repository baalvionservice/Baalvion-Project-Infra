<!-- only for home page css -->
<style>.checkbox-container{z-index: 1;}.ml-0{margin-left:0px !important}</style>
 <!-- body content section  --> 
 <style>.sec2-main-hed a h3{color: #202124;cursor: pointer;
    font-size: 60px;
    word-break: break-word;
    text-decoration: underline;}.sec2-main-hed a img{display:block;width:100%;height:auto;object-fit:cover}.sec2-main-hed a h3:hover{text-decoration-color:#0dbe98!important}.zone__title__text{text-transform: uppercase;font-size: 1rem;}.zone__title__text:before{content:"";font-size:24px;color:#06917b;margin-right:6px}.zone__title__text::after{content:"";font-size:24px;color:#06917b;margin-left:6px}@media screen and (min-width:1024px) and (min-width:1280px){.splash--two-thirds:not(.splash--enterprise) .splash__headline{font-size:60px;line-height:60px}}@media screen and (min-width:1024px) and (min-width:1024px){.splash--two-thirds:not(.splash--enterprise) .splash__headline{font-size:calc(-40px+7.8125vw);line-height:calc(-40px+7.8125vw)}}@media(min-width:1024px){.splash--two-thirds:not(.splash--enterprise) .splash__headline{font-size:40px;line-height:40px}}@media screen and (min-width:1280px){.splash__headline{font-size:90px;line-height:90px}}@media screen and (min-width:320px){.splash__headline{font-size:calc(10px+6.25vw);line-height:calc(10px+6.25vw)}}@media screen and (max-width:700px){.sec2-main-hed a h3{font-size:30px;line-height:1.4em}.sid-heading{padding:0 0!important}}.card-sub{font-size: 14px;
    text-transform: uppercase; } .card-head-til{font-size: 14px;
    line-height: 1.1;
    color: #202124;}.news-hed-img img{width:100%}.sid-heading a{color: #202124;}.sid-heading a:hover,.card-head-til:hover{text-decoration:underline}.sid-heading{padding:.5rem 3rem}.side-menu-hed hr{width:70%}.feature-box img.featured{width:100%;height:auto;margin-bottom:0;border:3px solid #000;box-shadow:0 0 5px #000}@media only screen and (min-width:600px){.feature-box img.featured{height:300px!important;border:5px solid #000;box-shadow:0 0 10px #000}}.foot-peren{font-size: 12px;
    margin: 6px 11px;
    color: #000;}.bod-non{border:none}</style> 

<!-- web story card start  -->
<div class="container mb-3" style="position:relative; margin-top:10px; z-index:auto;">
<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
    <li class="breadcrumb-item"><a href="<?php echo base_url(); ?>">Home</a></li>
    <li class="breadcrumb-item active" aria-current="page">Web Story</li>
  </ol>
</nav>
<?php 
$ci = &get_instance();
foreach($cat_list as $cat){ 
   $sub_cat_list = $ci->get_sub_category($cat['cat_id']);
   $foour_recent_post = $ci->get_recent_post($cat['cat_id'],4);
   // debug($foour_recent_post);exit;
?>
<div class="container my-5">
<div class="zone__title">
   <h2 class="zone__title__text my-3"><?= strtoupper($cat['cat_name'])?></h2>
</div>

<ul class="nav nav-tabs mb-3">
  <li class="nav-item">
    <a class="nav-link active" aria-current="page" href="<?=base_url()?>">HOME</a>
  </li>
  <?php foreach($sub_cat_list as $sub_cat){ ?>
  <li class="nav-item">
    <a class="nav-link" href="<?php echo base_url(); ?><?php echo str_replace(' ','-',$cat['cat_name']).'/'. str_replace(' ','-',$sub_cat['sub_cat_name'])?>"><?=ucfirst($sub_cat['sub_cat_name'])?></a>
  </li>
  <?php } ?>
</ul>

         
   <div class="row mb-4">
   <?php foreach($foour_recent_post as $post){ ?>
      <div class="col-sm-6 col-md-3 px-0"> 
         <a href="<?php echo base_url().str_replace(' ','-',$post['cat_name']).'/'.str_replace(' ','-',$post['sub_cat_name']).'/'.str_replace(' ','-',$post['uri']); ?>">  
         <div class="card h-100 shadow bod-non">
            <img class="card-img-top" src="https://images.indianexpress.com/2023/02/hacks.jpg?w=223" alt="">
            <div class="card-body"> 
               <p class="card-text card-head-til"><?=ucfirst($post['post_title']);?></p>
            </div>
            <div class="foot-peren">
                  <span class="text-muted">3 hour ago </span>
            </div>
            </div>
         </a>   
      </div>
      <?php } ?>
   </div>
   </div>
   <?php } ?>
</div>
 
 