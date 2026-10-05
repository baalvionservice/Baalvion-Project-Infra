<?php
/** Imperialpedia — /news: the news front page. Lead story, top stories, then the latest grouped by day. */
$CI =& get_instance();
$today = news_when(gmdate('Y-m-d H:i:s'));
$items = array_values($items);
foreach ($items as $k => $it) { $items[$k]['w'] = news_when($it['date']); }
$lead = isset($items[0]) ? $items[0] : null;
$top = array_slice($items, 1, 3);
$rest = array_slice($items, 4);
$groups = array();
foreach ($rest as $it) { $groups[$it['w']['key']]['label'] = $it['w']; $groups[$it['w']['key']]['items'][] = $it; }
$sections = $CI->db->query("SELECT s.sub_cat_name, s.sub_cat_id, c.cat_name,
      (SELECT COUNT(*) FROM post p WHERE p.sub_cat_id = s.sub_cat_id AND p.status = 'published') AS n, CHAR_LENGTH(s.sub_cat_desc) AS dl
   FROM sub_category s JOIN category c ON c.cat_id = s.cat_id WHERE c.cat_name = 'news' ORDER BY s.sub_cat_name")->result_array();
$sec_link = function ($s) { return base_url('news/' . str_replace(' ', '-', $s['sub_cat_name'])); };
?>
<style>
.nw{--ink:#0f172a;--mute:#64748b;--line:#e2e8f0;--red:#d00000;max-width:1240px;margin:0 auto;padding:0 20px 60px}
.nw-mast{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:30px 0 14px;border-bottom:3px solid var(--ink)}
.nw-mast h1{font-size:clamp(2.2rem,5vw,3.6rem);font-weight:800;letter-spacing:-.04em;line-height:1;margin:0;color:var(--ink)}
.nw-live{display:inline-flex;align-items:center;gap:9px;font-size:.74rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--red);margin-bottom:8px}
.nw-live i{width:9px;height:9px;border-radius:50%;background:var(--red);animation:nwp 1.6s infinite}
@keyframes nwp{0%{box-shadow:0 0 0 0 rgba(208,0,0,.5)}100%{box-shadow:0 0 0 10px rgba(208,0,0,0)}}
.nw-when{font-size:.9rem;font-weight:600;color:var(--mute);text-align:right;line-height:1.5}.nw-when b{display:block;color:var(--ink);font-size:1rem}
.nw-tabs{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:10px 0;border-bottom:1px solid var(--line)}.nw-tabs::-webkit-scrollbar{display:none}
.nw-tabs a{flex:none;padding:8px 16px;border-radius:999px;font-size:.85rem;font-weight:700;color:#334155;text-decoration:none;white-space:nowrap}
.nw-tabs a:hover{background:#f1f5f9;color:var(--ink)}.nw-tabs a.on{background:var(--ink);color:#fff}
.nw-top{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:30px;padding:26px 0 8px}
.nw-lead{position:relative;display:flex;flex-direction:column;justify-content:flex-end;min-height:440px;border-radius:18px;overflow:hidden;text-decoration:none;color:#fff;background:linear-gradient(135deg,#0b1220 0%,#1b2a4a 55%,#3a1530 100%);isolation:isolate}
.nw-lead:hover{color:#fff}
.nw-lead img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2;transition:transform .6s ease}.nw-lead:hover img{transform:scale(1.04)}
.nw-lead::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(to top,rgba(8,12,24,.92) 10%,rgba(8,12,24,.35) 60%,rgba(8,12,24,.05))}
.nw-lead-in{padding:30px 32px 32px}
.nw-pill{display:inline-block;font-size:.7rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;background:var(--red);color:#fff;border-radius:999px;padding:5px 12px;margin-bottom:14px}
.nw-lead h2{font-size:clamp(1.6rem,3vw,2.5rem);line-height:1.15;font-weight:800;letter-spacing:-.03em;margin:0 0 12px;color:#fff}
.nw-lead p{font-size:1.02rem;line-height:1.6;color:#cbd5e1;margin:0 0 14px;max-width:640px}
.nw-meta{font-size:.82rem;font-weight:700;color:#cbd5e1;display:flex;flex-wrap:wrap;gap:4px 14px}.nw-meta b{color:#fff}
.nw-stack{display:flex;flex-direction:column}
.nw-h{font-size:.78rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--mute);margin:0 0 4px;padding-bottom:10px;border-bottom:1px solid var(--line)}
.nw-sm{display:flex;gap:14px;padding:16px 0;border-bottom:1px solid var(--line);text-decoration:none;color:var(--ink)}
.nw-sm:hover{color:var(--ink)}.nw-sm:hover strong{color:var(--red)}
.nw-num{flex:none;font-size:1.7rem;font-weight:800;color:#cbd5e1;line-height:1;width:34px}
.nw-sm strong{display:block;font-size:1.02rem;line-height:1.35;font-weight:800;transition:color .15s}
.nw-sm span.t{display:block;margin-top:5px;font-size:.76rem;font-weight:700;color:var(--red)}
.nw-sm .th{flex:none;width:92px;height:68px;border-radius:10px;overflow:hidden;background:#e2e8f0}.nw-sm .th img{width:100%;height:100%;object-fit:cover;display:block}
.nw-main{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:44px;padding-top:26px}
.nw-day{display:flex;align-items:baseline;gap:12px;margin:26px 0 2px;padding-bottom:8px;border-bottom:2px solid var(--ink)}.nw-day:first-child{margin-top:0}
.nw-day strong{font-size:1.1rem;font-weight:800;color:var(--ink)}.nw-day span{font-size:.84rem;font-weight:600;color:var(--mute)}
.nw-item{display:grid;grid-template-columns:88px minmax(0,1fr) 140px;gap:16px;padding:18px 0;border-bottom:1px solid #eef2f7;text-decoration:none;color:var(--ink)}
.nw-item.noimg{grid-template-columns:88px minmax(0,1fr)}.nw-item:hover{color:var(--ink)}.nw-item:hover h3{color:var(--red)}
.nw-time{font-size:.78rem;font-weight:800;color:var(--red);line-height:1.4}.nw-time em{display:block;font-style:normal;color:var(--mute);font-weight:600}
.nw-item h3{font-size:1.15rem;line-height:1.35;font-weight:800;margin:0 0 6px;transition:color .15s}
.nw-item p{margin:0 0 6px;font-size:.92rem;line-height:1.55;color:#475569;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.nw-by{font-size:.78rem;font-weight:700;color:var(--mute)}
.nw-thumb{width:140px;height:94px;border-radius:10px;overflow:hidden;background:#e2e8f0}.nw-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.nw-side{position:sticky;top:18px;align-self:start;display:flex;flex-direction:column;gap:22px}
.nw-box{background:#f8fafc;border:1px solid var(--line);border-radius:14px;padding:18px}
.nw-box a.nwrow{display:flex;justify-content:space-between;gap:10px;padding:9px 6px;border-radius:8px;color:#334155;font-size:.92rem;font-weight:700;text-decoration:none}
.nw-box a.nwrow:hover{background:#fff;color:var(--red)}.nw-box a.nwrow span{color:var(--mute);font-weight:600}
.nw-empty{padding:60px 0;text-align:center;color:var(--mute)}
.nw .imp-ad{margin:1.4rem 0}
@media (max-width:991.98px){.nw-top{grid-template-columns:1fr;gap:6px}.nw-lead{min-height:360px}.nw-main{grid-template-columns:1fr;gap:20px}.nw-side{position:static}}
@media (max-width:640px){.nw{padding:0 16px 50px}.nw-mast{padding:18px 0 12px;align-items:flex-start}.nw-when{text-align:left}
 .nw-lead{min-height:320px;border-radius:14px}.nw-lead-in{padding:20px 18px 22px}.nw-lead p{display:none}
 .nw-item,.nw-item.noimg{grid-template-columns:minmax(0,1fr) 88px;gap:4px 12px;padding:16px 0}.nw-item.noimg{grid-template-columns:minmax(0,1fr)}
 .nw-time{grid-column:1/-1;display:flex;gap:8px;align-items:baseline}.nw-time em{display:inline}
 .nw-item>div:nth-child(2){grid-column:1;grid-row:2}.nw-thumb{width:88px;height:88px;grid-column:2;grid-row:2}.nw-item h3{font-size:1.04rem}.nw-item p{display:none}}
</style>
<main class="nw">
   <header class="nw-mast">
      <div><div class="nw-live"><i></i> Live &middot; Latest news</div><h1>News</h1></div>
      <div class="nw-when"><b><?php echo htmlspecialchars($today['date']); ?></b>Updated <?php echo htmlspecialchars($today['time']); ?></div>
   </header>
   <?php if ($sections) { ?>
   <nav class="nw-tabs" aria-label="News sections"><a class="on" href="<?php echo base_url('news'); ?>">Top stories</a>
      <?php foreach ($sections as $s) { ?><a href="<?php echo htmlspecialchars($sec_link($s)); ?>"><?php echo htmlspecialchars(ucwords($s['sub_cat_name'])); ?></a><?php } ?>
   </nav>
   <?php } ?>

   <?php if (!$lead) { ?><p class="nw-empty">No stories yet. Check back soon.</p><?php } else { ?>
   <section class="nw-top" aria-label="Top stories">
      <a class="nw-lead" href="<?php echo htmlspecialchars($lead['url']); ?>">
         <?php if ($lead['image'] !== '') { ?><img src="<?php echo htmlspecialchars($lead['image']); ?>" alt="" width="900" height="560" fetchpriority="high" onerror="this.style.display='none'"><?php } ?>
         <span class="nw-lead-in">
            <span class="nw-pill"><?php echo $lead['w']['day'] === 'Today' ? 'Top story' : htmlspecialchars($lead['section']); ?></span>
            <h2><?php echo htmlspecialchars($lead['title']); ?></h2>
            <p><?php echo htmlspecialchars($lead['excerpt']); ?></p>
            <span class="nw-meta"><?php if ($lead['author'] !== '') { ?><span>By <b><?php echo htmlspecialchars($lead['author']); ?></b></span><?php } ?><span><?php echo htmlspecialchars($lead['w']['day'] === 'Today' || $lead['w']['day'] === 'Yesterday' ? $lead['w']['day'] . ', ' . $lead['w']['time'] : $lead['w']['abs']); ?></span><?php if ($lead['w']['ago'] !== '') { ?><span><?php echo htmlspecialchars($lead['w']['ago']); ?></span><?php } ?></span>
         </span>
      </a>
      <?php if ($top) { ?>
      <div class="nw-stack"><h2 class="nw-h">Also making news</h2>
         <?php foreach ($top as $i => $it) { ?>
         <a class="nw-sm" href="<?php echo htmlspecialchars($it['url']); ?>">
            <span class="nw-num"><?php echo $i + 1; ?></span>
            <span style="flex:1;min-width:0"><strong><?php echo htmlspecialchars($it['title']); ?></strong><span class="t"><?php echo htmlspecialchars($it['w']['day'] === 'Today' || $it['w']['day'] === 'Yesterday' ? $it['w']['day'] . ', ' . $it['w']['time'] : $it['w']['abs']); ?></span></span>
            <?php if ($it['image'] !== '') { ?><span class="th"><img src="<?php echo htmlspecialchars($it['image']); ?>" alt="" loading="lazy" width="92" height="68" onerror="this.parentNode.style.display='none'"></span><?php } ?>
         </a>
         <?php } ?>
      </div>
      <?php } ?>
   </section>
   <?php $this->load->view('includes/network_ad', array('format' => 'leader', 'site' => 'trade')); ?>

   <div class="nw-main">
      <section aria-label="Latest news">
         <?php if (!$groups) { ?><p class="nw-empty">That's everything for now. New stories appear here as soon as they are published.</p><?php } ?>
         <?php foreach ($groups as $g) { ?>
            <div class="nw-day"><strong><?php echo htmlspecialchars($g['label']['day']); ?></strong><span><?php echo htmlspecialchars($g['label']['date']); ?></span></div>
            <?php foreach ($g['items'] as $it) { ?>
            <a class="nw-item<?php echo $it['image'] === '' ? ' noimg' : ''; ?>" href="<?php echo htmlspecialchars($it['url']); ?>">
               <div class="nw-time"><?php echo htmlspecialchars($it['w']['time']); ?><?php if ($it['w']['ago'] !== '') { ?><em><?php echo htmlspecialchars($it['w']['ago']); ?></em><?php } ?></div>
               <div><h3><?php echo htmlspecialchars($it['title']); ?></h3><p><?php echo htmlspecialchars($it['excerpt']); ?></p><?php if ($it['author'] !== '') { ?><span class="nw-by">By <?php echo htmlspecialchars($it['author']); ?></span><?php } ?></div>
               <?php if ($it['image'] !== '') { ?><div class="nw-thumb"><img src="<?php echo htmlspecialchars($it['image']); ?>" alt="" loading="lazy" width="140" height="94" onerror="this.parentNode.style.display='none'"></div><?php } ?>
            </a>
            <?php } ?>
         <?php } ?>
      </section>
      <aside class="nw-side">
         <?php if ($sections) { ?>
         <div class="nw-box"><h2 class="nw-h" style="border:0;padding:0 0 6px">Sections</h2>
            <?php foreach ($sections as $s) { $cnt = (int)$s['n'] + ((int)$s['n'] === 0 && (int)$s['dl'] > 200 ? 1 : 0); ?>
            <a class="nwrow" href="<?php echo htmlspecialchars($sec_link($s)); ?>"><?php echo htmlspecialchars(ucwords($s['sub_cat_name'])); ?><span><?php echo $cnt; ?></span></a>
            <?php } ?>
         </div>
         <?php } ?>
         <?php $this->load->view('includes/network_box'); ?>
      </aside>
   </div>
   <?php } ?>
</main>
