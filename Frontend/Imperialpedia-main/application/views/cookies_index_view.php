<?php
/**
 * Imperialpedia — Cookies section landing page
 * URL: /cookies
 */
?>
<style>
.ckl-hero{background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:#fff;border-bottom:4px solid #d00000;padding:48px 0 38px;margin-bottom:35px}
.ckl-hero h1{font-weight:800;font-size:2.6rem;letter-spacing:-.025em;color:#fff;margin:0 0 10px}
.ckl-hero p{max-width:720px;margin:0;font-size:1.05rem;line-height:1.6;color:#cbd5e1}
.ckl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px;margin-bottom:48px}
.ckl-card{display:flex;flex-direction:column;gap:10px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:20px 20px 18px;text-decoration:none;color:#0f172a;transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease}
.ckl-card:hover{transform:translateY(-2px);border-color:#d00000;box-shadow:0 8px 22px rgba(0,0,0,.08);color:#0f172a}
.ckl-name{font-size:1.2rem;font-weight:800;line-height:1.25;margin:0}
.ckl-excerpt{font-size:.92rem;line-height:1.55;color:#475569;margin:0;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.ckl-foot{margin-top:auto;display:flex;justify-content:space-between;align-items:center;font-size:.8rem;font-weight:700;color:#64748b}
.ckl-foot .ckl-go{color:#d00000}
</style>

<div class="ckl-hero">
  <div class="container">
    <h1>Cookies</h1>
    <p>Guides to the streaming, design and writing services people ask about most. Pick a service to read its articles.</p>
  </div>
</div>

<div class="container">
  <div class="ckl-grid">
    <?php foreach($services as $svc){
      $slug = str_replace(' ', '-', $svc['sub_cat_name']);
      $n = (int)$svc['article_count'];
      $label = brand_name($svc['sub_cat_name']);
    ?>
      <a class="ckl-card" href="<?php echo base_url('cookies/' . $slug); ?>">
        <h2 class="ckl-name"><?php echo htmlspecialchars($label); ?></h2>
        <p class="ckl-excerpt"><?php echo htmlspecialchars(seo_excerpt($svc['sub_cat_desc'], 170)); ?></p>
        <div class="ckl-foot">
          <span><?php echo $n; ?> <?php echo $n === 1 ? 'article' : 'articles'; ?></span>
          <span class="ckl-go">View guides &rarr;</span>
        </div>
      </a>
    <?php } ?>
  </div>
</div>
