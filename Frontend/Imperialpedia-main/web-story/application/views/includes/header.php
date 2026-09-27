<!DOCTYPE html>
<html lang="en">
   <head>
   <meta name="robots" content="noindex">
   <meta name="googlebot" content="noindex">
   <meta name="googlebot-news" content="nosnippet">
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <?php foreach ($meta as $meta_res){?>
      <title><?php if (!empty($meta_res['meta_title'])) { echo $meta_res['meta_title'];} ?></title>
      <meta name="description" content="<?php if (!empty($meta_res['meta_desc'])) {echo $meta_res['meta_desc'];} ?>" />
      <meta property=”og:title” content="<?php if (!empty($meta_res['meta_title'])) { echo $meta_res['meta_title'];} ?>"/>
      <meta property=”og:url” content="<?php echo base_url().uri_string();?>"/>
      <meta property=”og:site_name” content="www.imperialpedia.com/web-story"/>
      <meta property=”og:image” content="<?php echo base_url() . 'assets/img/favicon.png'; ?>"/>
      <meta property=”og:type” content="article"/>
      <meta property=”og:description” content="<?php if (!empty($meta_res['meta_desc'])) {echo $meta_res['meta_desc'];} ?>"/>
      <link rel="alternate" type="application/rss+xml" href="https://www.imperialpedia.com/rssfeed">
      <?php }?>
      <link rel="icon" type="image/x-icon" href="<?php echo base_url() . 'assets/img/favicon.png'; ?>"> 
      <!-- Bootstrap CSS --> 
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
      <link href="//fonts.googleapis.com/css?family=Google+Sans:400,500|Roboto:400,400italic,500,500italic,700,700italic|Roboto+Mono:400,500,700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="<?php echo base_url() . 'assets/css/header-footer.css'; ?>">  
      <!-- navbar  -->
      <style>.cust-navbar{background-color:#070d1f;position:sticky;top:0;z-index:999}.lod-bg{background:#323a56}.sub-head-til{font-size:.75rem;margin-bottom:.5rem;letter-spacing:.03rem;text-transform:uppercase;color:#c5dcff}.list-unstyled li a{display:inline-block;width:100%;text-decoration:none;color:#fff;font-size:.875rem}@media(min-width:65em){.list-unstyled li a{line-height:1.5rem;letter-spacing:.1rem;border-bottom:0}}@media(min-width:40em){html:not(.layoutUpdates) .sub-head-til{font-size:1.4rem}}@media(min-width:40em){html:not(.layoutUpdates) .header-nav__link{font-size:1.25rem;line-height:2.5rem}}.navbar .megamenu{padding:1rem} @media all and (min-width:992px){.navbar .has-megamenu{position:static!important}.navbar .megamenu{left:0;right:0;width:100%;margin-top:0}}@media(max-width:991px){.navbar.fixed-top .navbar-collapse,.navbar.sticky-top .navbar-collapse{overflow-y:auto;max-height:90vh;margin-top:10px}.de-sm-none{display:none}.log-btn{width: 100%;}}@media (min-width: 992px){.navbar-expand-lg .navbar-collapse{justify-content: space-around;}}.log-btn{color: #fff;background:#05e5b59c;padding: 0.375rem 1.75rem;}</style>
      <style>@media only screen and (max-width: 767px){.sm-flex-dir-rev{flex-direction: column-reverse;}}.btn-primary{border: none;}</style>
      <!-- for all page  -->
      <style>@media only screen and (max-width: 767px){.mob-w-auto{width: auto!important;}.mob-w-auto .table-para{padding: 0.3em 0.68em;}}
   body{font-family: Google Sans,Arial,sans-serif;color:#202124;font-size:16/24px;font-weight:400;}@media (max-width: 576px){.d-small-none{display:none;}}.bg-gool{background:#f1f3f4}
   </style>

   <!-- addsense  -->
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8170643011469769"
     crossorigin="anonymous"></script>
   </head>
   <body>  
      <nav class="navbar navbar-expand-lg navbar-dark cust-navbar">
         <div class="container-fluid">
            <a class="navbar-brand" href="<?php echo base_url() ?>">
            <img src="<?php echo base_url() ?>assets/img/brand-logo.png" alt="brand logo" class="img-fluid" width="auto" height="100">
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#main_nav">
            <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="main_nav">
               <ul class="navbar-nav">
                  <?php  foreach($cat_list as $cat_res){  ?>
                  <li class="nav-item dropdown has-megamenu">
                     <a class="nav-link dropdown-toggle" href="javaScript:void(0);" data-bs-toggle="dropdown"> <?php echo ucfirst($cat_res['cat_name']);?> </a>
                     <div class="dropdown-menu megamenu lod-bg" role="menu" style="border-radius: 0px">
                        <div class="row g-3">
                           <?php  foreach($subcat_list as $subcat_res){ 
                              if($subcat_res['cat_id'] ==$cat_res['cat_id']){
                              
                              ?>
                           <div class="col-lg-3 col-6">
                              <div class="col-megamenu">
                                 <!-- <span class="sub-head-til">SEO Phase 1</span> -->
                                 <ul class="list-unstyled">
                                    <li><a href="<?php echo base_url(); ?><?php echo str_replace(' ','-',$cat_res['cat_name']).'/'. str_replace(' ','-',$subcat_res['sub_cat_name'])?>"><?php echo ucfirst($subcat_res['sub_cat_name']);?></a></li>
                                 </ul>
                              </div>
                           </div>
                           <?php }} ?>
                        </div>
                     </div>
                  </li>
                  <?php } ?>
               </ul>
			  <a href="<?php if(isset($this->session->userid)){ echo base_url().'logout'; }else{echo base_url().'login';} ?>" class="btn log-btn"><?php if(isset($this->session->userid)){ echo 'logout'; }else{echo 'login';} ?></a>
            </div>
         </div>
      </nav> 