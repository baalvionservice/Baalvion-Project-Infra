<?php
/**
 * Imperialpedia — homepage (bold magazine layout).
 * Everything shown comes from the database; nothing here is a placeholder or an invented figure.
 *
 */
$labels = array(
   'insurance' => 'Insurance', 'marketing' => 'Marketing', 'internet' => 'Internet', 'seo' => 'SEO',
   'editor' => 'Creative Software', 'news' => 'News', 'attorney' => 'Legal', 'online-education' => 'Online Education',
);
$blurbs = array(
   'insurance' => 'Money-literacy guides: health, life, motor and business cover explained for Indian policyholders.',
   'marketing' => 'Learn email, affiliate, content and influencer marketing, with the economics behind each.',
   'internet' => 'Learn how the web works, from hosting and CDNs to the deep web and online privacy.',
   'seo' => 'Search ranking factors, Google updates, keyword research and how to build lasting organic traffic.',
   'editor' => 'Hands-on tutorials for Adobe, mobile editors and creator workflows.',
   'news' => 'Building an online store and running a business on the web.',
   'attorney' => 'Immigration and legal topics, in plain language.',
   'online-education' => 'Courses, degrees and learning online.',
);
$accents = array(
   'insurance' => '#16a34a', 'marketing' => '#8b5cf6', 'internet' => '#0ea5e9', 'seo' => '#10b981',
   'editor' => '#ec4899', 'news' => '#f59e0b', 'attorney' => '#3b82f6', 'online-education' => '#f97316',
);
$order = array('seo', 'marketing', 'internet', 'editor', 'insurance', 'news', 'attorney', 'online-education');

$posts = !empty($home_posts) ? $home_posts : array();
$url_of = function ($p) { return base_url(str_replace(' ', '-', $p['cat_name']) . '/' . str_replace(' ', '-', $p['sub_cat_name']) . '/' . str_replace(' ', '-', $p['uri'])); };
$img_of = function ($p, $w = 640) { return !empty($p['post_img']) ? post_thumb($p['post_img'], $w) : ''; };
$mins_of = function ($p) { return max(1, (int)ceil(($p['post_chars'] / 6) / 200)); };
$ex_of = function ($p, $n = 140) { return seo_excerpt($p['post_sample'], $n); };
$label_of = function ($c) use ($labels) { return isset($labels[$c]) ? $labels[$c] : ucwords(str_replace('-', ' ', $c)); };
$accent_of = function ($c) use ($accents) { return isset($accents[$c]) ? $accents[$c] : '#94a3b8'; };
$author_of = function ($p) { $a = post_author($p); return $a ? $a['name'] : ''; };

$by_cat = array(); $subs = array();
foreach ($posts as $p) {
   $by_cat[$p['cat_name']][] = $p;
   $subs[$p['cat_name']][$p['sub_cat_name']] = (isset($subs[$p['cat_name']][$p['sub_cat_name']]) ? $subs[$p['cat_name']][$p['sub_cat_name']] : 0) + 1;
}
$cats = array();
foreach ($order as $c) { if (!empty($by_cat[$c])) { $cats[] = $c; } }
foreach (array_keys($by_cat) as $c) { if (!in_array($c, $cats, true)) { $cats[] = $c; } }
$top_sub = function ($c) use ($subs) { $s = $subs[$c]; arsort($s); reset($s); return key($s); };

// Lead: newest post with a picture. Strip: newest of each other section. Mosaic: the next best five.
$lead = null;
foreach ($posts as $p) { if ($p['cat_name'] === 'seo' && $img_of($p) !== '') { $lead = $p; break; } }   // an SEO blog leads with SEO
if ($lead === null) { foreach ($posts as $p) { if ($img_of($p) !== '') { $lead = $p; break; } } }
if ($lead === null && !empty($posts)) { $lead = $posts[0]; }
$used = array(); if ($lead) { $used[$lead['post_id']] = 1; }

$strip = array(); $seen_cat = array(); if ($lead) { $seen_cat[$lead['cat_name']] = 1; }
foreach ($posts as $p) {
   if (count($strip) >= 3) { break; }
   if (!empty($used[$p['post_id']]) || !empty($seen_cat[$p['cat_name']])) { continue; }
   $strip[] = $p; $seen_cat[$p['cat_name']] = 1; $used[$p['post_id']] = 1;
}
// Top stories: the newest two guides from each section, in the order SEO, marketing, internet... (an SEO blog leads with SEO).
$mosaic = array();
foreach ($cats as $c) {
   $n = 0;
   foreach ($by_cat[$c] as $p) {
      if ($n >= 2 || count($mosaic) >= 6) { break; }
      if (!empty($used[$p['post_id']]) || $img_of($p) === '') { continue; }
      $mosaic[] = $p; $used[$p['post_id']] = 1; $n++;
   }
}
$pick = function ($c) use (&$used, $by_cat) {
   $out = array();
   foreach ($by_cat[$c] as $p) { if (count($out) < 3 && empty($used[$p['post_id']])) { $out[] = $p; } }
   foreach ($by_cat[$c] as $p) { if (count($out) < 3 && !in_array($p, $out, true)) { $out[] = $p; } }
   foreach ($out as $p) { $used[$p['post_id']] = 1; }
   return $out;
};
$authors = !empty($home_authors) ? $home_authors : array();
?>
<style>
:root { --mg-navy:#0b1220; --mg-navy2:#111a2e; --mg-ink:#0f172a; --mg-mute:#64748b; --mg-line:#e2e8f0; --mg-red:#e11d2e; }
body { background:#fff; }
.mg-font { font-family:var(--p6-font-headline,'Plus Jakarta Sans',system-ui,sans-serif); }
.mg-wrap { max-width:none; margin:0 auto; padding:0 24px; }
@media (min-width: 992px) { .mg-wrap { padding:0 3rem; } .mg-strip { margin:0 -3rem; } }
.mg-rise { opacity:0; transform:translateY(22px); transition:opacity .7s ease, transform .7s cubic-bezier(.2,.7,.2,1); }
.mg-rise.is-in { opacity:1; transform:none; }
@media (prefers-reduced-motion: reduce) { .mg-rise { opacity:1; transform:none; transition:none; } }

/* HERO */
.mg-hero { position:relative; min-height:0; background:radial-gradient(1100px 520px at 85% -10%, rgba(225,29,46,.22), transparent 60%), radial-gradient(900px 500px at -10% 110%, rgba(56,189,248,.14), transparent 60%), var(--mg-navy); color:#fff; padding:46px 0 0; overflow:hidden; }
.mg-hero-grid { display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1.12fr); gap:54px; align-items:center; padding-bottom:54px; }
.mg-kicker { display:inline-flex; align-items:center; gap:10px; font-size:.78rem; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:#cbd5e1; margin:0 0 20px; }
.mg-kicker::before { content:""; width:34px; height:2px; background:var(--mg-red); }
.mg-hero h1 { font-size:.9rem; font-weight:700; letter-spacing:.02em; color:#94a3b8; margin:0 0 22px; max-width:520px; line-height:1.5; }
.mg-hero-tag { display:inline-block; font-size:.72rem; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:#fff; background:var(--c, #e11d2e); padding:6px 13px; border-radius:999px; margin-bottom:18px; }
.mg-hero h2 { font-size:clamp(1.9rem, 3.5vw, 3rem); line-height:1.1; letter-spacing:-.03em; font-weight:800; margin:0 0 20px; color:#fff; }
.mg-hero h2 a { color:inherit; text-decoration:none; }
.mg-hero p.lede { font-size:1.14rem; line-height:1.65; color:#cbd5e1; margin:0 0 26px; max-width:560px; }
.mg-by { display:flex; flex-wrap:wrap; align-items:center; gap:6px 16px; font-size:.86rem; font-weight:600; color:#94a3b8; margin-bottom:26px; }
.mg-by b { color:#e2e8f0; font-weight:700; }
.mg-cta { display:inline-flex; align-items:center; gap:10px; background:#fff; color:var(--mg-navy); font-weight:800; font-size:.98rem; padding:14px 26px; border-radius:999px; text-decoration:none; transition:transform .18s ease, box-shadow .18s ease; }
.mg-cta:hover { transform:translateY(-2px); box-shadow:0 14px 30px rgba(0,0,0,.35); color:var(--mg-navy); }
.mg-hero-img { display:block; position:relative; border-radius:22px; overflow:hidden; aspect-ratio:16/10; box-shadow:0 34px 80px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.08); background:#1e293b; transform:perspective(1400px) rotateY(-3deg); transition:transform .5s ease; }
.mg-hero-img:hover { transform:perspective(1400px) rotateY(0deg) scale(1.01); }
.mg-hero-img img { width:100%; height:100%; object-fit:cover; display:block; }
.mg-strip { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:1px; background:rgba(255,255,255,.1); border-top:1px solid rgba(255,255,255,.1); margin:0 -24px; }
.mg-strip a { display:flex; gap:16px; align-items:center; padding:22px 26px; background:var(--mg-navy2); text-decoration:none; color:#fff; transition:background .2s ease; }
.mg-strip a:hover { background:#16213a; color:#fff; }
.mg-strip img { width:92px; height:62px; object-fit:cover; border-radius:10px; flex:none; background:#1e293b; }
.mg-strip small { display:block; font-size:.7rem; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:var(--c, #94a3b8); margin-bottom:4px; }
.mg-strip strong { display:-webkit-box; font-size:.98rem; line-height:1.36; font-weight:700; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

/* TOPIC BAR */
.mg-topics { background:#fff; border-bottom:1px solid var(--mg-line); position:relative; z-index:2; }
.mg-topics .mg-wrap { display:flex; gap:10px; overflow-x:auto; padding-top:18px; padding-bottom:18px; scrollbar-width:none; }
.mg-topics .mg-wrap::-webkit-scrollbar { display:none; }
.mg-topics a { flex:none; display:inline-flex; align-items:center; gap:10px; padding:11px 20px; border-radius:999px; background:#f1f5f9; color:var(--mg-ink); font-weight:700; font-size:.92rem; text-decoration:none; transition:all .18s ease; }
.mg-topics a i { width:10px; height:10px; border-radius:50%; background:var(--c); }
.mg-topics a em { font-style:normal; font-size:.78rem; color:var(--mg-mute); font-weight:700; }
.mg-topics a:hover { background:var(--mg-ink); color:#fff; transform:translateY(-1px); }
.mg-topics a:hover em { color:#cbd5e1; }

/* TOP STORIES */
.mg-sec { padding:64px 0 10px; }
.mg-sec-head { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:26px; }
.mg-sec-head h2 { font-size:clamp(1.6rem, 3vw, 2.3rem); font-weight:800; letter-spacing:-.03em; margin:0; color:var(--mg-ink); }
.mg-eyebrow { display:block; font-size:.74rem; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--mg-red); margin-bottom:8px; }
.mg-mosaic { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:22px; }
.mg-tile { display:flex; flex-direction:column; border-radius:18px; overflow:hidden; text-decoration:none; color:#fff; background:var(--mg-navy); box-shadow:0 14px 34px rgba(15,23,42,.18); transition:transform .22s ease, box-shadow .22s ease; }
.mg-tile:hover { transform:translateY(-6px); box-shadow:0 26px 50px rgba(15,23,42,.28); color:#fff; }
.mg-tile-img { display:block; aspect-ratio:16/10; overflow:hidden; background:#1e293b; position:relative; }
.mg-tile-img img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .6s ease; }
.mg-tile:hover .mg-tile-img img { transform:scale(1.06); }
.mg-tile-img::after { content:""; position:absolute; left:0; right:0; bottom:0; height:4px; background:var(--c); }
.mg-tile-in { padding:20px 22px 22px; display:flex; flex-direction:column; gap:10px; flex:1; }
.mg-tile .mg-pill { align-self:flex-start; font-size:.68rem; font-weight:800; letter-spacing:.12em; text-transform:uppercase; padding:5px 11px; border-radius:999px; background:var(--c); color:#fff; }
.mg-tile h3 { font-size:1.12rem; line-height:1.32; font-weight:800; margin:0; letter-spacing:-.01em; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; color:#fff; }
.mg-tile span.mg-m { margin-top:auto; font-size:.8rem; font-weight:600; color:#94a3b8; }

/* CATEGORY SECTIONS */
.mg-cat { padding:70px 0; content-visibility:auto; contain-intrinsic-size:auto 640px; }
.mg-trust { content-visibility:auto; contain-intrinsic-size:auto 560px; }
.mg-cat:nth-of-type(even) { background:#f8fafc; }
.mg-cat-grid { display:grid; grid-template-columns:minmax(0, .8fr) minmax(0, 2.2fr); gap:48px; align-items:start; }
.mg-cat-info { position:sticky; top:24px; }
.mg-cat-bar { width:56px; height:6px; border-radius:3px; background:var(--c); margin-bottom:20px; }
.mg-cat-info h2 { font-size:clamp(1.8rem, 3.2vw, 2.6rem); font-weight:800; letter-spacing:-.035em; line-height:1.08; margin:0 0 12px; color:var(--mg-ink); }
.mg-cat-info p { font-size:1.02rem; line-height:1.65; color:#475569; margin:0 0 22px; }
.mg-all { display:inline-flex; align-items:center; gap:8px; padding:12px 22px; border-radius:999px; border:2px solid var(--mg-ink); color:var(--mg-ink); font-weight:800; font-size:.9rem; text-decoration:none; transition:all .18s ease; }
.mg-all:hover { background:var(--mg-ink); color:#fff; }
.mg-cards { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:22px; }
.mg-card { display:flex; flex-direction:column; text-decoration:none; color:var(--mg-ink); }
.mg-card:hover { color:var(--mg-ink); }
.mg-card-img { display:block; aspect-ratio:16/10; border-radius:16px; overflow:hidden; background:#e2e8f0; margin-bottom:14px; box-shadow:0 10px 24px rgba(15,23,42,.1); }
.mg-card-img img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .5s ease; }
.mg-card:hover .mg-card-img img { transform:scale(1.06); }
.mg-card .mg-t { font-size:.7rem; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:var(--c); margin-bottom:6px; }
.mg-card h3 { font-size:1.08rem; line-height:1.36; font-weight:800; margin:0 0 8px; letter-spacing:-.01em; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; transition:color .15s ease; }
.mg-card:hover h3 { color:var(--c); }
.mg-card .mg-m { font-size:.8rem; font-weight:600; color:var(--mg-mute); }

/* TRUST BAND */
.mg-trust { background:radial-gradient(900px 400px at 100% 0, rgba(225,29,46,.2), transparent 60%), var(--mg-navy); color:#fff; padding:76px 0; }
.mg-trust-grid { display:grid; grid-template-columns:minmax(0, 1.1fr) minmax(0, 1fr); gap:56px; align-items:center; }
.mg-trust h2 { font-size:clamp(1.8rem, 3.4vw, 2.7rem); font-weight:800; letter-spacing:-.035em; line-height:1.1; margin:0 0 14px; }
.mg-trust p { font-size:1.08rem; line-height:1.7; color:#cbd5e1; margin:0 0 28px; max-width:560px; }
.mg-stats { display:flex; flex-wrap:wrap; gap:26px 46px; margin-bottom:30px; }
.mg-stats strong { display:block; font-size:clamp(2.2rem, 4vw, 3.2rem); font-weight:800; letter-spacing:-.04em; line-height:1; }
.mg-stats span { font-size:.76rem; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:#94a3b8; }
.mg-links { display:flex; flex-wrap:wrap; gap:12px; }
.mg-links a { padding:13px 24px; border-radius:999px; font-weight:800; font-size:.92rem; text-decoration:none; border:1px solid rgba(255,255,255,.3); color:#fff; transition:all .18s ease; }
.mg-links a:first-child { background:#fff; color:var(--mg-navy); border-color:#fff; }
.mg-links a:hover { transform:translateY(-2px); }
.mg-authors { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:14px; }
.mg-author { display:flex; align-items:center; gap:14px; padding:14px 16px; border-radius:14px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); text-decoration:none; color:#fff; transition:background .18s ease, transform .18s ease; }
.mg-author:hover { background:rgba(255,255,255,.12); transform:translateY(-2px); color:#fff; }
.mg-author img { width:48px; height:48px; border-radius:50%; object-fit:cover; flex:none; background:#1e293b; }
.mg-author strong { display:block; font-size:.95rem; line-height:1.25; }
.mg-author em { font-style:normal; font-size:.76rem; color:#94a3b8; line-height:1.3; display:block; }

@media (max-width: 1100px) {
   .mg-mosaic { grid-template-columns:1fr 1fr; }
   .mg-cat-grid { grid-template-columns:1fr; gap:26px; }
   .mg-cat-info { position:static; }
}
@media (max-width: 900px) {
   .mg-hero { padding-top:34px; }
   .mg-hero-grid { grid-template-columns:1fr; gap:30px; padding-bottom:34px; }
   .mg-hero-img { order:-1; transform:none; border-radius:16px; }
   .mg-strip { grid-template-columns:1fr; margin:0 -24px; }
   .mg-trust-grid { grid-template-columns:1fr; gap:36px; }
}
@media (max-width: 767.98px) {
   .mg-wrap { padding:0 16px; }
   .mg-strip { margin:0 -16px; }
   .mg-strip a { padding:16px 18px; }
   .mg-hero h1 { margin-bottom:16px; font-size:.82rem; }
   .mg-hero p.lede { font-size:1.02rem; }
   .mg-cta { width:100%; justify-content:center; }
   .mg-sec { padding-top:44px; }
   .mg-mosaic { grid-template-columns:1fr; gap:14px; }
   .mg-cat { padding:46px 0; }
   .mg-cards { grid-template-columns:1fr; gap:16px; }
   .mg-card { flex-direction:row; gap:14px; align-items:center; }
   .mg-card-img { flex:none; width:128px; aspect-ratio:1/1; margin:0; border-radius:12px; box-shadow:none; }
   .mg-card h3 { font-size:1rem; margin-bottom:6px; }
   .mg-trust { padding:52px 0; }
   .mg-authors { grid-template-columns:1fr; }
}
</style>

<main>
<?php if ($lead && $img_of($lead, 960) !== '') { ?><link rel="preload" as="image" href="<?php echo htmlspecialchars($img_of($lead, 960)); ?>" fetchpriority="high"><?php } ?>
<?php if ($lead) { $lc = $accent_of($lead['cat_name']); ?>
<section class="mg-hero mg-font" style="--c:<?php echo $lc; ?>">
   <div class="mg-wrap">
      <div class="mg-hero-grid">
         <div>
            <p class="mg-kicker">Imperialpedia</p>
            <h1>SEO guides and practical education for people building on the web.</h1>
            <span class="mg-hero-tag"><?php echo htmlspecialchars($label_of($lead['cat_name'])); ?></span>
            <h2><a href="<?php echo htmlspecialchars($url_of($lead)); ?>"><?php echo htmlspecialchars(ucfirst($lead['post_title'])); ?></a></h2>
            <p class="lede"><?php echo htmlspecialchars($ex_of($lead, 190)); ?></p>
            <div class="mg-by">
               <?php if ($author_of($lead) !== '') { ?><span>By <b><?php echo htmlspecialchars($author_of($lead)); ?></b></span><?php } ?>
               <span><?php echo date('M j, Y', strtotime($lead['posted_date'])); ?></span>
               <span><?php echo $mins_of($lead); ?> min read</span>
            </div>
            <a class="mg-cta" href="<?php echo htmlspecialchars($url_of($lead)); ?>">Read the story <span aria-hidden="true">&rarr;</span></a>
         </div>
         <?php if ($img_of($lead) !== '') { ?>
         <a class="mg-hero-img" href="<?php echo htmlspecialchars($url_of($lead)); ?>" aria-label="<?php echo htmlspecialchars(ucfirst($lead['post_title'])); ?>">
            <img src="<?php echo htmlspecialchars($img_of($lead, 960)); ?>" alt="" width="960" height="600" decoding="async" fetchpriority="high" onerror="this.parentNode.style.display='none'">
         </a>
         <?php } ?>
      </div>
      <?php if (!empty($strip)) { ?>
      <div class="mg-strip">
         <?php foreach ($strip as $p) { $im = $img_of($p); ?>
         <a href="<?php echo htmlspecialchars($url_of($p)); ?>" style="--c:<?php echo $accent_of($p['cat_name']); ?>">
            <?php if ($im !== '') { ?><img src="<?php echo htmlspecialchars($im); ?>" alt="" loading="lazy" width="92" height="62" onerror="this.style.display='none'"><?php } ?>
            <span><small><?php echo htmlspecialchars($label_of($p['cat_name'])); ?></small><strong><?php echo htmlspecialchars(ucfirst($p['post_title'])); ?></strong></span>
         </a>
         <?php } ?>
      </div>
      <?php } ?>
   </div>
</section>
<?php } ?>

<nav class="mg-topics mg-font" aria-label="Browse by topic">
   <div class="mg-wrap">
      <?php foreach ($cats as $c) { ?>
         <a href="<?php echo base_url($c . '/' . str_replace(' ', '-', $top_sub($c))); ?>" style="--c:<?php echo $accent_of($c); ?>"><i></i><?php echo htmlspecialchars($label_of($c)); ?> <em><?php echo count($by_cat[$c]); ?></em></a>
      <?php } ?>
   </div>
</nav>

<?php if (!empty($mosaic)) { ?>
<section class="mg-sec mg-font" aria-label="Top stories">
   <div class="mg-wrap">
      <div class="mg-sec-head mg-rise"><div><span class="mg-eyebrow">Don't miss</span><h2>Top stories</h2></div></div>
      <div class="mg-mosaic">
         <?php foreach ($mosaic as $p) { ?>
         <a class="mg-tile mg-rise" href="<?php echo htmlspecialchars($url_of($p)); ?>" style="--c:<?php echo $accent_of($p['cat_name']); ?>">
            <span class="mg-tile-img"><img src="<?php echo htmlspecialchars($img_of($p)); ?>" alt="" loading="lazy" width="800" height="500"></span>
            <span class="mg-tile-in">
               <span class="mg-pill"><?php echo htmlspecialchars($label_of($p['cat_name'])); ?></span>
               <h3><?php echo htmlspecialchars(ucfirst($p['post_title'])); ?></h3>
               <span class="mg-m"><?php echo date('M j, Y', strtotime($p['posted_date'])); ?> &middot; <?php echo $mins_of($p); ?> min read</span>
            </span>
         </a>
         <?php } ?>
      </div>
   </div>
</section>
<?php } ?>

<?php foreach ($cats as $c) {
   $items = $pick($c);
   $all = base_url($c . '/' . str_replace(' ', '-', $top_sub($c)));
?>
<section class="mg-cat mg-font" style="--c:<?php echo $accent_of($c); ?>" aria-label="<?php echo htmlspecialchars($label_of($c)); ?>">
   <div class="mg-wrap">
      <div class="mg-cat-grid">
         <div class="mg-cat-info mg-rise">
            <div class="mg-cat-bar"></div>
            <h2><?php echo htmlspecialchars($label_of($c)); ?></h2>
            <?php if (isset($blurbs[$c])) { ?><p><?php echo htmlspecialchars($blurbs[$c]); ?></p><?php } ?>
            <a class="mg-all" href="<?php echo htmlspecialchars($all); ?>">All <?php echo count($by_cat[$c]); ?> guides <span aria-hidden="true">&rarr;</span></a>
         </div>
         <div class="mg-cards">
            <?php foreach ($items as $p) { $im = $img_of($p); ?>
            <a class="mg-card mg-rise" href="<?php echo htmlspecialchars($url_of($p)); ?>">
               <span class="mg-card-img"><?php if ($im !== '') { ?><img src="<?php echo htmlspecialchars($im); ?>" alt="" loading="lazy" width="640" height="480" onerror="this.parentNode.style.display='none'"><?php } ?></span>
               <span>
                  <span class="mg-t"><?php echo htmlspecialchars(ucwords($p['sub_cat_name'])); ?></span>
                  <h3><?php echo htmlspecialchars(ucfirst($p['post_title'])); ?></h3>
                  <span class="mg-m"><?php echo date('M j, Y', strtotime($p['posted_date'])); ?> &middot; <?php echo $mins_of($p); ?> min read</span>
               </span>
            </a>
            <?php } ?>
         </div>
      </div>
   </div>
</section>
<?php } ?>

<section class="mg-trust mg-font" aria-label="About Imperialpedia">
   <div class="mg-wrap">
      <div class="mg-trust-grid">
         <div class="mg-rise">
            <span class="mg-eyebrow" style="color:#fda4af">Who writes this</span>
            <h2>Learn from writers you can look up</h2>
            <p>Every guide carries its author's name, and corrections are handled through our editorial policy. Browse the contributors, or tell us what we got wrong.</p>
            <div class="mg-stats">
               <div><strong><?php echo count($posts); ?></strong><span>Guides</span></div>
               <div><strong><?php echo count($cats); ?></strong><span>Topics</span></div>
               <div><strong><?php echo count($authors); ?></strong><span>Contributors</span></div>
            </div>
            <div class="mg-links">
               <a href="<?php echo base_url('author'); ?>">Meet the contributors</a>
               <a href="<?php echo base_url('editorial-policy'); ?>">Editorial policy</a>
               <a href="<?php echo base_url('about'); ?>">About us</a>
            </div>
         </div>
         <div class="mg-authors mg-rise">
            <?php foreach (array_slice($authors, 0, 6) as $a) { ?>
            <a class="mg-author" href="<?php echo base_url('author/' . $a['slug']); ?>">
               <img src="<?php echo htmlspecialchars(author_avatar_url($a['avatar'] ?? '', $a['name'])); ?>" alt="" loading="lazy" width="48" height="48">
               <span><strong><?php echo htmlspecialchars($a['name']); ?></strong><em><?php echo htmlspecialchars($a['title']); ?></em></span>
            </a>
            <?php } ?>
         </div>
      </div>
   </div>
</section>
</main>

<script>
(function(){
   var els = document.querySelectorAll('.mg-rise');
   if(!('IntersectionObserver' in window)){ els.forEach(function(e){ e.classList.add('is-in'); }); return; }
   var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('is-in'); io.unobserve(en.target); } });
   }, {rootMargin: '0px 0px -8% 0px', threshold: 0.08});
   els.forEach(function(e, i){ e.style.transitionDelay = ((i % 3) * 70) + 'ms'; io.observe(e); });
})();
</script>
