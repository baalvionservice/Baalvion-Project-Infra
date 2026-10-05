<?php
/** Imperialpedia — /news: latest stories grouped by day. */
$today = news_when(gmdate('Y-m-d H:i:s'));
$groups = array();
foreach ($items as $it) { $w = news_when($it['date']); $groups[$w['key']]['label'] = $w; $groups[$w['key']]['items'][] = array_merge($it, array('w' => $w)); }
?>
<style>
.nw-wrap .imp-ad--leader{margin:1.4rem 0}.nw-wrap{max-width:980px;margin:0 auto;padding:0 20px 60px}
.nw-head{padding:30px 0 18px;border-bottom:3px solid #0f172a;margin-bottom:6px}
.nw-kick{display:flex;align-items:center;gap:10px;font-size:.76rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#d00000}
.nw-kick i{width:9px;height:9px;border-radius:50%;background:#d00000;display:inline-block;animation:nwp 1.6s infinite}
@keyframes nwp{0%{box-shadow:0 0 0 0 rgba(208,0,0,.5)}100%{box-shadow:0 0 0 10px rgba(208,0,0,0)}}
.nw-head h1{font-size:clamp(1.8rem,4vw,2.8rem);font-weight:800;letter-spacing:-.03em;margin:6px 0 4px;color:#0f172a}
.nw-date{font-size:.95rem;font-weight:600;color:#64748b}
.nw-day{display:flex;align-items:baseline;gap:12px;margin:30px 0 4px;padding-bottom:8px;border-bottom:1px solid #e2e8f0}
.nw-day strong{font-size:1.1rem;font-weight:800;color:#0f172a}.nw-day span{font-size:.85rem;font-weight:600;color:#64748b}
.nw-item{display:grid;grid-template-columns:96px minmax(0,1fr) 150px;gap:18px;padding:18px 0;border-bottom:1px solid #eef2f7;text-decoration:none;color:#0f172a;align-items:start}
.nw-item:hover{color:#0f172a}.nw-item:hover h2{color:#d00000}
.nw-time{font-size:.78rem;font-weight:800;color:#d00000;letter-spacing:.02em;line-height:1.4}.nw-time em{display:block;font-style:normal;color:#64748b;font-weight:600}
.nw-item h2{font-size:1.2rem;line-height:1.35;font-weight:800;margin:0 0 6px;letter-spacing:-.01em;transition:color .15s ease}
.nw-item p{margin:0 0 6px;font-size:.92rem;line-height:1.55;color:#475569;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.nw-by{font-size:.78rem;font-weight:700;color:#64748b}
.nw-thumb{width:150px;height:100px;border-radius:10px;overflow:hidden;background:#e2e8f0}.nw-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.nw-noimg{grid-template-columns:96px minmax(0,1fr)}
.nw-empty{padding:50px 0;text-align:center;color:#64748b}
@media (max-width:640px){.nw-wrap{padding:0 16px 50px}.nw-item,.nw-noimg{grid-template-columns:minmax(0,1fr) 92px;gap:6px 12px;padding:16px 0}.nw-noimg{grid-template-columns:minmax(0,1fr)}.nw-time{grid-column:1/-1;display:flex;gap:8px;align-items:baseline}.nw-time em{display:inline}.nw-item>div:nth-child(2){grid-column:1;grid-row:2}.nw-thumb{width:92px;height:92px;grid-column:2;grid-row:2}.nw-item h2{font-size:1.05rem}.nw-item p{display:none}}
</style>
<main class="nw-wrap">
   <header class="nw-head">
      <div class="nw-kick"><i></i> Latest news</div>
      <h1>News</h1>
      <div class="nw-date"><?php echo htmlspecialchars($today['date']); ?> &middot; updated <?php echo htmlspecialchars($today['time']); ?></div>
   </header>
   <?php if (empty($groups)) { ?><p class="nw-empty">No stories yet. Check back soon.</p><?php } ?>
   <?php $gi = 0; foreach ($groups as $g) { $gi++; ?>
   <section>
      <div class="nw-day"><strong><?php echo htmlspecialchars($g['label']['day']); ?></strong><span><?php echo htmlspecialchars($g['label']['date']); ?></span></div>
      <?php foreach ($g['items'] as $it) { ?>
      <a class="nw-item<?php echo $it['image'] === '' ? ' nw-noimg' : ''; ?>" href="<?php echo htmlspecialchars($it['url']); ?>">
         <div class="nw-time"><?php echo htmlspecialchars($it['w']['time']); ?><?php if ($it['w']['ago'] !== '') { ?><em><?php echo htmlspecialchars($it['w']['ago']); ?></em><?php } ?></div>
         <div><h2><?php echo htmlspecialchars($it['title']); ?></h2><p><?php echo htmlspecialchars($it['excerpt']); ?></p><?php if ($it['author'] !== '') { ?><span class="nw-by">By <?php echo htmlspecialchars($it['author']); ?></span><?php } ?></div>
         <?php if ($it['image'] !== '') { ?><div class="nw-thumb"><img src="<?php echo htmlspecialchars($it['image']); ?>" alt="" loading="lazy" width="150" height="100" onerror="this.parentNode.style.display='none'"></div><?php } ?>
      </a>
      <?php } ?>
   </section>
   <?php if ($gi === 1) { $this->load->view('includes/network_ad', array('format' => 'leader', 'site' => 'trade')); } ?>
   <?php } ?>
   <?php $this->load->view('includes/network_ad', array('format' => 'leader', 'site' => 'signal')); ?>
   <?php $this->load->view('includes/network_box'); ?>
</main>
