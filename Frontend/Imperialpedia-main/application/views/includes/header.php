<!DOCTYPE html>
<html lang="en">
   <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <?php
         $meta_title = 'Imperialpedia Editorial & Tech Archive';
         $meta_desc = 'Imperialpedia Editorial, Technology, Software, and Financial News Archive.';
         $meta_image = base_url() . 'assets/img/og-image.png';
         $pub_date = date('c');
         $mod_date = date('c');

         if(!empty($meta)){
            foreach($meta as $meta_res){
               if(!empty($meta_res['meta_title'])){ $meta_title = $meta_res['meta_title']; }
               if(!empty($meta_res['meta_desc'])){ $meta_desc = $meta_res['meta_desc']; }
            }
         }

         $page_uri = uri_string();
         if($meta_title === 'Imperialpedia Editorial & Tech Archive' && $page_uri !== ''){
            $label = ucwords(str_replace(array('-', '_'), ' ', basename($page_uri)));
            $meta_title = $label . ' - Imperialpedia';
            $meta_desc = $label . ' on Imperialpedia: independent guides and analysis on marketing, SEO, insurance and technology.';
         }

         if(!empty($post_details) && is_array($post_details)){
            $pd = $post_details[0];
            if(!empty($pd['post_title'])){
               $meta_title = ucfirst($pd['post_title']);
               if(mb_strlen($meta_title) <= 45){ $meta_title .= ' - Imperialpedia'; }
            }
            if(!empty($pd['meta_desc'])){ $meta_desc = $pd['meta_desc']; }
            else if(!empty($pd['post_desc'])){ $meta_desc = seo_excerpt($pd['post_desc'], 155); }
            if(!empty($pd['post_img'])){ $meta_image = base_url() . 'uploads/post/' . $pd['post_img']; }
            if(!empty($pd['posted_date'])){ $pub_date = date('c', strtotime($pd['posted_date'])); }
            if(!empty($pd['post_updated'])){ $mod_date = date('c', strtotime($pd['post_updated'])); }
         }
      ?>
      <title><?php echo htmlspecialchars($meta_title); ?></title>
      <meta name="description" content="<?php echo htmlspecialchars($meta_desc); ?>" />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <link rel="canonical" href="<?php echo rtrim(base_url().uri_string(), '/'); ?>"/>
      <meta property="og:title" content="<?php echo htmlspecialchars($meta_title); ?>"/>
      <meta property="og:url" content="<?php echo base_url().uri_string();?>"/>
      <meta property="og:site_name" content="Imperialpedia"/>
      <meta property="og:image" content="<?php echo $meta_image; ?>"/>
      <meta property="og:image:width" content="1200"/>
      <meta property="og:image:height" content="630"/>
      <meta name="twitter:card" content="summary_large_image"/>
      <meta name="twitter:title" content="<?php echo htmlspecialchars($meta_title); ?>"/>
      <meta name="twitter:description" content="<?php echo htmlspecialchars($meta_desc); ?>"/>
      <meta name="twitter:image" content="<?php echo $meta_image; ?>"/>
      <meta property="og:type" content="article"/>
      <meta property="og:description" content="<?php echo htmlspecialchars($meta_desc); ?>"/>
      <meta property="article:published_time" content="<?php echo $pub_date; ?>"/>
      <meta property="article:modified_time" content="<?php echo $mod_date; ?>"/>
      <link rel="icon" type="image/x-icon" href="<?php echo base_url() . 'assets/img/favicon.png'; ?>">

      <!-- Google News & Discover Schema.org JSON-LD Structured Data -->
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": "<?php echo base_url().uri_string(); ?>"
        },
        "headline": <?php echo json_encode($meta_title); ?>,
        "image": [
          <?php echo json_encode($meta_image); ?>
        ],
        "datePublished": "<?php echo $pub_date; ?>",
        "dateModified": "<?php echo $mod_date; ?>",
        "author": {
          "@type": "Organization",
          "name": "Imperialpedia Editorial Desk",
          "url": "<?php echo base_url(); ?>"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Imperialpedia",
          "logo": {
            "@type": "ImageObject",
            "url": "<?php echo base_url() . 'assets/img/brand-logo.png'; ?>"
          }
        },
        "description": <?php echo json_encode($meta_desc); ?>
      }
      </script>
      <?php echo render_website_schema('Imperialpedia', base_url()); ?>
      <?php echo render_organization_schema('Imperialpedia', base_url()); ?>
      <!-- Resource Hints & Critical Performance Preloading -->
      <link rel="dns-prefetch" href="//fonts.googleapis.com">
      <link rel="dns-prefetch" href="//fonts.gstatic.com">
      <link rel="dns-prefetch" href="//cdn.jsdelivr.net">
      <link rel="dns-prefetch" href="//cdnjs.cloudflare.com">
      <link rel="preload" href="<?php echo base_url(); ?>assets/vendor/fa/webfonts/fa-solid-900.woff2" as="font" type="font/woff2" crossorigin>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Oswald:wght@500;600;700&family=Plus+Jakarta+Sans:ital,wght@0,500;0,600;0,700;0,800;1,700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
      <!-- Bootstrap CSS --> 
      <link href="<?php echo base_url(); ?>assets/vendor/bootstrap/bootstrap.min.css" rel="stylesheet">
      <link rel="stylesheet" href="<?php echo base_url(); ?>assets/vendor/fa/css/all.min.css" media="print" onload="this.media='all'">
      <link rel="stylesheet" href="<?php echo base_url() . 'assets/css/header-footer.css'; ?>">  

      <style>
         :root {
            --p6-red: #d00000;
            --p6-dark: #0f172a;
            --p6-ticker-bg: #1e293b;
            --p6-font-headline: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
            --p6-font-body: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            --p6-font-accent: 'Plus Jakarta Sans', 'Inter', sans-serif;
         }

         body {
            font-family: var(--p6-font-body) !important;
            color: #1e293b;
         }

         h1, h2, h3, h4, h5, h6, .p6-main-title, .p6-detail-title, .p6-article-title {
            font-family: var(--p6-font-headline) !important;
         }

         /* Top Utility & Ticker Bar */
         .p6-top-utility-bar {
            background: #090d16;
            color: #94a3b8;
            font-size: 0.78rem;
            padding: 6px 0;
            border-bottom: 1px solid #1e293b;
            font-family: 'Roboto', sans-serif;
         }
         .p6-live-badge {
            background: var(--p6-red);
            color: #ffffff;
            font-family: 'Oswald', sans-serif;
            font-weight: 700;
            padding: 2px 8px;
            font-size: 0.7rem;
            letter-spacing: 1px;
            text-transform: uppercase;
            border-radius: 2px;
            animation: pulse 1.5s infinite;
         }
         @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
         }
         .p6-ticker-text {
            color: #cbd5e1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
         }

         /* Main Brand Masthead Header */
         .p6-masthead {
            background: #ffffff;
            border-bottom: 3px solid #000000;
            padding: 16px 0;
         }
         .p6-brand-logo {
            font-family: 'Oswald', sans-serif;
            font-size: 2.5rem;
            font-weight: 700;
            letter-spacing: -0.5px;
            color: #0f172a;
            text-decoration: none;
            text-transform: uppercase;
            line-height: 1;
         }
         .p6-brand-logo span {
            color: var(--p6-red);
         }
         .p6-edition-tag {
            font-size: 0.7rem;
            font-weight: 700;
            background: #f1f5f9;
            color: #475569;
            padding: 3px 8px;
            border-radius: 4px;
            letter-spacing: 1px;
            vertical-align: middle;
            margin-left: 8px;
         }

         /* Custom Navbar Styling */
         .cust-navbar {
            background-color: #070d1f;
            position: sticky;
            top: 0;
            z-index: 999;
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
         }
         .lod-bg {
            background: #111827;
            border: 1px solid #1f2937;
         }
         .sub-head-til {
            font-size: .75rem;
            margin-bottom: .5rem;
            letter-spacing: .03rem;
            text-transform: uppercase;
            color: #c5dcff;
         }
         .list-unstyled li a {
            display: inline-block;
            width: 100%;
            text-decoration: none;
            color: #e2e8f0;
            font-size: .875rem;
            padding: 4px 0;
            transition: color 0.2s ease;
         }
         .list-unstyled li a:hover {
            color: #00cdac;
         }
         .navbar .megamenu {
            padding: 1.5rem;
         }
         @media all and (min-width:992px){
            .navbar .has-megamenu { position:static!important; }
            .navbar .megamenu { left:0; right:0; width:100%; margin-top:0; }
         }
         @media(max-width:991px){
            .navbar.fixed-top .navbar-collapse, .navbar.sticky-top .navbar-collapse {
               overflow-y:auto;
               max-height:90vh;
               margin-top:10px;
            }
            .de-sm-none { display:none; }
            .log-btn { width: 100%; }
         }
         @media (min-width: 992px){
            .navbar-expand-lg .navbar-collapse { justify-content: space-between; }
         }
         .log-btn {
            color: #fff;
            background: var(--p6-red);
            font-family: 'Oswald', sans-serif;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            padding: 0.4rem 1.4rem;
            border-radius: 4px;
            transition: all 0.2s ease;
         }
         .log-btn:hover {
            background: #b00000;
            color: #fff;
         }
         .p6-search-trigger {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: #cbd5e1;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s ease;
         }
         .p6-search-trigger:hover {
            background: rgba(255,255,255,0.2);
            color: #ffffff;
         }

         /* Ultra-Clean Lightweight Editorial Layout (Page Six / NY Post Style) */
         html, body { max-width: 100%; overflow-x: hidden; background-color: #ffffff !important; }
         img, video, iframe, svg { max-width: 100%; height: auto; }
         .table { display: block; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
         pre, code { white-space: pre-wrap; word-break: break-word; }

         /* Sticky Mobile Social Action Bar */
         .p6-mobile-share-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 54px;
            background: #0f172a;
            z-index: 9999;
            border-top: 2px solid var(--p6-red);
            box-shadow: 0 -4px 16px rgba(0,0,0,0.15);
         }
         .p6-mob-share-btn {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: #ffffff !important;
            font-size: 1.05rem;
            text-decoration: none;
            border: none;
            cursor: pointer;
            transition: transform 0.2s ease, background-color 0.2s ease;
         }
         .p6-mob-share-btn:active { transform: scale(0.9); }
         .p6-mob-twitter { background: #000000; border: 1px solid #334155; }
         .p6-mob-facebook { background: #1877f2; }
         .p6-mob-whatsapp { background: #25d366; }
         .p6-mob-copy { background: #e11d48; }

         /* Master Editorial Typography & Article Design System (Page Six / NY Post) */
         .p6-detail-header {
            background: #ffffff !important;
            border-bottom: 1px solid #e2e8f0 !important;
            padding: 24px 0 20px 0 !important;
            margin-bottom: 24px !important;
         }
         .p6-detail-title, h1.p6-detail-title {
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
            font-weight: 800 !important;
            font-size: 2.75rem !important;
            line-height: 1.18 !important;
            letter-spacing: -0.03em !important;
            color: #0f172a !important;
            margin-bottom: 16px !important;
         }
         .p6-article-body {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            font-size: 1.125rem !important;
            line-height: 1.85 !important;
            color: #1e293b !important;
         }
         /* Universal Override: Strip all artificial red left-border lines from article elements */
         .p6-article-body *, .lead-intro, .p6-article-body .lead-intro {
            border-left: none !important;
         }
         .p6-article-body .lead-intro, .lead-intro {
            padding-left: 0 !important;
            font-size: 1.15rem !important;
            font-weight: 500 !important;
            color: #1e293b !important;
            margin-bottom: 24px !important;
         }

         .p6-article-body h2 {
            font-family: 'Plus Jakarta Sans', sans-serif !important;
            font-weight: 800 !important;
            font-size: 1.85rem !important;
            line-height: 1.25 !important;
            letter-spacing: -0.025em !important;
            color: #0f172a !important;
            margin-top: 38px !important;
            margin-bottom: 18px !important;
            border-left: none !important;
            padding-left: 0 !important;
         }
         .p6-article-body h3 {
            font-family: 'Plus Jakarta Sans', sans-serif !important;
            font-weight: 700 !important;
            font-size: 1.4rem !important;
            line-height: 1.3 !important;
            letter-spacing: -0.015em !important;
            color: #1e293b !important;
            margin-top: 32px !important;
            margin-bottom: 14px !important;
            border-left: none !important;
            padding-left: 0 !important;
         }
         .p6-article-body h4 {
            font-family: 'Plus Jakarta Sans', sans-serif !important;
            font-weight: 700 !important;
            font-size: 1.15rem !important;
            line-height: 1.35 !important;
            color: #334155 !important;
            margin-top: 24px !important;
            margin-bottom: 12px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
         }
         .p6-article-body p, .p6-article-body div {
            font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif !important;
            font-size: 1.125rem !important;
            line-height: 1.85 !important;
            color: #1e293b !important;
            margin-bottom: 22px !important;
            border-left: none !important;
         }
         .p6-article-body blockquote {
            font-family: 'Merriweather', Georgia, serif !important;
            font-style: italic !important;
            font-size: 1.2rem !important;
            line-height: 1.75 !important;
            background: #fafafa !important;
            border-top: 2px solid #0f172a !important;
            border-bottom: 2px solid #0f172a !important;
            border-left: none !important;
            border-right: none !important;
            padding: 20px 24px !important;
            margin: 32px 0 !important;
            border-radius: 0 !important;
            color: #1f2937 !important;
         }
         .p6-article-body ul, .p6-article-body ol {
            font-size: 1.1rem !important;
            line-height: 1.8 !important;
            color: #1e293b !important;
            margin-bottom: 24px !important;
            padding-left: 1.5rem !important;
            border-left: none !important;
         }
         .p6-article-body li {
            margin-bottom: 8px !important;
         }
         .p6-article-body a {
            color: var(--p6-red) !important;
            font-weight: 600 !important;
            text-decoration: underline !important;
            text-decoration-thickness: 1.5px !important;
            text-underline-offset: 3px !important;
            transition: color 0.2s ease, text-decoration-color 0.2s ease !important;
         }
         .p6-article-body a:hover {
            color: #b00000 !important;
            text-decoration-color: #b00000 !important;
         }

         /* Clean Responsive Editorial Tables */
         table, .table, .p6-article-body table {
            width: 100% !important;
            margin: 28px 0 !important;
            border-collapse: collapse !important;
            border-spacing: 0 !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            border: 1px solid #e2e8f0 !important;
            display: table !important;
         }
         table th, .table th, .p6-article-body table th {
            background: #f8fafc !important;
            color: #0f172a !important;
            font-family: 'Plus Jakarta Sans', sans-serif !important;
            font-weight: 700 !important;
            font-size: 0.95rem !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
            padding: 14px 16px !important;
            text-align: left !important;
            border-bottom: 2px solid #cbd5e1 !important;
         }
         table td, .table td, .p6-article-body table td {
            padding: 14px 16px !important;
            border-bottom: 1px solid #f1f5f9 !important;
            color: #334155 !important;
            font-size: 1rem !important;
         }
         table tr:nth-child(even) td, .table tr:nth-child(even) td, .p6-article-body table tr:nth-child(even) td {
            background: #fdfdfd !important;
         }
         /* Featured Hero Image & Captions */
         .p6-featured-img-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            background: transparent !important;
            margin-bottom: 24px !important;
            border-radius: 10px !important;
            overflow: hidden !important;
         }
         .p6-img-caption {
            font-size: 0.8rem !important;
            color: #64748b !important;
            margin-top: 8px !important;
            font-style: italic !important;
            display: block !important;
         }

         /* Signature Page Six & NY Post Inline Recommendation ("SEE ALSO") */
         .p6-see-also-box {
            border-top: 2px solid #0f172a !important;
            border-bottom: 1px solid #e2e8f0 !important;
            padding: 14px 16px !important;
            margin: 32px 0 !important;
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
            background: #f8fafc !important;
            border-radius: 4px !important;
         }
         .p6-see-also-label {
            color: var(--p6-red) !important;
            font-weight: 800 !important;
            font-size: 0.82rem !important;
            letter-spacing: 1.5px !important;
            text-transform: uppercase !important;
            white-space: nowrap !important;
         }
         .p6-see-also-link {
            font-weight: 700 !important;
            color: #0f172a !important;
            text-decoration: none !important;
            font-size: 1.05rem !important;
            line-height: 1.3 !important;
         }
         .p6-see-also-link:hover {
            color: var(--p6-red) !important;
            text-decoration: underline !important;
         }
         .p6-widget-box {
            background: #ffffff !important;
            border: 1px solid #f1f5f9 !important;
            box-shadow: 0 2px 10px rgba(0,0,0,0.02) !important;
            border-radius: 10px !important;
         }

         @media (max-width: 767px) {
            body { padding-bottom: 60px; }
            .btn { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
            .btn-sm { min-height: 40px; }
            .p6-brand-logo { font-size: 1.5rem; }
            h1 { font-size: 1.65rem; line-height: 1.25; }
            h2 { font-size: 1.35rem; }
            .container, .container-fluid { padding-left: 16px !important; padding-right: 16px !important; }
            .p6-detail-title, .p6-article-title { font-size: 1.65rem !important; line-height: 1.25 !important; letter-spacing: -0.015em !important; margin-bottom: 12px !important; }
            .p6-article-body { font-size: 1.05rem !important; line-height: 1.8 !important; }
            .p6-article-body p { margin-bottom: 18px; }
            .p6-article-body p, .p6-article-body ul, .p6-article-body ol, .p6-article-body div { margin-left: 0 !important; padding-left: 0; border-left: 0; }
            .p6-article-body ul, .p6-article-body ol { padding-left: 1.25rem; }
            .p6-article-body h2 { font-size: 1.35rem !important; padding-left: 10px; margin-top: 26px; }
            .p6-article-body h3 { font-size: 1.18rem; }
            .p6-article-body blockquote { padding: 14px 16px !important; margin: 20px 0 !important; font-size: 1.05rem !important; }
            .p6-featured-img-container { padding: 0 !important; border-radius: 8px !important; }
            .p6-featured-img-container img { border-radius: 8px; width: 100%; }
         }
      </style>

      <!-- Adsense -->
      <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8170643011469769" crossorigin="anonymous"></script>
   </head>
   <body>
      <!-- Main Masthead -->
      <div class="p6-masthead">
         <div class="container-fluid px-lg-5">
            <div class="row align-items-center">
               <div class="col-md-4 col-6">
                  <a href="<?php echo base_url(); ?>" class="p6-brand-logo">
                     IMPERIAL<span>PEDIA</span>
                     
                  </a>
               </div>
               <div class="col-md-8 col-6 text-end">
                  <div class="d-inline-flex align-items-center gap-3">
                     <a href="<?php echo base_url(); ?>seo/web-seo/high-traffic-low-competition-website-niches" class="btn btn-outline-danger btn-sm fw-bold d-none d-lg-inline-block" style="font-family:'Oswald',sans-serif; letter-spacing:0.5px;">
                        <i class="fa-solid fa-fire me-1"></i> HOT MASTERCLASS
                     </a>
                     <a href="<?php if(isset($this->session->userid)){ echo base_url().'logout'; }else{echo base_url().'login';} ?>" class="btn log-btn">
                        <?php if(isset($this->session->userid)){ echo '<i class="fa-solid fa-right-from-bracket me-1"></i> Logout'; }else{echo '<i class="fa-solid fa-user me-1"></i> Login';} ?>
                     </a>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <!-- Navigation Bar -->
      <nav class="navbar navbar-expand-lg navbar-dark cust-navbar">
         <div class="container-fluid px-lg-5">
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#main_nav" aria-controls="main_nav" aria-expanded="false" aria-label="Toggle navigation">
               <span class="navbar-toggler-icon"></span> <span class="text-white small fw-bold ms-1 align-middle">MENU</span>
            </button>
            
            <div class="collapse navbar-collapse" id="main_nav">
               <ul class="navbar-nav me-auto">
                  <li class="nav-item me-2">
                     <a class="nav-link fw-bold text-uppercase text-warning" href="<?php echo base_url(); ?>"><i class="fa-solid fa-house me-1"></i> Home</a>
                  </li>
                  <?php if(!empty($cat_list)){ foreach($cat_list as $cat_res){ ?>
                  <li class="nav-item dropdown has-megamenu me-1">
                     <a class="nav-link dropdown-toggle text-uppercase font-monospace fw-bold" href="javaScript:void(0);" data-bs-toggle="dropdown">
                        <?php echo ucfirst($cat_res['cat_name']);?>
                     </a>
                     <div class="dropdown-menu megamenu lod-bg shadow-lg" role="menu" style="border-radius: 0px">
                        <div class="row g-3">
                           <?php if(!empty($subcat_list)){ foreach($subcat_list as $subcat_res){ 
                              if($subcat_res['cat_id'] == $cat_res['cat_id']){
                           ?>
                           <div class="col-lg-3 col-6">
                              <div class="col-megamenu">
                                 <ul class="list-unstyled">
                                    <li>
                                       <a href="<?php echo base_url(); ?><?php echo str_replace(' ','-',$cat_res['cat_name']).'/'. str_replace(' ','-',$subcat_res['sub_cat_name'])?>">
                                          <i class="fa-solid fa-angle-right me-1 text-danger"></i> <?php echo ucfirst($subcat_res['sub_cat_name']);?>
                                       </a>
                                    </li>
                                 </ul>
                              </div>
                           </div>
                           <?php }}} ?>
                        </div>
                     </div>
                  </li>
                  <?php }} ?>
               </ul>

               <!-- Global Quick Search Trigger & Modal -->
               <div class="d-flex align-items-center">
                  <button type="button" class="p6-search-trigger me-2 border-0" data-bs-toggle="modal" data-bs-target="#p6SearchModal" aria-label="Search articles">
                     <i class="fa-solid fa-magnifying-glass me-1"></i> Search Articles &amp; Archives...
                  </button>
               </div>
            </div>
         </div>
      </nav> 

<!-- GLOBAL SEARCH MODAL -->
<div class="modal fade" id="p6SearchModal" tabindex="-1" aria-labelledby="p6SearchModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content border-0 shadow-lg" style="border-radius: 12px; overflow: hidden;">
      <div class="modal-header bg-dark text-white border-0 py-3">
        <h5 class="modal-title font-monospace fw-bold text-uppercase" id="p6SearchModalLabel"><i class="fa-solid fa-bolt text-danger me-2"></i> Search Imperialpedia</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body p-4 bg-light">
        <form action="<?php echo base_url(); ?>search" method="GET" id="p6HeaderSearchForm">
           <div class="position-relative mb-3">
              <i class="fa-solid fa-magnifying-glass position-absolute start-0 top-50 translate-middle-y ms-3 text-danger fs-5"></i>
              <input type="text" name="q" id="p6ModalSearchInput" class="form-control form-control-lg ps-5 rounded-pill border-2 border-dark" placeholder="Type keyword (e.g. Health Insurance, Core Update, SEO)..." autocomplete="off" required>
           </div>
        </form>
        <div id="p6LiveSearchResults" class="list-group shadow-sm mt-2" style="display:none; max-height: 360px; overflow-y: auto;">
        </div>
      </div>
    </div>
  </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function(){
   const searchInput = document.getElementById('p6ModalSearchInput');
   const searchResults = document.getElementById('p6LiveSearchResults');

   if(searchInput && searchResults){
      let timer = null;
      searchInput.addEventListener('input', function(){
         clearTimeout(timer);
         const q = this.value.trim();
         if(q.length < 2){
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
            return;
         }
         timer = setTimeout(() => {
            fetch('<?php echo base_url(); ?>SearchCtrl/api?q=' + encodeURIComponent(q))
               .then(res => res.json())
               .then(data => {
                  if(data.status === 'ok' && data.results.length > 0){
                     let html = '';
                     data.results.forEach(item => {
                        html += `<a href="${item.url}" class="list-group-item list-group-item-action d-flex align-items-center gap-3 p-3">
                           <img src="${item.img}" alt="" loading="lazy" style="width:50px; height:40px; object-fit:cover; border-radius:4px;">
                           <div>
                              <span class="badge bg-danger text-uppercase mb-1" style="font-size:0.65rem;">${item.subcat}</span>
                              <div class="fw-bold text-dark text-truncate mb-0" style="max-width:450px;">${item.title}</div>
                           </div>
                        </a>`;
                     });
                     searchResults.innerHTML = html;
                     searchResults.style.display = 'block';
                  } else {
                     searchResults.innerHTML = '<div class="list-group-item text-muted text-center py-3">No instant matches. Press Enter to perform full archive search.</div>';
                     searchResults.style.display = 'block';
                  }
               }).catch(err => console.error(err));
         }, 250);
      });
   }
});
</script>

<!-- Sticky Mobile Social Action Bar (Page Six & NY Post Engagement System) -->
<div class="p6-mobile-share-bar d-md-none">
   <div class="d-flex justify-content-around align-items-center h-100 px-3">
      <a href="https://twitter.com/intent/tweet?text=<?php echo urlencode($meta_title); ?>&url=<?php echo urlencode(base_url().uri_string()); ?>" target="_blank" class="p6-mob-share-btn p6-mob-twitter" title="Share on Twitter/X" aria-label="Share on Twitter/X">
         <i class="fa-brands fa-x-twitter"></i>
      </a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=<?php echo urlencode(base_url().uri_string()); ?>" target="_blank" class="p6-mob-share-btn p6-mob-facebook" title="Share on Facebook" aria-label="Share on Facebook">
         <i class="fa-brands fa-facebook-f"></i>
      </a>
      <a href="https://api.whatsapp.com/send?text=<?php echo urlencode($meta_title . ' ' . base_url().uri_string()); ?>" target="_blank" class="p6-mob-share-btn p6-mob-whatsapp" title="Share on WhatsApp" aria-label="Share on WhatsApp">
         <i class="fa-brands fa-whatsapp"></i>
      </a>
      <button type="button" onclick="if(navigator.share){navigator.share({title:document.title,url:window.location.href}).catch(()=>{});}else{navigator.clipboard.writeText(window.location.href);alert('Link copied to clipboard!');}" class="p6-mob-share-btn p6-mob-copy" title="Share Article" aria-label="Share Article">
         <i class="fa-solid fa-share-nodes"></i>
      </button>
   </div>
</div> 