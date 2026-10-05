<?php
/**
 * Imperialpedia — section hub page (one sub-category and its articles).
 * Used for /{category}/{sub-category} on every section except cookies.
 */
if (!function_exists('hub_headings')) {
   // [id, text] for every <h2> in the guide, and the guide HTML with those ids added.
   function hub_headings($html) {
      $out = array();
      $new = preg_replace_callback('/<h2([^>]*)>(.*?)<\/h2>/is', function ($m) use (&$out) {
         $text = trim(strip_tags($m[2]));
         $id = 'sec-' . (count($out) + 1);
         $out[] = array($id, $text);
         return '<h2' . preg_replace('/\sid="[^"]*"/', '', $m[1]) . ' id="' . $id . '">' . $m[2] . '</h2>';
      }, (string)$html);
      return array($out, $new);
   }
}

$sc = !empty($get_subcat_info) ? $get_subcat_info[0] : null;
$posts = !empty($post) ? $post : array();
usort($posts, function ($a, $b) { return strtotime($b['posted_date']) - strtotime($a['posted_date']); });

$cat_slug = $this->uri->segment(1);
$labels = array(
   'insurance' => 'Insurance', 'internet' => 'Internet', 'marketing' => 'Marketing', 'news' => 'News',
   'attorney' => 'Legal', 'online-education' => 'Online Education', 'editor' => 'Editor', 'seo' => 'SEO',
);
$accents = array(
   'insurance' => '#15803d', 'internet' => '#0369a1', 'marketing' => '#6d28d9', 'news' => '#b45309',
   'attorney' => '#1d4ed8', 'online-education' => '#c2410c', 'editor' => '#be185d', 'seo' => '#047857',
);
$cat_label = isset($labels[$cat_slug]) ? $labels[$cat_slug] : ucwords(str_replace('-', ' ', $cat_slug));
$accent = isset($accents[$cat_slug]) ? $accents[$cat_slug] : '#0f172a';
$sub_name = $sc ? ucwords($sc['sub_cat_name']) : '';
$sub_slug = $sc ? str_replace(' ', '-', $sc['sub_cat_name']) : '';

$guide_html = $sc ? preg_replace(array('/<h1\b/i', '/<\/h1>/i'), array('<h2', '</h2>'), $sc['sub_cat_desc']) : '';   // the page's own h1 is the title above
list($toc, $guide_html) = hub_headings($guide_html);
// Short standfirst: the first paragraph of the guide.
$stand = '';
if (preg_match('/<p[^>]*>(.*?)<\/p>/is', $guide_html, $pm)) { $stand = seo_excerpt($pm[1], 230); }

$latest = !empty($posts) ? strtotime($posts[0]['post_updated'] ?: $posts[0]['posted_date']) : 0;
$count = count($posts);
?>
<style>
:root { --hub-accent: <?php echo $accent; ?>; }
.hub-head { background:#fff; padding:28px 0 22px; border-bottom:1px solid #e2e8f0; }
.hub-crumb { display:flex; align-items:center; flex-wrap:wrap; gap:8px; font-size:.78rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#64748b; margin-bottom:12px; }
.hub-crumb .hub-chip { background:var(--hub-accent); color:#fff; padding:5px 11px; border-radius:4px; letter-spacing:.1em; }
.hub-title { font-family:var(--p6-font-headline, 'Plus Jakarta Sans', system-ui, sans-serif); font-weight:800; font-size:2.6rem; line-height:1.15; letter-spacing:-.025em; color:#0f172a; margin:0 0 12px; }
.hub-stand { max-width:760px; font-size:1.08rem; line-height:1.65; color:#475569; margin:0 0 16px; }
.hub-stats { display:flex; flex-wrap:wrap; gap:8px 18px; font-size:.85rem; font-weight:600; color:#64748b; }
.hub-stats strong { color:#0f172a; }
.hub-tools { display:flex; flex-wrap:wrap; gap:12px; align-items:center; justify-content:space-between; margin:26px 0 18px; }
.hub-search { position:relative; flex:1 1 280px; max-width:420px; }
.hub-search i { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:.85rem; }
.hub-search input { width:100%; padding:11px 14px 11px 38px; border:1px solid #cbd5e1; border-radius:999px; font-size:.95rem; outline:0; background:#fff; }
.hub-search input:focus { border-color:var(--hub-accent); box-shadow:0 0 0 3px rgba(15,23,42,.06); }
.hub-pills { display:flex; flex-wrap:wrap; gap:8px; }
.hub-pill { padding:8px 14px; border:1px solid #e2e8f0; border-radius:999px; background:#fff; color:#334155; font-size:.82rem; font-weight:700; text-decoration:none; }
.hub-pill:hover { border-color:var(--hub-accent); color:var(--hub-accent); }
.hub-pill.is-on { background:var(--hub-accent); border-color:var(--hub-accent); color:#fff; }
.hub-grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:22px; margin-bottom:46px; }
.hub-card { display:flex; flex-direction:column; background:#fff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden; text-decoration:none; color:#0f172a; box-shadow:0 1px 2px rgba(15,23,42,.04); transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
.hub-card:hover { transform:translateY(-4px); border-color:#cbd5e1; box-shadow:0 16px 34px rgba(15,23,42,.11); color:#0f172a; }
.hub-thumb { display:block; aspect-ratio:16/9; background:#e2e8f0; overflow:hidden; }
.hub-thumb img { width:100%; height:100%; object-fit:cover; display:block; margin:0; transition:transform .4s ease; }
.hub-card:hover .hub-thumb img { transform:scale(1.04); }
.hub-body { display:flex; flex-direction:column; gap:9px; padding:16px 18px 18px; flex:1; }
.hub-tag { align-self:flex-start; font-size:.66rem; font-weight:800; letter-spacing:.09em; text-transform:uppercase; color:var(--hub-accent); background:#f1f5f9; border-radius:999px; padding:4px 10px; }
.hub-card h2 { font-size:1.08rem; line-height:1.38; font-weight:800; margin:0; color:#0f172a; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
.hub-ex { font-size:.9rem; line-height:1.55; color:#64748b; margin:0; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
.hub-meta { margin-top:auto; padding-top:8px; display:flex; flex-wrap:wrap; gap:4px 12px; font-size:.78rem; font-weight:600; color:#64748b; }
.hub-card.is-lead { grid-column:span 3; flex-direction:row; }
.hub-card.is-lead .hub-thumb { flex:0 0 52%; aspect-ratio:auto; min-height:300px; }
.hub-card.is-lead .hub-body { padding:30px 34px; justify-content:center; gap:12px; }
.hub-card.is-lead h2 { font-size:1.75rem; line-height:1.28; -webkit-line-clamp:4; }
.hub-card.is-lead .hub-ex { font-size:1rem; -webkit-line-clamp:4; }
.hub-empty { padding:34px; text-align:center; color:#64748b; border:1px dashed #cbd5e1; border-radius:14px; margin-bottom:40px; }
.hub-guide-wrap { display:grid; grid-template-columns:260px minmax(0, 1fr); gap:30px; align-items:start; margin-bottom:56px; }
.hub-guide-wrap.is-solo { grid-template-columns:minmax(0, 860px); }
.hub-toc { position:sticky; top:16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:18px; }
.hub-toc h3 { font-size:.78rem; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:#475569; margin:0 0 10px; }
.hub-toc a { display:block; padding:8px 10px; border-radius:8px; color:#334155; font-size:.9rem; line-height:1.4; text-decoration:none; font-weight:600; }
.hub-toc a:hover { background:#fff; color:var(--hub-accent); }
.hub-guide { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:34px 38px; font-size:1.05rem; line-height:1.85; color:#2c3e50; }
.hub-guide h1 { display:none; }
.hub-guide h2 { font-size:1.5rem; font-weight:800; color:#0f172a; margin:2rem 0 .8rem; padding-left:14px; border-left:4px solid var(--hub-accent); line-height:1.3; }
.hub-guide h2:first-of-type { margin-top:0; }
.hub-guide h3 { font-size:1.2rem; font-weight:800; color:#0f172a; margin:1.6rem 0 .6rem; }
.hub-section-title { font-size:1.35rem; font-weight:800; color:#0f172a; margin:0 0 16px; }
@media (max-width: 991.98px) {
   .hub-grid { grid-template-columns:repeat(2, minmax(0, 1fr)); }
   .hub-card.is-lead { grid-column:span 2; }
   .hub-card.is-lead .hub-thumb { flex-basis:46%; min-height:240px; }
   .hub-guide-wrap { grid-template-columns:1fr; }
   .hub-toc { position:static; }
}
@media (max-width: 767.98px) {
   .hub-head { padding:20px 0 18px; }
   .hub-title { font-size:1.75rem; }
   .hub-stand { font-size:1rem; }
   .hub-grid { grid-template-columns:1fr; gap:14px; margin-bottom:34px; }
   .hub-card, .hub-card.is-lead { grid-column:auto; flex-direction:column; }
   .hub-card.is-lead .hub-thumb { flex:none; min-height:0; aspect-ratio:16/9; }
   .hub-card.is-lead .hub-body { padding:16px 18px 18px; }
   .hub-card.is-lead h2 { font-size:1.15rem; }
   .hub-pills { flex-wrap:nowrap; overflow-x:auto; -webkit-overflow-scrolling:touch; padding-bottom:4px; width:100%; }
   .hub-pill { white-space:nowrap; }
   .hub-guide { padding:20px 16px; font-size:1rem; line-height:1.7; }
   .hub-guide h2 { font-size:1.25rem; }
   .hub-toc a:nth-child(n+7) { display:none; }
   .hub-toc.is-open a:nth-child(n+7) { display:block; }
}
</style>

<header class="hub-head">
   <div class="container-fluid px-lg-5">
      <div class="hub-crumb">
         <span class="hub-chip"><?php echo htmlspecialchars(strtoupper($cat_label)); ?></span>
         <span>&rsaquo;</span>
         <span><?php echo htmlspecialchars(strtoupper($sub_name)); ?></span>
      </div>
      <h1 class="hub-title"><?php echo htmlspecialchars($sub_name); ?></h1>
      <?php if ($stand !== '') { ?><p class="hub-stand"><?php echo htmlspecialchars($stand); ?></p><?php } ?>
      <div class="hub-stats">
         <span><strong><?php echo $count; ?></strong> <?php echo $count === 1 ? 'article' : 'articles'; ?></span>
         <?php if ($latest) { ?><span>Latest update <strong><?php echo date('M j, Y', $latest); ?></strong></span><?php } ?>
         <span>By the Imperialpedia editorial team</span>
      </div>
   </div>
</header>

<main class="container-fluid px-lg-5">
   <div class="hub-tools">
      <?php if ($count > 3) { ?>
      <div class="hub-search">
         <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
         <input type="search" id="hubFilter" placeholder="Search <?php echo (int)$count; ?> articles in <?php echo htmlspecialchars($sub_name); ?>" aria-label="Filter articles">
      </div>
      <?php } ?>
      <?php if (!empty($get_subcat_list) && count($get_subcat_list) > 1) { ?>
      <nav class="hub-pills" aria-label="More in <?php echo htmlspecialchars($cat_label); ?>">
         <?php foreach ($get_subcat_list as $s) {
            $slug = str_replace(' ', '-', $s['sub_cat_name']);
            $on = ($s['sub_cat_name'] === $sc['sub_cat_name']); ?>
            <a class="hub-pill<?php echo $on ? ' is-on' : ''; ?>" href="<?php echo base_url($cat_slug . '/' . $slug); ?>"><?php echo htmlspecialchars(ucwords($s['sub_cat_name'])); ?></a>
         <?php } ?>
      </nav>
      <?php } ?>
   </div>

   <?php if ($count === 0) { ?>
      <div class="hub-empty">New guides for this section are on the way.</div>
   <?php } else { ?>
   <div class="hub-grid" id="hubGrid">
      <?php foreach ($posts as $i => $p) {
         $url = base_url($cat_slug . '/' . $sub_slug . '/' . str_replace(' ', '-', $p['uri']));
         $img = !empty($p['post_img']) ? upload_image_url('post', $p['post_img']) : '';
         $author = post_author($p);
         $mins = post_read_minutes($p['post_desc']);
         $ex = seo_excerpt($p['post_desc'], $i === 0 ? 220 : 130);
      ?>
      <a class="hub-card<?php echo ($i === 0 && $count > 2) ? ' is-lead' : ''; ?>" href="<?php echo htmlspecialchars($url); ?>" data-title="<?php echo htmlspecialchars(strtolower($p['post_title'] . ' ' . $ex)); ?>">
         <span class="hub-thumb"><?php if ($img !== '') { ?><img src="<?php echo htmlspecialchars($img); ?>" alt="" <?php echo $i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'; ?> onerror="this.parentNode.style.display='none'"><?php } ?></span>
         <span class="hub-body">
            <span class="hub-tag"><?php echo htmlspecialchars($sub_name); ?></span>
            <h2><?php echo htmlspecialchars(ucfirst($p['post_title'])); ?></h2>
            <p class="hub-ex"><?php echo htmlspecialchars($ex); ?></p>
            <span class="hub-meta">
               <?php if ($author) { ?><span><?php echo htmlspecialchars($author['name']); ?></span><?php } ?>
               <span><?php echo date('M j, Y', strtotime($p['posted_date'])); ?></span>
               <span><?php echo (int)$mins; ?> min read</span>
            </span>
         </span>
      </a>
      <?php } ?>
   </div>
   <p class="hub-empty" id="hubNone" style="display:none">No articles match that search.</p>
   <?php } ?>

   <?php if (trim(strip_tags($guide_html)) !== '') { ?>
   <h2 class="hub-section-title">The complete guide to <?php echo htmlspecialchars($sub_name); ?></h2>
   <div class="hub-guide-wrap<?php echo count($toc) > 1 ? '' : ' is-solo'; ?>">
      <?php if (count($toc) > 1) { ?>
      <aside class="hub-toc" id="hubToc">
         <h3>In this guide</h3>
         <?php foreach ($toc as $t) { ?><a href="#<?php echo $t[0]; ?>"><?php echo htmlspecialchars(ucfirst($t[1])); ?></a><?php } ?>
         <?php if (count($toc) > 6) { ?><button type="button" class="p6-toc-toggle" id="hubTocBtn" style="display:none">Show all <?php echo count($toc); ?> sections</button><?php } ?>
      </aside>
      <?php } ?>
      <article class="hub-guide p6-content-box"><?php echo $guide_html; ?></article>
   </div>
   <?php } ?>
</main>

<script>
(function(){
   var f = document.getElementById('hubFilter'), grid = document.getElementById('hubGrid'), none = document.getElementById('hubNone');
   if(f && grid){
      f.addEventListener('input', function(){
         var q = f.value.trim().toLowerCase(), shown = 0;
         grid.querySelectorAll('.hub-card').forEach(function(c, i){
            var hit = !q || (c.getAttribute('data-title') || '').indexOf(q) > -1;
            c.style.display = hit ? '' : 'none';
            if(hit) shown++;
            if(q) c.classList.remove('is-lead'); else if(i === 0 && grid.children.length > 2) c.classList.add('is-lead');
         });
         if(none) none.style.display = shown ? 'none' : 'block';
      });
   }
   var guide = document.querySelector('.hub-guide');
   if(guide && window.matchMedia('(max-width: 767.98px)').matches && guide.scrollHeight > 900){
      guide.classList.add('p6-collapsed');
      var more = document.createElement('button');
      more.type = 'button'; more.className = 'p6-readmore'; more.textContent = 'Read the full guide';
      more.addEventListener('click', function(){
         var c = guide.classList.toggle('p6-collapsed');
         more.textContent = c ? 'Read the full guide' : 'Show less';
         if(c){ guide.scrollIntoView({behavior: 'smooth', block: 'start'}); }
      });
      guide.parentNode.insertBefore(more, guide.nextSibling);
   }
   var toc = document.getElementById('hubToc'), btn = document.getElementById('hubTocBtn');
   if(toc && btn){
      btn.style.display = '';
      btn.addEventListener('click', function(){
         var open = toc.classList.toggle('is-open');
         btn.textContent = open ? 'Show fewer' : btn.getAttribute('data-all');
      });
      btn.setAttribute('data-all', btn.textContent);
   }
})();
</script>
