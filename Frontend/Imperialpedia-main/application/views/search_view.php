<!-- Page Six & NY Post Design System — Search Results View -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">

<style>
:root {
   --p6-red: #d00000;
   --p6-red-hover: #b00000;
   --p6-dark: #111111;
   --p6-gray-bg: #f8f9fa;
   --p6-card-border: #e2e8f0;
   --p6-font-headline: 'Google Sans', 'Roboto', Arial, sans-serif;
   --p6-font-body: 'Google Sans', 'Roboto', Arial, sans-serif;
   --p6-font-accent: 'Oswald', 'Google Sans', sans-serif;
}

body {
   background-color: #f7f7f9;
   font-family: var(--p6-font-body);
   color: #202124;
}

.p6-search-header {
   background: #ffffff;
   border-bottom: 2px solid var(--p6-dark);
   padding: 36px 0 28px 0;
   margin-bottom: 32px;
}

.p6-search-title {
   font-family: var(--p6-font-headline);
   font-weight: 700;
   font-size: 2.2rem;
   color: var(--p6-dark);
   margin-bottom: 12px;
}

.p6-search-box-wrap {
   max-width: 680px;
   position: relative;
}

.p6-search-input {
   font-size: 1.1rem;
   padding: 14px 20px 14px 50px;
   border-radius: 30px;
   border: 2px solid var(--p6-dark);
   box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}

.p6-search-input:focus {
   border-color: var(--p6-red);
   box-shadow: 0 4px 20px rgba(208,0,0,0.15);
}

.p6-search-icon-inside {
   position: absolute;
   left: 20px;
   top: 50%;
   transform: translateY(-50%);
   color: var(--p6-red);
   font-size: 1.2rem;
}

.p6-search-card {
   background: #ffffff;
   border: 1px solid var(--p6-card-border);
   border-radius: 8px;
   overflow: hidden;
   transition: transform 0.2s ease, box-shadow 0.2s ease;
   height: 100%;
   display: flex;
   flex-direction: column;
   text-decoration: none;
   color: inherit;
}

.p6-search-card:hover {
   transform: translateY(-4px);
   box-shadow: 0 8px 25px rgba(0,0,0,0.1);
   color: inherit;
}

.p6-search-img-wrap {
   height: 180px;
   overflow: hidden;
   position: relative;
   background: #000;
}

.p6-search-img {
   width: 100%;
   height: 100%;
   object-fit: cover;
   transition: transform 0.3s ease;
}

.p6-search-card:hover .p6-search-img {
   transform: scale(1.05);
}

.p6-search-body {
   padding: 20px;
   display: flex;
   flex-direction: column;
   flex-grow: 1;
}

.p6-search-badge {
   background: var(--p6-red);
   color: #fff;
   font-family: var(--p6-font-accent);
   font-size: 0.7rem;
   font-weight: 700;
   padding: 3px 8px;
   letter-spacing: 1px;
   text-transform: uppercase;
   border-radius: 2px;
   align-self: flex-start;
   margin-bottom: 10px;
}

.p6-search-card-title {
   font-family: var(--p6-font-headline);
   font-weight: 700;
   font-size: 1.2rem;
   line-height: 1.35;
   color: var(--p6-dark);
   margin-bottom: 10px;
}

.p6-search-desc {
   font-size: 0.88rem;
   color: #64748b;
   line-height: 1.5;
   margin-bottom: 16px;
   display: -webkit-box;
   -webkit-line-clamp: 3;
   -webkit-box-orient: vertical;
   overflow: hidden;
}

.p6-search-footer {
   margin-top: auto;
   padding-top: 12px;
   border-top: 1px solid #f1f5f9;
   display: flex;
   align-items: center;
   justify-content: space-between;
   font-size: 0.8rem;
   color: #94a3b8;
}

.p6-search-read-btn {
   color: var(--p6-red);
   font-weight: 700;
   font-family: var(--p6-font-accent);
   letter-spacing: 0.5px;
}
</style>

<!-- Search Header Section -->
<header class="p6-search-header">
   <div class="container-fluid px-lg-5">
      <div class="row align-items-center">
         <div class="col-lg-7">
            <h1 class="p6-search-title">
               <?php if(!empty($query)): ?>
                  Search Results for <span class="text-danger">"<?php echo htmlspecialchars($query); ?>"</span>
               <?php else: ?>
                  Search Articles &amp; Archives
               <?php endif; ?>
            </h1>
            <p class="text-muted mb-3">
               Explore Imperialpedia\'s full catalog of SEO, insurance, marketing, and technology detailed guides.
            </p>
         </div>
         <div class="col-lg-5">
            <form action="<?php echo base_url(); ?>search" method="GET">
               <div class="p6-search-box-wrap">
                  <i class="fa-solid fa-magnifying-glass p6-search-icon-inside"></i>
                  <input type="text" name="q" class="form-control p6-search-input" placeholder="Search keywords, topics or guides..." value="<?php echo htmlspecialchars($query); ?>" required>
                  <button type="submit" class="btn btn-danger position-absolute end-0 top-50 translate-middle-y me-2 rounded-pill px-4 fw-bold" style="font-family:'Oswald',sans-serif;">SEARCH</button>
               </div>
            </form>
         </div>
      </div>
   </div>
</header>

<!-- Search Results Grid Section -->
<section class="pb-5">
   <div class="container-fluid px-lg-5">
      
      <?php if(!empty($query)): ?>
         <div class="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
            <h4 class="fw-bold m-0 font-serif">Found <?php echo count($results); ?> Matching Articles</h4>
            <span class="badge bg-dark">SORTED BY RELEVANCE</span>
         </div>
      <?php endif; ?>

      <?php if(!empty($results)): ?>
         <div class="row g-4">
            <?php foreach($results as $res): 
               $cat = !empty($res['cat_name']) ? str_replace(' ', '-', $res['cat_name']) : 'seo';
               $subcat = !empty($res['sub_cat_name']) ? str_replace(' ', '-', $res['sub_cat_name']) : 'web-seo';
               $post_url = base_url() . strtolower($cat) . '/' . strtolower($subcat) . '/' . str_replace(' ', '-', $res['uri']);
               $img = !empty($res['post_img']) ? $res['post_img'] : 'post.png';
               $img_url = (strpos($img, 'http') === 0) ? $img : base_url() . 'uploads/post/' . $img;
               $clean_desc = strip_tags($res['post_desc']);
            ?>
            <div class="col-xl-4 col-lg-6">
               <a href="<?php echo $post_url; ?>" class="p6-search-card">
                  <div class="p6-search-img-wrap">
                     <img src="<?php echo $img_url; ?>" alt="<?php echo htmlspecialchars($res['post_title']); ?>" class="p6-search-img">
                  </div>
                  <div class="p6-search-body">
                     <span class="p6-search-badge"><?php echo strtoupper($res['sub_cat_name']); ?></span>
                     <h3 class="p6-search-card-title"><?php echo ucfirst($res['post_title']); ?></h3>
                     <p class="p6-search-desc"><?php echo substr($clean_desc, 0, 160) . '...'; ?></p>
                     <div class="p6-search-footer">
                        <span><i class="fa-regular fa-calendar-days me-1"></i> <?php echo date('M d, Y', strtotime($res['posted_date'])); ?></span>
                        <span class="p6-search-read-btn">Read Article &rarr;</span>
                     </div>
                  </div>
               </a>
            </div>
            <?php endforeach; ?>
         </div>
      <?php elseif(!empty($query)): ?>
         <div class="text-center py-5 my-4 bg-white rounded-3 border">
            <i class="fa-solid fa-file-circle-exclamation text-muted display-1 mb-3"></i>
            <h3 class="fw-bold">No articles found matching "<?php echo htmlspecialchars($query); ?>"</h3>
            <p class="text-muted">Try searching with broader terms like <strong>SEO</strong>, <strong>Insurance</strong>, <strong>Marketing</strong>, or <strong>Editor</strong>.</p>
            <a href="<?php echo base_url(); ?>seo/web-seo" class="btn btn-danger btn-lg px-4 mt-2 font-monospace fw-bold">Explore All Guides &rarr;</a>
         </div>
      <?php else: ?>
         <div class="text-center py-5 my-4 bg-white rounded-3 border">
            <i class="fa-solid fa-magnifying-glass text-muted display-1 mb-3"></i>
            <h3 class="fw-bold">Enter a keyword above to search our archive</h3>
            <p class="text-muted">Popular searches: <em>Health Insurance, March 2024 Core Update, Instagram SEO, Monopoly, CapCut</em></p>
         </div>
      <?php endif; ?>

   </div>
</section>
