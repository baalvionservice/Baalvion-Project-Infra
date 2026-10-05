<?php
// "More from the Baalvion network": four editorial cards linking to our own sites, shown inside an article.
// These are plain links between sites we run (no ads, no payment), so they are labelled honestly and use
// rel="noopener nofollow". Show it only on the pages listed in $show_on (post slugs), so it never appears sitewide.
$show_on = array('best-cloud-web-hosting-high-traffic-under-10');
$slug = isset($row['uri']) ? str_replace(' ', '-', $row['uri']) : '';
if (!in_array($slug, $show_on, true)) { return; }

$sites = array(
   array('url' => 'https://trade.baalvion.com/', 'img' => 'network-trade.webp', 'name' => 'Baalvion Trade',
         'text' => 'A platform for global trade: sourcing, quotes, payments, compliance and logistics in one place.', 'host' => 'trade.baalvion.com'),
   array('url' => 'https://ships.baalvion.com/', 'img' => 'network-ships.webp', 'name' => 'World Shipping Directory',
         'text' => 'A reference registry of shipping companies and their vessels, with the source shown for every figure.', 'host' => 'ships.baalvion.com'),
   array('url' => 'https://signal.baalvion.com/', 'img' => 'network-signal.webp', 'name' => 'Baalvion Intelligence',
         'text' => 'One news API for developers, with summaries and sentiment already attached. Free tier available.', 'host' => 'signal.baalvion.com'),
   array('url' => 'https://baal.baalvion.com/', 'img' => 'network-baal.webp', 'name' => 'BAAL (pre-launch)',
         'text' => 'A planned token linked to the Baalvion vision. It is pre-launch: no token exists and it cannot be bought.', 'host' => 'baal.baalvion.com'),
);
?>
<aside class="imp-netstrip" aria-label="More from the Baalvion network">
   <div class="imp-netstrip-head">
      <h3>More from the Baalvion network</h3>
      <p>Other projects from the same team, if you are curious.</p>
   </div>
   <div class="imp-netstrip-grid">
      <?php foreach ($sites as $s) { ?>
      <a class="imp-netcard" href="<?php echo htmlspecialchars($s['url']); ?>" target="_blank" rel="noopener nofollow">
         <img loading="lazy" decoding="async" width="960" height="540" src="<?php echo base_url('assets/img/' . $s['img']); ?>" alt="<?php echo htmlspecialchars($s['name']); ?>">
         <span class="imp-netcard-body">
            <strong><?php echo htmlspecialchars($s['name']); ?></strong>
            <span><?php echo htmlspecialchars($s['text']); ?></span>
            <em><?php echo htmlspecialchars($s['host']); ?> &rarr;</em>
         </span>
      </a>
      <?php } ?>
   </div>
</aside>
