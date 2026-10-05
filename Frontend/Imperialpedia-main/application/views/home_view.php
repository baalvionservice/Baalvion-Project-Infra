<?php
/**
 * Imperialpedia — homepage.
 * Calm, editorial layout: one lead story, the latest list, then every section with its newest guides.
 * Everything shown comes from the database; nothing here is a placeholder or an invented figure.
 * The previous design is kept in home_view_legacy.php.
 */
$labels = array(
   'insurance' => 'Insurance', 'marketing' => 'Marketing', 'internet' => 'Internet', 'seo' => 'SEO',
   'editor' => 'Creative Software', 'news' => 'News', 'attorney' => 'Legal', 'online-education' => 'Online Education',
);
$blurbs = array(
   'insurance' => 'Health, life, motor and business cover explained for Indian policyholders.',
   'marketing' => 'Email, affiliate, content and influencer marketing, with the economics behind them.',
   'internet' => 'How the web works, from hosting and CDNs to the deep web and online privacy.',
   'seo' => 'Search ranking factors, Google updates and how to build lasting organic traffic.',
   'editor' => 'Hands-on guides to Adobe, mobile editors and creator workflows.',
   'news' => 'Building an online store and running a business on the web.',
   'attorney' => 'Immigration and legal topics, in plain language.',
   'online-education' => 'Courses, degrees and learning online.',
);
$accents = array(
   'insurance' => '#15803d', 'marketing' => '#6d28d9', 'internet' => '#0369a1', 'seo' => '#047857',
   'editor' => '#be185d', 'news' => '#b45309', 'attorney' => '#1d4ed8', 'online-education' => '#c2410c',
);
$order = array('insurance', 'marketing', 'internet', 'seo', 'editor', 'news', 'attorney', 'online-education');

$posts = !empty($home_posts) ? $home_posts : array();
$url_of = function ($p) { return base_url(str_replace(' ', '-', $p['cat_name']) . '/' . str_replace(' ', '-', $p['sub_cat_name']) . '/' . str_replace(' ', '-', $p['uri'])); };
$img_of = function ($p) { return !empty($p['post_img']) ? upload_image_url('post', $p['post_img']) : ''; };
$mins_of = function ($p) { return max(1, (int)ceil(($p['post_chars'] / 6) / 200)); };
$ex_of = function ($p, $n = 140) { return seo_excerpt($p['post_sample'], $n); };
$label_of = function ($c) use ($labels) { return isset($labels[$c]) ? $labels[$c] : ucwords(str_replace('-', ' ', $c)); };
$accent_of = function ($c) use ($accents) { return isset($accents[$c]) ? $accents[$c] : '#0f172a'; };

// Group by category; remember the busiest sub-category of each as the "View all" target.
$by_cat = array(); $subs = array();
foreach ($posts as $p) {
   $by_cat[$p['cat_name']][] = $p;
   $subs[$p['cat_name']][$p['sub_cat_name']] = (isset($subs[$p['cat_name']][$p['sub_cat_name']]) ? $subs[$p['cat_name']][$p['sub_cat_name']] : 0) + 1;
}
$cats = array();
foreach ($order as $c) { if (!empty($by_cat[$c])) { $cats[] = $c; } }
foreach (array_keys($by_cat) as $c) { if (!in_array($c, $cats, true)) { $cats[] = $c; } }
$top_sub = function ($c) use ($subs) { $s = $subs[$c]; arsort($s); reset($s); return key($s); };

// Lead story: the newest post that has a picture; the latest list is the next five.
$lead = null;
foreach ($posts as $p) { if ($img_of($p) !== '') { $lead = $p; break; } }
if ($lead === null && !empty($posts)) { $lead = $posts[0]; }
// "Latest": the newest guide from each section first (so the list is varied), then the next newest overall.
$latest = array(); $seen_cat = array();
foreach ($posts as $p) {
   if ($lead && $p['post_id'] == $lead['post_id']) { $seen_cat[$p['cat_name']] = 1; continue; }
   if (empty($seen_cat[$p['cat_name']]) && count($latest) < 5) { $latest[] = $p; $seen_cat[$p['cat_name']] = 1; }
}
foreach ($posts as $p) {
   if (count($latest) >= 5) { break; }
   if (($lead && $p['post_id'] == $lead['post_id']) || in_array($p, $latest, true)) { continue; }
   $latest[] = $p;
}
usort($latest, function ($a, $b) { return strtotime($b['posted_date']) - strtotime($a['posted_date']); });

$authors = !empty($home_authors) ? $home_authors : array();

// Each section block shows guides not already featured above it.
$shown = array();
if ($lead) { $shown[$lead['post_id']] = 1; }
foreach ($latest as $p) { $shown[$p['post_id']] = 1; }
$pick = function ($c) use (&$shown, $by_cat) {
   $out = array();
   foreach ($by_cat[$c] as $p) { if (count($out) < 3 && empty($shown[$p['post_id']])) { $out[] = $p; } }
   foreach ($by_cat[$c] as $p) { if (count($out) < 3 && !in_array($p, $out, true)) { $out[] = $p; } }
   foreach ($out as $p) { $shown[$p['post_id']] = 1; }
   return $out;
};
?>
<style>
:root { --hm-ink:#0f172a; --hm-mute:#64748b; --hm-line:#e2e8f0; --hm-soft:#f8fafc; --hm-brand:#d00000; }
.hm-wrap { max-width:1240px; margin:0 auto; padding:0 20px; }
.hm-intro { padding:38px 0 8px; }
.hm-eyebrow { font-size:.78rem; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:var(--hm-brand); margin:0 0 10px; }
.hm-h1 { font-family:var(--p6-font-headline,'Plus Jakarta Sans',system-ui,sans-serif); font-weight:800; font-size:clamp(1.9rem, 4.2vw, 3.1rem); line-height:1.12; letter-spacing:-.03em; color:var(--hm-ink); margin:0 0 12px; max-width:880px; }
.hm-sub { font-size:1.1rem; line-height:1.65; color:#475569; margin:0 0 22px; max-width:720px; }
.hm-chips { display:flex; flex-wrap:wrap; gap:10px; }
.hm-chip { display:inline-flex; align-items:center; gap:8px; padding:9px 16px; border:1px solid var(--hm-line); border-radius:999px; background:#fff; color:#1e293b; font-size:.88rem; font-weight:700; text-decoration:none; transition:all .15s ease; }
.hm-chip i { width:9px; height:9px; border-radius:50%; background:var(--c, #0f172a); display:inline-block; }
.hm-chip:hover { border-color:var(--c, #0f172a); box-shadow:0 6px 16px rgba(15,23,42,.08); transform:translateY(-1px); color:#0f172a; }

.hm-top { display:grid; grid-template-columns:minmax(0, 1.65fr) minmax(0, 1fr); gap:30px; padding:30px 0 12px; }
.hm-lead { display:flex; flex-direction:column; text-decoration:none; color:var(--hm-ink); }
.hm-lead:hover { color:var(--hm-ink); }
.hm-lead-img { display:block; aspect-ratio:16/9; border-radius:16px; overflow:hidden; background:#e2e8f0; box-shadow:0 18px 40px rgba(15,23,42,.12); }
.hm-lead-img img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .5s ease; }
.hm-lead:hover .hm-lead-img img { transform:scale(1.03); }
.hm-tag { align-self:flex-start; margin-top:18px; font-size:.7rem; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:var(--c, #0f172a); background:#f1f5f9; padding:5px 11px; border-radius:999px; }
.hm-lead h2 { font-family:var(--p6-font-headline,'Plus Jakarta Sans',system-ui,sans-serif); font-size:clamp(1.5rem, 2.6vw, 2.2rem); line-height:1.22; letter-spacing:-.02em; font-weight:800; margin:10px 0 10px; }
.hm-lead p { font-size:1.05rem; line-height:1.65; color:#475569; margin:0 0 12px; }
.hm-meta { font-size:.82rem; font-weight:600; color:var(--hm-mute); display:flex; flex-wrap:wrap; gap:4px 14px; }
.hm-side { border-left:1px solid var(--hm-line); padding-left:30px; }
.hm-side h3 { font-size:.8rem; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:var(--hm-mute); margin:0 0 6px; }
.hm-row { display:flex; gap:14px; padding:16px 0; border-bottom:1px solid var(--hm-line); text-decoration:none; color:var(--hm-ink); }
.hm-row:last-child { border-bottom:0; }
.hm-row:hover { color:var(--hm-ink); }
.hm-row:hover strong { color:var(--hm-brand); }
.hm-row-img { flex:none; width:104px; height:70px; border-radius:10px; overflow:hidden; background:#e2e8f0; }
.hm-row-img img { width:100%; height:100%; object-fit:cover; display:block; }
.hm-row strong { display:-webkit-box; font-size:.98rem; line-height:1.38; font-weight:700; margin:2px 0 4px; transition:color .15s ease; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
.hm-row small { font-size:.75rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--c, #64748b); }

.hm-block { padding:44px 0 6px; }
.hm-block-head { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:20px; padding-bottom:14px; border-bottom:1px solid var(--hm-line); }
.hm-block-head h2 { font-family:var(--p6-font-headline,'Plus Jakarta Sans',system-ui,sans-serif); font-size:1.65rem; font-weight:800; letter-spacing:-.02em; margin:0; color:var(--hm-ink); }
.hm-block-head h2::before { content:""; display:inline-block; width:6px; height:1.05em; border-radius:3px; background:var(--c, #0f172a); margin-right:12px; vertical-align:-.12em; }
.hm-block-head p { margin:4px 0 0; font-size:.92rem; color:var(--hm-mute); max-width:560px; }
.hm-all { flex:none; font-size:.88rem; font-weight:800; color:var(--c, #0f172a); text-decoration:none; white-space:nowrap; }
.hm-all:hover { text-decoration:underline; }
.hm-cards { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:22px; }
.hm-card { display:flex; flex-direction:column; background:#fff; border:1px solid var(--hm-line); border-radius:14px; overflow:hidden; text-decoration:none; color:var(--hm-ink); box-shadow:0 1px 2px rgba(15,23,42,.04); transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
.hm-card:hover { transform:translateY(-4px); border-color:#cbd5e1; box-shadow:0 16px 32px rgba(15,23,42,.1); color:var(--hm-ink); }
.hm-card-img { display:block; aspect-ratio:16/9; background:#e2e8f0; overflow:hidden; }
.hm-card-img img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .4s ease; }
.hm-card:hover .hm-card-img img { transform:scale(1.04); }
.hm-card-body { display:flex; flex-direction:column; gap:8px; padding:16px 18px 18px; flex:1; }
.hm-card-body .hm-tag { margin:0; }
.hm-card h3 { font-size:1.06rem; line-height:1.38; font-weight:800; margin:0; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
.hm-card p { font-size:.9rem; line-height:1.55; color:#64748b; margin:0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.hm-card .hm-meta { margin-top:auto; padding-top:6px; font-size:.78rem; }

.hm-trust { margin:56px 0 60px; padding:34px 36px; background:var(--hm-soft); border:1px solid var(--hm-line); border-radius:18px; display:grid; grid-template-columns:minmax(0, 1.1fr) minmax(0, 1fr); gap:34px; align-items:center; }
.hm-trust h2 { font-family:var(--p6-font-headline,'Plus Jakarta Sans',system-ui,sans-serif); font-size:1.6rem; font-weight:800; letter-spacing:-.02em; margin:0 0 10px; color:var(--hm-ink); }
.hm-trust p { margin:0 0 16px; font-size:1rem; line-height:1.65; color:#475569; }
.hm-stats { display:flex; flex-wrap:wrap; gap:22px 34px; margin:0 0 18px; }
.hm-stats div strong { display:block; font-size:1.9rem; font-weight:800; letter-spacing:-.02em; color:var(--hm-ink); line-height:1.1; }
.hm-stats div span { font-size:.78rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--hm-mute); }
.hm-links { display:flex; flex-wrap:wrap; gap:10px; }
.hm-links a { padding:10px 18px; border-radius:999px; font-size:.88rem; font-weight:700; text-decoration:none; border:1px solid #cbd5e1; color:var(--hm-ink); background:#fff; }
.hm-links a:first-child { background:var(--hm-ink); border-color:var(--hm-ink); color:#fff; }
.hm-links a:hover { opacity:.88; }
.hm-authors { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:12px; }
.hm-author { display:flex; align-items:center; gap:12px; padding:12px 14px; background:#fff; border:1px solid var(--hm-line); border-radius:12px; text-decoration:none; color:var(--hm-ink); }
.hm-author:hover { border-color:#cbd5e1; box-shadow:0 8px 18px rgba(15,23,42,.08); color:var(--hm-ink); }
.hm-author img { width:44px; height:44px; border-radius:50%; object-fit:cover; flex:none; background:#e2e8f0; }
.hm-author strong { display:block; font-size:.92rem; line-height:1.25; }
.hm-author span span { font-size:.75rem; color:var(--hm-mute); line-height:1.3; display:block; }

@media (max-width: 991.98px) {
   .hm-top { grid-template-columns:1fr; gap:10px; }
   .hm-side { border-left:0; padding-left:0; border-top:1px solid var(--hm-line); padding-top:18px; }
   .hm-cards { grid-template-columns:repeat(2, minmax(0, 1fr)); }
   .hm-trust { grid-template-columns:1fr; padding:26px 22px; gap:22px; }
}
@media (max-width: 767.98px) {
   .hm-wrap { padding:0 16px; }
   .hm-intro { padding:24px 0 4px; }
   .hm-sub { font-size:1rem; margin-bottom:16px; }
   .hm-chips { flex-wrap:nowrap; overflow-x:auto; -webkit-overflow-scrolling:touch; padding-bottom:6px; margin-right:-16px; padding-right:16px; }
   .hm-chip { white-space:nowrap; flex:none; }
   .hm-top { padding-top:20px; }
   .hm-lead-img { border-radius:12px; }
   .hm-block { padding-top:34px; }
   .hm-block-head { flex-direction:column; align-items:flex-start; gap:6px; }
   .hm-block-head h2 { font-size:1.35rem; }
   .hm-cards { grid-template-columns:1fr; gap:14px; }
   .hm-card { flex-direction:row; }
   .hm-card-img { flex:none; width:118px; aspect-ratio:auto; }
   .hm-card-body { padding:12px 14px; gap:6px; }
   .hm-card h3 { font-size:.98rem; }
   .hm-card p { display:none; }
   .hm-authors { grid-template-columns:1fr; }
   .hm-trust { margin:40px 0 44px; }
}
</style>

<main class="hm-wrap">
   <section class="hm-intro">
      <p class="hm-eyebrow">Imperialpedia</p>
      <h1 class="hm-h1">Clear, practical guides on insurance, marketing, SEO and technology.</h1>
      <p class="hm-sub">Research-led articles by named contributors. Pick a topic to start, or read the latest below.</p>
      <nav class="hm-chips" aria-label="Browse by topic">
         <?php foreach ($cats as $c) { ?>
            <a class="hm-chip" style="--c:<?php echo $accent_of($c); ?>" href="<?php echo base_url($c . '/' . str_replace(' ', '-', $top_sub($c))); ?>"><i></i><?php echo htmlspecialchars($label_of($c)); ?></a>
         <?php } ?>
      </nav>
   </section>

   <?php if ($lead) { ?>
   <section class="hm-top" aria-label="Featured and latest">
      <a class="hm-lead" href="<?php echo htmlspecialchars($url_of($lead)); ?>" style="--c:<?php echo $accent_of($lead['cat_name']); ?>">
         <?php if ($img_of($lead) !== '') { ?><span class="hm-lead-img"><img src="<?php echo htmlspecialchars($img_of($lead)); ?>" alt="" width="1200" height="675" fetchpriority="high" onerror="this.parentNode.style.display='none'"></span><?php } ?>
         <span class="hm-tag"><?php echo htmlspecialchars($label_of($lead['cat_name'])); ?></span>
         <h2><?php echo htmlspecialchars(ucfirst($lead['post_title'])); ?></h2>
         <p><?php echo htmlspecialchars($ex_of($lead, 200)); ?></p>
         <span class="hm-meta"><span><?php echo date('M j, Y', strtotime($lead['posted_date'])); ?></span><span><?php echo $mins_of($lead); ?> min read</span></span>
      </a>
      <aside class="hm-side">
         <h3>Latest</h3>
         <?php foreach ($latest as $p) { $im = $img_of($p); ?>
         <a class="hm-row" href="<?php echo htmlspecialchars($url_of($p)); ?>" style="--c:<?php echo $accent_of($p['cat_name']); ?>">
            <?php if ($im !== '') { ?><span class="hm-row-img"><img src="<?php echo htmlspecialchars($im); ?>" alt="" loading="lazy" width="104" height="70" onerror="this.parentNode.style.display='none'"></span><?php } ?>
            <span>
               <small><?php echo htmlspecialchars($label_of($p['cat_name'])); ?></small>
               <strong><?php echo htmlspecialchars(ucfirst($p['post_title'])); ?></strong>
               <span class="hm-meta"><span><?php echo date('M j, Y', strtotime($p['posted_date'])); ?></span><span><?php echo $mins_of($p); ?> min read</span></span>
            </span>
         </a>
         <?php } ?>
      </aside>
   </section>
   <?php } ?>

   <?php foreach ($cats as $c) {
      $items = $pick($c);
      $all = base_url($c . '/' . str_replace(' ', '-', $top_sub($c)));
   ?>
   <section class="hm-block" style="--c:<?php echo $accent_of($c); ?>" aria-label="<?php echo htmlspecialchars($label_of($c)); ?>">
      <div class="hm-block-head">
         <div>
            <h2><?php echo htmlspecialchars($label_of($c)); ?></h2>
            <?php if (isset($blurbs[$c])) { ?><p><?php echo htmlspecialchars($blurbs[$c]); ?></p><?php } ?>
         </div>
         <a class="hm-all" href="<?php echo htmlspecialchars($all); ?>">View all <?php echo count($by_cat[$c]); ?> &rarr;</a>
      </div>
      <div class="hm-cards">
         <?php foreach ($items as $p) { $im = $img_of($p); ?>
         <a class="hm-card" href="<?php echo htmlspecialchars($url_of($p)); ?>" style="--c:<?php echo $accent_of($c); ?>">
            <span class="hm-card-img"><?php if ($im !== '') { ?><img src="<?php echo htmlspecialchars($im); ?>" alt="" loading="lazy" width="640" height="360" onerror="this.parentNode.style.display='none'"><?php } ?></span>
            <span class="hm-card-body">
               <span class="hm-tag"><?php echo htmlspecialchars(ucwords($p['sub_cat_name'])); ?></span>
               <h3><?php echo htmlspecialchars(ucfirst($p['post_title'])); ?></h3>
               <p><?php echo htmlspecialchars($ex_of($p, 120)); ?></p>
               <span class="hm-meta"><span><?php echo date('M j, Y', strtotime($p['posted_date'])); ?></span><span><?php echo $mins_of($p); ?> min read</span></span>
            </span>
         </a>
         <?php } ?>
      </div>
   </section>
   <?php } ?>

   <section class="hm-trust" aria-label="About Imperialpedia">
      <div>
         <h2>Written by people you can look up</h2>
         <p>Every guide carries its author's name, and corrections are handled through our editorial policy. Browse the contributors, or tell us what we got wrong.</p>
         <div class="hm-stats">
            <div><strong><?php echo count($posts); ?></strong><span>Guides</span></div>
            <div><strong><?php echo count($cats); ?></strong><span>Topics</span></div>
            <div><strong><?php echo count($authors); ?></strong><span>Contributors</span></div>
         </div>
         <div class="hm-links">
            <a href="<?php echo base_url('author'); ?>">Meet the contributors</a>
            <a href="<?php echo base_url('editorial-policy'); ?>">Editorial policy</a>
            <a href="<?php echo base_url('about'); ?>">About us</a>
         </div>
      </div>
      <div class="hm-authors">
         <?php foreach (array_slice($authors, 0, 6) as $a) { ?>
         <a class="hm-author" href="<?php echo base_url('author/' . $a['slug']); ?>">
            <img src="<?php echo htmlspecialchars(author_avatar_url($a['avatar'] ?? '', $a['name'])); ?>" alt="" loading="lazy" width="44" height="44">
            <span><strong><?php echo htmlspecialchars($a['name']); ?></strong><span><?php echo htmlspecialchars($a['title']); ?></span></span>
         </a>
         <?php } ?>
      </div>
   </section>
</main>
