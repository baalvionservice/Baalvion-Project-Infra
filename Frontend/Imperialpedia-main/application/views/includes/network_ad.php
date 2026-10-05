<?php
/**
 * Banner-format links to our own sites ("From our network"), in the standard shapes readers know:
 *   leader (wide strip), rect (300x250 box), sky (300x600 tall).
 * Usage: $this->load->view('includes/network_ad', array('format' => 'rect', 'site' => 'trade', 'row' => $row));
 * Plain editorial links between sites we run: no ad network, no payment. They are labelled "From our network"
 * (never "Ad"/"Advertisement"/"Sponsored"), and use rel="noopener nofollow". Shown only on the posts listed in $show_on.
 */
$show_on = array('best-cloud-web-hosting-high-traffic-under-10');
$slug = isset($row['uri']) ? str_replace(' ', '-', $row['uri']) : '';
if (!in_array($slug, $show_on, true)) { return; }

$sites = array(
   'trade' => array('url' => 'https://trade.baalvion.com/', 'name' => 'Baalvion Trade', 'host' => 'trade.baalvion.com',
      'line' => 'Sourcing to settlement.', 'sub' => 'Sourcing, quotes, payments, compliance and logistics for global trade, in one place.', 'cta' => 'Explore',
      'bg' => 'linear-gradient(135deg,#0b1220 0%,#12335b 60%,#1d4f91 100%)', 'accent' => '#7fb4ff',
      'art' => '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="10" y="62" width="44" height="30"/><rect x="58" y="62" width="44" height="30"/><rect x="34" y="30" width="44" height="30"/><path d="M0 104h120"/></svg>'),
   'ships' => array('url' => 'https://ships.baalvion.com/', 'name' => 'World Shipping Directory', 'host' => 'ships.baalvion.com',
      'line' => 'Every shipping company, and the ships it sails.', 'sub' => 'A reference registry of vessels and their owners, with the source shown for every figure.', 'cta' => 'Browse',
      'bg' => 'linear-gradient(160deg,#06202e 0%,#0b4a63 55%,#1a7f9a 100%)', 'accent' => '#8fe3f2',
      'art' => '<svg viewBox="0 0 120 120" fill="currentColor"><path d="M8 70h104l-14 22H22z"/><rect x="26" y="44" width="16" height="26"/><rect x="46" y="52" width="50" height="18"/><rect x="54" y="40" width="12" height="12"/><rect x="72" y="40" width="12" height="12"/></svg>'),
   'signal' => array('url' => 'https://signal.baalvion.com/', 'name' => 'Baalvion Intelligence', 'host' => 'signal.baalvion.com',
      'line' => 'Turn global news into actionable intelligence.', 'sub' => 'One news API for developers, with summaries and sentiment already attached. Free tier available.', 'cta' => 'Try it free',
      'bg' => 'linear-gradient(135deg,#050810 0%,#0a1f3a 55%,#0e4d64 100%)', 'accent' => '#55e6c1',
      'art' => '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M0 74h22l10-34 14 52 16-64 12 46 10-18h36"/><circle cx="96" cy="30" r="8"/><circle cx="96" cy="30" r="18" opacity=".5"/></svg>'),
   'baal' => array('url' => 'https://baal.baalvion.com/', 'name' => 'BAAL (pre-launch)', 'host' => 'baal.baalvion.com',
      'line' => 'Pre-launch: no token exists yet.', 'sub' => 'A planned token linked to the Baalvion vision. It cannot be bought or transferred today.', 'cta' => 'Read more',
      'bg' => 'linear-gradient(135deg,#0b1020 0%,#221a4d 60%,#3d2c7a 100%)', 'accent' => '#c7b6ff',
      'art' => '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="60" cy="60" r="46"/><circle cx="60" cy="60" r="32"/><path d="M60 22v76M40 48h40M40 72h40"/></svg>'),
);
$format = isset($format) && in_array($format, array('leader', 'rect', 'sky'), true) ? $format : 'leader';
if (empty($sites[$site])) { return; }
$s = $sites[$site];
?>
<aside class="imp-ad imp-ad--<?php echo $format; ?>" aria-label="From our network">
   <span class="imp-ad-tag">From our network</span>
   <a class="imp-ad-box" href="<?php echo htmlspecialchars($s['url']); ?>" target="_blank" rel="noopener nofollow" style="background:<?php echo $s['bg']; ?>;--ac:<?php echo $s['accent']; ?>">
      <span class="imp-ad-art" aria-hidden="true"><?php echo $s['art']; ?></span>
      <span class="imp-ad-copy">
         <span class="imp-ad-name"><?php echo htmlspecialchars($s['name']); ?></span>
         <strong class="imp-ad-line"><?php echo htmlspecialchars($s['line']); ?></strong>
         <span class="imp-ad-sub"><?php echo htmlspecialchars($s['sub']); ?></span>
      </span>
      <span class="imp-ad-cta"><?php echo htmlspecialchars($s['cta']); ?> <i aria-hidden="true">&rarr;</i></span>
      <span class="imp-ad-host"><?php echo htmlspecialchars($s['host']); ?></span>
   </a>
</aside>
