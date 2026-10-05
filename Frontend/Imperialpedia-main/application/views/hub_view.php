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
   'attorney' => 'Legal', 'online-education' => 'Online Education', 'editor' => 'Editor', 'seo' => 'SEO', 'cookies' => 'Cookies',
);
$accents = array(
   'insurance' => '#15803d', 'internet' => '#0369a1', 'marketing' => '#6d28d9', 'news' => '#b45309',
   'attorney' => '#1d4ed8', 'online-education' => '#c2410c', 'editor' => '#be185d', 'seo' => '#047857', 'cookies' => '#0f766e',
);
$cat_label = isset($labels[$cat_slug]) ? $labels[$cat_slug] : ucwords(str_replace('-', ' ', $cat_slug));
$accent = isset($accents[$cat_slug]) ? $accents[$cat_slug] : '#0f172a';
$sub_name = $sc ? brand_name($sc['sub_cat_name']) : '';
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

<?php
// A sub-category with no separate articles is itself the article (for example a single news story).
// Show it as a proper article page: headline, byline, share row, readable body, contents list, more from the section.
if ($count === 0 && trim(strip_tags($guide_html)) !== '' && $sc) {
   $CI =& get_instance();
   $au = null;
   if (!empty($sc['author_name'])) {
      $au = $CI->db->query('SELECT * FROM author WHERE LOWER(name) = ? LIMIT 1', array(strtolower(trim($sc['author_name']))))->row_array();
      if ($au) { $au['url'] = base_url('author/' . $au['slug']); $au['avatar_url'] = author_avatar_url($au['avatar'] ?? '', $au['name']); }
   }
   // The page query joins the category table, whose dates overwrite the sub-category's; read the real dates directly.
   $dates = $CI->db->select('added_date, updated_date')->get_where('sub_category', array('sub_cat_id' => (int)$sc['sub_cat_id']))->row_array();
   $pub = strtotime($dates['added_date']); $upd = !empty($dates['updated_date']) ? strtotime($dates['updated_date']) : 0;
   $w_pub = news_when($dates['added_date']);
   $w_upd = ($upd && abs($upd - $pub) > 300) ? news_when($dates['updated_date']) : null;
   $is_news = ($cat_slug === 'news');
   $more_news = $is_news ? news_feed(5, base_url(uri_string())) : array();
   $mins = max(1, (int)ceil(str_word_count(strip_tags($guide_html)) / 200));
   $page_url = base_url(uri_string());
   $others = array();
   foreach ((array)$get_subcat_list as $o) { if ($o['sub_cat_id'] != $sc['sub_cat_id']) { $others[] = $o; } }
   $hero = !empty($sc['sub_cat_image']) ? upload_image_url('subcategory', $sc['sub_cat_image']) : '';
?>
<style>
.na-wrap{max-width:1180px;margin:0 auto;padding:0 20px}
.na-head{padding:30px 0 6px}
.na-title{font-family:var(--p6-font-headline,'Plus Jakarta Sans',system-ui,sans-serif);font-weight:800;font-size:clamp(1.8rem,3.6vw,2.9rem);line-height:1.14;letter-spacing:-.03em;color:#0f172a;margin:6px 0 14px;max-width:900px}
.na-stand{font-size:1.15rem;line-height:1.6;color:#475569;max-width:780px;margin:0 0 20px}
.na-by{display:flex;flex-wrap:wrap;align-items:center;gap:12px 22px;padding:14px 0;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0}
.na-by-who{display:flex;align-items:center;gap:12px}
.na-by-who img{width:44px;height:44px;border-radius:50%;object-fit:cover;aspect-ratio:1/1;flex:none}
.na-by-who strong{display:block;font-size:.95rem;color:#0f172a;line-height:1.25}
.na-by-who span{display:block;font-size:.78rem;color:#64748b}
.na-by-meta{font-size:.84rem;font-weight:600;color:#64748b}
.na-share{margin-left:auto;display:flex;gap:8px;align-items:center}
.na-share span{font-size:.76rem;font-weight:700;color:#64748b;margin-right:2px}
.na-share a,.na-share button{width:38px;height:38px;border-radius:50%;border:1px solid #cbd5e1;background:#fff;color:#0f172a !important;display:inline-flex;align-items:center;justify-content:center;padding:0;cursor:pointer;text-decoration:none !important;font-size:.95rem}
.na-share a:hover,.na-share button:hover{background:#0f172a;color:#fff !important;border-color:#0f172a}
.na-grid{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:44px;padding:30px 0 20px;align-items:start}
.na-hero{border-radius:14px;overflow:hidden;margin:0 0 24px}.na-hero img{display:block;width:100%;height:auto}
.na-body{font-size:1.1rem;line-height:1.85;color:#1e293b;max-width:760px}
.na-body h2{font-size:1.55rem;font-weight:800;color:#0f172a;margin:2.2rem 0 .8rem;line-height:1.3;letter-spacing:-.01em;scroll-margin-top:20px}
.na-body h2:first-child{margin-top:0}
.na-body h3{font-size:1.2rem;font-weight:800;margin:1.6rem 0 .6rem;color:#0f172a}
.na-body p{margin:0 0 1.15rem}
.na-body ul,.na-body ol{margin:0 0 1.2rem;padding-left:1.4rem}.na-body li{margin-bottom:.45rem}
.na-body img{max-width:100% !important;height:auto !important;border-radius:10px}
.na-body a{color:#b45309;text-decoration:underline;text-underline-offset:3px}
.na-side{position:sticky;top:18px;display:flex;flex-direction:column;gap:18px}
.na-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:18px}
.na-box h3{font-size:.76rem;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#475569;margin:0 0 10px}
.na-box a{display:block;padding:8px 10px;border-radius:8px;color:#334155;font-size:.9rem;line-height:1.4;font-weight:600;text-decoration:none}
.na-box a:hover{background:#fff;color:var(--hub-accent)}
.na-tags{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0 0}
.na-tags span{font-size:.78rem;font-weight:700;color:#475569;background:#f1f5f9;border-radius:999px;padding:6px 12px}
.na-more{padding:10px 0 50px}
.na-more h2{font-size:1.3rem;font-weight:800;margin:0 0 14px}
.na-more-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px}
.na-more-card{display:block;padding:16px 18px;border:1px solid #e2e8f0;border-radius:12px;text-decoration:none;color:#0f172a;background:#fff;transition:all .15s ease}
.na-more-card:hover{border-color:var(--hub-accent);box-shadow:0 10px 24px rgba(15,23,42,.1);transform:translateY(-2px);color:#0f172a}
.na-more-card strong{display:block;font-size:1rem;margin-bottom:4px}.na-more-card span{font-size:.85rem;color:#64748b;line-height:1.5}
.na-line{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin:10px 0 0;font-size:.78rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#d00000}
.na-line span{color:#64748b;letter-spacing:.04em;font-weight:700;text-transform:none}
.na-progress{position:fixed;left:0;top:0;right:0;height:3px;z-index:3000;background:transparent}.na-progress i{display:block;height:100%;width:0;background:#d00000;transition:width .08s linear}
.na-by-meta{display:flex;flex-wrap:wrap;gap:4px 14px;align-items:baseline}.na-by-meta b{color:#0f172a}.na-by-meta em{font-style:normal;color:#d00000;font-weight:700}
.na-more-list{border-top:1px solid #e2e8f0}.na-more-row{display:block;padding:14px 0;border-bottom:1px solid #e2e8f0;text-decoration:none;color:#0f172a}
.na-more-row:hover strong{color:#d00000}.na-more-time{display:block;font-size:.74rem;font-weight:800;color:#d00000;margin-bottom:3px}.na-more-row strong{font-size:1rem;line-height:1.4;font-weight:800;transition:color .15s ease}
.na-more-all{display:inline-block;margin-top:14px;font-weight:800;font-size:.9rem;color:#0f172a;text-decoration:none}.na-more-all:hover{color:#d00000}
@media (max-width:767.98px){
.na-head{padding:14px 0 0}
.na-line{font-size:.72rem;margin-top:4px}
.na-title{font-size:1.85rem;line-height:1.12;margin:8px 0 10px;letter-spacing:-.025em}
.na-stand{font-size:1.02rem;line-height:1.5;margin-bottom:12px;color:#334155;font-weight:500}
.na-by{gap:8px 14px;padding:12px 0;border-bottom:0}
.na-by-who{width:100%}.na-by-who span span{font-size:.74rem}
.na-by-meta{width:100%;font-size:.78rem;gap:2px 10px}
.na-share{margin:0;padding:10px 0 12px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;width:100%}
.na-share a,.na-share button{flex:1;border-radius:10px;height:42px;width:auto}.na-share span{display:none}
.na-grid{padding-top:14px;gap:12px}
.na-side{display:block}.na-box{padding:12px 14px}.na-box h3{margin-bottom:6px}
.na-toc a{padding:6px 4px}.na-toc a:nth-child(n+4){display:none}.na-toc.is-open a:nth-child(n+4){display:block}
.na-body{font-size:1.06rem;line-height:1.72}
.na-body>p:first-of-type{font-size:1.14rem;line-height:1.65;color:#0f172a;font-weight:500}
.na-body h2{font-size:1.25rem;margin-top:1.8rem}
.na-body .imp-embed{margin-left:-16px;margin-right:-16px;max-width:none}.na-body .imp-embed iframe{border-radius:0;border-left:0;border-right:0}
.na-wrap{padding-bottom:10px}
}
@media (max-width:991.98px){.na-grid{grid-template-columns:1fr;gap:20px}.na-side{position:static;order:-1}}
@media (max-width:767.98px){.na-wrap{padding:0 16px}.na-head{padding-top:20px}.na-stand{font-size:1.02rem}.na-body{font-size:1.02rem;line-height:1.75}.na-share{margin-left:0;width:100%}.na-body h2{font-size:1.3rem}}
</style>
<div class="na-progress" id="naProg" aria-hidden="true"><i></i></div>
<main class="na-wrap">
   <header class="na-head">
      <div class="hub-crumb"><span class="hub-chip"><?php echo htmlspecialchars(strtoupper($cat_label)); ?></span><span>&rsaquo;</span><span><?php echo htmlspecialchars(strtoupper($sub_name)); ?></span></div>
      <div class="na-line"><?php echo htmlspecialchars($is_news ? ($w_pub['day'] === 'Today' ? 'Today\'s news' : 'News') : $cat_label); ?> <span><?php echo htmlspecialchars($w_pub['date']); ?></span></div>
      <h1 class="na-title"><?php echo htmlspecialchars($sub_name); ?></h1>
      <?php if ($stand !== '') { ?><p class="na-stand"><?php echo htmlspecialchars($stand); ?></p><?php } ?>
      <div class="na-by">
         <div class="na-by-who">
            <?php if ($au) { ?><img src="<?php echo htmlspecialchars($au['avatar_url']); ?>" alt="<?php echo htmlspecialchars($au['name']); ?>" width="44" height="44">
            <span style="display:block"><strong><a href="<?php echo $au['url']; ?>" rel="author" style="color:inherit;text-decoration:none"><?php echo htmlspecialchars($au['name']); ?></a></strong><span><?php echo htmlspecialchars($au['title']); ?></span></span>
            <?php } else { ?><span style="display:block"><strong>Imperialpedia editorial team</strong></span><?php } ?>
         </div>
         <div class="na-by-meta"><span class="na-when"><b><?php echo htmlspecialchars($w_pub['day'] === 'Today' || $w_pub['day'] === 'Yesterday' ? $w_pub['day'] . ', ' . $w_pub['time'] : $w_pub['abs']); ?></b><?php if ($w_pub['ago'] !== '') { ?> <em>(<?php echo htmlspecialchars($w_pub['ago']); ?>)</em><?php } ?></span><?php if ($w_upd) { ?> <span class="na-upd">Updated <?php echo htmlspecialchars($w_upd['ago'] !== '' ? $w_upd['ago'] : $w_upd['abs']); ?></span><?php } ?> <span class="na-read"><?php echo $mins; ?> min read</span></div>
         <div class="na-share"><span>Share</span>
            <a href="https://api.whatsapp.com/send?text=<?php echo rawurlencode($sub_name . ' ' . $page_url); ?>" target="_blank" rel="noopener" aria-label="Share on WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
            <a href="https://twitter.com/intent/tweet?text=<?php echo rawurlencode($sub_name); ?>&amp;url=<?php echo rawurlencode($page_url); ?>" target="_blank" rel="noopener" aria-label="Share on X"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=<?php echo rawurlencode($page_url); ?>" target="_blank" rel="noopener" aria-label="Share on Facebook"><i class="fa-brands fa-facebook-f"></i></a>
            <button type="button" onclick="navigator.clipboard&amp;&amp;navigator.clipboard.writeText(location.href);this.innerHTML='&amp;#10003;'" aria-label="Copy link"><i class="fa-solid fa-link"></i></button>
         </div>
      </div>
   </header>
   <div class="na-grid">
      <article>
         <?php if ($hero !== '') { ?><div class="na-hero"><img src="<?php echo htmlspecialchars($hero); ?>" alt="<?php echo htmlspecialchars($sub_name); ?>" width="1100" height="620" fetchpriority="high"></div><?php } ?>
         <div class="na-body"><?php echo embed_social($guide_html); ?></div>
         <?php $this->load->view('includes/network_ad', array('format' => 'leader', 'site' => 'ships')); ?>
         <?php if (!empty($sc['tags'])) { $tg = array_slice(array_filter(array_map('trim', explode(',', $sc['tags']))), 0, 8); if ($tg) { ?>
         <div class="na-tags"><?php foreach ($tg as $t) { ?><span><?php echo htmlspecialchars($t); ?></span><?php } ?></div>
         <?php } } ?>
      </article>
      <aside class="na-side">
         <?php if (count($toc) > 1) { ?>
         <div class="na-box"><h3>In this article</h3><div class="na-toc" id="naToc"><?php foreach ($toc as $t) { ?><a href="#<?php echo $t[0]; ?>"><?php echo htmlspecialchars(ucfirst($t[1])); ?></a><?php } ?></div>
         <?php if (count($toc) > 3) { ?><button type="button" class="p6-toc-toggle" id="naTocBtn" style="display:none" onclick="var t=document.getElementById('naToc');this.textContent=t.classList.toggle('is-open')?'Show fewer':'Show all sections'">Show all sections</button><?php } ?></div>
         <?php } ?>
         <?php $this->load->view('includes/network_ad', array('format' => 'rect', 'site' => 'signal')); ?>
         <?php $this->load->view('includes/network_box'); ?>
      </aside>
   </div>
   <?php if ($more_news) { ?>
   <section class="na-more"><h2>More news</h2>
      <div class="na-more-list"><?php foreach ($more_news as $mn) { $mw = news_when($mn['date']); ?>
         <a class="na-more-row" href="<?php echo htmlspecialchars($mn['url']); ?>">
            <span class="na-more-time"><?php echo htmlspecialchars($mw['day']); ?> &middot; <?php echo htmlspecialchars($mw['time']); ?></span>
            <strong><?php echo htmlspecialchars($mn['title']); ?></strong>
         </a>
      <?php } ?>
      <a class="na-more-all" href="<?php echo base_url('news'); ?>">All news &rarr;</a></div>
   </section>
   <?php } elseif ($others) { ?>
   <section class="na-more"><h2>More in <?php echo htmlspecialchars($cat_label); ?></h2>
      <div class="na-more-grid"><?php foreach ($others as $o) { ?>
         <a class="na-more-card" href="<?php echo base_url($cat_slug . '/' . str_replace(' ', '-', $o['sub_cat_name'])); ?>"><strong><?php echo htmlspecialchars(brand_name($o['sub_cat_name'])); ?></strong><span><?php echo htmlspecialchars(seo_excerpt($o['sub_cat_desc'], 110)); ?></span></a>
      <?php } ?></div>
   </section>
   <?php } ?>
</main>
<script>(function(){var bar=document.querySelector('#naProg i');if(bar){var f=function(){var h=document.documentElement,max=h.scrollHeight-h.clientHeight;bar.style.width=(max>0?Math.min(100,h.scrollTop/max*100):0)+'%';};addEventListener('scroll',f,{passive:true});f();}var b=document.getElementById('naTocBtn');if(b&&window.matchMedia('(max-width:767.98px)').matches){b.style.display='block';}})();</script>
<?php return; } ?>
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
            <a class="hub-pill<?php echo $on ? ' is-on' : ''; ?>" href="<?php echo base_url($cat_slug . '/' . $slug); ?>"><?php echo htmlspecialchars(brand_name($s['sub_cat_name'])); ?></a>
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
         $img = !empty($p['post_img']) ? post_thumb($p['post_img'], $i === 0 && $count > 2 ? 900 : 640) : '';
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
      <article class="hub-guide p6-content-box"><?php echo embed_social($guide_html); ?></article>
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
